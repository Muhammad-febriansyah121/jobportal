<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployerMessageTemplateController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $templates = MessageTemplate::query()
            ->where('company_id', $company->id)
            ->when($request->filled('channel'), fn ($query) => $query->where('channel', $request->string('channel')->toString()))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('body', 'like', '%'.$search.'%');
                });
            })
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (MessageTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'channel' => $template->channel,
                'subject' => $template->subject,
                'body_preview' => mb_substr((string) $template->body, 0, 120),
                'description' => $template->description,
                'is_active' => $template->is_active,
                'updated_at' => $template->updated_at?->format('d M Y H:i'),
            ]);

        return Inertia::render('employer/message-templates/index', [
            'templates' => $templates,
            'filters' => [
                'channel' => $request->string('channel')->toString(),
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function create(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        return Inertia::render('employer/message-templates/create');
    }

    public function store(Request $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $data = $this->validatedPayload($request);

        MessageTemplate::create([
            'company_id' => $company->id,
            'created_by' => $request->user()->id,
            'name' => $data['name'],
            'channel' => $data['channel'],
            'subject' => $data['channel'] === 'email' ? $data['subject'] : null,
            'body' => $data['body'],
            'description' => $data['description'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template berhasil disimpan.']);

        return to_route('employer.message-templates.index');
    }

    public function edit(Request $request, MessageTemplate $messageTemplate, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        abort_unless($messageTemplate->company_id === $company->id, 404);

        return Inertia::render('employer/message-templates/edit', [
            'template' => [
                'id' => $messageTemplate->id,
                'name' => $messageTemplate->name,
                'channel' => $messageTemplate->channel,
                'subject' => $messageTemplate->subject,
                'body' => $messageTemplate->body,
                'description' => $messageTemplate->description,
                'is_active' => (bool) $messageTemplate->is_active,
            ],
        ]);
    }

    public function update(Request $request, MessageTemplate $messageTemplate, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        abort_unless($messageTemplate->company_id === $company->id, 404);

        $data = $this->validatedPayload($request);

        $messageTemplate->update([
            'name' => $data['name'],
            'channel' => $data['channel'],
            'subject' => $data['channel'] === 'email' ? $data['subject'] : null,
            'body' => $data['body'],
            'description' => $data['description'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template berhasil diperbarui.']);

        return to_route('employer.message-templates.index');
    }

    public function destroy(Request $request, MessageTemplate $messageTemplate, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        abort_unless($messageTemplate->company_id === $company->id, 404);

        $messageTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template dihapus.']);

        return to_route('employer.message-templates.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'channel' => ['required', Rule::in(['whatsapp', 'email'])],
            'subject' => ['nullable', 'string', 'max:191', 'required_if:channel,email'],
            'body' => ['required', 'string', 'min:5', 'max:6000'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'name.required' => 'Nama template wajib diisi.',
            'channel.required' => 'Pilih channel template.',
            'subject.required_if' => 'Subject wajib untuk template email.',
            'body.required' => 'Isi pesan wajib diisi.',
            'body.min' => 'Isi pesan minimal 5 karakter.',
        ]);
    }
}
