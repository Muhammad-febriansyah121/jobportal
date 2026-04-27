<?php

use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('employer workspace menu pages are available', function (string $routeName, string $component, ?string $title, bool $needsCompany) {
    $employer = User::factory()->employer()->create();

    if ($needsCompany) {
        Company::create([
            'owner_id' => $employer->id,
            'name' => 'Karivia Tech',
            'slug' => 'karivia-tech',
            'verification_status' => 'approved',
            'is_verified' => true,
        ]);
    }

    actingAs($employer)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(function (Assert $page) use ($component, $title): Assert {
            $page
                ->component($component)
                ->has('employer_unread_messages')
                ->has('header_notifications.unread_count')
                ->has('header_notifications.items');

            if ($title !== null) {
                $page
                    ->where('title', $title)
                    ->has('description')
                    ->has('message');
            }

            return $page->etc();
        });
})->with([
    'candidates' => ['employer.candidates.index', 'employer/candidates', null, true],
    'messages' => ['employer.messages.index', 'employer/messages', null, true],
    'analytics' => ['employer.analytics.index', 'employer/analytics', null, false],
    'billing' => ['employer.billing.index', 'employer/billing', null, false],
    'talent search' => ['employer.talent-search.index', 'employer/talent-search', null, false],
]);
