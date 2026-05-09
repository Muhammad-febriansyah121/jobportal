<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSalarySubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'job_title' => ['required', 'string', 'max:150'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'company_name' => ['nullable', 'string', 'max:150'],
            'location_city' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', 'in:full_time,part_time,contract,internship,freelance'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'monthly_salary' => ['required', 'integer', 'min:500000', 'max:1000000000'],
            'is_anonymous' => ['nullable', 'boolean'],
            'contributor_name' => ['nullable', 'string', 'max:120'],
            'contributor_email' => ['nullable', 'email', 'max:160'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'job_title.required' => 'Posisi/jabatan wajib diisi.',
            'monthly_salary.required' => 'Gaji per bulan wajib diisi.',
            'monthly_salary.min' => 'Gaji per bulan minimal Rp 500.000.',
        ];
    }
}
