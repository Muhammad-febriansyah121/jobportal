<?php

namespace App\Http\Requests\Employer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveEmployerJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'employer';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'description' => ['nullable', 'string'],
            'responsibilities' => ['nullable', 'string'],
            'required_qualifications' => ['nullable', 'string'],
            'preferred_qualifications' => ['nullable', 'string'],
            'benefits' => ['nullable', 'string', 'max:4000'],
            'location_city' => ['nullable', 'string', 'max:255'],
            'location_province' => ['nullable', 'string', 'max:255'],
            'work_mode' => ['required', Rule::in(['remote', 'hybrid', 'onsite'])],
            'job_type' => ['required', Rule::in(['full_time', 'part_time', 'contract', 'internship', 'freelance'])],
            'experience_level' => ['required', Rule::in(['entry', 'mid', 'senior', 'lead', 'manager'])],
            'qualification' => ['nullable', Rule::in(['sma', 'd3', 's1', 's2', 's3'])],
            'experience_min_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'experience_max_years' => ['nullable', 'integer', 'min:0', 'max:50', 'gte:experience_min_years'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0', 'gte:salary_min'],
            'salary_currency' => ['required', 'string', 'size:3'],
            'is_salary_visible' => ['required', 'boolean'],
            'is_anonymous' => ['nullable', 'boolean'],
            'is_urgent' => ['nullable', 'boolean'],
            'response_sla_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
            'closes_at' => ['nullable', 'date', 'after:today'],
        ];
    }
}
