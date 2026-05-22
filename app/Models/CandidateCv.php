<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['candidate_id', 'file_url', 'parsed_json', 'source', 'is_primary', 'uploaded_at'])]
class CandidateCv extends Model
{
    protected $table = 'candidate_cvs';

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    protected function casts(): array
    {
        return [
            'parsed_json' => 'array',
            'is_primary' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    /**
     * Normalize file_url to a host-relative path (e.g. "/storage/candidate-cvs/x.pdf").
     *
     * Why: iframe/anchor rendering this URL should resolve against the current
     * browser host. Storing an absolute URL bakes APP_URL into the DB, breaking
     * preview ketika port atau domain berubah (mis. local dev jobportal pindah
     * port karena port 8000 sudah dipakai project lain).
     */
    protected function fileUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $this->normalizeFileUrl($value),
            set: fn (?string $value): array => ['file_url' => $this->normalizeFileUrl($value)],
        );
    }

    private function normalizeFileUrl(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return $value;
        }

        if (str_starts_with($value, '/')) {
            return $value;
        }

        $path = parse_url($value, PHP_URL_PATH);

        return is_string($path) && $path !== '' ? $path : $value;
    }
}
