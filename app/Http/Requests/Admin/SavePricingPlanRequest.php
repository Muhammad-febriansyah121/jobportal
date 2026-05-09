<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SavePricingPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isPaid = (int) $this->input('price', 0) > 0;

        return [
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'active_jobs_limit' => ['required', 'integer', $isPaid ? 'min:1' : 'min:0'],
            'recruiter_seat_limit' => ['required', 'integer', 'min:0'],
            'ai_interview_quota' => ['nullable', 'integer', 'min:0'],
            'talent_search_quota' => ['required', 'integer', 'min:0'],
            'features' => [$isPaid ? 'required' : 'nullable', 'string', 'max:5000'],
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
            'active_jobs_limit.min' => 'Paket berbayar harus memiliki batas lowongan aktif minimal 1.',
            'features.required' => 'Paket berbayar wajib mencantumkan rincian fitur yang ditawarkan.',
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
            $talentQuota = (int) $this->input('talent_search_quota', 0);
            $jobs = (int) $this->input('active_jobs_limit', 0);
            $seats = (int) $this->input('recruiter_seat_limit', 0);

            if ($aiQuota === 0 && $talentQuota === 0 && $jobs === 0 && $seats === 0) {
                $validator->errors()->add('price', 'Paket berbayar wajib memiliki minimal satu kuota fitur (lowongan, recruiter seat, AI interview, atau talent search).');
            }
        });
    }
}
