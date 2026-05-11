<?php

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminAiAuditLogController;
use App\Http\Controllers\Admin\AdminAssessmentQuestionController;
use App\Http\Controllers\Admin\AdminCandidatePricingMenuController;
use App\Http\Controllers\Admin\AdminCareerResourceController;
use App\Http\Controllers\Admin\AdminCompanyController;
use App\Http\Controllers\Admin\AdminCompanyReviewController;
use App\Http\Controllers\Admin\AdminCompanySizeController;
use App\Http\Controllers\Admin\AdminCompanyVerificationController;
use App\Http\Controllers\Admin\AdminContactMessageController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFaqController;
use App\Http\Controllers\Admin\AdminIndustryController;
use App\Http\Controllers\Admin\AdminJobListingController;
use App\Http\Controllers\Admin\AdminLaporanController;
use App\Http\Controllers\Admin\AdminLegalPageController;
use App\Http\Controllers\Admin\AdminMentorController;
use App\Http\Controllers\Admin\AdminPlatformAnalyticsController;
use App\Http\Controllers\Admin\AdminPricingPlanController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminSalaryInsightController;
use App\Http\Controllers\Admin\AdminSkillController;
use App\Http\Controllers\Admin\AdminSubIndustryController;
use App\Http\Controllers\Admin\AdminSubscriptionController;
use App\Http\Controllers\Admin\AdminSystemReviewController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminWebSettingController;
use App\Http\Controllers\Admin\AdminWhatsAppController;
use App\Http\Controllers\AiInterviewSimulatorController;
use App\Http\Controllers\Auth\GoogleLoginController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Candidate\CandidateJobController;
use App\Http\Controllers\CareerResourceController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CvAnalyzerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LegalPageController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PakasirWebhookController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\SalaryController;
use Illuminate\Support\Facades\Route;

// Override Fortify's password reset link route to support WhatsApp notification
Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])
    ->middleware('guest')
    ->name('password.request');
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');

Route::post('webhooks/pakasir', [PakasirWebhookController::class, 'handle'])
    ->name('webhooks.pakasir');

Route::get('/', HomeController::class)->name('home');
Route::get('/jobs', [HomeController::class, 'jobs'])->name('jobs.index');
Route::get('/companies', [HomeController::class, 'companies'])->name('companies.index');
Route::get('/companies/{company:slug}', [CompanyProfileController::class, 'show'])->name('companies.show');
Route::get('/salary', [SalaryController::class, 'index'])->name('salary.index');
Route::post('/salary/submissions', [SalaryController::class, 'store'])->name('salary.submissions.store');
Route::get('/pricing', PricingController::class)->name('pricing');
Route::get('/career-resources', [CareerResourceController::class, 'index'])->name('career-resources.index');
Route::get('/career-resources/{careerResource:slug}', [CareerResourceController::class, 'show'])->name('career-resources.show');
Route::get('/jobs/{jobListing:slug}', [CandidateJobController::class, 'show'])->name('jobs.show');
Route::get('/terms', [LegalPageController::class, 'terms'])->name('terms');
Route::get('/privacy', [LegalPageController::class, 'privacy'])->name('privacy');
Route::get('/about', [LegalPageController::class, 'about'])->name('about');
Route::get('/contact', ContactController::class)->name('contact');
Route::get('/cv-analyzer', CvAnalyzerController::class)->name('cv-analyzer');
Route::get('/ai-interview-simulator', AiInterviewSimulatorController::class)->name('ai-interview-simulator');
Route::post('/contact', [ContactController::class, 'send'])->name('contact.send');
Route::get('/auth/google/redirect', [GoogleLoginController::class, 'redirect'])
    ->middleware('guest')
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleLoginController::class, 'callback'])
    ->middleware('guest')
    ->name('auth.google.callback');
Route::post('/auth/google/login', [GoogleLoginController::class, 'store'])
    ->middleware('guest')
    ->name('auth.google.login');

Route::prefix('regions')->name('regions.')->group(function () {
    Route::get('provinces', [RegionController::class, 'provinces'])->name('provinces');
    Route::get('cities', [RegionController::class, 'cities'])->name('cities');
});

