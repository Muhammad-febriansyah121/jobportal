<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScheduleInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::in(['online', 'onsite'])],
            'scheduled_at' => ['required', 'date', 'after_or_equal:now'],
            'duration_minutes' => ['required', 'integer', Rule::in([15, 30, 45, 60, 90, 120])],
            'meeting_url' => ['required_if:mode,online', 'nullable', 'url', 'max:500'],
            'address' => ['required_if:mode,onsite', 'nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mode.required' => 'Pilih mode wawancara (online atau onsite).',
            'scheduled_at.required' => 'Tanggal dan jam wajib diisi.',
            'scheduled_at.after_or_equal' => 'Jadwal tidak boleh di masa lalu.',
            'duration_minutes.required' => 'Durasi wajib diisi.',
            'meeting_url.required_if' => 'Meeting URL wajib untuk wawancara online.',
            'meeting_url.url' => 'Format meeting URL tidak valid.',
            'address.required_if' => 'Alamat wajib untuk wawancara onsite.',
        ];
    }
}
