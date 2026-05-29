<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCandidateCvBuilderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'candidate';
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'template' => ['nullable', 'string', Rule::in(['ats'])],
            'title' => ['nullable', 'string', 'max:120'],
            'summary' => ['nullable', 'string', 'max:2500'],
            'personal' => ['required', 'array'],
            'personal.full_name' => ['required', 'string', 'max:120'],
            'personal.headline' => ['nullable', 'string', 'max:160'],
            'personal.email' => ['nullable', 'email', 'max:120'],
            'personal.phone' => ['nullable', 'string', 'max:40'],
            'personal.city' => ['nullable', 'string', 'max:80'],
            'personal.linkedin' => ['nullable', 'url', 'max:255'],
            'personal.github' => ['nullable', 'url', 'max:255'],
            'personal.portfolio' => ['nullable', 'url', 'max:255'],
            'skills' => ['nullable', 'array', 'max:40'],
            'skills.*' => ['nullable', 'string', 'max:80'],
            'experiences' => ['nullable', 'array', 'max:20'],
            'experiences.*.job_title' => ['nullable', 'string', 'max:120'],
            'experiences.*.company_name' => ['nullable', 'string', 'max:120'],
            'experiences.*.location' => ['nullable', 'string', 'max:80'],
            'experiences.*.start_date' => ['nullable', 'string', 'max:20'],
            'experiences.*.end_date' => ['nullable', 'string', 'max:20'],
            'experiences.*.is_current' => ['nullable', 'boolean'],
            'experiences.*.description' => ['nullable', 'string', 'max:2000'],
            'educations' => ['nullable', 'array', 'max:15'],
            'educations.*.school_name' => ['nullable', 'string', 'max:120'],
            'educations.*.degree' => ['nullable', 'string', 'max:120'],
            'educations.*.field_of_study' => ['nullable', 'string', 'max:120'],
            'educations.*.start_year' => ['nullable', 'string', 'max:10'],
            'educations.*.end_year' => ['nullable', 'string', 'max:10'],
            'educations.*.description' => ['nullable', 'string', 'max:1000'],
            'projects' => ['nullable', 'array', 'max:20'],
            'projects.*.name' => ['nullable', 'string', 'max:120'],
            'projects.*.role' => ['nullable', 'string', 'max:120'],
            'projects.*.link' => ['nullable', 'url', 'max:255'],
            'projects.*.description' => ['nullable', 'string', 'max:2000'],
            'certifications' => ['nullable', 'array', 'max:20'],
            'certifications.*.name' => ['nullable', 'string', 'max:120'],
            'certifications.*.issuer' => ['nullable', 'string', 'max:120'],
            'certifications.*.year' => ['nullable', 'string', 'max:20'],
            'ai_review' => ['nullable', 'array'],
            'ai_review.text' => ['nullable', 'string', 'max:20000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'skills' => is_array($this->input('skills')) ? $this->input('skills') : [],
            'experiences' => is_array($this->input('experiences')) ? $this->input('experiences') : [],
            'educations' => is_array($this->input('educations')) ? $this->input('educations') : [],
            'projects' => is_array($this->input('projects')) ? $this->input('projects') : [],
            'certifications' => is_array($this->input('certifications')) ? $this->input('certifications') : [],
        ]);
    }
}
