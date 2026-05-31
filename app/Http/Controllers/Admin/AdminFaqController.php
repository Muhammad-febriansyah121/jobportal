<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveFaqRequest;
use App\Models\Faq;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminFaqController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $faqs = Faq::query()
            ->select(['id', 'title', 'description', 'created_at'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($builder) use ($search): void {
                    $builder
                        ->where('title', 'like', '%'.$search.'%')
                        ->orWhere('description', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Faq $faq): array => [
                'id' => $faq->id,
                'title' => $faq->title,
                'description' => str($faq->description)->limit(120)->toString(),
                'created_at' => $faq->created_at?->format('d M Y H:i') ?? '-',
                'actions' => $this->faqActions($faq),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola FAQ',
            'description' => 'Tambah, ubah, dan hapus daftar pertanyaan umum untuk platform.',
            'indexAction' => route('admin.faqs.index'),
            'createAction' => $this->action('Tambah FAQ', route('admin.faqs.store'), 'Plus', 'post', 'default', null, null, $this->faqFields()),
            'filters' => [
                $this->field('search', 'Cari FAQ', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'title', 'label' => 'Judul'],
                ['key' => 'description', 'label' => 'Deskripsi'],
                ['key' => 'created_at', 'label' => 'Dibuat'],
            ],
            'rows' => $faqs,
            'emptyState' => 'Belum ada FAQ.',
        ]);
    }

    public function store(SaveFaqRequest $request, RecordActivity $activity): RedirectResponse
    {
        $faq = Faq::create($request->validated());
        $activity->handle($request->user(), 'create_faq', $faq);

        $this->flash('FAQ berhasil ditambahkan.');

        return back();
    }

    public function update(SaveFaqRequest $request, Faq $faq, RecordActivity $activity): RedirectResponse
    {
        $faq->update($request->validated());
        $activity->handle($request->user(), 'update_faq', $faq);

        $this->flash('FAQ berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, Faq $faq, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_faq', $faq, ['title' => $faq->title]);
        $faq->delete();

        $this->flash('FAQ berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function faqActions(Faq $faq): array
    {
        return [
            $this->action('Edit', route('admin.faqs.update', $faq), 'Pencil', 'patch', 'warning', null, null, $this->faqFields($faq)),
            $this->action('Hapus', route('admin.faqs.destroy', $faq), 'Trash', 'delete', 'destructive', 'Hapus FAQ?', 'FAQ yang dihapus tidak bisa dikembalikan.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function faqFields(?Faq $faq = null): array
    {
        return [
            $this->field('title', 'Judul', 'text', $faq?->title, [], ['required' => true, 'placeholder' => 'Contoh: Bagaimana cara upgrade paket?']),
            $this->field('description', 'Deskripsi', 'textarea', $faq?->description, [], ['required' => true, 'placeholder' => 'Tulis jawaban FAQ secara jelas dan ringkas.']),
        ];
    }
}
