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

        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => bcrypt($request->validated('password')),
            'role' => 'employer',
        ]);

        $user->markEmailAsVerified();

        CompanyMember::create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role' => $request->validated('role'),
            'is_active' => true,
            'invited_at' => now(),
            'joined_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$user->name} berhasil ditambahkan ke tim."]);

        return back();
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role anggota berhasil diperbarui.']);

        return back();
    }

    public function destroy(Request $request, CompanyMember $teamMember, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null || $teamMember->company_id !== $company->id, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $teamMember->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Anggota berhasil dihapus dari tim.']);

        return back();
    }

    public function toggle(Request $request, CompanyMember $teamMember, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null || $teamMember->company_id !== $company->id, 403);
        abort_unless($company->owner_id === $request->user()->id, 403);

        $teamMember->update(['is_active' => ! $teamMember->is_active]);

        $label = $teamMember->is_active ? 'diaktifkan' : 'dinonaktifkan';

        Inertia::flash('toast', ['type' => 'success', 'message' => "Anggota berhasil {$label}."]);

        return back();
    }
}
