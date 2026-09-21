<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreScrapedJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'source' => ['required', 'array'],
            'source.platform' => ['required', 'string', 'max:100'],
            'source.job_id' => ['required', 'string', 'max:255'],
            'source.url' => ['required', 'url', 'max:2048'],
            'company' => ['required', 'array'],
            'company.name' => ['required', 'string', 'max:255'],
            'company.logo_url' => ['nullable', 'url', 'max:2048'],
            'company.website' => ['nullable', 'url', 'max:2048'],
            'company.profile' => ['nullable', 'string'],
            'job' => ['required', 'array'],
            'job.title' => ['required', 'string', 'max:255'],
            'job.description' => ['required', 'string'],
            'job.salary' => ['nullable', 'array'],
            'job.salary.min' => ['nullable', 'integer', 'min:0'],
            'job.salary.max' => ['nullable', 'integer', 'min:0', 'gte:job.salary.min'],
            'job.salary.currency' => ['nullable', 'string', 'size:3'],
            'job.location' => ['nullable', 'string', 'max:255'],
            'job.employment_type' => ['nullable', 'string', 'max:50'],
            'job.workplace_type' => ['nullable', 'string', 'max:50'],
            'job.requirements' => ['nullable', 'array'],
            'job.requirements.*' => ['string', 'max:5000'],
            'job.skills' => ['nullable', 'array'],
            'job.skills.*' => ['string', 'max:255'],
            'contact' => ['nullable', 'array'],
            'contact.hr_email' => ['nullable', 'email', 'max:255'],
            'contact.email_source' => ['nullable', 'url', 'max:2048'],
            'contact.email_verified' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'metadata.scraped_at' => ['nullable', 'date'],
        ];
    }
}
