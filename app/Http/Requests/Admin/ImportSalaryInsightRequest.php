<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportSalaryInsightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'dataset_date' => ['nullable', 'date_format:Y-m-d'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'publish' => ['nullable', 'boolean'],
            'source_name' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File CSV wajib dipilih.',
            'file.mimes' => 'File harus berformat CSV.',
            'dataset_date.date_format' => 'Format tanggal dataset harus YYYY-MM-DD.',
        ];
    }
}
