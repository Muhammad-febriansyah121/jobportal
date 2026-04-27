<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateWorkspaceController extends Controller
{
    public function messages(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $search = $request->string('search')->toString();

        $conversations = Conversation::query()
            ->where('candidate_id', $candidate->id)
            ->with(['company:id,name,logo_url', 'latestMessage.sender:id,name,avatar_url', 'application.jobListing:id,title'])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $request->user()->id),
            ])
            ->when($search !== '', fn ($query) => $query->where(function ($conversationQuery) use ($search): void {
                $conversationQuery
                    ->whereHas('company', fn ($companyQuery) => $companyQuery->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('application.jobListing', fn ($jobQuery) => $jobQuery->where('title', 'like', '%'.$search.'%'));
            }))
            ->latest('last_message_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Conversation $conversation): array => [
                'id' => $conversation->id,
                'company' => [
                    'id' => $conversation->company?->id,
                    'name' => $conversation->company?->name ?? 'Perusahaan',
                    'logo_url' => $conversation->company?->logo_url,
                ],
                'latest_message' => $conversation->latestMessage ? [
                    'body' => str((string) $conversation->latestMessage->body)->limit(80)->toString(),
                    'sent_at' => $conversation->latestMessage->created_at?->diffForHumans(),
                    'is_mine' => $conversation->latestMessage->sender_id === $request->user()->id,
                ] : null,
                'job_title' => $conversation->application?->jobListing?->title,
                'unread_count' => $conversation->unread_count,
                'last_message_at' => $conversation->last_message_at?->format('d M Y'),
            ]);

        $unreadTotal = Conversation::query()
            ->where('candidate_id', $candidate->id)
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $request->user()->id),
            ])
            ->get()
            ->sum('unread_count');

        return Inertia::render('candidate/messages', [
            'filters' => ['search' => $search],
            'conversations' => $conversations,
            'unread_total' => $unreadTotal,
        ]);
    }
}
