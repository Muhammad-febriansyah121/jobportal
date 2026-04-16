<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\MentorMentee;
use App\Models\MentorProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminMentorController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $mentors = MentorProfile::query()
            ->select(['id', 'user_id', 'headline', 'rate', 'is_verified', 'created_at'])
            ->with(['user:id,name,email,is_active'])
            ->withCount('mentees')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->whereHas('user', function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('verified'), fn ($query) => $query->where('is_verified', $request->string('verified')->toString() === 'yes'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (MentorProfile $mentor): array => [
                'id' => $mentor->id,
                'name' => $mentor->user?->name,
                'email' => $mentor->user?->email,
                'headline' => $mentor->headline ?? '-',
                'rate' => $mentor->rate ? 'Rp '.number_format((int) $mentor->rate, 0, ',', '.') : '-',
                'verified' => [
                    'label' => $mentor->is_verified ? 'Verified' : 'Belum',
                    'tone' => $mentor->is_verified ? 'success' : 'warning',
                ],
                'status' => [
                    'label' => $mentor->user?->is_active ? 'Aktif' : 'Nonaktif',
                    'tone' => $mentor->user?->is_active ? 'success' : 'danger',
                ],
                'mentees_count' => $mentor->mentees_count,
                'actions' => $this->mentorActions($mentor),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Mentor',
            'description' => 'Review mentor, verifikasi profil, aktifkan atau nonaktifkan mentor.',
            'indexAction' => route('admin.mentors.index'),
            'filters' => [
                $this->field('search', 'Cari mentor', 'search', $request->string('search')->toString()),
                $this->field('verified', 'Verifikasi', 'select', $request->string('verified')->toString(), $this->options([
                    '' => 'Semua mentor',
                    'yes' => 'Verified',
                    'no' => 'Belum verified',
                ])),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'headline', 'label' => 'Headline'],
                ['key' => 'rate', 'label' => 'Rate'],
                ['key' => 'verified', 'label' => 'Verifikasi'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'mentees_count', 'label' => 'Mentee'],
            ],
            'rows' => $mentors,
            'emptyState' => 'Belum ada mentor.',
        ]);
    }

    public function show(MentorProfile $mentorProfile): Response
    {
        $mentorProfile->load(['user:id,name,email,is_active']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Mentor',
            'description' => $mentorProfile->user?->name,
            'backHref' => route('admin.mentors.index'),
            'actions' => $this->mentorActions($mentorProfile),
            'sections' => [
                [
                    'title' => 'Profil mentor',
                    'items' => [
                        ['label' => 'Nama', 'value' => $mentorProfile->user?->name],
                        ['label' => 'Email', 'value' => $mentorProfile->user?->email],
                        ['label' => 'Headline', 'value' => $mentorProfile->headline ?? '-'],
                        ['label' => 'Bio', 'value' => $mentorProfile->bio ?? '-'],
                        ['label' => 'Rate', 'value' => $mentorProfile->rate ? 'Rp '.number_format((int) $mentorProfile->rate, 0, ',', '.') : '-'],
                        ['label' => 'Verified', 'value' => $mentorProfile->is_verified ? 'Ya' : 'Belum'],
                        ['label' => 'Status user', 'value' => $mentorProfile->user?->is_active ? 'Aktif' : 'Nonaktif'],
                    ],
                ],
            ],
            'tables' => [
                [
                    'title' => 'Kandidat bimbingan',
                    'columns' => [
                        ['key' => 'candidate_id', 'label' => 'Candidate ID'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'started_at', 'label' => 'Mulai'],
                        ['key' => 'ended_at', 'label' => 'Selesai'],
                    ],
                    'rows' => MentorMentee::query()
                        ->select(['id', 'candidate_id', 'status', 'started_at', 'ended_at'])
                        ->where('mentor_id', $mentorProfile->id)
                        ->latest()
                        ->limit(20)
                        ->get()
                        ->map(fn (MentorMentee $mentee): array => [
                            'id' => $mentee->id,
                            'candidate_id' => $mentee->candidate_id,
                            'status' => str($mentee->status)->headline()->toString(),
                            'started_at' => $mentee->started_at?->format('d M Y') ?? '-',
                            'ended_at' => $mentee->ended_at?->format('d M Y') ?? '-',
                        ]),
                ],
            ],
        ]);
    }

    public function verify(Request $request, MentorProfile $mentorProfile, RecordActivity $activity): RedirectResponse
    {
        $mentorProfile->update(['is_verified' => true]);
        $activity->handle($request->user(), 'verify_mentor', $mentorProfile);

        $this->flash('Mentor berhasil diverifikasi.');

        return back();
    }

    public function activate(Request $request, MentorProfile $mentorProfile, RecordActivity $activity): RedirectResponse
    {
        $mentorProfile->user()->update(['is_active' => true]);
        $activity->handle($request->user(), 'activate_mentor', $mentorProfile);

        $this->flash('Mentor berhasil diaktifkan.');

        return back();
    }

    public function deactivate(Request $request, MentorProfile $mentorProfile, RecordActivity $activity): RedirectResponse
    {
        $mentorProfile->user()->update(['is_active' => false]);
        $activity->handle($request->user(), 'deactivate_mentor', $mentorProfile);

        $this->flash('Mentor berhasil dinonaktifkan.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function mentorActions(MentorProfile $mentor): array
    {
        return [
            $this->action('Lihat Detail', route('admin.mentors.show', $mentor), 'Eye'),
            $this->action('Verifikasi', route('admin.mentors.verify', $mentor), 'ShieldCheck', 'patch', 'default', 'Verifikasi mentor?', 'Profil mentor akan ditandai verified.'),
            $mentor->user?->is_active
                ? $this->action('Nonaktifkan', route('admin.mentors.deactivate', $mentor), 'Ban', 'patch', 'destructive', 'Nonaktifkan mentor?', 'Mentor tidak bisa memakai platform sampai diaktifkan kembali.')
                : $this->action('Aktifkan', route('admin.mentors.activate', $mentor), 'Check', 'patch'),
        ];
    }
}
