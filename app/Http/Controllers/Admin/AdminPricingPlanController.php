<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SavePricingPlanRequest;
use App\Models\PricingPlan;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminPricingPlanController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $plans = PricingPlan::query()
            ->select(['id', 'name', 'slug', 'price', 'duration_days', 'active_jobs_limit', 'recruiter_seat_limit', 'ai_screening_quota', 'talent_search_quota', 'features_json', 'is_active', 'created_at'])
            ->withCount('subscriptions')
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (PricingPlan $plan): array => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => 'Rp '.number_format((int) $plan->price, 0, ',', '.'),
                'duration' => $this->durationLabel((int) $plan->duration_days),
                'active_jobs_limit' => $plan->active_jobs_limit,
                'recruiter_seat_limit' => $plan->recruiter_seat_limit,
                'ai_screening_quota' => $plan->ai_screening_quota,
                'talent_search_quota' => $plan->talent_search_quota,
                'status' => [
                    'label' => $plan->is_active ? 'Aktif' : 'Nonaktif',
                    'tone' => $plan->is_active ? 'success' : 'danger',
                ],
                'subscriptions_count' => $plan->subscriptions_count,
                'actions' => $this->planActions($plan),
            ]);

        return Inertia::render('admin/pricing-plans/index', [
            'title' => 'Kelola Pricing Plan',
            'description' => 'Atur paket Starter, Growth, Enterprise, quota AI, seat recruiter, dan feature list.',
            'indexAction' => route('admin.pricing-plans.index'),
            'createHref' => route('admin.pricing-plans.create'),
            'filters' => [
                $this->field('search', 'Cari paket', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama'],
                ['key' => 'price', 'label' => 'Harga'],
                ['key' => 'duration', 'label' => 'Masa Aktif'],
                ['key' => 'active_jobs_limit', 'label' => 'Job limit'],
                ['key' => 'recruiter_seat_limit', 'label' => 'Seat'],
                ['key' => 'ai_screening_quota', 'label' => 'AI quota'],
                ['key' => 'talent_search_quota', 'label' => 'Talent quota'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'subscriptions_count', 'label' => 'Subscription'],
            ],
            'rows' => $plans,
            'emptyState' => 'Belum ada pricing plan.',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/pricing-plans/create', [
            'title' => 'Tambah Pricing Plan',
            'description' => 'Buat paket langganan baru lengkap dengan kuota, seat recruiter, dan feature list.',
            'backHref' => route('admin.pricing-plans.index'),
            'storeAction' => route('admin.pricing-plans.store'),
        ]);
    }

    public function store(SavePricingPlanRequest $request, RecordActivity $activity): RedirectResponse
    {
        $plan = PricingPlan::create($this->planPayload($request));
        Cache::forget('admin.pricing_plans.list');
        $activity->handle($request->user(), 'create_pricing_plan', $plan);

        $this->flash('Pricing plan berhasil ditambahkan.');

        return to_route('admin.pricing-plans.show', $plan);
    }

    public function show(PricingPlan $pricingPlan): Response
    {
        $pricingPlan->loadCount('subscriptions');

        return Inertia::render('admin/pricing-plans/show', [
            'title' => $pricingPlan->name,
            'description' => 'Preview detail paket, kuota, dan fitur sebelum ditawarkan ke employer.',
            'backHref' => route('admin.pricing-plans.index'),
            'plan' => $this->planDetail($pricingPlan),
            'actions' => [
                $this->action('Edit', route('admin.pricing-plans.edit', $pricingPlan), 'Pencil'),
                $this->action($pricingPlan->is_active ? 'Nonaktifkan' : 'Aktifkan', route('admin.pricing-plans.toggle', $pricingPlan), $pricingPlan->is_active ? 'Ban' : 'Check', 'patch', $pricingPlan->is_active ? 'destructive' : 'default', 'Ubah status paket?', 'Status paket akan diperbarui.'),
            ],
        ]);
    }

    public function edit(PricingPlan $pricingPlan): Response
    {
        $pricingPlan->loadCount('subscriptions');

        return Inertia::render('admin/pricing-plans/edit', [
            'title' => 'Edit Pricing Plan',
            'description' => 'Perbarui harga, kuota, status, dan daftar fitur paket.',
            'backHref' => route('admin.pricing-plans.show', $pricingPlan),
            'updateAction' => route('admin.pricing-plans.update', $pricingPlan),
            'plan' => $this->planDetail($pricingPlan),
        ]);
    }

    public function update(SavePricingPlanRequest $request, PricingPlan $pricingPlan, RecordActivity $activity): RedirectResponse
    {
        $pricingPlan->update($this->planPayload($request));
        Cache::forget('admin.pricing_plans.list');
        $activity->handle($request->user(), 'update_pricing_plan', $pricingPlan);

        $this->flash('Pricing plan berhasil diperbarui.');

        return to_route('admin.pricing-plans.show', $pricingPlan);
    }

    public function toggle(Request $request, PricingPlan $pricingPlan, RecordActivity $activity): RedirectResponse
    {
        $pricingPlan->update(['is_active' => ! $pricingPlan->is_active]);
        Cache::forget('admin.pricing_plans.list');
        $activity->handle($request->user(), 'toggle_pricing_plan', $pricingPlan, ['is_active' => $pricingPlan->is_active]);

        $this->flash('Status pricing plan diperbarui.');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function planPayload(SavePricingPlanRequest $request): array
    {
        $validated = $request->validated();
        $pricingPlan = $request->route('pricing_plan') ?? $request->route('pricingPlan');

        return [
            'name' => $validated['name'],
            'slug' => UniqueSlug::make(
                PricingPlan::class,
                $validated['name'],
                'paket',
                $pricingPlan instanceof PricingPlan ? $pricingPlan : null,
            ),
            'price' => $validated['price'],
            'duration_days' => $validated['duration_days'],
            'active_jobs_limit' => $validated['active_jobs_limit'],
            'recruiter_seat_limit' => $validated['recruiter_seat_limit'],
            'talent_search_quota' => $validated['talent_search_quota'],
            'features_json' => collect(preg_split('/\r\n|\r|\n/', (string) ($validated['features'] ?? '')))
                ->map(fn (string $feature): string => trim($feature))
                ->filter()
                ->values()
                ->all(),
            'is_active' => $request->boolean('is_active'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function planActions(PricingPlan $plan): array
    {
        return [
            $this->action('Lihat Detail', route('admin.pricing-plans.show', $plan), 'Eye'),
            $this->action('Edit', route('admin.pricing-plans.edit', $plan), 'Pencil'),
            $this->action($plan->is_active ? 'Nonaktifkan' : 'Aktifkan', route('admin.pricing-plans.toggle', $plan), $plan->is_active ? 'Ban' : 'Check', 'patch', $plan->is_active ? 'destructive' : 'default', 'Ubah status paket?', 'Status paket akan diperbarui.'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function planDetail(PricingPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price' => (int) $plan->price,
            'price_label' => 'Rp '.number_format((int) $plan->price, 0, ',', '.'),
            'duration_days' => (int) $plan->duration_days,
            'duration_label' => $this->durationLabel((int) $plan->duration_days),
            'active_jobs_limit' => (int) $plan->active_jobs_limit,
            'recruiter_seat_limit' => (int) $plan->recruiter_seat_limit,
            'talent_search_quota' => (int) $plan->talent_search_quota,
            'features' => collect($plan->normalizedFeatures())
                ->filter(fn (array $feature): bool => $feature['included'])
                ->map(fn (array $feature): string => $feature['label'])
                ->values()
                ->all(),
            'is_active' => (bool) $plan->is_active,
            'subscriptions_count' => (int) ($plan->subscriptions_count ?? 0),
            'created_at' => $plan->created_at?->format('d M Y H:i'),
            'updated_at' => $plan->updated_at?->format('d M Y H:i'),
        ];
    }

    private function durationLabel(int $days): string
    {
        if ($days < 1) {
            return 'Masa aktif belum diatur';
        }

        if ($days % 30 === 0) {
            $months = (int) ($days / 30);

            return $months.' Bulan Masa Aktif';
        }

        return $days.' Hari Masa Aktif';
    }
}
