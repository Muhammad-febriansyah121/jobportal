<?php

use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Http\Controllers\Candidate\CandidateApplicationController;
use App\Http\Controllers\Candidate\CandidateCareerCoachController;
use App\Http\Controllers\Candidate\CandidateCareerPathController;
use App\Http\Controllers\Candidate\CandidateCareerResourceController;
use App\Http\Controllers\Candidate\CandidateCertificationController;
use App\Http\Controllers\Candidate\CandidateCompanyReviewController;
use App\Http\Controllers\Candidate\CandidateCvController;
use App\Http\Controllers\Candidate\CandidateDashboardController;
use App\Http\Controllers\Candidate\CandidateEducationController;
use App\Http\Controllers\Candidate\CandidateExperienceController;
use App\Http\Controllers\Candidate\CandidateInterviewController;
use App\Http\Controllers\Candidate\CandidateJobController;
use App\Http\Controllers\Candidate\CandidateMessageController;
use App\Http\Controllers\Candidate\CandidateOnboardingController;
use App\Http\Controllers\Candidate\CandidatePricingController;
use App\Http\Controllers\Candidate\CandidateProfileController;
use App\Http\Controllers\Candidate\CandidateReportController;
use App\Http\Controllers\Candidate\CandidateSavedJobController;
use App\Http\Controllers\Candidate\CandidateSkillController;
use App\Http\Controllers\Candidate\CandidateSystemReviewController;
use App\Http\Controllers\Candidate\CandidateWorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('candidate')
    ->name('candidate.')
    ->middleware(['auth', 'verified', 'candidate'])
    ->group(function () {
        Route::get('/', CandidateDashboardController::class)->name('dashboard');

        Route::get('onboarding', [CandidateOnboardingController::class, 'edit'])->name('onboarding.edit');
        Route::post('onboarding', [CandidateOnboardingController::class, 'store'])->name('onboarding.store');
        Route::post('onboarding/parse-cv', [CandidateOnboardingController::class, 'parseCv'])->name('onboarding.parse-cv');
        Route::post('onboarding/parse-cv-stream', [CandidateOnboardingController::class, 'parseCvStream'])->name('onboarding.parse-cv-stream');

        Route::get('profile', [CandidateProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [CandidateProfileController::class, 'update'])->name('profile.update');
        Route::get('profile-photo', [CandidateProfileController::class, 'editPhoto'])->name('profile.photo.edit');
        Route::patch('profile-photo', [CandidateProfileController::class, 'updatePhoto'])->name('profile.photo.update');

        // Routes accessible before profile is 100% complete (needed to complete profile)
        Route::resource('experiences', CandidateExperienceController::class)->parameters(['experiences' => 'candidateExperience'])->only(['index', 'store', 'update', 'destroy']);
        Route::resource('educations', CandidateEducationController::class)->parameters(['educations' => 'candidateEducation'])->only(['index', 'store', 'update', 'destroy']);
        Route::get('skills', [CandidateSkillController::class, 'index'])->name('skills.index');
        Route::post('skills', [CandidateSkillController::class, 'store'])->name('skills.store');
        Route::patch('skills/{skill}', [CandidateSkillController::class, 'update'])->name('skills.update');
        Route::delete('skills/{skill}', [CandidateSkillController::class, 'destroy'])->name('skills.destroy');
        Route::resource('cvs', CandidateCvController::class)->parameters(['cvs' => 'candidateCv'])->only(['index', 'store', 'destroy']);
        Route::patch('cvs/{candidateCv}/primary', [CandidateCvController::class, 'setPrimary'])->name('cvs.primary');

        Route::middleware('candidate.onboarded')->group(function () {
            Route::get('cvs/builder', [CandidateCvController::class, 'builder'])->name('cvs.builder-page');
            Route::post('cvs/builder/save', [CandidateCvController::class, 'saveBuilder'])->name('cvs.builder-save');
            Route::post('cvs/builder/ai-draft', [CandidateCvController::class, 'generateAiDraft'])->name('cvs.builder-draft');
            Route::post('cvs/builder/ai-review', [CandidateCvController::class, 'reviewBuilder'])->name('cvs.builder-review');
            Route::post('cvs/builder/ai-review-stream', [CandidateCvController::class, 'reviewBuilderStream'])->name('cvs.builder-review-stream');
            Route::get('cvs/builder/pdf', [CandidateCvController::class, 'downloadBuilderPdf'])->name('cvs.builder-pdf');

            Route::resource('certifications', CandidateCertificationController::class)->parameters(['certifications' => 'candidateCertification'])->only(['index', 'store', 'update', 'destroy']);

            Route::get('jobs', [CandidateJobController::class, 'index'])->name('jobs.index');
            Route::get('jobs/{jobListing:slug}', [CandidateJobController::class, 'show'])->name('jobs.show');
            Route::post('jobs/{jobListing}/save', [CandidateSavedJobController::class, 'store'])->name('jobs.save');
            Route::delete('jobs/{jobListing}/save', [CandidateSavedJobController::class, 'destroy'])->name('jobs.unsave');
            Route::post('jobs/{jobListing}/apply', [CandidateApplicationController::class, 'store'])->name('jobs.apply');
            Route::post('jobs/{jobListing}/report', [CandidateReportController::class, 'store'])->name('jobs.report');
            Route::post('companies/{company:slug}/reviews', [CandidateCompanyReviewController::class, 'store'])->name('companies.reviews.store');
            Route::get('company-reviews', [CandidateCompanyReviewController::class, 'index'])->name('company-reviews.index');
            Route::post('company-reviews', [CandidateCompanyReviewController::class, 'storeFromList'])->name('company-reviews.store');
            Route::delete('company-reviews/{companyReview}', [CandidateCompanyReviewController::class, 'destroy'])->name('company-reviews.destroy');

            Route::get('system-reviews', [CandidateSystemReviewController::class, 'index'])->name('system-reviews.index');
            Route::post('system-reviews', [CandidateSystemReviewController::class, 'store'])->name('system-reviews.store');
            Route::delete('system-reviews/{systemReview}', [CandidateSystemReviewController::class, 'destroy'])->name('system-reviews.destroy');

            Route::get('saved-jobs', [CandidateSavedJobController::class, 'index'])->name('saved-jobs.index');
            Route::get('messages', [CandidateWorkspaceController::class, 'messages'])->name('messages.index');
            Route::get('messages/{conversation}', [CandidateMessageController::class, 'show'])->name('messages.show');
            Route::post('messages/{conversation}/messages', [CandidateMessageController::class, 'store'])->name('messages.store');

            Route::get('applications', [CandidateApplicationController::class, 'index'])->name('applications.index');
            Route::get('applications/{application}', [CandidateApplicationController::class, 'show'])->name('applications.show');

            Route::get('interviews', [CandidateInterviewController::class, 'index'])->name('interviews.index');
            Route::get('interviews/{interview}', [CandidateInterviewController::class, 'show'])->name('interviews.show');
            Route::patch('interviews/{interview}/confirm', [CandidateInterviewController::class, 'confirm'])->name('interviews.confirm');
            Route::patch('interviews/{interview}/decline', [CandidateInterviewController::class, 'decline'])->name('interviews.decline');

            Route::get('ai-interviews', [CandidateAiInterviewController::class, 'index'])->name('ai-interviews.index');
            Route::get('ai-interviews/history', [CandidateAiInterviewController::class, 'history'])->name('ai-interviews.history');
            Route::post('ai-interviews', [CandidateAiInterviewController::class, 'store'])->name('ai-interviews.store');
            Route::get('ai-interviews/{aiInterviewSession}', [CandidateAiInterviewController::class, 'show'])->name('ai-interviews.show');
            Route::patch('ai-interviews/{aiInterviewSession}/confirm', [CandidateAiInterviewController::class, 'confirm'])->name('ai-interviews.confirm');
            Route::patch('ai-interviews/{aiInterviewSession}/decline', [CandidateAiInterviewController::class, 'decline'])->name('ai-interviews.decline');
            Route::patch('ai-interviews/{aiInterviewSession}/reschedule', [CandidateAiInterviewController::class, 'reschedule'])->name('ai-interviews.reschedule');
            Route::patch('ai-interviews/{aiInterviewSession}/start', [CandidateAiInterviewController::class, 'start'])->name('ai-interviews.start');
            Route::post('ai-interviews/{aiInterviewSession}/client-secret', [CandidateAiInterviewController::class, 'clientSecret'])->name('ai-interviews.client-secret');
            Route::post('ai-interviews/{aiInterviewSession}/voice-log', [CandidateAiInterviewController::class, 'voiceLog'])->name('ai-interviews.voice-log');
            Route::post('ai-interviews/{aiInterviewSession}/recording', [CandidateAiInterviewController::class, 'uploadRecording'])->name('ai-interviews.upload-recording');
            Route::patch('ai-interviews/{aiInterviewSession}/answer', [CandidateAiInterviewController::class, 'answer'])->name('ai-interviews.answer');
            Route::get('ai-interviews/{aiInterviewSession}/feedback', [CandidateAiInterviewController::class, 'feedback'])->name('ai-interviews.feedback');
            Route::delete('ai-interviews/{aiInterviewSession}', [CandidateAiInterviewController::class, 'destroy'])->name('ai-interviews.destroy');

            Route::get('career-resources', [CandidateCareerResourceController::class, 'index'])->name('career-resources.index');
            Route::get('career-resources/{careerResource:slug}', [CandidateCareerResourceController::class, 'show'])->name('career-resources.show');

            Route::get('career-coach', [CandidateCareerCoachController::class, 'index'])->name('career-coach.index');
            Route::post('career-coach/sessions', [CandidateCareerCoachController::class, 'start'])->name('career-coach.start');
            Route::post('career-coach/messages', [CandidateCareerCoachController::class, 'message'])->name('career-coach.message');
            Route::post('career-coach/stream', [CandidateCareerCoachController::class, 'stream'])->name('career-coach.stream');

            Route::get('career-paths', [CandidateCareerPathController::class, 'index'])->name('career-paths.index');
            Route::post('career-paths', [CandidateCareerPathController::class, 'generate'])->name('career-paths.generate');
            Route::patch('career-paths/{careerPath}/activate', [CandidateCareerPathController::class, 'activate'])->name('career-paths.activate');
            Route::delete('career-paths/{careerPath}', [CandidateCareerPathController::class, 'destroy'])->name('career-paths.destroy');
            Route::patch('career-paths/steps/{step}', [CandidateCareerPathController::class, 'toggleStep'])->name('career-paths.steps.toggle');

            Route::get('pricing', [CandidatePricingController::class, 'index'])->name('pricing.index');
            Route::post('pricing/claim-trial/{candidatePricingMenu}', [CandidatePricingController::class, 'claimTrial'])->name('pricing.claim-trial');
            Route::post('pricing/purchase/{candidatePricingMenu}', [CandidatePricingController::class, 'purchase'])->name('pricing.purchase');
            Route::post('pricing/check/{candidateWalletTransaction}', [CandidatePricingController::class, 'check'])->name('pricing.check');
        });
    });
