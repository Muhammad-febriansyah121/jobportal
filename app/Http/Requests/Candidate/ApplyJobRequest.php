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
            'phone' => ['required', 'string', 'max:20', 'regex:/^[0-9+\-\s()]{8,20}$/'],
            'candidate_cv_id' => ['nullable', 'integer', 'exists:candidate_cvs,id'],
            'cover_letter' => ['nullable', 'string', 'min:100', 'max:5000'],
            'screening_answers' => ['nullable', 'array'],
            'screening_answers.*' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get the custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.required' => 'Nomor WhatsApp wajib diisi agar perusahaan bisa menghubungi kamu.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid.',
        ];
    }
}
