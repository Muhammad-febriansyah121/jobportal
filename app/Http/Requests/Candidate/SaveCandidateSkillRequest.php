<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCandidateSkillRequest extends FormRequest
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
        $skillIdRequired = $this->route('skill') ? 'nullable' : 'required';

        return [
            'skill_id' => [$skillIdRequired, 'integer', 'exists:skills,id'],
            'years_exp' => ['nullable', 'integer', 'min:0', 'max:60'],
            'proficiency' => ['nullable', Rule::in(['beginner', 'intermediate', 'advanced', 'expert'])],
        ];
    }
}
