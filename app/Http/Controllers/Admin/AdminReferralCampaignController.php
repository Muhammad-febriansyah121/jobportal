<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveReferralCampaignRequest;
use App\Models\ReferralCampaign;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminReferralCampaignController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/referral-campaigns/index', [
            'campaigns' => ReferralCampaign::query()->withCount('redemptions')->latest()->get()->map(fn (ReferralCampaign $campaign): array => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'slug' => $campaign->slug,
                'redemptions' => $campaign->redemptions_count,
                'status' => $campaign->is_active ? 'Aktif' : 'Nonaktif',
                'validity_days' => $campaign->validity_days,
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/referral-campaigns/create');
    }

    public function store(SaveReferralCampaignRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $code = Str::upper(trim($data['codes']));
        $ownerEmail = $data['owner_email'] ?? null;
        unset($data['codes']);
        unset($data['owner_email']);
        $campaign = ReferralCampaign::create($data);
        $campaign->codes()->create([
            'code' => $code,
            'owner_user_id' => $ownerEmail ? User::query()->where('email', $ownerEmail)->value('id') : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Campaign referral berhasil dibuat.']);

        return to_route('admin.referral-campaigns.index');
    }

    public function toggle(ReferralCampaign $referralCampaign): RedirectResponse
    {
        $referralCampaign->update(['is_active' => ! $referralCampaign->is_active]);

        return back();
    }
}
