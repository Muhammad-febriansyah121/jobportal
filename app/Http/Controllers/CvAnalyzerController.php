<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CvAnalyzerController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('front/cv-analyzer/index');
    }
}
