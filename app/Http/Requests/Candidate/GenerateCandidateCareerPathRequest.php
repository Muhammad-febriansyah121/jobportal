<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class GenerateCandidateCareerPathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'candidate';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'target_role' => ['required', 'string', 'max:255'],
            'focus' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
