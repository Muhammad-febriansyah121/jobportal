<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\EnsureCandidateReferralCode;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateReferralController extends Controller
{
    public function __invoke(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        EnsureCandidateReferralCode $ensureCandidateReferralCode
    ): Response {
        $code = $ensureCandidateReferralCode->handle($resolveCandidateProfile->handle($request->user()));

        return Inertia::render('candidate/referral', [
            'referral' => $code ? [
                'code' => $code->code,
                'share_url' => route('register', ['type' => 'candidate', 'referral_code' => $code->code]),
                'campaign' => $code->campaign->name,
                'successful_redemptions' => $code->redemptions()->where('status', 'success')->count(),
                'max_redemptions' => $code->max_redemptions,
                'benefits' => [
                    'cv_builder_quota' => (int) $code->campaign->cv_builder_quota,
                    'ai_interview_quota' => (int) $code->campaign->ai_interview_quota,
                    'ai_token_amount' => (int) $code->campaign->ai_token_amount,
                    'validity_days' => (int) $code->campaign->validity_days,
                ],
            ] : null,
        ]);
    }
}
