<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class ApplyJobRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'candidate';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'candidate_cv_id' => ['nullable', 'integer', 'exists:candidate_cvs,id'],
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'screening_answers' => ['nullable', 'array'],
            'screening_answers.*' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
