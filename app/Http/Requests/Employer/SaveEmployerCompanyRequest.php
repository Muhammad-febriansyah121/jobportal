<?php

namespace App\Http\Requests\Employer;

use App\Models\Company;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveEmployerCompanyRequest extends FormRequest
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
        /** @var Company|null $company */
        $company = $this->attributes->get('employerCompany');

        return [
            'name' => ['required', 'string', 'max:255'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'cover_url' => ['nullable', 'url', 'max:2048'],
            'description' => ['nullable', 'string'],
            'company_size' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'url', 'max:255'],
            'hq_city' => ['nullable', 'string', 'max:255'],
            'hq_province' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('companies', 'slug')->ignore($company)],
        ];
    }
}
