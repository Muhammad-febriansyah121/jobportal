<?php

namespace App\Jobs;

use App\Models\WhatsappBulkMessage;
use App\Models\WhatsappBulkRecipient;
use App\Services\WhatsAppGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWhatsappBulkRecipientJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public readonly int $recipientId) {}

    public function handle(WhatsAppGatewayService $whatsApp): void
    {
        $recipient = WhatsappBulkRecipient::with('bulkMessage')->find($this->recipientId);

        if (! $recipient || ! $recipient->bulkMessage) {
            return;
        }

        if ($recipient->status !== 'pending') {
            return;
        }

        $bulk = $recipient->bulkMessage;

        if ($bulk->status === 'queued') {
            $bulk->update([
                'status' => 'processing',
                'started_at' => $bulk->started_at ?? now(),
            ]);
        }

        if ($bulk->channel === 'email') {
            $this->dispatchEmail($recipient, $bulk);

            return;
        }

        $this->dispatchWhatsApp($recipient, $bulk, $whatsApp);
    }

    private function dispatchWhatsApp(WhatsappBulkRecipient $recipient, WhatsappBulkMessage $bulk, WhatsAppGatewayService $whatsApp): void
    {
        $phone = $this->normalizePhone((string) $recipient->phone_number);

        if ($phone === '') {
            $recipient->update([
                'status' => 'failed',
                'error_message' => 'Nomor WhatsApp kosong / tidak valid.',
            ]);

            $this->bumpCounter($bulk->id, 'failed_count');
            $this->finalizeIfDone($bulk->id);

            return;
        }

        $result = $whatsApp->sendText((string) $bulk->session_id, $phone, $recipient->rendered_message);

        if (is_array($result)) {
            $recipient->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_message' => null,
            ]);
            $this->bumpCounter($bulk->id, 'sent_count');
        } else {
            $recipient->update([
                'status' => 'failed',
                'error_message' => 'Gateway WhatsApp menolak atau tidak merespons.',
            ]);
            $this->bumpCounter($bulk->id, 'failed_count');
        }

        $this->finalizeIfDone($bulk->id);
    }

    private function dispatchEmail(WhatsappBulkRecipient $recipient, WhatsappBulkMessage $bulk): void
    {
        $email = trim((string) $recipient->email_address);

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $recipient->update([
                'status' => 'failed',
                'error_message' => 'Alamat email kosong atau tidak valid.',
            ]);
            $this->bumpCounter($bulk->id, 'failed_count');
            $this->finalizeIfDone($bulk->id);

            return;
        }

        $subject = (string) ($bulk->subject ?: 'Pesan dari rekruter');
        $replyTo = (string) $bulk->reply_to_email;
        $body = (string) $recipient->rendered_message;

        try {
            $isHtml = $body !== strip_tags($body);

            Mail::send([], [], function (Message $message) use ($email, $recipient, $subject, $replyTo, $body, $isHtml): void {
                $message->to($email, $recipient->candidate_name ?: null);
                $message->subject($subject);

                if ($isHtml) {
                    $message->html($body);
                } else {
                    $message->text($body);
                }

                if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
                    $message->replyTo($replyTo);
                }
            });

            $recipient->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_message' => null,
            ]);
            $this->bumpCounter($bulk->id, 'sent_count');
        } catch (\Throwable $exception) {
            Log::warning('Broadcast email failed', [
                'recipient_id' => $recipient->id,
                'error' => $exception->getMessage(),
            ]);

            $recipient->update([
                'status' => 'failed',
                'error_message' => mb_substr($exception->getMessage(), 0, 500),
            ]);
            $this->bumpCounter($bulk->id, 'failed_count');
        }

        $this->finalizeIfDone($bulk->id);
    }

    public function failed(\Throwable $exception): void
    {
        $recipient = WhatsappBulkRecipient::find($this->recipientId);

        if (! $recipient) {
            return;
        }

        if ($recipient->status === 'pending') {
            $recipient->update([
                'status' => 'failed',
                'error_message' => mb_substr($exception->getMessage(), 0, 500),
            ]);

            if ($recipient->whatsapp_bulk_message_id) {
                $this->bumpCounter($recipient->whatsapp_bulk_message_id, 'failed_count');
                $this->finalizeIfDone($recipient->whatsapp_bulk_message_id);
            }
        }
    }

    private function bumpCounter(int $bulkId, string $column): void
    {
        DB::table('whatsapp_bulk_messages')->where('id', $bulkId)->increment($column);
    }

    private function finalizeIfDone(int $bulkId): void
    {
        $bulk = WhatsappBulkMessage::find($bulkId);

        if (! $bulk) {
            return;
        }

        $processed = $bulk->sent_count + $bulk->failed_count + $bulk->skipped_count;

        if ($processed < $bulk->recipients_count) {
            return;
        }

        if ($bulk->completed_at !== null) {
            return;
        }

        $finalStatus = $bulk->failed_count === 0
            ? 'completed'
            : ($bulk->sent_count === 0 ? 'failed' : 'completed_with_errors');

        $bulk->update([
            'status' => $finalStatus,
            'completed_at' => now(),
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
