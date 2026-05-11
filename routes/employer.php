<?php

use App\Http\Controllers\Employer\EmployerAiInterviewController;
use App\Http\Controllers\Employer\EmployerAiInterviewManualReviewController;
use App\Http\Controllers\Employer\EmployerAnalyticsController;
use App\Http\Controllers\Employer\EmployerApplicationController;
use App\Http\Controllers\Employer\EmployerBillingCancelController;
use App\Http\Controllers\Employer\EmployerBillingClaimTrialController;
use App\Http\Controllers\Employer\EmployerBillingController;
use App\Http\Controllers\Employer\EmployerBillingPurchaseController;
use App\Http\Controllers\Employer\EmployerCandidateActionController;
use App\Http\Controllers\Employer\EmployerCompanyController;
use App\Http\Controllers\Employer\EmployerCompanyReviewController;
use App\Http\Controllers\Employer\EmployerCompanyVerificationController;
use App\Http\Controllers\Employer\EmployerDashboardController;
use App\Http\Controllers\Employer\EmployerEmailSettingsController;
use App\Http\Controllers\Employer\EmployerGoogleCalendarController;
use App\Http\Controllers\Employer\EmployerInterviewController;
use App\Http\Controllers\Employer\EmployerJobListingController;
use App\Http\Controllers\Employer\EmployerMessageController;
use App\Http\Controllers\Employer\EmployerMessageTemplateController;
use App\Http\Controllers\Employer\EmployerTalentSearchActionController;
use App\Http\Controllers\Employer\EmployerTeamController;
use App\Http\Controllers\Employer\EmployerWhatsAppBulkController;
use App\Http\Controllers\Employer\EmployerWhatsAppController;
use App\Http\Controllers\Employer\EmployerWorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('employer')
    ->name('employer.')
    ->middleware(['auth', 'verified', 'employer'])
    ->group(function () {
        Route::get('/', EmployerDashboardController::class)->name('dashboard');

        Route::get('company', [EmployerCompanyController::class, 'edit'])->name('company.edit');
        Route::patch('company', [EmployerCompanyController::class, 'update'])->name('company.update');
        Route::get('verification', [EmployerCompanyVerificationController::class, 'index'])->name('verification.index');
        Route::post('verification', [EmployerCompanyVerificationController::class, 'store'])->name('verification.store');
        Route::get('candidates', [EmployerWorkspaceController::class, 'candidates'])->name('candidates.index');
        Route::get('candidates/{application}', [EmployerApplicationController::class, 'show'])->name('candidates.show');
        Route::get('google-calendar/connect', [EmployerGoogleCalendarController::class, 'connect'])->name('google-calendar.connect');
        Route::get('google-calendar/callback', [EmployerGoogleCalendarController::class, 'callback'])->name('google-calendar.callback');
        Route::delete('google-calendar', [EmployerGoogleCalendarController::class, 'disconnect'])->name('google-calendar.disconnect');
        Route::post('applications/{application}/google-meet', [EmployerGoogleCalendarController::class, 'generateMeet'])->name('applications.google-meet');
        Route::post('applications/{application}/whatsapp', [EmployerCandidateActionController::class, 'sendWhatsapp'])->name('applications.whatsapp.send');
        Route::get('messages', [EmployerWorkspaceController::class, 'messages'])->name('messages.index');
        Route::get('messages/{conversation}', [EmployerMessageController::class, 'show'])->name('messages.show');
        Route::post('messages/{conversation}/messages', [EmployerMessageController::class, 'store'])->name('messages.store');
        Route::get('analytics', EmployerAnalyticsController::class)->name('analytics.index');
        Route::get('billing', EmployerBillingController::class)->name('billing.index');
        Route::get('settings/email', [EmployerEmailSettingsController::class, 'edit'])->name('email-settings.edit');
        Route::patch('settings/email', [EmployerEmailSettingsController::class, 'update'])->name('email-settings.update');
        Route::post('settings/email/test', [EmployerEmailSettingsController::class, 'test'])->name('email-settings.test');
        Route::get('whatsapp', [EmployerWhatsAppController::class, 'edit'])->name('whatsapp.edit');
        Route::patch('whatsapp', [EmployerWhatsAppController::class, 'update'])->name('whatsapp.update');
        Route::post('whatsapp/test', [EmployerWhatsAppController::class, 'sendTest'])->name('whatsapp.test');
        Route::post('whatsapp/connect', [EmployerWhatsAppController::class, 'connect'])->name('whatsapp.connect');
        Route::post('whatsapp/reconnect', [EmployerWhatsAppController::class, 'reconnect'])->name('whatsapp.reconnect');
        Route::delete('whatsapp/session', [EmployerWhatsAppController::class, 'disconnect'])->name('whatsapp.disconnect');
        Route::get('reviews', [EmployerCompanyReviewController::class, 'index'])->name('reviews.index');
        Route::patch('reviews/{companyReview}/approve', [EmployerCompanyReviewController::class, 'approve'])->name('reviews.approve');
        Route::patch('reviews/{companyReview}/reject', [EmployerCompanyReviewController::class, 'reject'])->name('reviews.reject');
        Route::post('reviews/{companyReview}/reply', [EmployerCompanyReviewController::class, 'reply'])->name('reviews.reply');
        Route::delete('reviews/{companyReview}/reply', [EmployerCompanyReviewController::class, 'deleteReply'])->name('reviews.delete-reply');
        Route::post('reviews/{companyReview}/flag', [EmployerCompanyReviewController::class, 'flag'])->name('reviews.flag');
        Route::get('whatsapp-bulk', [EmployerWhatsAppBulkController::class, 'index'])->name('whatsapp-bulk.index');
        Route::get('whatsapp-bulk/create', [EmployerWhatsAppBulkController::class, 'create'])->name('whatsapp-bulk.create');
        Route::post('whatsapp-bulk', [EmployerWhatsAppBulkController::class, 'store'])->name('whatsapp-bulk.store');
        Route::get('whatsapp-bulk/{whatsappBulk}', [EmployerWhatsAppBulkController::class, 'show'])->name('whatsapp-bulk.show');

        Route::get('message-templates', [EmployerMessageTemplateController::class, 'index'])->name('message-templates.index');
        Route::get('message-templates/create', [EmployerMessageTemplateController::class, 'create'])->name('message-templates.create');
        Route::post('message-templates', [EmployerMessageTemplateController::class, 'store'])->name('message-templates.store');
        Route::get('message-templates/{messageTemplate}/edit', [EmployerMessageTemplateController::class, 'edit'])->name('message-templates.edit');
        Route::patch('message-templates/{messageTemplate}', [EmployerMessageTemplateController::class, 'update'])->name('message-templates.update');
        Route::delete('message-templates/{messageTemplate}', [EmployerMessageTemplateController::class, 'destroy'])->name('message-templates.destroy');
        Route::post('billing/purchase/{pricingPlan}', EmployerBillingPurchaseController::class)->name('billing.purchase');
        Route::post('billing/claim-trial/{pricingPlan}', EmployerBillingClaimTrialController::class)->name('billing.claim-trial');
        Route::post('billing/payment/{payment}/cancel', EmployerBillingCancelController::class)->name('billing.payment.cancel');
        Route::get('talent-search', [EmployerWorkspaceController::class, 'talentSearch'])->name('talent-search.index');
        Route::get('talent-pool', [EmployerWorkspaceController::class, 'talentPool'])->name('talent-pool.index');
        Route::get('talent-search/{candidateProfile}', [EmployerWorkspaceController::class, 'showTalent'])->name('talent-search.show');
        Route::get('talent-search/{candidateProfile}/match', [EmployerWorkspaceController::class, 'matchTalent'])->name('talent-search.match');
        Route::post('talent-search/{candidateProfile}/save', [EmployerTalentSearchActionController::class, 'save'])->name('talent-search.save');
        Route::delete('talent-search/{candidateProfile}/save', [EmployerTalentSearchActionController::class, 'unsave'])->name('talent-search.unsave');
        Route::post('talent-search/{candidateProfile}/shortlist', [EmployerTalentSearchActionController::class, 'shortlist'])->name('talent-search.shortlist');
        Route::delete('talent-search/{candidateProfile}/shortlist', [EmployerTalentSearchActionController::class, 'unshortlist'])->name('talent-search.unshortlist');
        Route::post('talent-search/{candidateProfile}/contact', [EmployerTalentSearchActionController::class, 'contact'])->name('talent-search.contact');
        Route::post('talent-search/{candidateProfile}/unlock', [EmployerTalentSearchActionController::class, 'unlock'])->name('talent-search.unlock');

        Route::resource('team', EmployerTeamController::class)
            ->parameters(['team' => 'teamMember'])
            ->only(['index', 'store', 'destroy']);
        Route::patch('team/{teamMember}/toggle', [EmployerTeamController::class, 'toggle'])->name('team.toggle');

        Route::resource('jobs', EmployerJobListingController::class)
            ->parameters(['jobs' => 'jobListing'])
            ->only(['index', 'show', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::post('jobs/{jobListing}/ai-interviews', [EmployerAiInterviewController::class, 'store'])->name('jobs.ai-interviews.store');
        Route::post('jobs/{jobListing}/ai-interviews/bulk', [EmployerAiInterviewController::class, 'storeBulk'])->name('jobs.ai-interviews.store-bulk');
        Route::get('jobs/{jobListing}/ai-interviews/compare', [EmployerAiInterviewController::class, 'compare'])->name('jobs.ai-interviews.compare');
        Route::patch('jobs/{jobListing}/publish', [EmployerJobListingController::class, 'publish'])->name('jobs.publish');
        Route::patch('jobs/{jobListing}/close', [EmployerJobListingController::class, 'close'])->name('jobs.close');
        Route::post('applications/{application}/interviews', [EmployerInterviewController::class, 'store'])->name('applications.interviews.store');
        Route::get('ai-interviews/{aiInterviewSession}', [EmployerAiInterviewController::class, 'show'])->name('ai-interviews.show');
        Route::delete('ai-interviews/{aiInterviewSession}/recording', [EmployerAiInterviewController::class, 'deleteRecording'])->name('ai-interviews.delete-recording');
        Route::get('ai-interviews/{aiInterviewSession}/review', [EmployerAiInterviewController::class, 'review'])->name('ai-interviews.review');
        Route::get('ai-interviews/{aiInterviewSession}/report.pdf', [EmployerAiInterviewController::class, 'downloadReportPdf'])->name('ai-interviews.report-pdf');
        Route::post('ai-interviews/{aiInterviewSession}/share-review', [EmployerAiInterviewController::class, 'shareReview'])->name('ai-interviews.share-review');
        Route::patch('ai-interviews/{aiInterviewSession}/advance-to-user', [EmployerAiInterviewController::class, 'advanceToUser'])->name('ai-interviews.advance-to-user');
        Route::post('ai-interviews/bulk-advance', [EmployerAiInterviewController::class, 'bulkAdvance'])->name('ai-interviews.bulk-advance');
        Route::post('ai-interviews/bulk-reject', [EmployerAiInterviewController::class, 'bulkReject'])->name('ai-interviews.bulk-reject');
        Route::post('ai-interviews/{aiInterviewSession}/talent-pool', [EmployerAiInterviewController::class, 'saveToTalentPool'])->name('ai-interviews.talent-pool');
        Route::patch('ai-interviews/{aiInterviewSession}/reject', [EmployerAiInterviewController::class, 'reject'])->name('ai-interviews.reject');
        Route::patch('ai-interviews/{aiInterviewSession}/reschedule/approve', [EmployerAiInterviewController::class, 'approveReschedule'])->name('ai-interviews.reschedule.approve');
        Route::patch('ai-interviews/{aiInterviewSession}/reschedule/reject', [EmployerAiInterviewController::class, 'rejectReschedule'])->name('ai-interviews.reschedule.reject');
        Route::post('ai-interviews/{aiInterviewSession}/manual-review', [EmployerAiInterviewManualReviewController::class, 'store'])->name('ai-interviews.manual-review.store');
        Route::delete('ai-interviews/{aiInterviewSession}/manual-review/{manualReview}', [EmployerAiInterviewManualReviewController::class, 'destroy'])->name('ai-interviews.manual-review.destroy');
    });