Route::post('locale', [LocaleController::class, 'update'])->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::post('device-tokens', [DeviceTokenController::class, 'store'])->name('device-tokens.store');
    Route::delete('device-tokens', [DeviceTokenController::class, 'destroy'])->name('device-tokens.destroy');

    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
});

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'admin'])
    ->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');

        Route::resource('users', AdminUserController::class)->only(['index', 'show']);
        Route::patch('users/{user}/activate', [AdminUserController::class, 'activate'])->name('users.activate');
        Route::patch('users/{user}/deactivate', [AdminUserController::class, 'deactivate'])->name('users.deactivate');
        Route::patch('users/{user}/reset-email-verification', [AdminUserController::class, 'resetEmailVerification'])->name('users.reset-email-verification');
        Route::post('users/{user}/detect-risk', [AdminUserController::class, 'detectRisk'])->name('users.detect-risk');
        Route::post('users/{user}/generate-ai-summary', [AdminUserController::class, 'generateAiSummary'])->name('users.generate-ai-summary');

        Route::resource('companies', AdminCompanyController::class)->only(['index', 'show']);
        Route::patch('companies/{company}/suspend', [AdminCompanyController::class, 'suspend'])->name('companies.suspend');
        Route::patch('companies/{company}/activate', [AdminCompanyController::class, 'activate'])->name('companies.activate');
        Route::post('companies/{company}/generate-ai-insight', [AdminCompanyController::class, 'generateAiInsight'])->name('companies.generate-ai-insight');

        Route::resource('company-verifications', AdminCompanyVerificationController::class)
            ->parameters(['company-verifications' => 'companyVerification'])
            ->only(['index', 'show']);
        Route::patch('company-verifications/{companyVerification}/approve', [AdminCompanyVerificationController::class, 'approve'])->name('company-verifications.approve');
        Route::patch('company-verifications/{companyVerification}/reject', [AdminCompanyVerificationController::class, 'reject'])->name('company-verifications.reject');
        Route::patch('company-verifications/{companyVerification}/need-revision', [AdminCompanyVerificationController::class, 'needRevision'])->name('company-verifications.need-revision');

        Route::resource('jobs', AdminJobListingController::class)->parameters(['jobs' => 'jobListing'])->only(['index', 'show']);
        Route::patch('jobs/{jobListing}/integrity-score', [AdminJobListingController::class, 'updateIntegrityScore'])->name('jobs.integrity-score');
        Route::patch('jobs/{jobListing}/publish', [AdminJobListingController::class, 'publish'])->name('jobs.publish');
        Route::patch('jobs/{jobListing}/suspend', [AdminJobListingController::class, 'suspend'])->name('jobs.suspend');
        Route::patch('jobs/{jobListing}/reject', [AdminJobListingController::class, 'reject'])->name('jobs.reject');

        Route::resource('reports', AdminReportController::class)->only(['index', 'show']);
        Route::patch('reports/{report}/under-review', [AdminReportController::class, 'underReview'])->name('reports.under-review');
        Route::patch('reports/{report}/resolve', [AdminReportController::class, 'resolve'])->name('reports.resolve');
        Route::patch('reports/{report}/dismiss', [AdminReportController::class, 'dismiss'])->name('reports.dismiss');
        Route::patch('reports/{report}/suspend-subject', [AdminReportController::class, 'suspendSubject'])->name('reports.suspend-subject');

        Route::resource('skills', AdminSkillController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('assessment-questions/skills/{skill}', [AdminAssessmentQuestionController::class, 'bySkill'])->name('assessment-questions.by-skill');
        Route::resource('assessment-questions', AdminAssessmentQuestionController::class)
            ->parameters(['assessment-questions' => 'assessmentQuestion'])
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::resource('industries', AdminIndustryController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('sub-industries', AdminSubIndustryController::class)
            ->parameters(['sub-industries' => 'subIndustry'])
            ->only(['index', 'store', 'update', 'destroy']);
        Route::resource('company-sizes', AdminCompanySizeController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('faqs', AdminFaqController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::resource('pricing-plans', AdminPricingPlanController::class)
            ->parameters(['pricing-plans' => 'pricingPlan'])
            ->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::patch('pricing-plans/{pricingPlan}/toggle', [AdminPricingPlanController::class, 'toggle'])->name('pricing-plans.toggle');
        Route::resource('candidate-pricing-menus', AdminCandidatePricingMenuController::class)
            ->parameters(['candidate-pricing-menus' => 'candidatePricingMenu'])
            ->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::patch('candidate-pricing-menus/{candidatePricingMenu}/toggle', [AdminCandidatePricingMenuController::class, 'toggle'])->name('candidate-pricing-menus.toggle');

        Route::resource('subscriptions', AdminSubscriptionController::class)->only(['index', 'show']);
        Route::patch('subscriptions/{subscription}/extend', [AdminSubscriptionController::class, 'extend'])->name('subscriptions.extend');
        Route::patch('subscriptions/{subscription}/cancel', [AdminSubscriptionController::class, 'cancel'])->name('subscriptions.cancel');

        Route::resource('salary-insights', AdminSalaryInsightController::class)
            ->parameters(['salary-insights' => 'salaryInsight'])
            ->only(['index', 'store', 'update', 'destroy']);
        Route::post('salary-insights/import', [AdminSalaryInsightController::class, 'import'])->name('salary-insights.import');
        Route::patch('salary-insights/{salaryInsight}/publish', [AdminSalaryInsightController::class, 'publish'])->name('salary-insights.publish');
        Route::patch('salary-insights/{salaryInsight}/unpublish', [AdminSalaryInsightController::class, 'unpublish'])->name('salary-insights.unpublish');

        Route::resource('career-resources', AdminCareerResourceController::class)
            ->parameters(['career-resources' => 'careerResource'])
            ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
        Route::patch('career-resources/{careerResource}/publish', [AdminCareerResourceController::class, 'publish'])->name('career-resources.publish');
        Route::patch('career-resources/{careerResource}/unpublish', [AdminCareerResourceController::class, 'unpublish'])->name('career-resources.unpublish');

        Route::resource('mentors', AdminMentorController::class)
            ->parameters(['mentors' => 'mentorProfile'])
            ->only(['index', 'show']);
        Route::patch('mentors/{mentorProfile}/verify', [AdminMentorController::class, 'verify'])->name('mentors.verify');
        Route::patch('mentors/{mentorProfile}/activate', [AdminMentorController::class, 'activate'])->name('mentors.activate');
        Route::patch('mentors/{mentorProfile}/deactivate', [AdminMentorController::class, 'deactivate'])->name('mentors.deactivate');

        Route::resource('ai-audit-logs', AdminAiAuditLogController::class)
            ->parameters(['ai-audit-logs' => 'aiAuditLog'])
            ->only(['index', 'show']);
        Route::patch('ai-audit-logs/{aiAuditLog}/retry', [AdminAiAuditLogController::class, 'retry'])->name('ai-audit-logs.retry');

        Route::resource('contact-messages', AdminContactMessageController::class)
            ->parameters(['contact-messages' => 'contactMessage'])
            ->only(['index', 'show', 'destroy']);
        Route::patch('contact-messages/{contactMessage}/mark-replied', [AdminContactMessageController::class, 'markReplied'])->name('contact-messages.mark-replied');

        Route::get('company-reviews', [AdminCompanyReviewController::class, 'index'])->name('company-reviews.index');
        Route::patch('company-reviews/{companyReview}/approve', [AdminCompanyReviewController::class, 'approve'])->name('company-reviews.approve');
        Route::patch('company-reviews/{companyReview}/reject', [AdminCompanyReviewController::class, 'reject'])->name('company-reviews.reject');

        Route::get('system-reviews', [AdminSystemReviewController::class, 'index'])->name('system-reviews.index');
        Route::patch('system-reviews/{systemReview}/approve', [AdminSystemReviewController::class, 'approve'])->name('system-reviews.approve');
        Route::patch('system-reviews/{systemReview}/reject', [AdminSystemReviewController::class, 'reject'])->name('system-reviews.reject');

        Route::resource('activity-logs', AdminActivityLogController::class)
            ->parameters(['activity-logs' => 'activityLog'])
            ->only(['index', 'show']);
        Route::get('analytics', AdminPlatformAnalyticsController::class)->name('analytics');

        Route::get('laporan', [AdminLaporanController::class, 'index'])->name('laporan.index');
        Route::get('laporan/revenue', [AdminLaporanController::class, 'exportRevenue'])->name('laporan.revenue');
        Route::get('laporan/lamaran', [AdminLaporanController::class, 'exportLamaran'])->name('laporan.lamaran');
        Route::get('laporan/pengguna', [AdminLaporanController::class, 'exportPengguna'])->name('laporan.pengguna');
        Route::get('laporan/subscription', [AdminLaporanController::class, 'exportSubscription'])->name('laporan.subscription');

        Route::get('settings', [AdminWebSettingController::class, 'edit'])->name('settings.edit');
        Route::post('settings', [AdminWebSettingController::class, 'update'])->name('settings.update');

        Route::get('whatsapp', [AdminWhatsAppController::class, 'edit'])->name('whatsapp.edit');
        Route::patch('whatsapp', [AdminWhatsAppController::class, 'update'])->name('whatsapp.update');
        Route::post('whatsapp/connect', [AdminWhatsAppController::class, 'connect'])->name('whatsapp.connect');
        Route::post('whatsapp/reconnect', [AdminWhatsAppController::class, 'reconnect'])->name('whatsapp.reconnect');
        Route::delete('whatsapp/disconnect', [AdminWhatsAppController::class, 'disconnect'])->name('whatsapp.disconnect');
        Route::post('whatsapp/send-test', [AdminWhatsAppController::class, 'sendTest'])->name('whatsapp.send-test');

        Route::get('legal/terms', [AdminLegalPageController::class, 'editTerms'])->name('legal.terms.edit');
        Route::post('legal/terms', [AdminLegalPageController::class, 'updateTerms'])->name('legal.terms.update');
        Route::get('legal/privacy', [AdminLegalPageController::class, 'editPrivacy'])->name('legal.privacy.edit');
        Route::post('legal/privacy', [AdminLegalPageController::class, 'updatePrivacy'])->name('legal.privacy.update');
    });

require __DIR__.'/settings.php';
require __DIR__.'/employer.php';
require __DIR__.'/candidate.php';
