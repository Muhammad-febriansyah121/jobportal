<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\GenerateUserAiSummary;
use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\User;
use App\Services\ActivityRiskDetector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'email_verified_at', 'created_at'])
            ->withCount('activityLogs')
            ->with('candidateProfile.primaryCv')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('is_active', $request->string('status')->toString() === 'active'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => str($user->role)->headline()->toString(),
                'status' => [
                    'label' => $user->is_active ? 'Aktif' : 'Nonaktif',
                    'tone' => $user->is_active ? 'success' : 'danger',
                ],
                'email_verified' => [
                    'label' => $user->email_verified_at ? 'Terverifikasi' : 'Belum',
                    'tone' => $user->email_verified_at ? 'success' : 'warning',
                ],
                'created_at' => $user->created_at?->format('d M Y'),
                'activity_count' => $user->activity_logs_count,
                'actions' => $this->userActions($user),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola User',
            'description' => 'Pantau akun pengguna, status aktivasi, dan riwayat aktivitas platform.',
            'indexAction' => route('admin.users.index'),
            'filters' => [
                $this->field('search', 'Cari nama/email', 'search', $request->string('search')->toString()),
                $this->field('role', 'Role', 'select', $request->string('role')->toString(), $this->options([
                    '' => 'Semua role',
                    'admin' => 'Admin',
                    'candidate' => 'Kandidat',
                    'employer' => 'Perusahaan',
                    'mentor' => 'Mentor',
                ])),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'active' => 'Aktif',
                    'inactive' => 'Nonaktif',
                ])),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'role', 'label' => 'Role'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'email_verified', 'label' => 'Email'],
                ['key' => 'created_at', 'label' => 'Tanggal daftar'],
                ['key' => 'activity_count', 'label' => 'Activity'],
            ],
            'rows' => $users,
            'emptyState' => 'Belum ada user yang cocok dengan filter ini.',
        ]);
    }

    public function show(User $user): Response
    {
        $user->loadCount('activityLogs');
        $user->load('candidateProfile.cvs');

        $activities = ActivityLog::query()
            ->select(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'created_at'])
            ->where('actor_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (ActivityLog $activity): array => [
                'id' => $activity->id,
                'action' => str($activity->action)->headline()->toString(),
                'subject' => $activity->subject_type === null ? '-' : class_basename((string) $activity->subject_type).' #'.$activity->subject_id,
                'created_at' => $activity->created_at?->format('d M Y H:i'),
            ]);

        $latestAiSummary = AiAuditLog::query()
            ->where('user_id', $user->id)
            ->where('feature', 'admin_user_summary')
            ->where('status', 'success')
            ->latest()
            ->first(['output_json', 'created_at']);

        $aiSummary = $latestAiSummary
            ? [
                'summary' => $latestAiSummary->output_json['summary'] ?? null,
                'generated_at' => $latestAiSummary->created_at?->format('d M Y H:i'),
            ]
            : null;
        $riskLog = AiAuditLog::query()
            ->where('user_id', $user->id)
            ->where('feature', 'user_activity_risk_detection')
            ->latest()
            ->first(['output_json', 'status', 'created_at']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail User',
            'description' => $user->name,
            'backHref' => route('admin.users.index'),
            'actions' => $this->userActions($user),
            'aiSummary' => $aiSummary,
            'sections' => [
                [
                    'title' => 'Profil',
                    'items' => [
                        ['label' => 'Nama', 'value' => $user->name],
                        ['label' => 'Email', 'value' => $user->email],
                        ['label' => 'No. HP', 'value' => $user->phone ?: '-'],
                        ['label' => 'Role', 'value' => str($user->role)->headline()->toString()],
                        ['label' => 'Status', 'value' => $user->is_active ? 'Aktif' : 'Nonaktif'],
                        ['label' => 'Email verification', 'value' => $user->email_verified_at?->format('d M Y H:i') ?? 'Belum terverifikasi'],
                        ['label' => 'Tanggal daftar', 'value' => $user->created_at?->format('d M Y H:i')],
                    ],
                ],
                [
                    'title' => 'AI Risk Detection',
                    'items' => $this->riskItems($riskLog),
                ],
            ],
            'tables' => [
                ...($user->role === 'candidate' ? [$this->candidateCvTable($user)] : []),
                [
                    'title' => 'Activity user',
                    'columns' => [
                        ['key' => 'action', 'label' => 'Aksi'],
                        ['key' => 'subject', 'label' => 'Subject'],
                        ['key' => 'created_at', 'label' => 'Waktu'],
                    ],
                    'rows' => $activities,
                ],
            ],
        ]);
    }

    public function detectRisk(User $user, ActivityRiskDetector $riskDetector): RedirectResponse
    {
        $log = $riskDetector->analyze($user);
        $level = str((string) ($log->output_json['risk_level'] ?? 'unknown'))->headline()->toString();

        if ($log->status === 'success') {
            $this->flash("Risk detection AI selesai. Level: {$level}.");
        } else {
            $this->flash("Risk detection dibuat dengan fallback heuristik. Level: {$level}. Konfigurasi API key perlu dicek.", 'warning');
        }

        return back();
    }

    public function generateAiSummary(User $user, GenerateUserAiSummary $action): RedirectResponse
    {
        $log = $action->handle($user);

        if ($log && $log->status === 'success') {
            $this->flash('Ringkasan AI berhasil dibuat.');
        } else {
            $this->flash('Gagal membuat ringkasan AI. Periksa konfigurasi API key.', 'error');
        }

        return back();
    }

    public function activate(Request $request, User $user, RecordActivity $activity): RedirectResponse
    {
        $user->update(['is_active' => true]);
        $activity->handle($request->user(), 'activate_user', $user);

        $this->flash('User berhasil diaktifkan.');

        return back();
    }

    public function deactivate(Request $request, User $user, RecordActivity $activity): RedirectResponse
    {
        if ($request->user()->is($user)) {
            $this->flash('Admin tidak bisa menonaktifkan akunnya sendiri.', 'error');

            return back();
        }

        $user->update(['is_active' => false]);
        $activity->handle($request->user(), 'deactivate_user', $user);

        $this->flash('User berhasil dinonaktifkan.');

        return back();
    }

    public function resetEmailVerification(Request $request, User $user, RecordActivity $activity): RedirectResponse
    {
        $user->forceFill(['email_verified_at' => null])->save();
        $activity->handle($request->user(), 'reset_email_verification', $user);

        $this->flash('Status verifikasi email berhasil direset.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function userActions(User $user): array
    {
        $cvUrl = $user->role === 'candidate'
            ? $user->candidateProfile?->primaryCv?->file_url
            : null;

        return array_values(array_filter([
            $this->action('Lihat Detail', route('admin.users.show', $user), 'Eye', 'get', 'default'),
            $this->action('Ringkasan AI', route('admin.users.generate-ai-summary', $user), 'Sparkles', 'post', 'secondary'),
            $cvUrl ? [
                'label' => 'Lihat CV',
                'href' => $cvUrl,
                'icon' => 'FileText',
                'method' => 'get',
                'variant' => 'success',
                'external' => true,
            ] : null,
            $user->is_active
                ? $this->action('Nonaktifkan', route('admin.users.deactivate', $user), 'Ban', 'patch', 'destructive', 'Nonaktifkan user?', 'User tidak bisa memakai platform sampai diaktifkan kembali.')
                : $this->action('Aktifkan', route('admin.users.activate', $user), 'Check', 'patch', 'success'),
            $this->action('Reset Email', route('admin.users.reset-email-verification', $user), 'ShieldCheck', 'patch', 'warning', 'Reset verifikasi email?', 'User perlu melakukan verifikasi email ulang.'),
            $this->action('Deteksi Risiko', route('admin.users.detect-risk', $user), 'ShieldAlert', 'post', 'violet', 'Jalankan deteksi risiko?', 'AI akan menilai pola apply, login gagal, dan aksi destruktif user.'),
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    private function candidateCvTable(User $user): array
    {
        $cvs = $user->candidateProfile?->cvs ?? collect();

        return [
            'title' => 'CV Kandidat',
            'columns' => [
                ['key' => 'source', 'label' => 'Sumber'],
                ['key' => 'is_primary', 'label' => 'Utama'],
                ['key' => 'uploaded_at', 'label' => 'Diunggah'],
                ['key' => 'view_url', 'label' => 'File'],
            ],
            'rows' => $cvs->map(fn ($cv): array => [
                'id' => $cv->id,
                'source' => str($cv->source ?? 'upload')->headline()->toString(),
                'is_primary' => $cv->is_primary ? 'Ya' : 'Tidak',
                'uploaded_at' => $cv->uploaded_at?->format('d M Y H:i') ?? '-',
                'view_url' => $cv->file_url
                    ? ['type' => 'link', 'label' => 'Buka PDF', 'href' => $cv->file_url]
                    : '-',
            ])->all(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function riskItems(?AiAuditLog $riskLog): array
    {
        if ($riskLog === null) {
            return [
                ['label' => 'Status', 'value' => 'Belum dianalisis'],
            ];
        }

        $output = $riskLog->output_json ?? [];

        return [
            ['label' => 'Risk level', 'value' => str((string) ($output['risk_level'] ?? '-'))->headline()->toString()],
            ['label' => 'Risk score', 'value' => $output['risk_score'] ?? '-'],
            ['label' => 'Confidence', 'value' => $output['confidence'] ?? '-'],
            ['label' => 'Status', 'value' => str($riskLog->status)->headline()->toString()],
            ['label' => 'Analisis terakhir', 'value' => $riskLog->created_at?->format('d M Y H:i')],
            ['label' => 'Alasan', 'value' => collect($output['reasons'] ?? [])->implode("\n")],
            ['label' => 'Rekomendasi', 'value' => collect($output['recommended_actions'] ?? [])->implode("\n")],
        ];
    }
}
