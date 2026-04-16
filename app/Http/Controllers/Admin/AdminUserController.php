<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\GenerateUserAiSummary;
use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\User;
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

        $activities = ActivityLog::query()
            ->select(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'created_at'])
            ->where('actor_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (ActivityLog $activity): array => [
                'id' => $activity->id,
                'action' => $activity->action,
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
                        ['label' => 'Role', 'value' => str($user->role)->headline()->toString()],
                        ['label' => 'Status', 'value' => $user->is_active ? 'Aktif' : 'Nonaktif'],
                        ['label' => 'Email verification', 'value' => $user->email_verified_at?->format('d M Y H:i') ?? 'Belum terverifikasi'],
                        ['label' => 'Tanggal daftar', 'value' => $user->created_at?->format('d M Y H:i')],
                    ],
                ],
            ],
            'tables' => [
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
        return [
            $this->action('Lihat Detail', route('admin.users.show', $user), 'Eye'),
            $this->action('Generate AI Summary', route('admin.users.generate-ai-summary', $user), 'Sparkles', 'post', 'outline'),
            $user->is_active
                ? $this->action('Nonaktifkan', route('admin.users.deactivate', $user), 'Ban', 'patch', 'destructive', 'Nonaktifkan user?', 'User tidak bisa memakai platform sampai diaktifkan kembali.')
                : $this->action('Aktifkan', route('admin.users.activate', $user), 'Check', 'patch', 'default'),
            $this->action('Reset Email', route('admin.users.reset-email-verification', $user), 'ShieldCheck', 'patch', 'outline', 'Reset verifikasi email?', 'User perlu melakukan verifikasi email ulang.'),
        ];
    }
}
