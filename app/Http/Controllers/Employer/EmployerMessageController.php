<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerMessageController extends Controller
{
    public function show(Request $request, Conversation $conversation, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        abort_if($conversation->company_id !== $company->id, 403);

        $conversation->load(['candidate.user', 'application.jobListing']);

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

        $candidate = $conversation->candidate;

        return Inertia::render('employer/messages/show', [
            'conversation' => [
                'id' => $conversation->id,
                'candidate' => [
                    'id' => $candidate?->id,
                    'name' => $candidate?->full_name ?? $candidate?->user?->name ?? 'Kandidat',
                    'avatar_url' => $candidate?->user?->avatar_url,
                    'headline' => $candidate?->headline,
                ],
                'job_title' => $conversation->application?->jobListing?->title,
            ],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Conversation $conversation, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        abort_if($conversation->company_id !== $company->id, 403);

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

        return to_route('employer.messages.show', $conversation);
    }
}
