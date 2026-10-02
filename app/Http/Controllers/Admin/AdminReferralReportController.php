<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReferralCode;
use App\Models\ReferralRedemption;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReferralReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $codes = ReferralCode::query()
            ->with(['owner:id,name,email', 'campaign:id,name'])
            ->withCount(['redemptions as successful_redemptions' => fn ($query) => $query->where('status', 'success')])
            ->withMax(['redemptions as last_redeemed_at' => fn ($query) => $query->where('status', 'success')], 'redeemed_at')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhereHas('owner', fn ($owner) => $owner->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('successful_redemptions')
            ->orderBy('code')
            ->get()
            ->map(fn (ReferralCode $code): array => [
                'id' => $code->id,
                'code' => $code->code,
                'campaign' => $code->campaign?->name ?? '-',
                'owner' => $code->owner ? [
                    'name' => $code->owner->name,
                    'email' => $code->owner->email,
                ] : null,
                'successful_redemptions' => (int) $code->successful_redemptions,
                'last_redeemed_at' => $code->last_redeemed_at ? Carbon::parse($code->last_redeemed_at)->format('d M Y H:i') : null,
                'status' => $code->is_active ? 'Aktif' : 'Nonaktif',
            ])
            ->values();

        $topReferrers = $codes
            ->filter(fn (array $code): bool => $code['owner'] !== null)
            ->groupBy(fn (array $code): string => $code['owner']['email'])
            ->map(fn ($referrer): array => [
                'owner' => $referrer->first()['owner'],
                'successful_redemptions' => $referrer->sum('successful_redemptions'),
                'codes_count' => $referrer->count(),
            ])
            ->sortByDesc('successful_redemptions')
            ->values();

        $recentRedemptions = ReferralRedemption::query()
            ->with(['code:id,code', 'candidate.user:id,name,email'])
            ->where('status', 'success')
            ->latest('redeemed_at')
            ->limit(30)
            ->get()
            ->map(fn (ReferralRedemption $redemption): array => [
                'id' => $redemption->id,
                'code' => $redemption->code?->code ?? '-',
                'candidate' => $redemption->candidate?->user ? [
                    'name' => $redemption->candidate->user->name,
                    'email' => $redemption->candidate->user->email,
                ] : null,
                'redeemed_at' => $redemption->redeemed_at?->format('d M Y H:i'),
                'expires_at' => $redemption->expires_at?->format('d M Y H:i'),
            ])
            ->values();

        return Inertia::render('admin/referral-reports', [
            'filters' => ['search' => $search],
            'summary' => [
                'total_redemptions' => ReferralRedemption::query()->where('status', 'success')->count(),
                'unique_candidates' => ReferralRedemption::query()->where('status', 'success')->distinct('candidate_id')->count('candidate_id'),
                'active_codes' => ReferralCode::query()->where('is_active', true)->count(),
                'top_code' => $codes->first(),
            ],
            'codes' => $codes,
            'topReferrers' => $topReferrers,
            'recentRedemptions' => $recentRedemptions,
        ]);
    }
}
