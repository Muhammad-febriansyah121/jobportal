<?php

use App\Jobs\SendScrapedJobApplicationEmail;
use App\Mail\ScrapedJobApplicationMail;
use App\Models\Application;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Models\ScrapedJob;
use App\Models\Setting;
use App\Models\User;
use App\Services\ScrapedJobApplicationEmailService;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

function scrapedApplicationCandidate(): array
{
    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
        'phone' => '081234567890',
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Siti Kandidat',
        'work_mode_pref' => 'any',
        'profile_completion' => 100,
    ]);
    $path = 'candidate-cvs/siti-kandidat.pdf';
    Storage::disk('public')->put($path, '%PDF-1.4 test cv');
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => Storage::disk('public')->url($path),
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    return [$user, $candidate, $cv];
}

function scrapedApplicationJob(?string $email = 'hr@example.com'): ScrapedJob
{
    return ScrapedJob::create([
        'source_platform' => 'test-source',
        'source_job_id' => fake()->unique()->uuid(),
        'source_url' => 'https://example.com/jobs/test',
        'company_name' => 'Test Company',
        'title' => 'Backend Engineer',
        'description' => 'Build backend services.',
        'hr_email' => $email,
        'email_verified' => $email !== null,
        'imported_at' => now(),
    ]);
}

test('public application routes use neutral paths', function () {
    $job = scrapedApplicationJob();

    expect(route('jobs.scraped.show', $job))
        ->toEndWith('/jobs/external/'.$job->id)
        ->and(route('candidate.scraped-jobs.apply', $job))
        ->toEndWith('/candidate/external-jobs/'.$job->id.'/apply');
});

test('scraped application is saved without sending when smtp is unavailable', function () {
    Mail::fake();
    Setting::query()->whereIn('key', [
        'smtp_host',
        'smtp_port',
        'smtp_auth',
        'smtp_username',
        'smtp_password',
        'smtp_from_address',
        'smtp_last_tested_at',
    ])->delete();
    [$user, $candidate, $cv] = scrapedApplicationCandidate();
    $job = scrapedApplicationJob();

    $response = $this->actingAs($user)->post(route('candidate.scraped-jobs.apply.store', $job), [
        'phone' => $user->phone,
        'candidate_cv_id' => $cv->id,
        'consent_to_email' => '1',
    ]);

    $application = Application::query()->where('scraped_job_id', $job->id)->firstOrFail();

    $response->assertRedirect(route('candidate.applications.show', $application));
    expect($application->email_status)->toBe('pending_smtp')
        ->and($application->recipient_email)->toBe('hr@example.com')
        ->and($application->job_listing_id)->toBeNull()
        ->and($candidate->applications()->count())->toBe(1);
    Mail::assertNothingOutgoing();
});

test('queued scraped application email sends to scraped hr with candidate reply to and cv attachment', function () {
    Mail::fake();
    Queue::fake();
    Setting::updateOrCreate(['key' => 'smtp_host'], ['value' => 'mail.example.com']);
    Setting::updateOrCreate(['key' => 'smtp_port'], ['value' => '587']);
    Setting::updateOrCreate(['key' => 'smtp_auth'], ['value' => '1']);
    Setting::updateOrCreate(['key' => 'smtp_username'], ['value' => 'noreply@example.com']);
    Setting::updateOrCreate(['key' => 'smtp_password'], ['value' => Crypt::encryptString('password')]);
    Setting::updateOrCreate(['key' => 'smtp_from_address'], ['value' => 'noreply@example.com']);
    Setting::updateOrCreate(['key' => 'smtp_last_tested_at'], ['value' => now()->toDateTimeString()]);
    [$user, $candidate, $cv] = scrapedApplicationCandidate();
    $job = scrapedApplicationJob();

    $this->actingAs($user)->post(route('candidate.scraped-jobs.apply.store', $job), [
        'phone' => $user->phone,
        'candidate_cv_id' => $cv->id,
        'cover_letter' => str_repeat('Saya tertarik dengan posisi ini. ', 4),
        'consent_to_email' => '1',
    ])->assertRedirect();

    $application = Application::query()->where('scraped_job_id', $job->id)->firstOrFail();

    expect($application->email_status)->toBe('queued');
    Queue::assertPushed(SendScrapedJobApplicationEmail::class, fn (SendScrapedJobApplicationEmail $queued): bool => $queued->applicationId === $application->id);

    (new SendScrapedJobApplicationEmail($application->id))->handle(app(ScrapedJobApplicationEmailService::class));

    $application->refresh();
    expect($application->email_status)->toBe('sent')
        ->and($application->email_sent_at)->not->toBeNull();
    Mail::assertSent(ScrapedJobApplicationMail::class, function (ScrapedJobApplicationMail $mail) use ($user): bool {
        return $mail->hasTo('hr@example.com')
            && $mail->hasReplyTo($user->email)
            && $mail->hasSubject('Lamaran Backend Engineer — Siti Kandidat')
            && count($mail->attachments()) === 1;
    });
});

test('candidate cannot submit the same scraped job twice or without consent', function () {
    [$user, $candidate, $cv] = scrapedApplicationCandidate();
    $job = scrapedApplicationJob();

    $this->actingAs($user)
        ->post(route('candidate.scraped-jobs.apply.store', $job), [
            'phone' => $user->phone,
            'candidate_cv_id' => $cv->id,
        ])
        ->assertSessionHasErrors('consent_to_email');

    $candidate->applications()->create([
        'scraped_job_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'recipient_email' => 'hr@example.com',
        'email_status' => 'pending_smtp',
        'applied_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('candidate.scraped-jobs.apply.store', $job), [
            'phone' => $user->phone,
            'candidate_cv_id' => $cv->id,
            'consent_to_email' => '1',
        ])
        ->assertSessionHasErrors('job');
});

test('scraped application requires a valid company email', function () {
    [$user, $candidate, $cv] = scrapedApplicationCandidate();
    $job = scrapedApplicationJob(null);

    $this->actingAs($user)
        ->get(route('candidate.scraped-jobs.apply', $job))
        ->assertSessionHasErrors('job');
});
