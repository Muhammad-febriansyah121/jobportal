<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveTeamMemberRequest;
use App\Models\CompanyMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerTeamController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 403);

        $isOwner = $company->owner_id === $request->user()->id;

        $members = $company->members()
            ->with('user:id,name,email,avatar_url,role')
            ->orderByDesc('joined_at')
            ->get()
            ->map(fn (CompanyMember $member): array => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'name' => $member->user?->name ?? '-',
                'email' => $member->user?->email ?? '-',
                'avatar_url' => $member->user?->avatar_url,
                'role' => $member->role,
                'is_active' => $member->is_active,
                'invited_at' => $member->invited_at?->format('d M Y') ?? '-',
                'joined_at' => $member->joined_at?->format('d M Y') ?? '-',
            ]);

        return Inertia::render('employer/team', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'owner_id' => $company->owner_id,
            ],
            'members' => $members,
            'isOwner' => $isOwner,
        ]);
    }

    public function store(SaveTeamMemberRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $user = User::where('email', $request->validated('email'))->firstOrFail();

        abort_if($user->id === $company->owner_id, 422);

        $existing = CompanyMember::where('company_id', $company->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing !== null) {
            $existing->update([
                'role' => $request->validated('role'),
                'is_active' => true,
                'joined_at' => $existing->joined_at ?? now(),
            ]);
        } else {
            CompanyMember::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'role' => $request->validated('role'),
                'is_active' => true,
                'invited_at' => now(),
                'joined_at' => now(),
            ]);

            // Give employer role if user doesn't have it yet
            if ($user->role !== 'employer') {
                $user->update(['role' => 'employer']);
            }
        }

        return back()->with('success', "{$user->name} berhasil ditambahkan ke tim.");
    }

    public function update(Request $request, CompanyMember $teamMember, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null || $teamMember->company_id !== $company->id, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $request->validate([
            'role' => ['required', 'in:admin_hr,recruiter,viewer'],
        ]);

        $teamMember->update(['role' => $request->input('role')]);

        return back()->with('success', 'Role anggota berhasil diperbarui.');
    }

    public function destroy(Request $request, CompanyMember $teamMember, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null || $teamMember->company_id !== $company->id, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $teamMember->delete();

        return back()->with('success', 'Anggota berhasil dihapus dari tim.');
    }

    public function toggle(Request $request, CompanyMember $teamMember, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null || $teamMember->company_id !== $company->id, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $teamMember->update(['is_active' => ! $teamMember->is_active]);

        $label = $teamMember->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Anggota berhasil {$label}.");
    }
}
