<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApplyScrapedJobRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20', 'regex:/^[0-9+\-\s()]{8,20}$/'],
            'candidate_cv_id' => ['nullable', 'integer', 'exists:candidate_cvs,id'],
            'cover_letter' => ['nullable', 'string', 'min:100', 'max:5000'],
            'consent_to_email' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Nomor WhatsApp wajib diisi agar perusahaan bisa menghubungi kamu.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid.',
            'consent_to_email.accepted' => 'Persetujuan pengiriman CV ke perusahaan wajib dicentang.',
        ];
    }
}
