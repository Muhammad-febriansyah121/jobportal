<?php

namespace App\Http\Requests\Employer;

use App\Models\AiInterviewManualReview;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveAiInterviewManualReviewRequest extends FormRequest
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
            'rating' => ['required', 'integer', 'between:1,5'],
            'decision' => ['required', 'string', Rule::in(AiInterviewManualReview::DECISIONS)],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
