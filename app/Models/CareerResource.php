<?php

namespace App\Models;

use Database\Factories\CareerResourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CareerResource extends Model
{
    /** @use HasFactory<CareerResourceFactory> */
    use HasFactory;

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
