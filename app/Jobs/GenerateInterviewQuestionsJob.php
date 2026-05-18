<?php

namespace App\Jobs;

use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Models\AiInterviewSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GenerateInterviewQuestionsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 120;

    /**
     * @param  array<string, mixed>  $options
     */
    public function __construct(
        public int $sessionId,
        public array $options,
    ) {}

    public function handle(CandidateAiInterviewController $controller): void
    {
        $session = AiInterviewSession::with('candidate')->find($this->sessionId);

        if ($session === null || $session->candidate === null) {
            return;
        }

        try {
            $controller->buildGeneralInterviewQuestionsForJob(
                $session,
                $session->candidate,
                $this->options,
            );
        } finally {
            $session->forceFill(['questions_preparing' => false])->save();
        }
    }

    public function failed(?Throwable $exception): void
    {
        AiInterviewSession::query()
            ->whereKey($this->sessionId)
            ->update(['questions_preparing' => false]);
    }
}
