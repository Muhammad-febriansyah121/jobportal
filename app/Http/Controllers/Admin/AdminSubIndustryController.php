<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveSubIndustryRequest;
use App\Models\Industry;
use App\Models\SubIndustry;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubIndustryController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $subIndustries = SubIndustry::query()
            ->select(['id', 'industry_id', 'name', 'slug', 'created_at'])
            ->with(['industry:id,name'])
            ->withCount(['salaryInsights'])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('industry_id'), fn ($query) => $query->where('industry_id', $request->integer('industry_id')))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (SubIndustry $subIndustry): array => [
                'id' => $subIndustry->id,
                'name' => $subIndustry->name,
                'slug' => $subIndustry->slug,
                'industry' => $subIndustry->industry?->name ?? '-',
                'salary_insights_count' => $subIndustry->salary_insights_count,
                'actions' => $this->subIndustryActions($subIndustry),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Sub Industri',
            'description' => 'Kelola master data sub industri sebagai turunan dari industri.',
            'indexAction' => route('admin.sub-industries.index'),
            'createAction' => $this->action('Tambah Sub Industri', route('admin.sub-industries.store'), 'Plus', 'post', 'default', null, null, $this->subIndustryFields()),
            'filters' => [
                $this->field('search', 'Cari sub industri', 'search', $request->string('search')->toString()),
                $this->field('industry_id', 'Industri', 'select', $request->string('industry_id')->toString(), $this->industryOptions()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'industry', 'label' => 'Industri'],
                ['key' => 'slug', 'label' => 'Slug'],
                ['key' => 'salary_insights_count', 'label' => 'Salary Insight'],
            ],
            'rows' => $subIndustries,
            'emptyState' => 'Belum ada sub industri.',
        ]);
    }

    public function store(SaveSubIndustryRequest $request, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = UniqueSlug::make(SubIndustry::class, $validated['name'], 'sub-industri');

        $subIndustry = SubIndustry::create($validated);
        Cache::forget('admin.sub_industries.list');
        $activity->handle($request->user(), 'create_sub_industry', $subIndustry);

        $this->flash('Sub industri berhasil ditambahkan.');

        return back();
    }

    public function update(SaveSubIndustryRequest $request, SubIndustry $subIndustry, RecordActivity $activity): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = UniqueSlug::make(SubIndustry::class, $validated['name'], 'sub-industri', $subIndustry);

        $subIndustry->update($validated);
        Cache::forget('admin.sub_industries.list');
        $activity->handle($request->user(), 'update_sub_industry', $subIndustry);

        $this->flash('Sub industri berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, SubIndustry $subIndustry, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_sub_industry', $subIndustry, ['name' => $subIndustry->name]);
        $subIndustry->delete();
        Cache::forget('admin.sub_industries.list');

        $this->flash('Sub industri berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function subIndustryActions(SubIndustry $subIndustry): array
    {
        return [
            $this->action('Edit', route('admin.sub-industries.update', $subIndustry), 'Pencil', 'patch', 'warning', null, null, $this->subIndustryFields($subIndustry)),
            $this->action('Hapus', route('admin.sub-industries.destroy', $subIndustry), 'Trash', 'delete', 'destructive', 'Hapus sub industri?', 'Sub industri akan dihapus dari master data.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function subIndustryFields(?SubIndustry $subIndustry = null): array
    {
        return [
            $this->field('industry_id', 'Industri', 'select', $subIndustry?->industry_id, $this->industryOptions(), ['required' => true]),
            $this->field('name', 'Nama Sub Industri', 'text', $subIndustry?->name, [], ['required' => true]),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function industryOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Pilih industri'],
            ...Industry::query()->select(['id', 'name'])->orderBy('name')->get()->map(fn (Industry $industry): array => [
                'value' => (string) $industry->id,
                'label' => $industry->name,
            ])->all(),
        ];
    }
}
