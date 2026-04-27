<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'company_id', 'job_listing_id', 'session_id', 'channel',
    'subject', 'reply_to_email', 'message_template',
    'recipients_count', 'sent_count', 'failed_count', 'skipped_count',
    'status', 'started_at', 'completed_at',
])]
class WhatsappBulkMessage extends Model
{
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(WhatsappBulkRecipient::class);
    }
}
