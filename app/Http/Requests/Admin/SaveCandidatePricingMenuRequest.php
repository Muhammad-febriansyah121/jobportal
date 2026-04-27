<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveCandidatePricingMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'integer', 'min:0'],
            'ai_token_amount' => ['required', 'integer', 'min:0'],
            'cv_builder_quota' => ['required', 'integer', 'min:0'],
            'features' => ['nullable', 'string', 'max:5000'],
            'is_default_free' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price.min' => 'Harga minimal 0.',
            'ai_token_amount.min' => 'Token AI minimal 0.',
            'cv_builder_quota.min' => 'Kuota CV Builder minimal 0.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $price = (int) $this->input('price', 0);
        $isDefaultFree = $this->boolean('is_default_free');

        if ($isDefaultFree) {
            $price = 0;
        }

        $this->merge([
            'price' => $price,
        ]);
    }
}
