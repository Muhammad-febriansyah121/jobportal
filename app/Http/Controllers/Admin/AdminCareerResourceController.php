<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveCareerResourceRequest;
use App\Models\CareerResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminCareerResourceController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $resources = CareerResource::query()
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'published_at', 'created_at'])
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (CareerResource $resource): array => [
                'id' => $resource->id,
                'thumbnail' => [
                    'type' => 'image',
                    'src' => $this->thumbnailUrl($resource),
                    'alt' => $resource->title,
                ],
                'title' => $resource->title,
                'slug' => $resource->slug,
                'type' => str($resource->type)->headline()->toString(),
                'category' => $resource->category ?? '-',
                'status' => [
                    'label' => $resource->published_at ? 'Published' : 'Draft',
                    'tone' => $resource->published_at ? 'success' : 'warning',
                ],
                'published_at' => $resource->published_at?->format('d M Y') ?? '-',
                'actions' => $this->resourceActions($resource),
            ]);

        return Inertia::render('admin/career-resources/index', [
            'title' => 'Kelola Career Resource',
            'description' => 'Kelola artikel, kategori resource, publish, unpublish, dan hapus konten karier.',
            'indexAction' => route('admin.career-resources.index'),
            'createHref' => route('admin.career-resources.create'),
            'filters' => [
                $this->field('search', 'Cari artikel', 'search', $request->string('search')->toString()),
                $this->field('category', 'Kategori', 'select', $request->string('category')->toString(), $this->categoryOptions()),
            ],
            'columns' => [
                ['key' => 'thumbnail', 'label' => 'Thumbnail'],
                ['key' => 'title', 'label' => 'Title'],
                ['key' => 'slug', 'label' => 'Slug'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'category', 'label' => 'Kategori'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'published_at', 'label' => 'Publish'],
            ],
            'rows' => $resources,
            'emptyState' => 'Belum ada career resource.',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/career-resources/create', [
            'title' => 'Tambah Career Resource',
            'description' => 'Buat artikel, panduan, template, atau video resource karier.',
            'backHref' => route('admin.career-resources.index'),
            'storeAction' => route('admin.career-resources.store'),
            'typeOptions' => $this->typeOptions(),
        ]);
    }

    public function store(SaveCareerResourceRequest $request, RecordActivity $activity): RedirectResponse
    {
        $resource = CareerResource::create($this->resourcePayload($request));
        $activity->handle($request->user(), 'create_career_resource', $resource);

        $this->flash('Career resource berhasil ditambahkan.');

        return to_route('admin.career-resources.show', $resource);
    }

    public function show(CareerResource $careerResource): Response
    {
        return Inertia::render('admin/career-resources/show', [
            'title' => $careerResource->title,
            'description' => 'Preview detail career resource sebelum tampil untuk user.',
            'backHref' => route('admin.career-resources.index'),
            'resource' => $this->resourceDetail($careerResource),
            'actions' => [
                $this->action('Edit', route('admin.career-resources.edit', $careerResource), 'Pencil'),
                $careerResource->published_at
                    ? $this->action('Unpublish', route('admin.career-resources.unpublish', $careerResource), 'X', 'patch', 'outline', 'Unpublish artikel?', 'Artikel tidak tampil sebagai published.')
                    : $this->action('Publish', route('admin.career-resources.publish', $careerResource), 'Check', 'patch', 'default', 'Publish artikel?', 'Artikel akan ditandai published.'),
            ],
        ]);
    }

    public function edit(CareerResource $careerResource): Response
    {
        return Inertia::render('admin/career-resources/edit', [
            'title' => 'Edit Career Resource',
            'description' => 'Perbarui thumbnail, metadata, dan isi resource karier.',
            'backHref' => route('admin.career-resources.show', $careerResource),
            'updateAction' => route('admin.career-resources.update', $careerResource),
            'typeOptions' => $this->typeOptions(),
            'resource' => $this->resourceDetail($careerResource),
        ]);
    }

    public function update(SaveCareerResourceRequest $request, CareerResource $careerResource, RecordActivity $activity): RedirectResponse
    {
        $careerResource->update($this->resourcePayload($request));
        $activity->handle($request->user(), 'update_career_resource', $careerResource);

        $this->flash('Career resource berhasil diperbarui.');

        return to_route('admin.career-resources.show', $careerResource);
    }

    public function destroy(Request $request, CareerResource $careerResource, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_career_resource', $careerResource, ['title' => $careerResource->title]);
        $this->deleteThumbnail($careerResource);
        $careerResource->delete();

        $this->flash('Career resource berhasil dihapus.');

        return back();
    }

    public function publish(Request $request, CareerResource $careerResource, RecordActivity $activity): RedirectResponse
    {
        $careerResource->update(['published_at' => now()]);
        $activity->handle($request->user(), 'publish_career_resource', $careerResource);

        $this->flash('Career resource berhasil dipublish.');

        return back();
    }

    public function unpublish(Request $request, CareerResource $careerResource, RecordActivity $activity): RedirectResponse
    {
        $careerResource->update(['published_at' => null]);
        $activity->handle($request->user(), 'unpublish_career_resource', $careerResource);

        $this->flash('Career resource kembali menjadi draft.');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function resourcePayload(SaveCareerResourceRequest $request): array
    {
        $validated = $request->validated();
        unset($validated['thumbnail']);

        $payload = [
            ...$validated,
            'slug' => $validated['slug'] ?: Str::slug($validated['title']),
        ];

        if ($request->hasFile('thumbnail')) {
            $careerResource = $request->route('careerResource');

            if ($careerResource instanceof CareerResource) {
                $this->deleteThumbnail($careerResource);
            }

            $payload['thumbnail_path'] = $request->file('thumbnail')->store('career-resources', 'public');
        }

        return $payload;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resourceActions(CareerResource $resource): array
    {
        return [
            $this->action('Lihat Detail', route('admin.career-resources.show', $resource), 'Eye'),
            $this->action('Edit', route('admin.career-resources.edit', $resource), 'Pencil'),
            $resource->published_at
                ? $this->action('Unpublish', route('admin.career-resources.unpublish', $resource), 'X', 'patch', 'outline', 'Unpublish artikel?', 'Artikel tidak tampil sebagai published.')
                : $this->action('Publish', route('admin.career-resources.publish', $resource), 'Check', 'patch', 'default', 'Publish artikel?', 'Artikel akan ditandai published.'),
            $this->action('Hapus', route('admin.career-resources.destroy', $resource), 'Trash', 'delete', 'destructive', 'Hapus artikel?', 'Artikel akan dihapus permanen.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resourceDetail(CareerResource $resource): array
    {
        return [
            'id' => $resource->id,
            'title' => $resource->title,
            'slug' => $resource->slug,
            'type' => $resource->type,
            'type_label' => str($resource->type)->headline()->toString(),
            'category' => $resource->category,
            'thumbnail_url' => $this->thumbnailUrl($resource),
            'content' => $resource->content,
            'status' => $resource->published_at ? 'Published' : 'Draft',
            'published_at' => $resource->published_at?->format('d M Y H:i'),
            'created_at' => $resource->created_at?->format('d M Y H:i'),
            'updated_at' => $resource->updated_at?->format('d M Y H:i'),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function typeOptions(): array
    {
        return $this->options([
            'article' => 'Article',
            'guide' => 'Guide',
            'template' => 'Template',
            'video' => 'Video',
        ]);
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function categoryOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua kategori'],
            ...CareerResource::query()
                ->select('category')
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->map(fn (string $category): array => ['value' => $category, 'label' => $category])
                ->all(),
        ];
    }

    private function thumbnailUrl(CareerResource $resource): ?string
    {
        if (! $resource->thumbnail_path) {
            return null;
        }

        return Storage::disk('public')->url($resource->thumbnail_path);
    }

    private function deleteThumbnail(CareerResource $resource): void
    {
        if ($resource->thumbnail_path) {
            Storage::disk('public')->delete($resource->thumbnail_path);
        }
    }
}
