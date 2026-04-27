<?php

use App\Models\Company;
use App\Models\Industry;
use App\Models\MessageTemplate;
use App\Models\User;

use function Pest\Laravel\actingAs;

function templateScenario(): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Tpl Industry',
        'slug' => 'tpl-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Tpl Co',
        'slug' => 'tpl-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    return [$employer, $company];
}

test('employer can list their templates', function () {
    [$employer, $company] = templateScenario();

    MessageTemplate::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'name' => 'Tpl A',
        'channel' => 'whatsapp',
        'body' => 'Halo {nama}',
        'is_active' => true,
    ]);

    actingAs($employer)
        ->get(route('employer.message-templates.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('employer/message-templates/index')
            ->has('templates.data', 1)
            ->where('templates.data.0.name', 'Tpl A')
        );
});

test('employer can create a whatsapp template', function () {
    [$employer] = templateScenario();

    actingAs($employer)
        ->post(route('employer.message-templates.store'), [
            'name' => 'Konfirmasi Lamaran',
            'channel' => 'whatsapp',
            'body' => 'Halo {nama}, terima kasih sudah melamar.',
            'is_active' => true,
        ])
        ->assertRedirect(route('employer.message-templates.index'));

    expect(MessageTemplate::query()->where('name', 'Konfirmasi Lamaran')->exists())->toBeTrue();
});

test('email template requires subject', function () {
    [$employer] = templateScenario();

    actingAs($employer)
        ->post(route('employer.message-templates.store'), [
            'name' => 'Email Tanpa Subject',
            'channel' => 'email',
            'body' => 'Halo {nama}.',
        ])
        ->assertSessionHasErrors(['subject']);
});

test('employer cannot edit template from another company', function () {
    [, $companyA] = templateScenario();
    [$employerB] = templateScenario();

    $template = MessageTemplate::create([
        'company_id' => $companyA->id,
        'name' => 'Foreign Tpl',
        'channel' => 'whatsapp',
        'body' => 'Halo',
        'is_active' => true,
    ]);

    actingAs($employerB)
        ->get(route('employer.message-templates.edit', $template))
        ->assertNotFound();
});

test('employer can update and delete their template', function () {
    [$employer, $company] = templateScenario();

    $template = MessageTemplate::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'name' => 'Old name',
        'channel' => 'whatsapp',
        'body' => 'Old body Halo',
        'is_active' => true,
    ]);

    actingAs($employer)
        ->patch(route('employer.message-templates.update', $template), [
            'name' => 'New name',
            'channel' => 'whatsapp',
            'body' => 'New body update',
            'is_active' => true,
        ])
        ->assertRedirect(route('employer.message-templates.index'));

    expect($template->fresh()->name)->toBe('New name');

    actingAs($employer)
        ->delete(route('employer.message-templates.destroy', $template))
        ->assertRedirect(route('employer.message-templates.index'));

    expect(MessageTemplate::query()->find($template->id))->toBeNull();
});
