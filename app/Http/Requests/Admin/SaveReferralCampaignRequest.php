<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveReferralCampaignRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:referral_campaigns,slug'],
            'description' => ['nullable', 'string'],
            'ai_token_amount' => ['required', 'integer', 'min:0'],
            'cv_builder_quota' => ['required', 'integer', 'min:0'],
            'ai_interview_quota' => ['required', 'integer', 'min:0'],
            'validity_days' => ['required', 'integer', 'min:0', 'max:3650'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'max_redemptions' => ['nullable', 'integer', 'min:1'],
            'max_referrals_per_user' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
            'codes' => ['nullable', 'string', 'max:50'],
            'owner_email' => ['nullable', 'email', 'exists:users,email'],
        ];
    }
}
