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
        $isUpdate = $this->route('skill') !== null;

        return [
            'skill_id' => $isUpdate
                ? ['nullable', 'integer', 'exists:skills,id']
                : ['nullable', 'integer', 'exists:skills,id', 'required_without:skill_name'],
            'skill_name' => $isUpdate
                ? ['nullable', 'string', 'max:100']
                : ['nullable', 'string', 'max:100', 'required_without:skill_id'],
            'years_exp' => ['nullable', 'integer', 'min:0', 'max:60'],
            'proficiency' => ['nullable', Rule::in(['beginner', 'intermediate', 'advanced', 'expert'])],
        ];
    }
}
