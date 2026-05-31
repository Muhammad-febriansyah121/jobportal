<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminContactMessageController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $messages = ContactMessage::query()
            ->select(['id', 'name', 'email', 'subject', 'status', 'created_at'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($builder) use ($search): void {
                    $builder
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%')
                        ->orWhere('subject', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ContactMessage $msg): array => [
                'id' => $msg->id,
                'name' => $msg->name,
                'email' => $msg->email,
                'subject' => $msg->subject,
                'status' => [
                    'label' => $this->statusLabel($msg->status),
                    'tone' => $this->statusTone($msg->status),
                ],
                'created_at' => $msg->created_at?->format('d M Y H:i') ?? '-',
                'actions' => $this->messageActions($msg),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Pesan Kontak',
            'description' => 'Pesan yang masuk dari halaman kontak publik.',
            'indexAction' => route('admin.contact-messages.index'),
            'filters' => [
                $this->field('search', 'Cari', 'search', $request->string('search')->toString()),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), [
                    ['value' => '', 'label' => 'Semua status'],
                    ['value' => 'unread', 'label' => 'Belum Dibaca'],
                    ['value' => 'read', 'label' => 'Sudah Dibaca'],
                    ['value' => 'replied', 'label' => 'Sudah Dibalas'],
                ]),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'subject', 'label' => 'Subjek'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'created_at', 'label' => 'Dikirim'],
            ],
            'rows' => $messages,
            'emptyState' => 'Belum ada pesan masuk.',
        ]);
    }

    public function show(ContactMessage $contactMessage): Response
    {
        if ($contactMessage->status === 'unread') {
            $contactMessage->update(['status' => 'read', 'read_at' => now()]);
        }

        return Inertia::render('admin/contact-messages/show', [
            'message' => [
                'id' => $contactMessage->id,
                'name' => $contactMessage->name,
                'email' => $contactMessage->email,
                'phone' => $contactMessage->phone,
                'subject' => $contactMessage->subject,
                'message' => $contactMessage->message,
                'status' => $contactMessage->status,
                'read_at' => $contactMessage->read_at?->format('d M Y H:i'),
                'created_at' => $contactMessage->created_at?->format('d M Y H:i'),
            ],
            'backHref' => route('admin.contact-messages.index'),
            'actions' => $this->messageActions($contactMessage),
        ]);
    }

    public function markReplied(ContactMessage $contactMessage): RedirectResponse
    {
        $contactMessage->update(['status' => 'replied']);

        $this->flash('Pesan ditandai sudah dibalas.');

        return back();
    }

    public function destroy(ContactMessage $contactMessage): RedirectResponse
    {
        $contactMessage->delete();

        $this->flash('Pesan berhasil dihapus.');

        return redirect()->route('admin.contact-messages.index');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function messageActions(ContactMessage $msg): array
    {
        $actions = [
            $this->action('Lihat Detail', route('admin.contact-messages.show', $msg), 'Eye', 'get', 'default'),
        ];

        if ($msg->status !== 'replied') {
            $actions[] = $this->action(
                'Tandai Dibalas',
                route('admin.contact-messages.mark-replied', $msg),
                'CheckCheck',
                'patch',
                'success',
                'Tandai sebagai sudah dibalas?',
                'Status pesan akan diubah menjadi "Sudah Dibalas".',
            );
        }

        $actions[] = $this->action(
            'Hapus',
            route('admin.contact-messages.destroy', $msg),
            'Trash',
            'delete',
            'destructive',
            'Hapus pesan ini?',
            'Pesan yang dihapus tidak bisa dikembalikan.',
        );

        return $actions;
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'unread' => 'Belum Dibaca',
            'read' => 'Sudah Dibaca',
            'replied' => 'Sudah Dibalas',
            default => $status,
        };
    }
}
