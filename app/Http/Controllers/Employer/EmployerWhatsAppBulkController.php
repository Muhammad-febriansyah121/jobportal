<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Jobs\SendWhatsappBulkRecipientJob;
use App\Models\Application;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\MessageTemplate;
use App\Models\WhatsappBulkMessage;
use App\Services\WhatsAppGatewayService;
use App\Support\MessageBodyFormatter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployerWhatsAppBulkController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan dulu.']);

            return to_route('employer.company.edit');
        }

        $campaigns = WhatsappBulkMessage::query()
            ->where('user_id', $request->user()->id)
            ->where('company_id', $company->id)
            ->with('jobListing:id,title')
            ->latest()
            ->paginate(10)
            ->through(fn (WhatsappBulkMessage $bulk): array => [
                'id' => $bulk->id,
                'job_title' => $bulk->jobListing?->title ?? '-',
                'channel' => $bulk->channel ?? 'whatsapp',
                'subject' => $bulk->subject,
                'status' => $bulk->status,
                'recipients_count' => $bulk->recipients_count,
                'sent_count' => $bulk->sent_count,
                'failed_count' => $bulk->failed_count,
                'skipped_count' => $bulk->skipped_count,
                'created_at' => $bulk->created_at?->format('d M Y H:i'),
                'completed_at' => $bulk->completed_at?->format('d M Y H:i'),
            ]);

        $sessionId = $this->resolveSessionId($request->user());
        $whatsApp = app(WhatsAppGatewayService::class);
        $sessionState = null;

        if ($sessionId !== '') {
            $session = $whatsApp->getSession($sessionId);
            $sessionState = strtoupper((string) data_get($session, 'state'));
        }

        return Inertia::render('employer/whatsapp-bulk/index', [
            'campaigns' => $campaigns,
            'gateway' => [
                'configured' => $whatsApp->isConfigured(),
                'session_id' => $sessionId,
                'session_state' => $sessionState,
            ],
        ]);
    }

    public function create(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan dulu.']);

            return to_route('employer.company.edit');
        }

        $jobs = JobListing::query()
            ->select(['id', 'title', 'status'])
            ->where('company_id', $company->id)
            ->withCount('applications')
            ->latest()
            ->get()
            ->map(fn (JobListing $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'status' => $job->status,
                'applications_count' => $job->applications_count,
            ]);

        $selectedJobId = $request->integer('job_listing_id') ?: null;
        $applications = collect();

        if ($selectedJobId !== null) {
            $job = JobListing::query()
                ->where('company_id', $company->id)
                ->find($selectedJobId);

            if ($job !== null) {
                $applications = Application::query()
                    ->select(['id', 'job_listing_id', 'candidate_id', 'status', 'applied_at'])
                    ->with([
                        'candidate:id,user_id,full_name,headline',
                        'candidate.user:id,name,phone,email',
                    ])
                    ->where('job_listing_id', $job->id)
                    ->latest('applied_at')
                    ->get()
                    ->map(function (Application $application): array {
                        $phone = $application->candidate?->user?->phone;
                        $email = $application->candidate?->user?->email;

                        return [
                            'id' => $application->id,
                            'candidate_name' => $application->candidate?->full_name
                                ?? $application->candidate?->user?->name
                                ?? 'Kandidat',
                            'candidate_headline' => $application->candidate?->headline,
                            'phone' => $phone,
                            'has_phone' => filled($phone),
                            'email' => $email,
                            'has_email' => filled($email),
                            'status' => $application->status,
                            'applied_at' => $application->applied_at?->format('d M Y H:i'),
                        ];
                    })
                    ->values();
            }
        }

        $templates = MessageTemplate::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->latest('updated_at')
            ->get(['id', 'name', 'channel', 'subject', 'body'])
            ->map(fn (MessageTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'channel' => $template->channel,
                'subject' => $template->subject,
                'body' => $template->body,
            ])
            ->values();

        $sessionId = $this->resolveSessionId($request->user());
        $whatsApp = app(WhatsAppGatewayService::class);
        $sessionState = null;

        if ($sessionId !== '') {
            $session = $whatsApp->getSession($sessionId);
            $sessionState = strtoupper((string) data_get($session, 'state'));
        }

        return Inertia::render('employer/whatsapp-bulk/create', [
            'jobs' => $jobs,
            'selected_job_id' => $selectedJobId,
            'applications' => $applications,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'gateway' => [
                'configured' => $whatsApp->isConfigured(),
                'session_id' => $sessionId,
                'session_state' => $sessionState,
                'is_connected' => in_array($sessionState ?? '', ['CONNECTED', 'READY'], true),
            ],
            'templates' => $templates,
            'default_reply_to' => $request->user()->email,
        ]);
    }

    public function store(
        Request $request,
        ResolveEmployerCompany $resolveEmployerCompany,
        WhatsAppGatewayService $whatsApp,
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan dulu.']);

            return to_route('employer.company.edit');
        }

        $data = $request->validate([
            'channel' => ['required', Rule::in(['whatsapp', 'email'])],
            'job_listing_id' => ['required', 'integer', 'exists:job_listings,id'],
            'application_ids' => ['required', 'array', 'min:1', 'max:500'],
            'application_ids.*' => ['integer', 'exists:applications,id'],
            'message_template' => ['required', 'string', 'min:5', 'max:6000'],
            'subject' => ['nullable', 'string', 'max:191', 'required_if:channel,email'],
            'reply_to_email' => ['nullable', 'email', 'max:191'],
        ], [
            'channel.required' => 'Pilih channel broadcast.',
            'subject.required_if' => 'Subject wajib untuk broadcast email.',
        ]);

        $channel = $data['channel'];
        $sessionId = null;

        if ($channel === 'whatsapp') {
            $sessionId = $this->resolveSessionId($request->user());

            if (! $whatsApp->isConfigured() || $sessionId === '') {
                Inertia::flash('toast', ['type' => 'error', 'message' => 'Gateway atau sesi WhatsApp belum siap.']);

                return back();
            }

            $session = $whatsApp->getSession($sessionId);
            $sessionState = strtoupper((string) data_get($session, 'state'));

            if (! in_array($sessionState, ['CONNECTED', 'READY'], true)) {
                Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi WhatsApp belum terhubung. Hubungkan dulu sebelum kirim massal.']);

                return back();
            }
        }

        $job = JobListing::query()
            ->where('company_id', $company->id)
            ->findOrFail($data['job_listing_id']);

        $applications = Application::query()
            ->whereIn('id', $data['application_ids'])
            ->where('job_listing_id', $job->id)
            ->with([
                'candidate:id,user_id,full_name',
                'candidate.user:id,name,phone,email',
                'jobListing:id,title',
            ])
            ->get();

        if ($applications->isEmpty()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Pelamar tidak ditemukan untuk lowongan ini.']);

            return back();
        }

        $bulk = DB::transaction(function () use ($request, $company, $job, $applications, $sessionId, $data, $channel): WhatsappBulkMessage {
            $bulk = WhatsappBulkMessage::create([
                'user_id' => $request->user()->id,
                'company_id' => $company->id,
                'job_listing_id' => $job->id,
                'session_id' => $sessionId,
                'channel' => $channel,
                'subject' => $channel === 'email' ? $data['subject'] : null,
                'reply_to_email' => $channel === 'email' ? ($data['reply_to_email'] ?? $request->user()->email) : null,
                'message_template' => $data['message_template'],
                'recipients_count' => 0,
                'status' => 'queued',
            ]);

            $sent = 0;
            $skipped = 0;

            foreach ($applications as $application) {
                $name = $application->candidate?->full_name
                    ?? $application->candidate?->user?->name
                    ?? 'Kandidat';
                $phone = trim((string) $application->candidate?->user?->phone);
                $email = trim((string) $application->candidate?->user?->email);

                $rendered = $this->renderTemplate($data['message_template'], [
                    'nama' => $name,
                    'name' => $name,
                    'posisi' => $application->jobListing?->title ?? $job->title,
                    'position' => $application->jobListing?->title ?? $job->title,
                    'perusahaan' => $company->name,
                    'company' => $company->name,
                ]);

                if ($channel === 'whatsapp') {
                    $rendered = MessageBodyFormatter::toWhatsApp($rendered);
                }

                $missingContact = $channel === 'whatsapp' ? $phone === '' : ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL));

                if ($missingContact) {
                    $bulk->recipients()->create([
                        'application_id' => $application->id,
                        'candidate_user_id' => $application->candidate?->user_id,
                        'candidate_name' => $name,
                        'phone_number' => $channel === 'whatsapp' ? '' : null,
                        'email_address' => $channel === 'email' ? '' : null,
                        'rendered_message' => $rendered,
                        'status' => 'skipped',
                        'error_message' => $channel === 'whatsapp'
                            ? 'Kandidat tidak memiliki nomor WhatsApp.'
                            : 'Kandidat tidak memiliki alamat email valid.',
                    ]);
                    $skipped += 1;

                    continue;
                }

                $bulk->recipients()->create([
                    'application_id' => $application->id,
                    'candidate_user_id' => $application->candidate?->user_id,
                    'candidate_name' => $name,
                    'phone_number' => $channel === 'whatsapp' ? $phone : null,
                    'email_address' => $channel === 'email' ? $email : null,
                    'rendered_message' => $rendered,
                    'status' => 'pending',
                ]);
                $sent += 1;
            }

            $bulk->update([
                'recipients_count' => $sent + $skipped,
                'skipped_count' => $skipped,
            ]);

            return $bulk->fresh('recipients');
        });

        $cumulativeDelay = 0;
        $delayRange = $channel === 'email' ? [5, 15] : [3, 8];

        foreach ($bulk->recipients()->where('status', 'pending')->orderBy('id')->get() as $recipient) {
            $cumulativeDelay += random_int($delayRange[0], $delayRange[1]);
            SendWhatsappBulkRecipientJob::dispatch($recipient->id)
                ->delay(now()->addSeconds($cumulativeDelay));
        }

        $pendingCount = $bulk->recipients_count - $bulk->skipped_count;

        if ($pendingCount === 0) {
            $bulk->update([
                'status' => 'completed_with_errors',
                'completed_at' => now(),
            ]);
        }

        $channelLabel = $channel === 'email' ? 'email' : 'WhatsApp';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Broadcast {$channelLabel} dijadwalkan: {$pendingCount} pesan akan dikirim, {$bulk->skipped_count} dilewati.",
        ]);

        return to_route('employer.whatsapp-bulk.show', $bulk->id);
    }

    public function show(Request $request, WhatsappBulkMessage $whatsappBulk, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $this->ensureOwns($whatsappBulk, $request->user()->id, $company);

        $whatsappBulk->load('jobListing:id,title');

        $recipients = $whatsappBulk->recipients()
            ->latest('id')
            ->paginate(50)
            ->through(fn ($recipient) => [
                'id' => $recipient->id,
                'candidate_name' => $recipient->candidate_name,
                'phone_number' => $recipient->phone_number,
                'email_address' => $recipient->email_address,
                'status' => $recipient->status,
                'error_message' => $recipient->error_message,
                'sent_at' => $recipient->sent_at?->format('d M Y H:i'),
            ]);

        return Inertia::render('employer/whatsapp-bulk/show', [
            'campaign' => [
                'id' => $whatsappBulk->id,
                'job_title' => $whatsappBulk->jobListing?->title ?? '-',
                'channel' => $whatsappBulk->channel ?? 'whatsapp',
                'subject' => $whatsappBulk->subject,
                'reply_to_email' => $whatsappBulk->reply_to_email,
                'status' => $whatsappBulk->status,
                'message_template' => $whatsappBulk->message_template,
                'recipients_count' => $whatsappBulk->recipients_count,
                'sent_count' => $whatsappBulk->sent_count,
                'failed_count' => $whatsappBulk->failed_count,
                'skipped_count' => $whatsappBulk->skipped_count,
                'started_at' => $whatsappBulk->started_at?->format('d M Y H:i'),
                'completed_at' => $whatsappBulk->completed_at?->format('d M Y H:i'),
                'created_at' => $whatsappBulk->created_at?->format('d M Y H:i'),
            ],
            'recipients' => $recipients,
        ]);
    }

    private function ensureOwns(WhatsappBulkMessage $bulk, int $userId, Company $company): void
    {
        abort_unless(
            (int) $bulk->user_id === $userId && (int) $bulk->company_id === (int) $company->id,
            404,
        );
    }

    private function resolveSessionId($user): string
    {
        $settings = is_array($user?->notification_settings) ? $user->notification_settings : [];

        return trim((string) data_get($settings, 'whatsapp.session_id'));
    }

    /**
     * @param  array<string, string>  $variables
     */
    private function renderTemplate(string $template, array $variables): string
    {
        $rendered = $template;

        foreach ($variables as $key => $value) {
            $rendered = str_replace('{'.$key.'}', $value, $rendered);
        }

        return $rendered;
    }
}
