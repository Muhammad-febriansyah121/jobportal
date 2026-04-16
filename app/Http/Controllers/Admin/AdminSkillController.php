<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveSkillRequest;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminSkillController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $skills = Skill::query()
            ->select(['id', 'name', 'slug', 'category', 'created_at'])
            ->withCount(['candidates', 'jobListings'])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Skill $skill): array => [
                'id' => $skill->id,
                'name' => $skill->name,
                'slug' => $skill->slug,
                'category' => $skill->category ?? '-',
                'candidates_count' => $skill->candidates_count,
                'job_listings_count' => $skill->job_listings_count,
                'actions' => $this->skillActions($skill),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Skill',
            'description' => 'Tambah, edit, hapus, dan kelompokkan skill kandidat serta lowongan.',
            'indexAction' => route('admin.skills.index'),
            'createAction' => $this->action('Tambah Skill', route('admin.skills.store'), 'Plus', 'post', 'default', null, null, $this->skillFields()),
            'filters' => [
                $this->field('search', 'Cari skill', 'search', $request->string('search')->toString()),
                $this->field('category', 'Kategori', 'select', $request->string('category')->toString(), $this->categoryOptions()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'slug', 'label' => 'Slug'],
                ['key' => 'category', 'label' => 'Kategori'],
                ['key' => 'candidates_count', 'label' => 'Kandidat'],
                ['key' => 'job_listings_count', 'label' => 'Lowongan'],
            ],
            'rows' => $skills,
            'emptyState' => 'Belum ada skill.',
        ]);
    }

    public function store(SaveSkillRequest $request, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);

        $skill = Skill::create($validated);
        Cache::forget('admin.skills.list');
        $activity->handle($request->user(), 'create_skill', $skill);

        $this->flash('Skill berhasil ditambahkan.');

        return back();
    }

    public function update(SaveSkillRequest $request, Skill $skill, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);

        $skill->update($validated);
        Cache::forget('admin.skills.list');
        $activity->handle($request->user(), 'update_skill', $skill);

        $this->flash('Skill berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, Skill $skill, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_skill', $skill, ['name' => $skill->name]);
        $skill->delete();
        Cache::forget('admin.skills.list');

        $this->flash('Skill berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function skillActions(Skill $skill): array
    {
        return [
            $this->action('Edit', route('admin.skills.update', $skill), 'Pencil', 'patch', 'outline', null, null, $this->skillFields($skill)),
            $this->action('Hapus', route('admin.skills.destroy', $skill), 'Trash', 'delete', 'destructive', 'Hapus skill?', 'Skill akan hilang dari daftar master data.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function skillFields(?Skill $skill = null): array
    {
        return [
            $this->field('name', 'Nama', 'text', $skill?->name, [], ['required' => true]),
            $this->field('slug', 'Slug', 'text', $skill?->slug),
            $this->field('category', 'Kategori', 'text', $skill?->category),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function categoryOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua kategori'],
            ...Skill::query()
                ->select('category')
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->map(fn (string $category): array => ['value' => $category, 'label' => $category])
                ->all(),
        ];
    }
}
