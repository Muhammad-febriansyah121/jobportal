<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateCandidateCvDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'candidate';
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'target_role' => ['required', 'string', 'max:120'],
            'years_experience' => ['nullable', 'numeric', 'min:0', 'max:60'],
            'focus_skills' => ['nullable', 'array', 'max:10'],
            'focus_skills.*' => ['nullable', 'string', 'max:80'],
            'achievements' => ['nullable', 'string', 'max:1800'],
            'language' => ['nullable', 'string', Rule::in(['id', 'en'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'focus_skills' => is_array($this->input('focus_skills')) ? $this->input('focus_skills') : [],
        ]);
    }
}
