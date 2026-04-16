<?php

use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Http\Controllers\Candidate\CandidateApplicationController;
use App\Http\Controllers\Candidate\CandidateAssessmentController;
use App\Http\Controllers\Candidate\CandidateCareerCoachController;
use App\Http\Controllers\Candidate\CandidateCertificationController;
use App\Http\Controllers\Candidate\CandidateCvController;
use App\Http\Controllers\Candidate\CandidateDashboardController;
use App\Http\Controllers\Candidate\CandidateEducationController;
use App\Http\Controllers\Candidate\CandidateExperienceController;
use App\Http\Controllers\Candidate\CandidateInterviewController;
use App\Http\Controllers\Candidate\CandidateJobController;
use App\Http\Controllers\Candidate\CandidateOnboardingController;
use App\Http\Controllers\Candidate\CandidateProfileController;
use App\Http\Controllers\Candidate\CandidateReportController;
use App\Http\Controllers\Candidate\CandidateSavedJobController;
use App\Http\Controllers\Candidate\CandidateSkillController;
use App\Http\Controllers\Candidate\CandidateWorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('candidate')
    ->name('candidate.')
    ->middleware(['auth', 'verified', 'candidate'])
    ->group(function () {
        Route::get('/', CandidateDashboardController::class)->name('dashboard');

        Route::get('onboarding', [CandidateOnboardingController::class, 'edit'])->name('onboarding.edit');
        Route::post('onboarding', [CandidateOnboardingController::class, 'store'])->name('onboarding.store');

        Route::get('profile', [CandidateProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [CandidateProfileController::class, 'update'])->name('profile.update');

        Route::resource('cvs', CandidateCvController::class)->parameters(['cvs' => 'candidateCv'])->only(['index', 'store', 'destroy']);
        Route::patch('cvs/{candidateCv}/primary', [CandidateCvController::class, 'setPrimary'])->name('cvs.primary');

        Route::resource('experiences', CandidateExperienceController::class)->parameters(['experiences' => 'candidateExperience'])->only(['index', 'store', 'update', 'destroy']);
        Route::resource('educations', CandidateEducationController::class)->parameters(['educations' => 'candidateEducation'])->only(['index', 'store', 'update', 'destroy']);
        Route::resource('certifications', CandidateCertificationController::class)->parameters(['certifications' => 'candidateCertification'])->only(['index', 'store', 'update', 'destroy']);

        Route::get('skills', [CandidateSkillController::class, 'index'])->name('skills.index');
        Route::post('skills', [CandidateSkillController::class, 'store'])->name('skills.store');
        Route::patch('skills/{skill}', [CandidateSkillController::class, 'update'])->name('skills.update');
        Route::delete('skills/{skill}', [CandidateSkillController::class, 'destroy'])->name('skills.destroy');

        Route::get('jobs', [CandidateJobController::class, 'index'])->name('jobs.index');
        Route::get('jobs/{jobListing:slug}', [CandidateJobController::class, 'show'])->name('jobs.show');
        Route::post('jobs/{jobListing}/save', [CandidateSavedJobController::class, 'store'])->name('jobs.save');
        Route::delete('jobs/{jobListing}/save', [CandidateSavedJobController::class, 'destroy'])->name('jobs.unsave');
        Route::post('jobs/{jobListing}/apply', [CandidateApplicationController::class, 'store'])->name('jobs.apply');
        Route::post('jobs/{jobListing}/report', [CandidateReportController::class, 'store'])->name('jobs.report');

        Route::get('saved-jobs', [CandidateSavedJobController::class, 'index'])->name('saved-jobs.index');
        Route::get('messages', [CandidateWorkspaceController::class, 'messages'])->name('messages.index');

        Route::get('applications', [CandidateApplicationController::class, 'index'])->name('applications.index');
        Route::get('applications/{application}', [CandidateApplicationController::class, 'show'])->name('applications.show');
        Route::patch('applications/{application}/withdraw', [CandidateApplicationController::class, 'withdraw'])->name('applications.withdraw');

        Route::get('interviews', [CandidateInterviewController::class, 'index'])->name('interviews.index');
        Route::get('interviews/{interview}', [CandidateInterviewController::class, 'show'])->name('interviews.show');
        Route::patch('interviews/{interview}/confirm', [CandidateInterviewController::class, 'confirm'])->name('interviews.confirm');
        Route::patch('interviews/{interview}/decline', [CandidateInterviewController::class, 'decline'])->name('interviews.decline');

        Route::get('ai-interviews', [CandidateAiInterviewController::class, 'index'])->name('ai-interviews.index');
        Route::post('ai-interviews', [CandidateAiInterviewController::class, 'store'])->name('ai-interviews.store');
        Route::get('ai-interviews/{aiInterviewSession}', [CandidateAiInterviewController::class, 'show'])->name('ai-interviews.show');
        Route::patch('ai-interviews/{aiInterviewSession}/answer', [CandidateAiInterviewController::class, 'answer'])->name('ai-interviews.answer');

        Route::get('assessments', CandidateAssessmentController::class)->name('assessments.index');

        Route::get('career-coach', [CandidateCareerCoachController::class, 'index'])->name('career-coach.index');
        Route::post('career-coach/sessions', [CandidateCareerCoachController::class, 'start'])->name('career-coach.start');
        Route::post('career-coach/messages', [CandidateCareerCoachController::class, 'message'])->name('career-coach.message');
    });
