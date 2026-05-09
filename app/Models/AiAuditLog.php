<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'feature',
    'input_hash',
    'input_json',
    'output_json',
    'model_name',
    'status',
    'prompt_tokens',
    'completion_tokens',
    'reasoning_tokens',
    'total_tokens',
])]
class AiAuditLog extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'input_json' => 'array',
            'output_json' => 'array',
            'prompt_tokens' => 'integer',
            'completion_tokens' => 'integer',
            'reasoning_tokens' => 'integer',
            'total_tokens' => 'integer',
        ];
    }
}
