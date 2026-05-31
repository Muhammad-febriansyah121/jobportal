<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveCandidatePricingMenuRequest;
use App\Models\CandidatePricingMenu;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminCandidatePricingMenuController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $menus = CandidatePricingMenu::query()
            ->select([
                'id',
                'name',
                'slug',
                'price',
                'ai_interview_quota',
                'cv_builder_quota',
                'validity_days',
                'is_default_free',
                'is_active',
                'created_at',
            ])
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%')
            )
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (CandidatePricingMenu $menu): array => [
                'id' => $menu->id,
                'name' => $menu->name,
                'price' => 'Rp '.number_format((int) $menu->price, 0, ',', '.'),
                'ai_interview_quota' => (int) $menu->ai_interview_quota,
                'cv_builder_quota' => (int) $menu->cv_builder_quota,
                'validity_days' => (int) $menu->validity_days,
                'menu_type' => [
                    'label' => $menu->is_default_free ? 'Gratis Default' : 'Berbayar',
                    'tone' => $menu->is_default_free ? 'success' : 'warning',
                ],
                'status' => [
                    'label' => $menu->is_active ? 'Aktif' : 'Nonaktif',
                    'tone' => $menu->is_active ? 'success' : 'danger',
                ],
                'actions' => $this->menuActions($menu),
            ]);

        return Inertia::render('admin/candidate-pricing-menus/index', [
            'title' => 'Kelola Pricing Kandidat',
            'description' => 'Atur paket berlangganan kandidat untuk simulasi AI Interview, CV ATS, Analisa CV, dan Career Coach.',
            'indexAction' => route('admin.candidate-pricing-menus.index'),
            'createHref' => route('admin.candidate-pricing-menus.create'),
            'filters' => [
                $this->field('search', 'Cari paket kandidat', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama Paket'],
                ['key' => 'price', 'label' => 'Harga'],
                ['key' => 'ai_interview_quota', 'label' => 'Simulasi Interview AI'],
                ['key' => 'cv_builder_quota', 'label' => 'Kuota CV'],
                ['key' => 'validity_days', 'label' => 'Masa Aktif (hari)'],
                ['key' => 'menu_type', 'label' => 'Tipe'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $menus,
            'emptyState' => 'Belum ada pricing kandidat.',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/candidate-pricing-menus/create', [
            'title' => 'Tambah Pricing Kandidat',
            'description' => 'Buat paket berlangganan kandidat (Simulasi Interview AI, CV ATS, Analisa CV, Career Coach).',
            'backHref' => route('admin.candidate-pricing-menus.index'),
            'storeAction' => route('admin.candidate-pricing-menus.store'),
        ]);
    }

    public function store(
        SaveCandidatePricingMenuRequest $request,
        RecordActivity $activity
    ): RedirectResponse {
        $menu = CandidatePricingMenu::create($this->menuPayload($request));

        if ($menu->is_default_free) {
            CandidatePricingMenu::query()
                ->whereKeyNot($menu->id)
                ->update(['is_default_free' => false]);
        }

        Cache::forget('admin.candidate_pricing_menus.list');
        $activity->handle($request->user(), 'create_candidate_pricing_menu', $menu);

        $this->flash('Pricing kandidat berhasil ditambahkan.');

        return to_route('admin.candidate-pricing-menus.show', $menu);
    }

    public function show(CandidatePricingMenu $candidatePricingMenu): Response
    {
        return Inertia::render('admin/candidate-pricing-menus/show', [
            'title' => $candidatePricingMenu->name,
            'description' => 'Preview detail paket kandidat sebelum dipublikasikan ke flow billing.',
            'backHref' => route('admin.candidate-pricing-menus.index'),
            'menu' => $this->menuDetail($candidatePricingMenu),
            'actions' => [
                $this->action(
                    'Edit',
                    route('admin.candidate-pricing-menus.edit', $candidatePricingMenu),
                    'Pencil',
                    'get',
                    'warning'
                ),
                $this->action(
                    $candidatePricingMenu->is_active ? 'Nonaktifkan' : 'Aktifkan',
                    route('admin.candidate-pricing-menus.toggle', $candidatePricingMenu),
                    $candidatePricingMenu->is_active ? 'Ban' : 'Check',
                    'patch',
                    $candidatePricingMenu->is_active ? 'destructive' : 'success',
                    'Ubah status paket kandidat?',
                    'Status paket kandidat akan diperbarui.'
                ),
            ],
        ]);
    }

    public function edit(CandidatePricingMenu $candidatePricingMenu): Response
    {
        return Inertia::render('admin/candidate-pricing-menus/edit', [
            'title' => 'Edit Pricing Kandidat',
            'description' => 'Perbarui harga, token AI, kuota CV Builder, dan benefit paket kandidat.',
            'backHref' => route('admin.candidate-pricing-menus.show', $candidatePricingMenu),
            'updateAction' => route('admin.candidate-pricing-menus.update', $candidatePricingMenu),
            'menu' => $this->menuDetail($candidatePricingMenu),
        ]);
    }

    public function update(
        SaveCandidatePricingMenuRequest $request,
        CandidatePricingMenu $candidatePricingMenu,
        RecordActivity $activity
    ): RedirectResponse {
        $candidatePricingMenu->update($this->menuPayload($request));

        if ($candidatePricingMenu->is_default_free) {
            CandidatePricingMenu::query()
                ->whereKeyNot($candidatePricingMenu->id)
                ->update(['is_default_free' => false]);
        }

        Cache::forget('admin.candidate_pricing_menus.list');
        $activity->handle($request->user(), 'update_candidate_pricing_menu', $candidatePricingMenu);

        $this->flash('Pricing kandidat berhasil diperbarui.');

        return to_route('admin.candidate-pricing-menus.show', $candidatePricingMenu);
    }

    public function toggle(
        Request $request,
        CandidatePricingMenu $candidatePricingMenu,
        RecordActivity $activity
    ): RedirectResponse {
        $candidatePricingMenu->update(['is_active' => ! $candidatePricingMenu->is_active]);
        Cache::forget('admin.candidate_pricing_menus.list');
        $activity->handle(
            $request->user(),
            'toggle_candidate_pricing_menu',
            $candidatePricingMenu,
            ['is_active' => $candidatePricingMenu->is_active]
        );

        $this->flash('Status pricing kandidat diperbarui.');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function menuPayload(SaveCandidatePricingMenuRequest $request): array
    {
        $validated = $request->validated();
        $candidatePricingMenu = $request->route('candidate_pricing_menu') ?? $request->route('candidatePricingMenu');
        $isDefaultFree = $request->boolean('is_default_free');

        return [
            'name' => $validated['name'],
            'slug' => UniqueSlug::make(
                CandidatePricingMenu::class,
                $validated['name'],
                'candidate-menu',
                $candidatePricingMenu instanceof CandidatePricingMenu ? $candidatePricingMenu : null,
            ),
            'description' => $validated['description'] ?? null,
            'price' => $isDefaultFree ? 0 : $validated['price'],
            'ai_token_amount' => 0,
            'ai_interview_quota' => $validated['ai_interview_quota'] ?? 0,
            'cv_builder_quota' => $validated['cv_builder_quota'],
            'validity_days' => $validated['validity_days'] ?? 30,
            'features_json' => collect(preg_split('/\r\n|\r|\n/', (string) ($validated['features'] ?? '')))
                ->map(fn (string $feature): string => trim($feature))
                ->filter()
                ->values()
                ->all(),
            'is_default_free' => $isDefaultFree,
            'is_active' => $request->boolean('is_active'),
            'is_trial' => $request->boolean('is_trial'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function menuActions(CandidatePricingMenu $menu): array
    {
        return [
            $this->action('Lihat Detail', route('admin.candidate-pricing-menus.show', $menu), 'Eye', 'get', 'default'),
            $this->action('Edit', route('admin.candidate-pricing-menus.edit', $menu), 'Pencil', 'get', 'warning'),
            $this->action(
                $menu->is_active ? 'Nonaktifkan' : 'Aktifkan',
                route('admin.candidate-pricing-menus.toggle', $menu),
                $menu->is_active ? 'Ban' : 'Check',
                'patch',
                $menu->is_active ? 'destructive' : 'success',
                'Ubah status paket kandidat?',
                'Status paket kandidat akan diperbarui.'
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function menuDetail(CandidatePricingMenu $menu): array
    {
        return [
            'id' => $menu->id,
            'name' => $menu->name,
            'slug' => $menu->slug,
            'description' => $menu->description,
            'price' => (int) $menu->price,
            'price_label' => 'Rp '.number_format((int) $menu->price, 0, ',', '.'),
            'ai_interview_quota' => (int) $menu->ai_interview_quota,
            'cv_builder_quota' => (int) $menu->cv_builder_quota,
            'validity_days' => (int) $menu->validity_days,
            'features' => $menu->normalizedFeatures(),
            'is_default_free' => (bool) $menu->is_default_free,
            'is_active' => (bool) $menu->is_active,
            'is_trial' => (bool) $menu->is_trial,
            'created_at' => $menu->created_at?->format('d M Y H:i'),
            'updated_at' => $menu->updated_at?->format('d M Y H:i'),
        ];
    }
}
