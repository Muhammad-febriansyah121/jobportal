<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveIndustryRequest;
use App\Models\Industry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminIndustryController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $industries = Industry::query()
            ->select(['id', 'name', 'slug', 'created_at'])
            ->withCount(['companies', 'jobListings'])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Industry $industry): array => [
                'id' => $industry->id,
                'name' => $industry->name,
                'slug' => $industry->slug,
                'companies_count' => $industry->companies_count,
                'job_listings_count' => $industry->job_listings_count,
                'actions' => $this->industryActions($industry),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Industri',
            'description' => 'Kelola master data industri untuk perusahaan, lowongan, dan salary insight.',
            'indexAction' => route('admin.industries.index'),
            'createAction' => $this->action('Tambah Industri', route('admin.industries.store'), 'Plus', 'post', 'default', null, null, $this->industryFields()),
            'filters' => [
                $this->field('search', 'Cari industri', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'slug', 'label' => 'Slug'],
                ['key' => 'companies_count', 'label' => 'Perusahaan'],
                ['key' => 'job_listings_count', 'label' => 'Lowongan'],
            ],
            'rows' => $industries,
            'emptyState' => 'Belum ada industri.',
        ]);
    }

    public function store(SaveIndustryRequest $request, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);

        $industry = Industry::create($validated);
        Cache::forget('admin.industries.list');
        $activity->handle($request->user(), 'create_industry', $industry);

        $this->flash('Industri berhasil ditambahkan.');

        return back();
    }

    public function update(SaveIndustryRequest $request, Industry $industry, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);

        $industry->update($validated);
        Cache::forget('admin.industries.list');
        $activity->handle($request->user(), 'update_industry', $industry);

        $this->flash('Industri berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, Industry $industry, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_industry', $industry, ['name' => $industry->name]);
        $industry->delete();
        Cache::forget('admin.industries.list');

        $this->flash('Industri berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function industryActions(Industry $industry): array
    {
        return [
            $this->action('Edit', route('admin.industries.update', $industry), 'Pencil', 'patch', 'outline', null, null, $this->industryFields($industry)),
            $this->action('Hapus', route('admin.industries.destroy', $industry), 'Trash', 'delete', 'destructive', 'Hapus industri?', 'Industri akan dihapus dari master data.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function industryFields(?Industry $industry = null): array
    {
        return [
            $this->field('name', 'Nama', 'text', $industry?->name, [], ['required' => true]),
            $this->field('slug', 'Slug', 'text', $industry?->slug),
        ];
    }
}
