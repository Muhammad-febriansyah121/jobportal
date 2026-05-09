<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\Conversation;
use App\Models\EmployerTalentCandidate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployerTalentSearchActionController extends Controller
{
    public function save(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $action = EmployerTalentCandidate::query()->firstOrCreate([
            'company_id' => $company->id,
            'candidate_id' => $candidateProfile->id,
        ]);

        $action->forceFill([
            'saved_at' => now(),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat disimpan.']);

        return back();
    }

    public function unsave(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $action = EmployerTalentCandidate::query()
            ->where('company_id', $company->id)
            ->where('candidate_id', $candidateProfile->id)
            ->first();

        if ($action !== null) {
            $action->forceFill([
                'saved_at' => null,
            ])->save();

            if ($action->shortlisted_at === null) {
                $action->delete();
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat dihapus dari simpanan.']);

        return back();
    }

    public function shortlist(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $action = EmployerTalentCandidate::query()->firstOrCreate([
            'company_id' => $company->id,
            'candidate_id' => $candidateProfile->id,
        ]);

        $action->forceFill([
            'shortlisted_at' => now(),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat masuk shortlist.']);

        return back();
    }

    public function unshortlist(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $action = EmployerTalentCandidate::query()
            ->where('company_id', $company->id)
            ->where('candidate_id', $candidateProfile->id)
            ->first();

        if ($action !== null) {
            $action->forceFill([
                'shortlisted_at' => null,
            ])->save();

            if ($action->saved_at === null) {
                $action->delete();
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat dikeluarkan dari shortlist.']);

        return back();
    }

    public function contact(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $conversation = Conversation::query()
            ->where('company_id', $company->id)
            ->where('candidate_id', $candidateProfile->id)
            ->whereNull('application_id')
            ->first();

        if ($conversation === null) {
            $conversation = Conversation::query()->create([
                'company_id' => $company->id,
                'candidate_id' => $candidateProfile->id,
                'application_id' => null,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Percakapan dengan kandidat berhasil dibuka.']);

        return to_route('employer.messages.show', $conversation);
    }

    public function unlock(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $action = EmployerTalentCandidate::query()->firstOrCreate([
            'company_id' => $company->id,
            'candidate_id' => $candidateProfile->id,
        ]);

        if ($action->unlocked_at !== null) {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Kandidat sudah pernah di-unlock — tidak ada Job Invitation tambahan yang dipakai.']);

            return back();
        }

        $activeSubscription = $company->activeSubscription()->with('plan:id,talent_search_quota')->first();
        $limit = (int) ($activeSubscription?->plan?->talent_search_quota ?? 0);

        $used = EmployerTalentCandidate::query()
            ->where('company_id', $company->id)
            ->whereNotNull('unlocked_at')
            ->count();

        if ($limit > 0 && $used >= $limit) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Kuota Job Invitation paket Anda sudah habis. Upgrade paket untuk menambah kuota.',
            ]);

            return to_route('employer.billing.index');
        }

        if ($limit === 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Paket Anda tidak menyertakan Job Invitation. Upgrade paket untuk membuka kontak kandidat.',
            ]);

            return to_route('employer.billing.index');
        }

        $action->forceFill([
            'unlocked_at' => now(),
            'unlocked_by_user_id' => $request->user()->id,
        ])->save();

        $remaining = max(0, $limit - $used - 1);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Kontak & CV kandidat terbuka. Sisa Job Invitation: {$remaining}.",
        ]);

        return back();
    }
}
