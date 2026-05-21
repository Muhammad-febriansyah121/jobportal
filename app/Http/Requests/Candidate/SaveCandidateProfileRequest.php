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
            'experiences' => ['nullable', 'array', 'max:30'],
            'experiences.*.company_name' => ['nullable', 'string', 'max:255'],
            'experiences.*.job_title' => ['nullable', 'string', 'max:255', 'required_with:experiences.*.company_name'],
            'experiences.*.start_date' => ['nullable', 'date'],
            'experiences.*.end_date' => ['nullable', 'date'],
            'experiences.*.is_current' => ['nullable', 'boolean'],
            'experiences.*.location' => ['nullable', 'string', 'max:255'],
            'experiences.*.description' => ['nullable', 'string', 'max:5000'],
            'educations' => ['nullable', 'array', 'max:20'],
            'educations.*.institution' => ['nullable', 'string', 'max:255'],
            'educations.*.degree' => ['nullable', 'string', 'max:255'],
            'educations.*.field_of_study' => ['nullable', 'string', 'max:255'],
            'educations.*.start_year' => ['nullable', 'integer', 'min:1950', 'max:'.now()->addYears(10)->year],
            'educations.*.end_year' => ['nullable', 'integer', 'min:1950', 'max:'.now()->addYears(10)->year],
            'educations.*.gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
        ];
    }
}
