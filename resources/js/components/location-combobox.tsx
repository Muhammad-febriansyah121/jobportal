import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function LocationCombobox({
    name,
    fetchUrl,
    defaultValue,
    placeholder,
    onChange,
    resetKey,
}: {
    name: string;
    fetchUrl: string;
    defaultValue: string;
    placeholder?: string;
    onChange?: (val: string) => void;
    resetKey?: string;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue);
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const prevResetKey = useRef(resetKey);

    // Reset city when province changes
    useEffect(() => {
        if (resetKey !== undefined && prevResetKey.current !== resetKey) {
            prevResetKey.current = resetKey;
            setValue('');
            onChange?.('');
        }
    }, [resetKey, onChange]);

    // Fetch options when opened
    useEffect(() => {
        if (!open) {
return;
}

        setLoading(true);
        fetch(fetchUrl)
            .then((r) => r.json())
            .then((data: string[]) => setItems(data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [open, fetchUrl]);

    const filtered = items.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
    );

    const handleSelect = (item: string) => {
        const next = item === value ? '' : item;
        setValue(next);
        onChange?.(next);
        setOpen(false);
        setQuery('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none',
                        'hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        !value && 'text-muted-foreground',
                    )}
                >
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <input type="hidden" name={name} value={value} />
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
            >
                <div className="border-b px-3 py-2">
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {loading && (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Memuat...
                        </p>
                    )}
                    {!loading && filtered.length === 0 && (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Tidak ditemukan.
                        </p>
                    )}
                    {filtered.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                            <Check
                                className={cn(
                                    'size-4 shrink-0',
                                    item === value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                )}
                            />
                            {item}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
