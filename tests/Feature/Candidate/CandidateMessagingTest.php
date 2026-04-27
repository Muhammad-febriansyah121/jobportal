<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\Message;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('candidate can open own conversation and send a message', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Bima Santoso',
    ]);

    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Chat Kandidat',
        'slug' => 'teknologi-chat-kandidat',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Nusantara Fintech Recruiter',
        'slug' => 'nusantara-fintech-recruiter',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-chat',
        'description' => 'Frontend role.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $conversation = Conversation::create([
        'company_id' => $company->id,
        'candidate_id' => $candidate->id,
        'application_id' => $application->id,
        'last_message_at' => now(),
    ]);

    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $employer->id,
        'body' => 'Halo, kami ingin update proses lamaran Anda.',
    ]);

    actingAs($candidateUser)
        ->get(route('candidate.messages.show', $conversation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/messages/show')
            ->where('conversation.company.name', 'Nusantara Fintech Recruiter')
            ->where('conversation.job_title', 'Frontend Engineer')
            ->where('messages.0.body', 'Halo, kami ingin update proses lamaran Anda.')
            ->etc()
        );

    actingAs($candidateUser)
        ->post(route('candidate.messages.store', $conversation), [
            'body' => 'Terima kasih, saya siap untuk tahap berikutnya.',
        ])
        ->assertRedirect(route('candidate.messages.show', $conversation));

    expect(Message::query()->where('conversation_id', $conversation->id)->count())->toBe(2);
    expect(
        Message::query()
            ->where('conversation_id', $conversation->id)
            ->latest('id')
            ->value('body')
    )->toBe('Terima kasih, saya siap untuk tahap berikutnya.');
});

test('candidate cannot open other candidates conversation', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $otherCandidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat A',
    ]);

    $otherCandidate = CandidateProfile::create([
        'user_id' => $otherCandidateUser->id,
        'full_name' => 'Kandidat B',
    ]);

    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Chat Forbidden',
        'slug' => 'teknologi-chat-forbidden',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Forbidden',
        'slug' => 'karivia-forbidden',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Engineer Forbidden',
        'slug' => 'backend-engineer-forbidden',
        'description' => 'Backend role.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $otherCandidate->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $conversation = Conversation::create([
        'company_id' => $company->id,
        'candidate_id' => $otherCandidate->id,
        'application_id' => $application->id,
        'last_message_at' => now(),
    ]);

    actingAs($candidateUser)
        ->get(route('candidate.messages.show', $conversation))
        ->assertForbidden();

    expect($candidate->id)->not->toBe($otherCandidate->id);
});
