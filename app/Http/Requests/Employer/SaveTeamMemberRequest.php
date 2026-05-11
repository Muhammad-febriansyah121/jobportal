<?php

namespace App\Http\Requests\Employer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class SaveTeamMemberRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'Email tersebut sudah terdaftar. Gunakan fitur tambah anggota lama untuk mengundang pengguna yang sudah ada.',
        ];
    }
}
