<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveCompanySizeRequest;
use App\Models\CompanySize;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompanySizeController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $sizes = CompanySize::query()
            ->select(['id', 'label', 'sort_order', 'created_at'])
            ->withCount('companies')
            ->when($request->filled('search'), fn ($query) => $query->where('label', 'like', '%'.$request->string('search')->toString().'%'))
            ->orderBy('sort_order')
            ->orderBy('label')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (CompanySize $size): array => [
                'id' => $size->id,
                'label' => $size->label,
                'sort_order' => $size->sort_order,
                'companies_count' => $size->companies_count,
                'actions' => $this->sizeActions($size),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Ukuran Perusahaan',
            'description' => 'Kelola master data ukuran perusahaan untuk profil dan lowongan.',
            'indexAction' => route('admin.company-sizes.index'),
            'createAction' => $this->action('Tambah Ukuran', route('admin.company-sizes.store'), 'Plus', 'post', 'default', null, null, $this->sizeFields()),
            'filters' => [
                $this->field('search', 'Cari label', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'label', 'label' => 'Label'],
                ['key' => 'sort_order', 'label' => 'Urutan'],
                ['key' => 'companies_count', 'label' => 'Perusahaan'],
            ],
            'rows' => $sizes,
            'emptyState' => 'Belum ada data ukuran perusahaan.',
        ]);
    }

    public function store(SaveCompanySizeRequest $request, RecordActivity $activity): RedirectResponse
    {
        $size = CompanySize::create($request->validated());
        $activity->handle($request->user(), 'create_company_size', $size);

        $this->flash('Ukuran perusahaan berhasil ditambahkan.');

        return back();
    }

    public function update(SaveCompanySizeRequest $request, CompanySize $companySize, RecordActivity $activity): RedirectResponse
    {
        $companySize->update($request->validated());
        $activity->handle($request->user(), 'update_company_size', $companySize);

        $this->flash('Ukuran perusahaan berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, CompanySize $companySize, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_company_size', $companySize, ['label' => $companySize->label]);
        $companySize->delete();

        $this->flash('Ukuran perusahaan berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sizeActions(CompanySize $size): array
    {
        return [
            $this->action('Edit', route('admin.company-sizes.update', $size), 'Pencil', 'patch', 'warning', null, null, $this->sizeFields($size)),
            $this->action('Hapus', route('admin.company-sizes.destroy', $size), 'Trash', 'delete', 'destructive', 'Hapus ukuran perusahaan?', 'Data ini akan dihapus dari master data.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sizeFields(?CompanySize $size = null): array
    {
        return [
            $this->field('label', 'Label', 'text', $size?->label, [], ['required' => true, 'placeholder' => '51-200 karyawan']),
            $this->field('sort_order', 'Urutan tampil', 'number', (string) ($size?->sort_order ?? 0)),
        ];
    }
}
