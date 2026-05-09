<?php

use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\User;

use function Pest\Laravel\actingAs;

function createOwnerWithCompany(): array
{
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech-'.$owner->id,
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    CompanyMember::create([
        'company_id' => $company->id,
        'user_id' => $owner->id,
        'role' => 'admin_hr',
        'is_active' => true,
        'joined_at' => now(),
    ]);

    return [$owner, $company];
}

test('owner can add a new user and they are automatically tied to the company', function () {
    [$owner, $company] = createOwnerWithCompany();

    actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'Budi Santoso',
            'email' => 'budi@karivia.test',
            'password' => 'password123',
            'role' => 'recruiter',
        ])
        ->assertRedirect();

    $user = User::where('email', 'budi@karivia.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Budi Santoso')
        ->and($user->role)->toBe('employer')
        ->and($user->email_verified_at)->not->toBeNull();

    expect(
        CompanyMember::where('company_id', $company->id)
            ->where('user_id', $user->id)
            ->where('role', 'recruiter')
            ->exists()
    )->toBeTrue();
});

test('duplicate email is rejected', function () {
    [$owner] = createOwnerWithCompany();
    User::factory()->create(['email' => 'existing@karivia.test']);

    actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'Someone',
            'email' => 'existing@karivia.test',
            'password' => 'password123',
            'role' => 'viewer',
        ])
        ->assertSessionHasErrors('email');
});

test('non-owner cannot add team members', function () {
    [$owner, $company] = createOwnerWithCompany();
    $member = User::factory()->employer()->create();
    CompanyMember::create([
        'company_id' => $company->id,
        'user_id' => $member->id,
        'role' => 'recruiter',
        'is_active' => true,
        'joined_at' => now(),
    ]);

    actingAs($member)
        ->post(route('employer.team.store'), [
            'name' => 'Intruder',
            'email' => 'intruder@karivia.test',
            'password' => 'password123',
            'role' => 'viewer',
        ])
        ->assertForbidden();
});
