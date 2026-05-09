import { Link, router } from '@inertiajs/react';
import { RotateCcw, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminField } from '@/types';

export function AdminFilterBar({
    fields,
    indexAction,
}: {
    fields?: AdminField[];
    indexAction: string;
}) {
    const { t } = useTranslate();

    if (!fields?.length) {
        return null;
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = Object.fromEntries(
            Array.from(new FormData(event.currentTarget).entries())
                .map(([key, value]) => [key, String(value)])
                .filter(([, value]) => value !== ''),
        );

        router.get(indexAction, payload, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    }

    const hasActiveFilters = fields.some((f) => f.value !== '' && f.value != null);

    const [parentValues, setParentValues] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        fields.forEach((f) => {
            if (fields.some((other) => other.dependsOn === f.name)) {
                map[f.name] = String(f.value ?? '');
            }
        });

        return map;
    });

    return (
        <Card>
            <CardContent className="pt-5 pb-4">
                {/* use key to force remount when server-side filter values change */}
                <form
                    key={fields.map((f) => String(f.value ?? '')).join('|')}
                    onSubmit={submit}
                    className="flex flex-col gap-3 lg:flex-row lg:items-end"
                >
                    {fields.map((field) => {
                        const parentValue = field.dependsOn ? parentValues[field.dependsOn] ?? '' : '';
                        const filteredOptions = field.type === 'cascading-select'
                            ? (field.options ?? []).filter((option) => option.value === '' || option.parent === parentValue)
                            : field.options ?? [];

                        return (
                            <div className="grid min-w-0 flex-1 gap-1.5" key={field.name}>
                                <Label htmlFor={`filter-${field.name}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {field.label}
                                </Label>
                                {field.type === 'select' ? (
                                    <select
                                        id={`filter-${field.name}`}
                                        name={field.name}
                                        defaultValue={String(field.value ?? '')}
                                        onChange={(event) => {
                                            if (parentValues[field.name] !== undefined) {
                                                setParentValues((prev) => ({ ...prev, [field.name]: event.target.value }));
                                            }
                                        }}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        {(field.options ?? []).map((option) => (
                                            <option value={option.value} key={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'cascading-select' ? (
                                    <select
                                        id={`filter-${field.name}`}
                                        name={field.name}
                                        defaultValue={String(field.value ?? '')}
                                        disabled={!parentValue}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {filteredOptions.map((option) => (
                                            <option value={option.value} key={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        id={`filter-${field.name}`}
                                        name={field.name}
                                        type={field.type === 'search' ? 'text' : field.type === 'date' ? 'date' : 'text'}
                                        defaultValue={String(field.value ?? '')}
                                        placeholder={field.placeholder ?? t('admin.components.admin_filter_bar.search_placeholder', { label: field.label.toLowerCase() })}
                                        className="h-9"
                                    />
                                )}
                            </div>
                        );
                    })}

                    <div className="flex shrink-0 items-center gap-2">
                        <Button type="submit" size="sm" className="gap-1.5">
                            <Search className="size-3.5" />
                            {t('admin.components.admin_filter_bar.apply')}
                        </Button>
                        {hasActiveFilters && (
                            <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <Link href={indexAction}>
                                    <RotateCcw className="size-3.5" />
                                    {t('admin.components.admin_filter_bar.reset')}
                                </Link>
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
