<?php

namespace App\Http\Requests\Candidate;

class ReviewCandidateCvRequest extends SaveCandidateCvBuilderRequest
{
    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'target_job' => ['nullable', 'string', 'max:160'],
        ];
    }
}
