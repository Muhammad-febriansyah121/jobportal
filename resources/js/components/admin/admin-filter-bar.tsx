import { Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
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
            preserveState: true,
            replace: true,
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 border-y bg-background py-4 lg:flex-row lg:items-end">
            {fields.map((field) => (
                <div className="grid min-w-0 flex-1 gap-2" key={field.name}>
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    {field.type === 'select' ? (
                        <select
                            id={`filter-${field.name}`}
                            name={field.name}
                            defaultValue={String(field.value ?? '')}
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {(field.options ?? []).map((option) => (
                                <option value={option.value} key={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <Input
                            id={`filter-${field.name}`}
                            name={field.name}
                            type={field.type === 'search' ? 'search' : 'text'}
                            defaultValue={String(field.value ?? '')}
                            placeholder={field.placeholder ?? `Masukkan ${field.label}`}
                        />
                    )}
                </div>
            ))}
            <div className="flex gap-2">
                <Button type="submit">
                    <Search />
                    Terapkan
                </Button>
                <Button asChild variant="outline">
                    <Link href={indexAction}>Reset</Link>
                </Button>
            </div>
        </form>
    );
}
