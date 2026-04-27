<?php

namespace App\Http\Requests\Employer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveEmployerWhatsAppSettingsRequest extends FormRequest
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
            'enabled' => ['required', 'boolean'],
            'session_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
