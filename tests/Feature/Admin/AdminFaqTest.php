<?php

use App\Models\Faq;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('admin can view faq index', function () {
    $admin = User::factory()->admin()->create();
    Faq::factory()->count(2)->create();

    actingAs($admin)
        ->get(route('admin.faqs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/resources/index'));
});

test('admin can create faq', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.faqs.store'), [
            'title' => 'Bagaimana cara melamar lowongan?',
            'description' => 'Masuk ke akun kandidat, pilih lowongan, lalu klik tombol Lamar.',
        ])
        ->assertRedirect();

    expect(Faq::where('title', 'Bagaimana cara melamar lowongan?')->exists())->toBeTrue();
});

test('admin can update faq', function () {
    $admin = User::factory()->admin()->create();
    $faq = Faq::factory()->create();

    actingAs($admin)
        ->patch(route('admin.faqs.update', $faq), [
            'title' => 'Bagaimana cara update profil?',
            'description' => 'Buka menu profil lalu simpan perubahan data akun kamu.',
        ])
        ->assertRedirect();

    expect($faq->refresh()->title)->toBe('Bagaimana cara update profil?');
});

test('admin can delete faq', function () {
    $admin = User::factory()->admin()->create();
    $faq = Faq::factory()->create();

    actingAs($admin)
        ->delete(route('admin.faqs.destroy', $faq))
        ->assertRedirect();

    expect(Faq::find($faq->id))->toBeNull();
});

test('non admin cannot access faq admin page', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('admin.faqs.index'))
        ->assertForbidden();
});
