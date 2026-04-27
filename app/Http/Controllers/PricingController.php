<?php

namespace App\Http\Controllers;

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
                'talent_search_quota' => $plan->talent_search_quota,
                'features' => $plan->normalizedFeatures(),
            ]);

        return Inertia::render('front/pricing', [
            'plans' => $plans,
        ]);
    }
}
