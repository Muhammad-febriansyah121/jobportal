<?php

namespace App\Http\Requests\Employer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'name' => ['required', 'string', 'max:255'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'logo' => ['nullable', 'image', 'max:3072'],
            'cover' => ['nullable', 'image', 'max:4096'],
            'description' => ['nullable', 'string'],
            'culture' => ['nullable', 'string', 'max:4000'],
            'benefits' => ['nullable', 'string', 'max:4000'],
            'company_size' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'url', 'max:255'],
            'hq_city' => ['nullable', 'string', 'max:255'],
            'hq_province' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
