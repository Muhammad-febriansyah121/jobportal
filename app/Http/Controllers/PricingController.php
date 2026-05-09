<?php

namespace App\Http\Controllers;

use App\Models\CandidatePricingMenu;
use App\Models\PricingPlan;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function __invoke(): Response
    {
        $plans = PricingPlan::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->get()
            ->map(fn (PricingPlan $plan): array => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => $plan->price,
                'duration_days' => $plan->duration_days,
                'active_jobs_limit' => $plan->active_jobs_limit,
                'recruiter_seat_limit' => $plan->recruiter_seat_limit,
                'ai_screening_quota' => $plan->ai_screening_quota,
                'ai_interview_quota' => $plan->ai_interview_quota,
                'talent_search_quota' => $plan->talent_search_quota,
                'features' => $plan->normalizedFeatures(),
            ]);

        $candidateMenus = CandidatePricingMenu::query()
            ->where('is_active', true)
            ->where('is_default_free', false)
            ->where('price', '>', 0)
            ->orderBy('price')
            ->get()
            ->map(fn (CandidatePricingMenu $menu): array => [
                'id' => $menu->id,
                'name' => $menu->name,
                'slug' => $menu->slug,
                'description' => $menu->description,
                'price' => (int) $menu->price,
                'ai_interview_quota' => (int) $menu->ai_interview_quota,
                'cv_builder_quota' => (int) $menu->cv_builder_quota,
                'validity_days' => (int) $menu->validity_days,
                'features' => $menu->normalizedFeatures(),
            ]);

        return Inertia::render('front/pricing', [
            'plans' => $plans,
            'candidateMenus' => $candidateMenus,
        ]);
    }
}
