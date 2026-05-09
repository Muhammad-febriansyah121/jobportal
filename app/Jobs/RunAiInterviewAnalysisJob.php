<?php

namespace App\Jobs;

use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Models\AiInterviewSession;
use App\Services\AiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunAiInterviewAnalysisJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 90;

    public int $tries = 2;

    public function __construct(public int $sessionId) {}

    public function handle(AiService $ai, CandidateAiInterviewController $controller): void
    {
        $session = AiInterviewSession::find($this->sessionId);

        if ($session === null) {
            return;
        }

        $controller->applyAiAnalysis($session, $ai);
    }
}
