<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use App\Models\WhatsappBulkMessage;
use App\Services\WhatsAppGatewayService;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;

test('whatsapp broadcast converts HTML body to WA markdown before storing', function () {
    Queue::fake();

    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'WA HTML',
        'slug' => 'wa-html-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'WA HTML Co',
        'slug' => 'wa-html-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'WA Engineer',
        'slug' => 'wa-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $userWithPhone = User::factory()->candidate()->create([
        'phone' => '081234567890',
        'onboarding_completed_at' => now(),
    ]);
    $profile = CandidateProfile::create([
        'user_id' => $userWithPhone->id,
        'full_name' => 'Test Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->mock(WhatsAppGatewayService::class, function ($mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true);
        $mock->shouldReceive('getSession')->andReturn(['state' => 'CONNECTED']);
    });

    $employer->update([
        'notification_settings' => [
            'whatsapp' => ['session_id' => 'session_test', 'enabled' => true],
        ],
    ]);

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'whatsapp',
            'job_listing_id' => $job->id,
            'application_ids' => [$application->id],
            'message_template' => '<p>Halo <strong>{nama}</strong>, ini <em>penting</em>.</p>',
        ])
        ->assertRedirect();

    $bulk = WhatsappBulkMessage::query()->latest('id')->first();
    expect($bulk)->not->toBeNull();
    expect($bulk->channel)->toBe('whatsapp');

    $recipient = $bulk->recipients()->first();
    expect($recipient->rendered_message)
        ->toBe('Halo *Test Kandidat*, ini _penting_.');
});
