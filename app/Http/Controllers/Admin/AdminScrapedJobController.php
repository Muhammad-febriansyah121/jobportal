<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateScrapedJobRequest;
use App\Models\ScrapedJob;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminScrapedJobController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $scrapedJobs = ScrapedJob::query()
            ->select([
                'id',
                'source_platform',
                'source_job_id',
                'company_name',
                'title',
                'hr_email',
                'location',
                'status',
                'scraped_at',
                'imported_at',
            ])
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $search = '%'.$request->string('search')->toString().'%';

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('title', 'like', $search)
                        ->orWhere('company_name', 'like', $search)
                        ->orWhere('source_job_id', 'like', $search);
                });
            })
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('platform'), fn (Builder $query) => $query->where('source_platform', $request->string('platform')->toString()))
            ->latest('imported_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (ScrapedJob $scrapedJob): array => [
                'id' => $scrapedJob->id,
                'title' => $scrapedJob->title,
                'company' => $scrapedJob->company_name,
                'platform' => $scrapedJob->source_platform,
                'source_job_id' => $scrapedJob->source_job_id,
                'location' => $scrapedJob->location ?? '-',
                'status' => [
                    'label' => str($scrapedJob->status)->headline()->toString(),
                    'tone' => $this->statusTone($scrapedJob->status),
                ],
                'scraped_at' => $scrapedJob->scraped_at?->format('d M Y H:i') ?? '-',
                'actions' => [
                    $this->action('Lihat Detail', route('admin.scraped-jobs.show', $scrapedJob, false), 'Eye'),
                    $this->action(
                        'Edit',
                        route('admin.scraped-jobs.update', $scrapedJob, false),
                        'Pencil',
                        'patch',
                        'warning',
                        null,
                        null,
                        [
                            $this->field(
                                'hr_email',
                                'Email perusahaan',
                                'email',
                                $scrapedJob->hr_email,
                                [],
                                ['placeholder' => 'hr@perusahaan.com'],
                            ),
                            $this->field('status', 'Status', 'select', $scrapedJob->status, $this->options([
                                'pending' => 'Pending',
                                'reviewed' => 'Reviewed',
                                'rejected' => 'Rejected',
                            ])),
                        ],
                    ),
                    $this->action(
                        'Hapus',
                        route('admin.scraped-jobs.destroy', $scrapedJob, false),
                        'Trash',
                        'delete',
                        'destructive',
                        'Hapus lowongan ini?',
                        'Data lowongan dan lamaran terkait akan dihapus permanen.',
                    ),
                ],
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Lowongan Eksternal',
            'description' => 'Pantau lowongan yang masuk dari sumber eksternal sebelum diproses menjadi lowongan publik.',
            'indexAction' => route('admin.scraped-jobs.index', [], false),
            'headerActions' => [
                $this->action(
                    'Ambil Data Lagi',
                    route('admin.scraped-jobs.index', $request->query(), false),
                    'RefreshCw',
                ),
            ],
            'filters' => [
                $this->field('search', 'Judul, perusahaan, atau ID eksternal', 'search', $request->string('search')->toString()),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'pending' => 'Pending',
                    'reviewed' => 'Reviewed',
                    'rejected' => 'Rejected',
                ])),
                $this->field('platform', 'Platform', 'select', $request->string('platform')->toString(), $this->platformOptions()),
            ],
            'columns' => [
                ['key' => 'title', 'label' => 'Judul'],
                ['key' => 'company', 'label' => 'Perusahaan'],
                ['key' => 'platform', 'label' => 'Platform'],
                ['key' => 'source_job_id', 'label' => 'ID Eksternal'],
                ['key' => 'location', 'label' => 'Lokasi'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'scraped_at', 'label' => 'Waktu diterima'],
            ],
            'rows' => $scrapedJobs,
            'emptyState' => 'Belum ada lowongan eksternal yang masuk.',
        ]);
    }

    public function update(
        UpdateScrapedJobRequest $request,
        ScrapedJob $scrapedJob,
        RecordActivity $activity,
    ): RedirectResponse {
        $data = $request->validated();
        $scrapedJob->update($data);
        $activity->handle($request->user(), 'update_external_job', $scrapedJob, [
            'changed_fields' => array_keys($data),
        ]);

        $this->flash('Lowongan eksternal berhasil diperbarui.');

        return back();
    }

    public function destroy(Request $request, ScrapedJob $scrapedJob, RecordActivity $activity): RedirectResponse
    {
        $activity->handle($request->user(), 'delete_external_job', $scrapedJob, [
            'title' => $scrapedJob->title,
            'company' => $scrapedJob->company_name,
            'source_job_id' => $scrapedJob->source_job_id,
        ]);

        $scrapedJob->delete();

        $this->flash('Lowongan berhasil dihapus.');

        return back();
    }

    public function show(ScrapedJob $scrapedJob): Response
    {
        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Lowongan Eksternal',
            'description' => $scrapedJob->title,
            'backHref' => route('admin.scraped-jobs.index', [], false),
            'sections' => [
                [
                    'title' => 'Informasi pekerjaan',
                    'items' => [
                        ['label' => 'Judul', 'value' => $scrapedJob->title],
                        ['label' => 'Perusahaan', 'value' => $scrapedJob->company_name],
                        ['label' => 'Lokasi', 'value' => $scrapedJob->location],
                        ['label' => 'Tipe pekerjaan', 'value' => str($scrapedJob->employment_type)->headline()->toString()],
                        ['label' => 'Workplace', 'value' => str($scrapedJob->workplace_type)->headline()->toString()],
                        ['label' => 'Gaji', 'value' => $this->salaryLabel($scrapedJob)],
                        ['label' => 'Status', 'value' => str($scrapedJob->status)->headline()->toString()],
                    ],
                ],
                [
                    'title' => 'Sumber eksternal',
                    'items' => [
                        ['label' => 'Platform', 'value' => $scrapedJob->source_platform],
                        ['label' => 'ID eksternal', 'value' => $scrapedJob->source_job_id],
                        ['label' => 'URL sumber', 'value' => $scrapedJob->source_url],
                        ['label' => 'Waktu diterima', 'value' => $scrapedJob->scraped_at?->format('d M Y H:i')],
                        ['label' => 'Waktu masuk', 'value' => $scrapedJob->imported_at?->format('d M Y H:i')],
                    ],
                ],
                [
                    'title' => 'Kontak dan data terstruktur',
                    'items' => [
                        ['label' => 'Email HR', 'value' => $scrapedJob->hr_email],
                        ['label' => 'Email terverifikasi', 'value' => $scrapedJob->email_verified ? 'Ya' : 'Tidak'],
                        ['label' => 'Sumber email', 'value' => $scrapedJob->email_source],
                        ['label' => 'Requirements', 'value' => collect($scrapedJob->requirements ?? [])->join(', ')],
                        ['label' => 'Skills', 'value' => collect($scrapedJob->skills ?? [])->join(', ')],
                    ],
                ],
                [
                    'title' => 'Deskripsi',
                    'items' => [
                        ['label' => 'Deskripsi pekerjaan', 'value' => $scrapedJob->description],
                        ['label' => 'Profil perusahaan', 'value' => $scrapedJob->company_profile],
                    ],
                ],
                [
                    'title' => 'Data sumber',
                    'items' => [
                        ['label' => 'JSON payload', 'value' => $this->payloadLabel($scrapedJob)],
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function platformOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua platform'],
            ...ScrapedJob::query()
                ->whereNotNull('source_platform')
                ->distinct()
                ->orderBy('source_platform')
                ->pluck('source_platform')
                ->map(fn (string $platform): array => [
                    'value' => $platform,
                    'label' => str($platform)->headline()->toString(),
                ])
                ->all(),
        ];
    }

    private function salaryLabel(ScrapedJob $scrapedJob): string
    {
        $currency = $scrapedJob->salary_currency ?? 'IDR';
        $minimum = $scrapedJob->salary_min;
        $maximum = $scrapedJob->salary_max;

        if ($minimum === null && $maximum === null) {
            return 'Tidak dicantumkan';
        }

        return $currency.' '.number_format($minimum ?? $maximum, 0, ',', '.').' - '.number_format($maximum ?? $minimum, 0, ',', '.');
    }

    private function payloadLabel(ScrapedJob $scrapedJob): string
    {
        return (string) json_encode(
            $scrapedJob->raw_payload,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );
    }
}
