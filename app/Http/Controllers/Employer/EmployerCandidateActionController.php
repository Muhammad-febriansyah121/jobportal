<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\WhatsAppGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployerCandidateActionController extends Controller
{
    public function sendWhatsapp(
        Request $request,
        Application $application,
        WhatsAppGatewayService $whatsApp,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): JsonResponse {
        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:4000'],
        ]);

        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless(
            $company !== null && $application->jobListing?->company_id === $company->id,
            403,
        );

        if (! $whatsApp->isConfigured()) {
            return response()->json([
                'message' => 'Gateway WhatsApp belum dikonfigurasi di server.',
            ], 422);
        }

        $settings = is_array($request->user()?->notification_settings)
            ? $request->user()->notification_settings
            : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));

        if ($sessionId === '') {
            return response()->json([
                'message' => 'Sesi WhatsApp Anda belum terhubung. Buka pengaturan WhatsApp untuk menghubungkan dulu.',
                'requires_setup' => true,
            ], 422);
        }

        $session = $whatsApp->getSession($sessionId);
        $sessionState = strtoupper((string) data_get($session, 'state'));

        if ($sessionState !== 'CONNECTED' && $sessionState !== 'READY') {
            return response()->json([
                'message' => 'Sesi WhatsApp Anda tidak aktif. Hubungkan ulang sesi WhatsApp dulu.',
                'requires_setup' => true,
            ], 422);
        }

        $candidatePhone = trim((string) $application->candidate?->user?->phone);

        if ($candidatePhone === '') {
            return response()->json([
                'message' => 'Kandidat belum mengisi nomor WhatsApp.',
            ], 422);
        }

        $normalizedPhone = $this->normalizePhone($candidatePhone);

        $result = $whatsApp->sendText($sessionId, $normalizedPhone, $validated['message']);

        if (! is_array($result)) {
            return response()->json([
                'message' => 'Pesan gagal dikirim. Coba lagi atau cek status sesi WhatsApp.',
            ], 422);
        }

        if ($application->first_responded_at === null) {
            $application->update(['first_responded_at' => now()]);
        }

        return response()->json([
            'message' => 'Pesan WhatsApp berhasil dikirim.',
        ]);
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        return $digits;
    }
}
