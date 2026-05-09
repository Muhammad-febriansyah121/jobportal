<?php

use App\Models\User;

beforeEach(function (): void {
    $this->seed();
});

dataset('publicRoutes', [
    '/',
    'about',
    'jobs',
    'companies',
    'pricing',
    'salary',
    'contact',
    'privacy',
    'terms',
    'career-resources',
    'login',
    'register',
    'forgot-password',
    'regions/provinces',
    'regions/cities',
]);

dataset('authSharedRoutes', [
    'dashboard',
    'settings',
    'settings/profile',
    'settings/security',
    'settings/appearance',
]);

dataset('adminRoutes', [
    'admin',
    'admin/users',
    'admin/companies',
    'admin/jobs',
    'admin/subscriptions',
    'admin/pricing-plans',
    'admin/pricing-plans/create',
    'admin/candidate-pricing-menus',
    'admin/candidate-pricing-menus/create',
    'admin/skills',
    'admin/industries',
    'admin/company-sizes',
    'admin/career-resources',
    'admin/career-resources/create',
    'admin/assessment-questions',
    'admin/assessment-questions/create',
    'admin/mentors',
    'admin/faqs',
    'admin/contact-messages',
    'admin/company-reviews',
    'admin/company-verifications',
    'admin/legal/terms',
    'admin/legal/privacy',
    'admin/settings',
    'admin/whatsapp',
    'admin/analytics',
    'admin/reports',
    'admin/activity-logs',
    'admin/ai-audit-logs',
    'admin/salary-insights',
]);

dataset('employerRoutes', [
    'employer',
    'employer/company',
    'employer/verification',
    'employer/jobs',
    'employer/jobs/create',
    'employer/candidates',
    'employer/talent-pool',
    'employer/talent-search',
    'employer/messages',
    'employer/message-templates',
    'employer/message-templates/create',
    'employer/team',
    'employer/billing',
    'employer/analytics',
    'employer/reviews',
    'employer/whatsapp',
    'employer/whatsapp-bulk',
    'employer/whatsapp-bulk/create',
    'employer/google-calendar/connect',
]);

dataset('candidateRoutes', [
    'candidate',
    'candidate/onboarding',
    'candidate/profile',
    'candidate/jobs',
    'candidate/saved-jobs',
    'candidate/applications',
    'candidate/interviews',
    'candidate/ai-interviews',
    'candidate/ai-interviews/history',
    'candidate/cvs',
    'candidate/cvs/builder',
    'candidate/cvs/builder/pdf',
    'candidate/skills',
    'candidate/educations',
    'candidate/experiences',
    'candidate/certifications',
    'candidate/messages',
    'candidate/career-coach',
    'candidate/career-resources',
    'candidate/pricing',
]);

it('public route does not 404 or 500', function (string $uri): void {
    $path = $uri === '/' ? '/' : '/'.$uri;
    $response = $this->get($path);
    expect($response->status())
        ->not->toBe(404, "GET {$path} returned 404")
        ->not->toBe(500, "GET {$path} returned 500");
})->with('publicRoutes');

it('shared auth route does not 404 or 500', function (string $uri): void {
    $user = User::factory()->candidate()->create();
    $response = $this->actingAs($user)->get('/'.$uri);
    expect($response->status())
        ->not->toBe(404, "GET /{$uri} returned 404")
        ->not->toBe(500, "GET /{$uri} returned 500");
})->with('authSharedRoutes');

it('admin route does not 404 or 500', function (string $uri): void {
    $admin = User::where('role', 'admin')->firstOrFail();
    $response = $this->actingAs($admin)->get('/'.$uri);
    expect($response->status())
        ->not->toBe(404, "GET /{$uri} returned 404")
        ->not->toBe(500, "GET /{$uri} returned 500");
})->with('adminRoutes');

it('employer route does not 404 or 500', function (string $uri): void {
    $employer = User::where('role', 'employer')->firstOrFail();
    $response = $this->actingAs($employer)->get('/'.$uri);
    expect($response->status())
        ->not->toBe(404, "GET /{$uri} returned 404")
        ->not->toBe(500, "GET /{$uri} returned 500");
})->with('employerRoutes');

it('candidate route does not 404 or 500', function (string $uri): void {
    $candidate = User::where('role', 'candidate')->firstOrFail();
    $response = $this->actingAs($candidate)->get('/'.$uri);
    expect($response->status())
        ->not->toBe(404, "GET /{$uri} returned 404")
        ->not->toBe(500, "GET /{$uri} returned 500");
})->with('candidateRoutes');
