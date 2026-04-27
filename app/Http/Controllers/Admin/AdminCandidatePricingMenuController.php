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
                'ai_token_amount',
                'cv_builder_quota',
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
                'ai_token_amount' => number_format((int) $menu->ai_token_amount, 0, ',', '.'),
                'cv_builder_quota' => (int) $menu->cv_builder_quota,
                'menu_type' => [
                    'label' => $menu->is_default_free ? 'Gratis Default' : 'Topup',
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
            'description' => 'Atur paket gratis sekali pakai CV Builder dan paket topup token AI untuk kandidat.',
            'indexAction' => route('admin.candidate-pricing-menus.index'),
            'createHref' => route('admin.candidate-pricing-menus.create'),
            'filters' => [
                $this->field('search', 'Cari paket kandidat', 'search', $request->string('search')->toString()),
            ],
            'columns' => [
                ['key' => 'name', 'label' => 'Nama Paket'],
                ['key' => 'price', 'label' => 'Harga'],
                ['key' => 'ai_token_amount', 'label' => 'Token AI'],
                ['key' => 'cv_builder_quota', 'label' => 'Kuota CV Builder'],
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
            'description' => 'Buat menu gratis atau paket topup token AI untuk kandidat.',
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
                    'Pencil'
                ),
                $this->action(
                    $candidatePricingMenu->is_active ? 'Nonaktifkan' : 'Aktifkan',
                    route('admin.candidate-pricing-menus.toggle', $candidatePricingMenu),
                    $candidatePricingMenu->is_active ? 'Ban' : 'Check',
                    'patch',
                    $candidatePricingMenu->is_active ? 'destructive' : 'default',
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
            'ai_token_amount' => $validated['ai_token_amount'],
            'cv_builder_quota' => $validated['cv_builder_quota'],
            'features_json' => collect(preg_split('/\r\n|\r|\n/', (string) ($validated['features'] ?? '')))
                ->map(fn (string $feature): string => trim($feature))
                ->filter()
                ->values()
                ->all(),
            'is_default_free' => $isDefaultFree,
            'is_active' => $request->boolean('is_active'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function menuActions(CandidatePricingMenu $menu): array
    {
        return [
            $this->action('Lihat Detail', route('admin.candidate-pricing-menus.show', $menu), 'Eye'),
            $this->action('Edit', route('admin.candidate-pricing-menus.edit', $menu), 'Pencil'),
            $this->action(
                $menu->is_active ? 'Nonaktifkan' : 'Aktifkan',
                route('admin.candidate-pricing-menus.toggle', $menu),
                $menu->is_active ? 'Ban' : 'Check',
                'patch',
                $menu->is_active ? 'destructive' : 'default',
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
            'ai_token_amount' => (int) $menu->ai_token_amount,
            'cv_builder_quota' => (int) $menu->cv_builder_quota,
            'features' => $menu->normalizedFeatures(),
            'is_default_free' => (bool) $menu->is_default_free,
            'is_active' => (bool) $menu->is_active,
            'created_at' => $menu->created_at?->format('d M Y H:i'),
            'updated_at' => $menu->updated_at?->format('d M Y H:i'),
        ];
    }
}
