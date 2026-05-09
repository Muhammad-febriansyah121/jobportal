<?php

namespace App\Http\Controllers\Admin\Concerns;

use Inertia\Inertia;

trait BuildsAdminPages
{
    /**
     * @param  array<int, array<string, string>>  $options
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    protected function field(string $name, string $label, string $type = 'text', mixed $value = null, array $options = [], array $extra = []): array
    {
        return [
            'name' => $name,
            'label' => $label,
            'type' => $type,
            'value' => $value,
            'options' => $options,
            ...$extra,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $fields
     * @return array<string, mixed>
     */
    protected function action(
        string $label,
        string $href,
        string $icon = 'Eye',
        string $method = 'get',
        string $variant = 'outline',
        ?string $confirmTitle = null,
        ?string $confirmDescription = null,
        ?array $fields = null,
    ): array {
        return array_filter([
            'label' => $label,
            'href' => $href,
            'icon' => $icon,
            'method' => $method,
            'variant' => $variant,
            'confirmTitle' => $confirmTitle,
            'confirmDescription' => $confirmDescription,
            'fields' => $fields,
        ], fn (mixed $value): bool => $value !== null);
    }

    /**
     * @return array<int, array<string, string>>
     */
    protected function options(array $items): array
    {
        return collect($items)
            ->map(fn (string $label, string|int $value): array => [
                'value' => (string) $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    protected function flash(string $message, string $type = 'success'): void
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);
    }

    protected function statusTone(?string $status): string
    {
        return match ($status) {
            'active', 'approved', 'published', 'resolved', 'success', 'hired' => 'success',
            'pending', 'pending_review', 'open', 'under_review', 'need_revision', 'past_due' => 'warning',
            'inactive', 'rejected', 'suspended', 'cancelled', 'expired', 'failed', 'dismissed' => 'danger',
            default => 'neutral',
        };
    }
}
