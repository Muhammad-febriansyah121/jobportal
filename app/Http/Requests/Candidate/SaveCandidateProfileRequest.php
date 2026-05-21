<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCandidateProfileRequest extends FormRequest
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
            'full_name' => ['required', 'string', 'max:255'],
            'headline' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:3000'],
            'location_city' => ['nullable', 'string', 'max:255'],
            'location_province' => ['nullable', 'string', 'max:255'],
            'expected_salary_min' => ['nullable', 'integer', 'min:0'],
            'expected_salary_max' => ['nullable', 'integer', 'min:0', 'gte:expected_salary_min'],
            'work_mode_pref' => ['required', Rule::in(['remote', 'hybrid', 'onsite', 'any'])],
            'availability' => ['nullable', Rule::in(['none', 'lt_1_month', '1_month', '2_months', 'gt_2_months'])],
            'preferred_industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'preferred_role' => ['nullable', 'string', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'skill_ids' => ['nullable', 'array'],
            'skill_ids.*' => ['integer', 'exists:skills,id'],
            'first_experience_company_name' => ['nullable', 'string', 'max:255'],
            'first_experience_job_title' => ['nullable', 'string', 'max:255', 'required_with:first_experience_company_name'],
            'first_experience_start_date' => ['nullable', 'date', 'required_with:first_experience_company_name'],
            'first_experience_end_date' => ['nullable', 'date', 'after_or_equal:first_experience_start_date'],
            'first_experience_is_current' => ['nullable', 'boolean'],
            'first_experience_location' => ['nullable', 'string', 'max:255'],
            'first_experience_description' => ['nullable', 'string', 'max:5000'],
            'first_education_institution' => ['nullable', 'string', 'max:255'],
            'first_education_degree' => ['nullable', 'string', 'max:255'],
            'first_education_field_of_study' => ['nullable', 'string', 'max:255'],
            'first_education_start_year' => ['nullable', 'integer', 'min:1950', 'max:'.now()->addYears(10)->year],
            'first_education_end_year' => ['nullable', 'integer', 'min:1950', 'max:'.now()->addYears(10)->year, 'gte:first_education_start_year'],
            'first_education_gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'additional_experiences' => ['nullable', 'string', 'max:50000'],
            'additional_educations' => ['nullable', 'string', 'max:50000'],
        ];
    }
}
