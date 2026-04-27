<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportSalaryInsightRequest;
use App\Http\Requests\Admin\SaveSalaryInsightRequest;
use App\Models\Company;
use App\Models\Industry;
use App\Models\SalaryInsight;
use App\Services\SalaryInsightCsvImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class AdminSalaryInsightController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $insights = SalaryInsight::query()
            ->select(['id', 'company_id', 'industry_id', 'job_title', 'location_city', 'source_name', 'dataset_date', 'salary_min', 'salary_median', 'salary_max', 'source_count', 'published_at', 'created_at'])
            ->with(['company:id,name', 'industry:id,name'])
            ->when($request->filled('search'), fn ($query) => $query->where('job_title', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('industry_id'), fn ($query) => $query->where('industry_id', $request->integer('industry_id')))
            ->when($request->filled('source_name'), fn ($query) => $query->where('source_name', 'like', '%'.$request->string('source_name')->toString().'%'))
            ->when($request->filled('dataset_date'), fn ($query) => $query->whereDate('dataset_date', $request->string('dataset_date')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (SalaryInsight $insight): array => [
                'id' => $insight->id,
                'job_title' => $insight->job_title,
                'industry' => $insight->industry?->name ?? '-',
                'company' => $insight->company?->name ?? '-',
                'location_city' => $insight->location_city ?? '-',
                'source_name' => $insight->source_name ?? '-',
                'dataset_date' => $insight->dataset_date?->format('Y-m-d') ?? '-',
                'salary_min' => $this->money($insight->salary_min),
                'salary_median' => $this->money($insight->salary_median),
                'salary_max' => $this->money($insight->salary_max),
                'source_count' => $insight->source_count,
                'status' => [
                    'label' => $insight->published_at ? 'Published' : 'Draft',
                    'tone' => $insight->published_at ? 'success' : 'warning',
                ],
                'actions' => $this->insightActions($insight),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Salary Insight',
            'description' => 'Tambah, edit, publish, dan hapus insight gaji per role, industri, dan perusahaan.',
            'indexAction' => route('admin.salary-insights.index'),
            'headerActions' => [
                $this->action('Tambah Salary Insight', route('admin.salary-insights.store'), 'Plus', 'post', 'default', null, null, $this->insightFields()),
                $this->action('Import CSV', route('admin.salary-insights.import'), 'Plus', 'post', 'outline', null, null, $this->importFields()),
            ],
            'filters' => [
                $this->field('search', 'Cari job title', 'search', $request->string('search')->toString()),
                $this->field('industry_id', 'Industri', 'select', $request->string('industry_id')->toString(), $this->industryOptions()),
                $this->field('source_name', 'Source', 'text', $request->string('source_name')->toString()),
                $this->field('dataset_date', 'Tanggal Dataset', 'date', $request->string('dataset_date')->toString()),
            ],
            'columns' => [
                ['key' => 'job_title', 'label' => 'Job title'],
                ['key' => 'industry', 'label' => 'Industri'],
                ['key' => 'company', 'label' => 'Company'],
                ['key' => 'location_city', 'label' => 'Lokasi'],
                ['key' => 'source_name', 'label' => 'Source'],
                ['key' => 'dataset_date', 'label' => 'Dataset Date'],
                ['key' => 'salary_min', 'label' => 'Min'],
                ['key' => 'salary_median', 'label' => 'Median'],
                ['key' => 'salary_max', 'label' => 'Max'],
                ['key' => 'source_count', 'label' => 'Source'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $insights,
            'emptyState' => 'Belum ada salary insight.',
        ]);
    }

    public function store(SaveSalaryInsightRequest $request, RecordActivity $activity): RedirectResponse
    {
        $insight = SalaryInsight::create($request->validated());
        $activity->handle($request->user(), 'create_salary_insight', $insight);

        $this->flash('Salary insight berhasil ditambahkan.');

        return back();
    }

    public function update(SaveSalaryInsightRequest $request, SalaryInsight $salaryInsight, RecordActivity $activity): RedirectResponse
    {
        $salaryInsight->update($request->validated());
        $activity->handle($request->user(), 'update_salary_insight', $salaryInsight);

        $this->flash('Salary insight berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, SalaryInsight $salaryInsight, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_salary_insight', $salaryInsight, ['job_title' => $salaryInsight->job_title]);
        $salaryInsight->delete();

        $this->flash('Salary insight berhasil dihapus.');

        return back();
    }

    public function publish(Request $request, SalaryInsight $salaryInsight, RecordActivity $activity): RedirectResponse
    {
        $salaryInsight->update(['published_at' => now()]);
        $activity->handle($request->user(), 'publish_salary_insight', $salaryInsight);

        $this->flash('Salary insight berhasil dipublish.');

        return back();
    }

    public function unpublish(Request $request, SalaryInsight $salaryInsight, RecordActivity $activity): RedirectResponse
    {
        $salaryInsight->update(['published_at' => null]);
        $activity->handle($request->user(), 'unpublish_salary_insight', $salaryInsight);

        $this->flash('Salary insight kembali menjadi draft.');

        return back();
    }

    public function import(
        ImportSalaryInsightRequest $request,
        SalaryInsightCsvImporter $importer,
        RecordActivity $activity,
    ): RedirectResponse {
        $data = $request->validated();

        try {
            $summary = $importer->import(
                filePath: $request->file('file')->getPathname(),
                publish: (bool) ($data['publish'] ?? false),
                sourceName: isset($data['source_name']) ? trim((string) $data['source_name']) : null,
                datasetDate: isset($data['dataset_date']) ? trim((string) $data['dataset_date']) : null,
            );
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }

        $activity->handle($request->user(), 'import_salary_insight_csv', null, [
            'aggregated_rows' => $summary['aggregated_rows'],
            'created' => $summary['created'],
            'file' => $request->file('file')->getClientOriginalName(),
            'updated' => $summary['updated'],
        ]);

        $this->flash("Import selesai. Dibuat {$summary['created']} dan diperbarui {$summary['updated']} insight.");

        return back();
    }

    private function money(?int $amount): string
    {
        return $amount === null ? '-' : 'Rp '.number_format($amount, 0, ',', '.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function insightActions(SalaryInsight $insight): array
    {
        return [
            $this->action('Edit', route('admin.salary-insights.update', $insight), 'Pencil', 'patch', 'outline', null, null, $this->insightFields($insight)),
            $insight->published_at
                ? $this->action('Sembunyikan', route('admin.salary-insights.unpublish', $insight), 'X', 'patch', 'outline', 'Sembunyikan insight?', 'Insight tidak akan tampil sebagai data publik.')
                : $this->action('Terbitkan', route('admin.salary-insights.publish', $insight), 'Check', 'patch', 'default', 'Terbitkan insight?', 'Insight akan ditandai sebagai data terbit.'),
            $this->action('Hapus', route('admin.salary-insights.destroy', $insight), 'Trash', 'delete', 'destructive', 'Hapus salary insight?', 'Data salary insight akan dihapus.'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function insightFields(?SalaryInsight $insight = null): array
    {
        return [
            $this->field('job_title', 'Job title', 'text', $insight?->job_title, [], ['required' => true]),
            $this->field('location_city', 'Kota', 'text', $insight?->location_city),
            $this->field('source_name', 'Source', 'text', $insight?->source_name),
            $this->field('dataset_date', 'Tanggal Dataset', 'date', $insight?->dataset_date?->format('Y-m-d')),
            $this->field('industry_id', 'Industri', 'select', $insight?->industry_id, $this->industryOptions()),
            $this->field('company_id', 'Company', 'select', $insight?->company_id, $this->companyOptions()),
            $this->field('salary_min', 'Salary min', 'currency', $insight?->salary_min ?? 0, [], ['min' => 0]),
            $this->field('salary_median', 'Salary median', 'currency', $insight?->salary_median ?? 0, [], ['min' => 0]),
            $this->field('salary_max', 'Salary max', 'currency', $insight?->salary_max ?? 0, [], ['min' => 0]),
            $this->field('source_count', 'Source count', 'number', $insight?->source_count ?? 0, [], ['min' => 0]),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function importFields(): array
    {
        return [
            $this->field('file', 'File CSV', 'file', null, [], ['required' => true]),
            $this->field('source_name', 'Source', 'text', 'LinkedIn + JobStreet'),
            $this->field('dataset_date', 'Tanggal Dataset', 'date', now()->format('Y-m-d')),
            $this->field('publish', 'Publish setelah import', 'checkbox', true),
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

    /**
     * @return array<int, array<string, string>>
     */
    private function companyOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Pilih company'],
            ...Company::query()->select(['id', 'name'])->orderBy('name')->limit(200)->get()->map(fn (Company $company): array => [
                'value' => (string) $company->id,
                'label' => $company->name,
            ])->all(),
        ];
    }
}
