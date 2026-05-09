<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'dataset_date' => ['nullable', 'date_format:Y-m-d'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'sub_industry_id' => [
                'nullable',
                'integer',
                Rule::exists('sub_industries', 'id')->where(fn ($query) => $query->where('industry_id', $this->integer('industry_id'))),
            ],
            'job_title' => ['required', 'string', 'max:255'],
            'location_city' => ['nullable', 'string', 'max:120'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0'],
            'qualification' => ['nullable', Rule::in(['sma', 'd3', 's1', 's2', 's3'])],
            'experience_min_years' => ['nullable', 'integer', 'min:0', 'max:50'],
            'experience_max_years' => ['nullable', 'integer', 'min:0', 'max:50', 'gte:experience_min_years'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sub_industry_id.exists' => 'Sub industri tidak sesuai dengan industri yang dipilih.',
        ];
    }
}
