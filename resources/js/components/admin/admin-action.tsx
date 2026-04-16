import { Form, Link } from '@inertiajs/react';
import {
    Ban,
    CalendarIcon,
    Check,
    Eye,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AdminAction, AdminField } from '@/types';

const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    Ban,
    Check,
    Eye,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash: Trash2,
    X,
};

type AdminActionButtonProps = {
    action: AdminAction;
};

export function AdminActionButton({ action }: AdminActionButtonProps) {
    const Icon = icons[action.icon] ?? Eye;
    const variant = action.variant ?? 'outline';
    const method = action.method ?? 'get';

    if (method === 'get') {
        return (
            <Button asChild variant={variant} size="sm">
                <Link href={action.href} prefetch>
                    <Icon />
                    {action.label}
                </Link>
            </Button>
        );
    }

    if (action.fields?.length) {
        return action.confirmTitle ? (
            <ConfirmedAction action={action} Icon={Icon} />
        ) : (
            <FormDialogAction action={action} Icon={Icon} />
        );
    }

    return <ConfirmedAction action={action} Icon={Icon} />;
}

export function AdminActionList({ actions = [] }: { actions?: AdminAction[] }) {
    return (
        <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action) => (
                <AdminActionButton action={action} key={`${action.href}-${action.label}`} />
            ))}
        </div>
    );
}

function ConfirmedAction({
    action,
    Icon,
}: AdminActionButtonProps & { Icon: ComponentType<SVGProps<SVGSVGElement>> }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant={action.variant ?? 'outline'} size="sm">
                    <Icon />
                    {action.label}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{action.confirmTitle ?? `${action.label}?`}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {action.confirmDescription ?? 'Pastikan aksi ini sudah sesuai.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <ActionForm action={action} Icon={Icon} mode="confirm" />
            </AlertDialogContent>
        </AlertDialog>
    );
}

function FormDialogAction({
    action,
    Icon,
}: AdminActionButtonProps & { Icon: ComponentType<SVGProps<SVGSVGElement>> }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={action.variant ?? 'outline'} size="sm">
                    <Icon />
                    {action.label}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{action.label}</DialogTitle>
                    <DialogDescription>Lengkapi data di bawah ini.</DialogDescription>
                </DialogHeader>
                <ActionForm action={action} Icon={Icon} mode="dialog" onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function ActionForm({
    action,
    Icon,
    mode,
    onSuccess,
}: AdminActionButtonProps & {
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    mode: 'confirm' | 'dialog';
    onSuccess?: () => void;
}) {
    const method = (action.method ?? 'post') as 'delete' | 'patch' | 'post' | 'put';

    return (
        <Form
            action={action.href}
            method={method}
            options={{ preserveScroll: true }}
            resetOnSuccess
            onSuccess={onSuccess}
            className="space-y-4"
        >
            {({ errors, processing }) => (
                <>
                    {action.fields?.map((field) => (
                        <AdminFormField field={field} errors={errors as Record<string, string>} key={field.name} />
                    ))}

                    {mode === 'confirm' ? (
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <Button type="submit" variant={action.variant ?? 'default'} disabled={processing}>
                                <Icon />
                                {processing ? 'Memproses...' : action.label}
                            </Button>
                        </AlertDialogFooter>
                    ) : (
                        <DialogFooter>
                            <Button type="submit" variant={action.variant ?? 'default'} disabled={processing}>
                                <Icon />
                                {processing ? 'Menyimpan...' : action.label}
                            </Button>
                        </DialogFooter>
                    )}
                </>
            )}
        </Form>
    );
}

function AdminFormField({ field, errors }: { field: AdminField; errors: Record<string, string> }) {
    const placeholder = field.placeholder ?? defaultPlaceholder(field);

    if (field.type === 'checkbox') {
        return (
            <div className="flex items-center gap-2">
                <input
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    value="1"
                    defaultChecked={Boolean(field.value)}
                    className="size-4 rounded border-input"
                />
                <Label htmlFor={field.name}>{field.label}</Label>
                <InputError message={errors[field.name]} />
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === 'textarea' ? (
                <textarea
                    id={field.name}
                    name={field.name}
                    defaultValue={String(field.value ?? '')}
                    placeholder={placeholder}
                    required={field.required}
                    className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
            ) : field.type === 'select' ? (
                <select
                    id={field.name}
                    name={field.name}
                    defaultValue={String(field.value ?? '')}
                    required={field.required}
                    aria-label={placeholder}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    {(field.options ?? []).map((option) => (
                        <option value={option.value} key={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : field.type === 'date' ? (
                <DatePickerField field={field} placeholder={placeholder} />
            ) : field.type === 'currency' || isCurrencyField(field) ? (
                <RupiahField field={field} placeholder={placeholder} />
            ) : (
                <Input
                    id={field.name}
                    name={field.name}
                    type={field.type === 'search' ? 'search' : field.type}
                    defaultValue={String(field.value ?? '')}
                    placeholder={placeholder}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                />
            )}
            <InputError message={errors[field.name]} />
        </div>
    );
}

function DatePickerField({ field, placeholder }: { field: AdminField; placeholder: string }) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(parseDate(String(field.value ?? '')));
    const value = date ? toDateInputValue(date) : '';

    return (
        <>
            <input type="hidden" name={field.name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={field.name}
                        type="button"
                        variant="outline"
                        className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                    >
                        <CalendarIcon />
                        {date ? formatDate(date) : placeholder}
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

function RupiahField({ field, placeholder }: { field: AdminField; placeholder: string }) {
    const [amount, setAmount] = useState<number>(() => onlyDigits(field.value));

    return (
        <>
            <input type="hidden" name={field.name} value={amount} />
            <Input
                id={field.name}
                inputMode="numeric"
                value={formatRupiah(amount)}
                placeholder={placeholder}
                required={field.required}
                onChange={(event) => setAmount(onlyDigits(event.target.value))}
            />
        </>
    );
}

function defaultPlaceholder(field: AdminField): string {
    if (field.type === 'date') {
        return `Pilih ${field.label}`;
    }

    if (field.type === 'select') {
        return `Pilih ${field.label}`;
    }

    if (field.type === 'currency' || isCurrencyField(field)) {
        return `Masukkan ${field.label} dalam Rupiah`;
    }

    return `Masukkan ${field.label}`;
}

function isCurrencyField(field: AdminField): boolean {
    return ['amount', 'price', 'salary_max', 'salary_median', 'salary_min'].includes(field.name);
}

function onlyDigits(value: unknown): number {
    const digits = String(value ?? '').replace(/\D/g, '');

    return digits ? Number(digits) : 0;
}

function formatRupiah(value: number): string {
    if (!value) {
        return '';
    }

    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
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
