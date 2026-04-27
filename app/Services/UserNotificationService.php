<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Carbon;

class UserNotificationService
{
    public function __construct(
        private readonly WhatsAppGatewayService $whatsAppGateway,
        private readonly FcmPushService $fcmPush,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function sendToUser(User $user, string $type, string $title, ?string $message = null, array $data = []): UserNotification
    {
        $notification = UserNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data_json' => $data,
            'is_read' => false,
        ]);

        $this->sendWhatsAppCopy($user, $type, $title, $message, $data);
        $this->sendFcmCopy($user, $type, $title, $message, $data);

        return $notification;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function sendFcmCopy(User $user, string $type, string $title, ?string $message, array $data): void
    {
        $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
        $isEnabled = data_get($settings, 'push.enabled');

        if ($isEnabled === false) {
            return;
        }

        $body = (string) ($message ?? '');
        $link = $this->notificationLink($type, $data);

        $this->fcmPush->sendToUser(
            $user,
            $title,
            $body,
            ['type' => $type] + $data,
            $link,
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function sendWhatsAppCopy(User $user, string $type, string $title, ?string $message, array $data): void
    {
        $defaultSessionId = trim((string) Setting::get('whatsapp_gateway_default_session_id', config('services.whatsapp.default_session_id')));

        if ($user->role === 'employer') {
            $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
            $isEnabled = data_get($settings, 'whatsapp.enabled');

            if ($isEnabled === false) {
                return;
            }

            $phoneNumber = trim((string) $user->phone);
            $sessionId = trim((string) (data_get($settings, 'whatsapp.session_id') ?: $defaultSessionId));
        } elseif ($user->role === 'candidate') {
            $phoneNumber = trim((string) $user->phone);
            $sessionId = $defaultSessionId;
        } else {
            return;
        }

        if ($phoneNumber === '' || $sessionId === '') {
            return;
        }

        $text = $this->buildWhatsAppMessage($type, $title, $message, $data);

        $this->whatsAppGateway->sendText($sessionId, $phoneNumber, $text);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function buildWhatsAppMessage(string $type, string $title, ?string $message, array $data): string
    {
        $appName = config('app.name', 'Karivia');
        $link = $this->notificationLink($type, $data);

        $body = match ($type) {
            'ai_interview_scheduled' => $this->msgAiInterviewScheduled($data),
            'interview_scheduled' => $this->msgInterviewScheduled($data),
            'ai_interview_confirmed' => $this->msgInterviewConfirmed($data),
            'ai_interview_declined' => $this->msgInterviewDeclined($data),
            'ai_interview_completed' => $this->msgInterviewCompleted($data),
            'ai_interview_reschedule_approved' => $this->msgRescheduleApproved($data),
            'ai_interview_reschedule_rejected' => $this->msgRescheduleRejected($data),
            'ai_interview_reschedule_requested' => $this->msgRescheduleRequested($data),
            'ai_interview_review_shared' => $this->msgReviewShared($data, $message),
            'application_advanced_after_ai_interview' => $this->msgApplicationAdvanced($data),
            'application_rejected_after_ai_interview' => $this->msgApplicationRejected($data),
            'application_submitted' => $this->msgApplicationSubmitted($data, $message),
            'company_verification' => $this->msgCompanyVerification($title, $message),
            default => $this->msgGeneric($title, $message),
        };

        $footer = implode("\n", array_filter([
            '',
            '─────────────────',
            $link !== null ? "Buka detail: {$link}" : null,
            "_{$appName} · Notifikasi Otomatis_",
        ]));

        return $body.$footer;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgAiInterviewScheduled(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');
        $companyName = data_get($data, 'company_name', config('app.name', 'Karivia'));
        $mode = data_get($data, 'interview_mode') === 'text' ? 'Teks' : 'Voice AI';
        $scheduledAt = data_get($data, 'scheduled_at');
        $jadwal = $scheduledAt
            ? Carbon::parse($scheduledAt)->locale('id')->isoFormat('dddd, D MMMM YYYY · HH:mm [WIB]')
            : null;

        $lines = [
            "*Undangan AI Interview — {$companyName}*",
            '',
            'Halo! Kamu mendapat undangan *AI Interview* untuk posisi:',
            "*{$jobTitle}*",
            '',
        ];

        if ($jadwal) {
            $lines[] = "Jadwal    : {$jadwal}";
        }

        $lines[] = "Mode      : Interview {$mode}";
        $lines[] = '';
        $lines[] = 'Harap konfirmasi kehadiran dan persiapkan dirimu sebelum sesi dimulai.';
        $lines[] = '';
        $lines[] = "_Semangat! {$companyName} menantikan yang terbaik darimu._";

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgInterviewScheduled(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');
        $companyName = data_get($data, 'company_name', config('app.name', 'Karivia'));
        $mode = data_get($data, 'mode') === 'onsite' ? 'Onsite' : 'Online';
        $scheduledAt = data_get($data, 'scheduled_at');
        $jadwal = $scheduledAt
            ? Carbon::parse($scheduledAt)->locale('id')->isoFormat('dddd, D MMMM YYYY · HH:mm [WIB]')
            : null;
        $duration = (int) data_get($data, 'duration_minutes', 60);
        $location = trim((string) data_get($data, 'location_url', ''));
        $notes = trim((string) data_get($data, 'notes', ''));

        $lines = [
            "*Undangan Wawancara — {$companyName}*",
            '',
            'Halo! Kamu mendapat undangan *wawancara* untuk posisi:',
            "*{$jobTitle}*",
            '',
        ];

        if ($jadwal) {
            $lines[] = "Jadwal    : {$jadwal}";
        }

        $lines[] = "Durasi    : {$duration} menit";
        $lines[] = "Mode      : {$mode}";

        if ($location !== '') {
            $lines[] = $mode === 'Onsite'
                ? "Alamat    : {$location}"
                : "Meeting   : {$location}";
        }

        if ($notes !== '') {
            $lines[] = '';
            $lines[] = '*Catatan dari rekruter:*';
            $lines[] = $notes;
        }

        $lines[] = '';
        $lines[] = 'Mohon konfirmasi kehadiran dan datang tepat waktu.';
        $lines[] = '';
        $lines[] = "_Sampai jumpa! Tim {$companyName}._";

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgInterviewConfirmed(array $data): string
    {
        $candidateName = data_get($data, 'candidate_name', 'Kandidat');
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Kandidat Konfirmasi Kehadiran Interview*',
            '',
            "{$candidateName} telah *mengkonfirmasi kehadiran* untuk AI Interview posisi *{$jobTitle}*.",
            '',
            'Sesi interview sudah dijadwalkan dan kandidat siap hadir.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgInterviewDeclined(array $data): string
    {
        $candidateName = data_get($data, 'candidate_name', 'Kandidat');
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Kandidat Menolak Undangan Interview*',
            '',
            "{$candidateName} *menolak* undangan AI Interview untuk posisi *{$jobTitle}*.",
            '',
            'Kamu dapat meninjau lamaran dan mempertimbangkan langkah selanjutnya dari dashboard recruiter.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgInterviewCompleted(array $data): string
    {
        $candidateName = data_get($data, 'candidate_name', 'Kandidat');
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Interview AI Selesai — Hasil Siap Direview*',
            '',
            "{$candidateName} baru saja *menyelesaikan AI Interview* untuk posisi *{$jobTitle}*.",
            '',
            'Buka detail interview untuk melihat jawaban, skor, dan analisis AI sebelum mengambil keputusan hiring.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgRescheduleApproved(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Jadwal Ulang Interview Disetujui*',
            '',
            "Permintaan jadwal ulang interview AI kamu untuk posisi *{$jobTitle}* telah *disetujui* oleh recruiter.",
            '',
            'Silakan buka detail interview untuk melihat jadwal baru dan konfirmasi ulang kehadiranmu.',
            '',
            '_Terima kasih atas kesabaran dan antusiasme kamu. Tetap semangat!_',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgRescheduleRejected(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Permintaan Jadwal Ulang Belum Disetujui*',
            '',
            "Maaf, recruiter belum dapat menyetujui permintaan jadwal ulang interview AI kamu untuk posisi *{$jobTitle}*.",
            '',
            'Silakan buka detail interview untuk melihat alasan dan ajukan kembali jika diperlukan.',
            '',
            '_Jangan menyerah! Tetap semangat mengejar peluang terbaikmu._',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgRescheduleRequested(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Permintaan Jadwal Ulang Interview*',
            '',
            "Kandidat untuk posisi *{$jobTitle}* mengajukan permintaan jadwal ulang AI Interview.",
            '',
            'Harap tinjau permintaan dan berikan keputusan melalui dashboard recruiter.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgReviewShared(array $data, ?string $message): string
    {
        $jobTitle = data_get($data, 'job_title', 'kandidat');

        return implode("\n", [
            '*Review Kandidat Siap Dilihat*',
            '',
            filled($message) ? trim((string) $message) : "Review AI Interview untuk posisi *{$jobTitle}* sudah tersedia.",
            '',
            'Buka detail untuk melihat skor, analisis mendalam, dan rekomendasi AI sebelum mengambil keputusan hiring.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgApplicationAdvanced(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Selamat! Kamu Lanjut ke Tahap Berikutnya*',
            '',
            "Hasil AI Interview kamu untuk posisi *{$jobTitle}* sudah direview oleh recruiter.",
            '',
            'Kamu berhasil melanjutkan ke tahap selanjutnya dalam proses rekrutmen!',
            '',
            '_Tetap percaya diri dan tunjukkan yang terbaik. Kami yakin kamu bisa!_',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgApplicationRejected(array $data): string
    {
        $jobTitle = data_get($data, 'job_title', 'posisi yang dilamar');

        return implode("\n", [
            '*Update Hasil Interview*',
            '',
            "Terima kasih sudah berpartisipasi dalam AI Interview untuk posisi *{$jobTitle}*.",
            '',
            'Setelah melalui proses seleksi, perusahaan belum bisa melanjutkan lamaranmu untuk posisi ini.',
            '',
            '_Jangan patah semangat! Setiap pengalaman adalah langkah maju. Cek lowongan lain yang mungkin lebih sesuai denganmu._',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function msgApplicationSubmitted(array $data, ?string $message): string
    {
        $jobTitle = data_get($data, 'job_title');

        $intro = $jobTitle
            ? "Ada *lamaran baru* yang masuk untuk posisi *{$jobTitle}*."
            : (filled($message) ? trim((string) $message) : 'Ada lamaran baru yang masuk.');

        return implode("\n", [
            '*Lamaran Baru Masuk*',
            '',
            $intro,
            '',
            'Segera tinjau profil kandidat dan lanjutkan proses rekrutmen melalui dashboard.',
        ]);
    }

    private function msgCompanyVerification(string $title, ?string $message): string
    {
        return implode("\n", array_filter([
            '*Update Verifikasi Perusahaan*',
            '',
            '*'.trim($title).'*',
            filled($message) ? trim((string) $message) : null,
            '',
            'Buka dashboard untuk melihat detail status verifikasi perusahaanmu.',
        ]));
    }

    private function msgGeneric(string $title, ?string $message): string
    {
        return implode("\n", array_filter([
            '*'.trim($title).'*',
            '',
            filled($message) ? trim((string) $message) : null,
        ]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function notificationLink(string $type, array $data): ?string
    {
        if (is_string($data['review_url'] ?? null) && $data['review_url'] !== '') {
            return $data['review_url'];
        }

        $sessionId = $data['ai_interview_session_id'] ?? null;

        return match ($type) {
            'application_submitted' => route('employer.candidates.index'),
            'company_verification' => route('employer.verification.index'),
            'ai_interview_review_shared',
            'ai_interview_reschedule_requested' => route('employer.dashboard'),
            'ai_interview_confirmed',
            'ai_interview_declined',
            'ai_interview_completed' => $sessionId !== null
                ? route('employer.ai-interviews.show', $sessionId)
                : route('employer.dashboard'),
            'ai_interview_scheduled',
            'ai_interview_reschedule_approved',
            'ai_interview_reschedule_rejected' => $sessionId !== null
                ? route('candidate.ai-interviews.show', $sessionId)
                : route('candidate.ai-interviews.index'),
            'interview_scheduled' => isset($data['interview_id'])
                ? route('candidate.interviews.show', $data['interview_id'])
                : route('candidate.interviews.index'),
            default => null,
        };
    }
}
