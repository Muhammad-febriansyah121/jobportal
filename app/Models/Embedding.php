<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['owner_type', 'owner_id', 'content_type', 'embedding', 'model_name'])]
class Embedding extends Model
{
    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
        ];
    }
}
