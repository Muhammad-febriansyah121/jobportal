<?php

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminAiAuditLogController;
use App\Http\Controllers\Admin\AdminCareerResourceController;
use App\Http\Controllers\Admin\AdminCompanyController;
use App\Http\Controllers\Admin\AdminCompanySizeController;
use App\Http\Controllers\Admin\AdminCompanyVerificationController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminIndustryController;
use App\Http\Controllers\Admin\AdminJobListingController;
use App\Http\Controllers\Admin\AdminMentorController;
use App\Http\Controllers\Admin\AdminPlatformAnalyticsController;
use App\Http\Controllers\Admin\AdminPricingPlanController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminSalaryInsightController;
use App\Http\Controllers\Admin\AdminSkillController;
use App\Http\Controllers\Admin\AdminSubscriptionController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminWebSettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PakasirWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('webhooks/pakasir', [PakasirWebhookController::class, 'handle'])
    ->name('webhooks.pakasir')
    ->withoutMiddleware(['web']);

Route::get('/', HomeController::class)->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
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
        Route::resource('industries', AdminIndustryController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('company-sizes', AdminCompanySizeController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::resource('pricing-plans', AdminPricingPlanController::class)
            ->parameters(['pricing-plans' => 'pricingPlan'])
            ->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::patch('pricing-plans/{pricingPlan}/toggle', [AdminPricingPlanController::class, 'toggle'])->name('pricing-plans.toggle');

        Route::resource('subscriptions', AdminSubscriptionController::class)->only(['index', 'show']);
        Route::patch('subscriptions/{subscription}/extend', [AdminSubscriptionController::class, 'extend'])->name('subscriptions.extend');
        Route::patch('subscriptions/{subscription}/cancel', [AdminSubscriptionController::class, 'cancel'])->name('subscriptions.cancel');

        Route::resource('salary-insights', AdminSalaryInsightController::class)
            ->parameters(['salary-insights' => 'salaryInsight'])
            ->only(['index', 'store', 'update', 'destroy']);
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

        Route::resource('activity-logs', AdminActivityLogController::class)
            ->parameters(['activity-logs' => 'activityLog'])
            ->only(['index', 'show']);
        Route::get('analytics', AdminPlatformAnalyticsController::class)->name('analytics');

        Route::get('settings', [AdminWebSettingController::class, 'edit'])->name('settings.edit');
        Route::post('settings', [AdminWebSettingController::class, 'update'])->name('settings.update');
    });

require __DIR__.'/settings.php';
require __DIR__.'/employer.php';
require __DIR__.'/candidate.php';
