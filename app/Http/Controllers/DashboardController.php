<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        return match ($request->user()?->role) {
            'admin' => to_route('admin.dashboard'),
            'candidate' => to_route('candidate.dashboard'),
            'employer' => to_route('employer.dashboard'),
            default => Inertia::render('dashboard'),
        };
    }
}
