<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveSalaryInsightRequest extends FormRequest
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
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'dataset_date' => ['nullable', 'date_format:Y-m-d'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'job_title' => ['required', 'string', 'max:255'],
            'location_city' => ['nullable', 'string', 'max:120'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_median' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0'],
            'source_name' => ['nullable', 'string', 'max:120'],
            'source_count' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
