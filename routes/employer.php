<?php

use App\Http\Controllers\Employer\EmployerCompanyController;
use App\Http\Controllers\Employer\EmployerCompanyVerificationController;
use App\Http\Controllers\Employer\EmployerDashboardController;
use App\Http\Controllers\Employer\EmployerJobListingController;
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
        Route::get('messages', [EmployerWorkspaceController::class, 'messages'])->name('messages.index');
        Route::get('analytics', [EmployerWorkspaceController::class, 'analytics'])->name('analytics.index');
        Route::get('billing', [EmployerWorkspaceController::class, 'billing'])->name('billing.index');
        Route::get('talent-search', [EmployerWorkspaceController::class, 'talentSearch'])->name('talent-search.index');

        Route::resource('jobs', EmployerJobListingController::class)
            ->parameters(['jobs' => 'jobListing'])
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::patch('jobs/{jobListing}/publish', [EmployerJobListingController::class, 'publish'])->name('jobs.publish');
        Route::patch('jobs/{jobListing}/close', [EmployerJobListingController::class, 'close'])->name('jobs.close');
    });
