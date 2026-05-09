<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerEmailSettingsRequest;
use App\Http\Requests\Employer\SendEmployerEmailTestRequest;
use App\Services\EmployerSmtpMailer;
use App\Support\EmployerEmailPreferences;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerEmailSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('employer/email-settings', [
            'user_email' => $user?->email,
            'smtp' => EmployerEmailPreferences::resolve($user),
        ]);
    }

    public function update(SaveEmployerEmailSettingsRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null) {
            EmployerEmailPreferences::update($user, $request->validated());
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengaturan SMTP berhasil disimpan.',
        ]);

        return back();
    }

    public function test(SendEmployerEmailTestRequest $request, EmployerSmtpMailer $mailer): RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            return back();
        }

        $result = $mailer->sendTest($user, (string) $request->validated('to'));

        if ($result['ok']) {
            EmployerEmailPreferences::markTested($user, now());
        }

        Inertia::flash('toast', [
            'type' => $result['ok'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);

        return back();
    }
}
