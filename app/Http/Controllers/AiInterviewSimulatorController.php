<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class AiInterviewSimulatorController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('front/ai-interview-simulator/index');
    }
}
