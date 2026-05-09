<?php

use App\Jobs\SendWhatsappBulkRecipientJob;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use App\Models\WhatsappBulkMessage;
use App\Models\WhatsappBulkRecipient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;

function bulkWaScenario(): array
{
    config()->set('services.whatsapp.base_url', 'http://wa.test');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create([
        'phone' => '628111000111',
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => 'session-bulk',
            ],
        ],
    ]);

    $industry = Industry::create([
        'name' => 'Tek Bulk',
        'slug' => 'tek-bulk-'.uniqid(),
    ]);

    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Bulk Corp',
        'slug' => 'bulk-corp-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-'.uniqid(),
        'description' => 'Job desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $candidateWithPhone = User::factory()->candidate()->create([
        'phone' => '08123456789',
    ]);
    $profileWithPhone = CandidateProfile::create([
        'user_id' => $candidateWithPhone->id,
        'full_name' => 'Andi Punya Nomor',
        'work_mode_pref' => 'any',
    ]);

    $candidateNoPhone = User::factory()->candidate()->create([
        'phone' => null,
    ]);
    $profileNoPhone = CandidateProfile::create([
        'user_id' => $candidateNoPhone->id,
        'full_name' => 'Budi Tanpa Nomor',
        'work_mode_pref' => 'any',
    ]);

    $appWithPhone = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profileWithPhone->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $appNoPhone = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profileNoPhone->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    return [$employer, $company, $job, $appWithPhone, $appNoPhone];
}

test('employer can dispatch a bulk WA campaign and recipients are queued', function () {
    [$employer, $company, $job, $appWithPhone, $appNoPhone] = bulkWaScenario();

    Http::fake([
        'http://wa.test/sessions/session-bulk' => Http::response([
            'data' => ['id' => 'session-bulk', 'state' => 'CONNECTED'],
        ], 200),
    ]);

    Queue::fake();

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'channel' => 'whatsapp',
            'job_listing_id' => $job->id,
            'application_ids' => [$appWithPhone->id, $appNoPhone->id],
            'message_template' => 'Halo {nama}, terima kasih melamar {posisi}.',
        ])
        ->assertRedirect();

    $bulk = WhatsappBulkMessage::query()->latest()->first();

    expect($bulk)->not->toBeNull()
        ->and($bulk->job_listing_id)->toBe($job->id)
        ->and($bulk->user_id)->toBe($employer->id)
        ->and($bulk->company_id)->toBe($company->id)
        ->and($bulk->recipients_count)->toBe(2)
        ->and($bulk->skipped_count)->toBe(1)
        ->and($bulk->status)->toBe('queued');

    $pending = WhatsappBulkRecipient::where('whatsapp_bulk_message_id', $bulk->id)
        ->where('status', 'pending')
        ->first();
    expect($pending)->not->toBeNull()
        ->and($pending->phone_number)->toBe('08123456789')
        ->and($pending->rendered_message)->toContain('Andi Punya Nomor')
        ->and($pending->rendered_message)->toContain('Backend Engineer');

    $skipped = WhatsappBulkRecipient::where('whatsapp_bulk_message_id', $bulk->id)
        ->where('status', 'skipped')
        ->first();
    expect($skipped)->not->toBeNull()
        ->and($skipped->error_message)->toContain('nomor');

    Queue::assertPushed(SendWhatsappBulkRecipientJob::class, 1);
});

test('employer cannot dispatch when WA session is not connected', function () {
    [$employer, , $job, $appWithPhone] = bulkWaScenario();

    Http::fake([
        'http://wa.test/sessions/session-bulk' => Http::response([
            'data' => ['id' => 'session-bulk', 'state' => 'WAITING_QR'],
        ], 200),
    ]);

    Queue::fake();

    actingAs($employer)
        ->post(route('employer.whatsapp-bulk.store'), [
            'job_listing_id' => $job->id,
            'application_ids' => [$appWithPhone->id],
            'message_template' => 'Halo {nama}.',
        ])
        ->assertRedirect();

    expect(WhatsappBulkMessage::count())->toBe(0);
    Queue::assertNothingPushed();
});

test('employer can view their bulk WA campaigns index', function () {
    [$employer] = bulkWaScenario();

    Http::fake([
        'http://wa.test/sessions/session-bulk' => Http::response([
            'data' => ['id' => 'session-bulk', 'state' => 'CONNECTED'],
        ], 200),
    ]);

    actingAs($employer)
        ->get(route('employer.whatsapp-bulk.index'))
        ->assertOk();
});
