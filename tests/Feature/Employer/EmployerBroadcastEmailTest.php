<?php

use App\Jobs\SendWhatsappBulkRecipientJob;
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

function broadcastEmailScenario(): array
{
    $employer = User::factory()->employer()->create([
        'email' => 'hr@perusahaan.com',
    ]);
    $industry = Industry::create([
        'name' => 'Bcast Industry',
        'slug' => 'bcast-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Bcast Co',
        'slug' => 'bcast-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Bcast Engineer',
        'slug' => 'bcast-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $applicantWithEmail = User::factory()->candidate()->create([
        'email' => 'kandidat1@example.com',
        'onboarding_completed_at' => now(),
    ]);
    $profile1 = CandidateProfile::create([
        'user_id' => $applicantWithEmail->id,
        'full_name' => 'Kandidat Satu',
        'work_mode_pref' => 'any',
    ]);
    $app1 = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile1->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    return [$employer, $job, $app1];
}

test('employer can queue email broadcast and recipients are pending', function () {
    Queue::fake();

    [$employer, $job, $app1] = broadcastEmailScenario();

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'email',
            'job_listing_id' => $job->id,
            'application_ids' => [$app1->id],
            'message_template' => 'Halo {nama}, terima kasih atas lamaran Anda.',
            'subject' => 'Update lamaran Anda',
            'reply_to_email' => 'hr@perusahaan.com',
        ])
        ->assertRedirect();

    $bulk = WhatsappBulkMessage::query()->latest('id')->first();

    expect($bulk)->not->toBeNull();
    expect($bulk->channel)->toBe('email');
    expect($bulk->subject)->toBe('Update lamaran Anda');
    expect($bulk->reply_to_email)->toBe('hr@perusahaan.com');
    expect($bulk->recipients_count)->toBe(1);

    $recipient = $bulk->recipients()->first();
    expect($recipient->email_address)->toBe('kandidat1@example.com');
    expect($recipient->status)->toBe('pending');
    expect($recipient->rendered_message)->toContain('Halo Kandidat Satu');

    Queue::assertPushed(SendWhatsappBulkRecipientJob::class, 1);
});

test('email broadcast requires subject', function () {
    [$employer, $job, $app1] = broadcastEmailScenario();

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'email',
            'job_listing_id' => $job->id,
            'application_ids' => [$app1->id],
            'message_template' => 'Halo {nama}.',
        ])
        ->assertSessionHasErrors(['subject']);
});

test('email broadcast skips applicant without email', function () {
    Queue::fake();

    [$employer, $job, $app1] = broadcastEmailScenario();

    $userNoEmail = User::factory()->candidate()->create([
        'email' => 'temp-'.uniqid().'@example.com',
        'onboarding_completed_at' => now(),
    ]);
    $userNoEmail->update(['email' => '']);

    $profile2 = CandidateProfile::create([
        'user_id' => $userNoEmail->id,
        'full_name' => 'Kandidat Dua',
        'work_mode_pref' => 'any',
    ]);
    $app2 = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile2->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'email',
            'job_listing_id' => $job->id,
            'application_ids' => [$app1->id, $app2->id],
            'message_template' => 'Halo {nama}.',
            'subject' => 'Test',
        ])
        ->assertRedirect();

    $bulk = WhatsappBulkMessage::query()->latest('id')->first();
    expect($bulk->skipped_count)->toBe(1);

    Queue::assertPushed(SendWhatsappBulkRecipientJob::class, 1);
});

test('email job marks recipient as sent after dispatch', function () {
    [$employer, $job, $app1] = broadcastEmailScenario();

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'email',
            'job_listing_id' => $job->id,
            'application_ids' => [$app1->id],
            'message_template' => 'Halo {nama}, terima kasih.',
            'subject' => 'Lamaran Diterima',
            'reply_to_email' => 'hr@perusahaan.com',
        ]);

    $bulk = WhatsappBulkMessage::query()->latest('id')->first();
    $recipient = $bulk->recipients()->first();

    (new SendWhatsappBulkRecipientJob($recipient->id))
        ->handle(app(WhatsAppGatewayService::class));

    $recipient->refresh();
    expect($recipient->status)->toBe('sent');
    expect($recipient->sent_at)->not->toBeNull();
});
