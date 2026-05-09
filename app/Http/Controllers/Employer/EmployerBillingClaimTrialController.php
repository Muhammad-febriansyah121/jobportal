<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\PricingPlan;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployerBillingClaimTrialController extends Controller
{
    public function __invoke(
        Request $request,
        PricingPlan $pricingPlan,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null, 403, 'Perusahaan belum disiapkan.');
        abort_unless($pricingPlan->is_active, 404);
        abort_unless($pricingPlan->is_trial, 422, 'Paket ini bukan paket trial.');

        $alreadyClaimed = $company->subscriptions()
            ->whereHas('plan', fn ($query) => $query->where('is_trial', true))
            ->exists();

        if ($alreadyClaimed) {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Trial sudah pernah diklaim untuk akun ini.',
            ]);

            return back();
        }

        DB::transaction(function () use ($company, $pricingPlan): void {
            $company->subscriptions()
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $now = Carbon::now();
            $endsAt = $now->copy()->addDays((int) $pricingPlan->duration_days);

            Subscription::create([
                'company_id' => $company->id,
                'pricing_plan_id' => $pricingPlan->id,
                'status' => 'active',
                'starts_at' => $now,
                'ends_at' => $endsAt,
            ]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Trial '.$pricingPlan->name.' aktif. Selamat mencoba!',
        ]);

        return redirect()->route('employer.billing.index');
    }
}
