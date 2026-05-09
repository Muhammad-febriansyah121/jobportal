<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
        $isPaid = (int) $this->input('price', 0) > 0;

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'integer', 'min:0'],
            'ai_interview_quota' => ['nullable', 'integer', 'min:0'],
            'cv_builder_quota' => ['required', 'integer', 'min:0'],
            'validity_days' => [$isPaid ? 'required' : 'nullable', 'integer', 'min:1'],
            'features' => [$isPaid ? 'required' : 'nullable', 'string', 'max:5000'],
            'is_default_free' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'is_trial' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price.min' => 'Harga minimal 0.',
            'ai_interview_quota.min' => 'Kuota Simulasi Interview AI minimal 0.',
            'cv_builder_quota.min' => 'Kuota CV Builder minimal 0.',
            'validity_days.min' => 'Masa aktif minimal 1 hari.',
            'validity_days.required' => 'Paket berbayar wajib memiliki masa aktif.',
            'features.required' => 'Paket berbayar wajib mencantumkan rincian fitur.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $price = (int) $this->input('price', 0);

            if ($price <= 0) {
                return;
            }

            $aiQuota = (int) $this->input('ai_interview_quota', 0);
            $cvQuota = (int) $this->input('cv_builder_quota', 0);

            if ($aiQuota === 0 && $cvQuota === 0) {
                $validator->errors()->add('price', 'Paket berbayar wajib memiliki minimal satu kuota fitur (Simulasi Interview AI atau CV Builder).');
            }
        });
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
