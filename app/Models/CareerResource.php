<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerResource extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'type',
        'category',
        'thumbnail_path',
        'content',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }
}
