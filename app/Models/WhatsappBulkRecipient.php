<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'whatsapp_bulk_message_id', 'application_id', 'candidate_user_id',
    'candidate_name', 'phone_number', 'email_address', 'rendered_message',
    'status', 'error_message', 'sent_at',
])]
class WhatsappBulkRecipient extends Model
{
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function bulkMessage(): BelongsTo
    {
        return $this->belongsTo(WhatsappBulkMessage::class, 'whatsapp_bulk_message_id');
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function candidateUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_user_id');
    }
}
