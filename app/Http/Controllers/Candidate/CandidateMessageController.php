<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateMessageController extends Controller
{
    public function show(Request $request, Conversation $conversation, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        abort_if($conversation->candidate_id !== $candidate->id, 403);

        $conversation->load(['company:id,name,logo_url', 'application.jobListing:id,title']);

        $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $request->user()->id)
            ->update(['read_at' => now()]);

        $messages = $conversation->messages()
            ->with('sender:id,name,avatar_url')
            ->oldest()
            ->get()
            ->map(fn (Message $message): array => [
                'id' => $message->id,
                'body' => $message->body,
                'sent_at' => $message->created_at?->format('d M Y, H:i'),
                'is_mine' => $message->sender_id === $request->user()->id,
                'sender_name' => $message->sender?->name ?? 'Pengguna',
                'sender_avatar' => $message->sender?->avatar_url,
            ])
            ->all();

        return Inertia::render('candidate/messages/show', [
            'conversation' => [
                'id' => $conversation->id,
                'company' => [
                    'id' => $conversation->company?->id,
                    'name' => $conversation->company?->name ?? 'Perusahaan',
                    'logo_url' => $conversation->company?->logo_url,
                ],
                'job_title' => $conversation->application?->jobListing?->title,
            ],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Conversation $conversation, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        abort_if($conversation->candidate_id !== $candidate->id, 403);

        $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $request->string('body')->toString(),
        ]);

        $conversation->update(['last_message_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesan berhasil dikirim.']);

        return to_route('candidate.messages.show', $conversation);
    }
}
