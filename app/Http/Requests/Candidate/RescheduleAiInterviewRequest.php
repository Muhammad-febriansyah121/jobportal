<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RescheduleAiInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'candidate';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'proposed_at' => ['required', 'date', Rule::date()->afterOrEqual(now()->addMinutes(30))],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'proposed_at.required' => 'Pilih jadwal pengganti yang diusulkan.',
            'proposed_at.after_or_equal' => 'Jadwal pengganti minimal 30 menit dari sekarang.',
            'reason.required' => 'Tulis alasan pengajuan jadwal ulang.',
        ];
    }
}
