<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveAssessmentQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'in:manual,ai'],
            'skill_id' => ['required', 'integer', 'exists:skills,id'],
            'difficulty' => ['required', 'in:easy,medium,hard'],
            'is_active' => ['nullable', 'boolean'],

            'manual_questions' => ['required_if:mode,manual', 'nullable', 'array', 'min:1', 'max:30'],
            'manual_questions.*.question' => ['required_if:mode,manual', 'nullable', 'string', 'max:5000'],
            'manual_questions.*.option_a' => ['required_if:mode,manual', 'nullable', 'string', 'max:500'],
            'manual_questions.*.option_b' => ['required_if:mode,manual', 'nullable', 'string', 'max:500'],
            'manual_questions.*.option_c' => ['required_if:mode,manual', 'nullable', 'string', 'max:500'],
            'manual_questions.*.option_d' => ['required_if:mode,manual', 'nullable', 'string', 'max:500'],
            'manual_questions.*.correct_option_index' => ['required_if:mode,manual', 'nullable', 'integer', 'between:0,3'],

            'total_questions' => ['required_if:mode,ai', 'nullable', 'integer', 'min:1', 'max:20'],
        ];
    }
}
