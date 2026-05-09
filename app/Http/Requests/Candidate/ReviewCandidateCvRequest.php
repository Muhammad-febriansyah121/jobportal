<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Validation\Rules\File;

class ReviewCandidateCvRequest extends SaveCandidateCvBuilderRequest
{
    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'cv_file' => ['required', File::types(['pdf', 'doc', 'docx', 'txt'])->max(5 * 1024)],
            'target_job' => ['nullable', 'string', 'max:160'],
        ];
    }
}
