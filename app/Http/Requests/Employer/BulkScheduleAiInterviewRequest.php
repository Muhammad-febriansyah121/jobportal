<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkScheduleAiInterviewRequest extends FormRequest
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
            'application_ids' => ['required', 'array', 'min:1', 'max:50'],
            'application_ids.*' => ['integer', 'distinct', 'exists:applications,id'],
            'interview_mode' => ['required', Rule::in(['voice', 'text'])],
            'scheduled_at' => ['required', 'date', 'after_or_equal:now'],
            'duration_minutes' => ['required', 'integer', Rule::in([15, 30, 45, 60])],
            'meeting_url' => ['nullable', 'url', 'max:255'],
            'voice' => ['nullable', Rule::in(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'])],
            'questions' => ['required', 'array', 'min:1', 'max:12'],
            'questions.*.question' => ['required', 'string', 'max:1000'],
            'questions.*.category' => ['nullable', 'string', 'max:80'],
            'questions.*.rubric' => ['nullable', 'string', 'max:2000'],
            'questions.*.weight' => ['required', 'integer', 'min:1', 'max:100'],
            'questions.*.allow_ai_followup' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'application_ids.required' => 'Pilih minimal satu kandidat untuk diundang.',
            'application_ids.min' => 'Pilih minimal satu kandidat untuk diundang.',
            'application_ids.max' => 'Maksimal 50 kandidat per batch undangan.',
            'interview_mode.required' => 'Pilih mode interview kandidat.',
            'scheduled_at.required' => 'Tanggal dan jam mulai interview wajib diisi.',
            'scheduled_at.after_or_equal' => 'Jadwal interview tidak boleh di masa lalu.',
            'questions.required' => 'Tambahkan minimal satu pertanyaan interview.',
            'questions.*.question.required' => 'Setiap pertanyaan wajib diisi.',
        ];
    }
}
