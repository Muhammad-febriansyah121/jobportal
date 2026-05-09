import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { useTranslate } from '@/hooks/use-translate';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type FieldProps = {
    label: string;
    name: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
};

export function Field({ label, name, error, required, children }: FieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>
                {label}
                {required ? (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                    </span>
                ) : null}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

export function Textarea({
    className,
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cn(
                'min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
            {...props}
        />
    );
}

export function Select({
    className,
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={cn(
                'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
}

type DatePickerInputProps = {
    name: string;
    defaultValue?: string | null;
    placeholder?: string;
};

export function DatePickerInput({
    name,
    defaultValue,
    placeholder,
}: DatePickerInputProps) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(
        parseDate(defaultValue ?? ''),
    );
    const value = date ? toDateInputValue(date) : '';
    const resolvedPlaceholder = placeholder ?? t('common.candidate_form.select_date');

    return (
        <>
            <input type="hidden" name={name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        type="button"
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon />
                        {date ? formatDate(date) : resolvedPlaceholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setOpen(false);
                        }}
                        captionLayout="dropdown"
                    />
                </PopoverContent>
            </Popover>
        </>
    );
}

type RupiahInputProps = {
    name?: string;
    defaultValue?: number | string | null;
    value?: number | string | null;
    onChange?: (value: number) => void;
    placeholder?: string;
};

export function RupiahInput({
    name,
    defaultValue,
    value,
    onChange,
    placeholder = 'Rp0',
}: RupiahInputProps) {
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<number>(() => onlyDigits(defaultValue));
    const amount = isControlled ? onlyDigits(value) : internal;

    const handleChange = (next: number): void => {
        if (isControlled) {
            onChange?.(next);
        } else {
            setInternal(next);
        }
    };

    return (
        <>
            {name ? <input type="hidden" name={name} value={amount || ''} /> : null}
            <Input
                id={name}
                inputMode="numeric"
                value={formatRupiah(amount)}
                placeholder={placeholder}
                onChange={(event) => handleChange(onlyDigits(event.target.value))}
            />
        </>
    );
}

export function formatRupiah(value?: number | null): string {
    if (!value) {
        return '';
    }

    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function onlyDigits(value: unknown): number {
    const digits = String(value ?? '').replace(/\D/g, '');

    return digits ? Number(digits) : 0;
}

function parseDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}
