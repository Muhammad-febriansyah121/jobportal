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
import { useCallback, useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { useTranslate } from '@/hooks/use-translate';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
                <AdminActionButton
                    action={action}
                    key={`${action.href}-${action.label}`}
                />
            ))}
        </div>
    );
}

function ConfirmedAction({
    action,
    Icon,
}: AdminActionButtonProps & { Icon: ComponentType<SVGProps<SVGSVGElement>> }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslate();

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant={action.variant ?? 'outline'} size="sm">
                    <Icon />
                    {action.label}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {action.confirmTitle ?? `${action.label}?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {action.confirmDescription ??
                            t('admin.components.admin_action.confirm_default')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <ActionForm
                    action={action}
                    Icon={Icon}
                    mode="confirm"
                    onSuccess={() => setOpen(false)}
                />
            </AlertDialogContent>
        </AlertDialog>
    );
}

function FormDialogAction({
    action,
    Icon,
}: AdminActionButtonProps & { Icon: ComponentType<SVGProps<SVGSVGElement>> }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslate();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={action.variant ?? 'outline'} size="sm">
                    <Icon />
                    {action.label}
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>{action.label}</DialogTitle>
                    <DialogDescription>
                        {t('admin.components.admin_action.dialog_description')}
                    </DialogDescription>
                </DialogHeader>
                <ActionForm
                    action={action}
                    Icon={Icon}
                    mode="dialog"
                    onSuccess={() => setOpen(false)}
                />
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
    const { t } = useTranslate();
    const method = (action.method ?? 'post') as
        | 'delete'
        | 'patch'
        | 'post'
        | 'put';
    const hasFileField = (action.fields ?? []).some((field) => field.type === 'file');

    const isDialog = mode === 'dialog';

    const dependedFieldNames = useMemo(() => {
        const set = new Set<string>();
        action.fields?.forEach((field) => {
            if (field.dependsOn) {
                set.add(field.dependsOn);
            }
        });

        return set;
    }, [action.fields]);

    const initialFieldValues = useMemo(() => {
        const map: Record<string, string> = {};
        action.fields?.forEach((field) => {
            if (dependedFieldNames.has(field.name)) {
                map[field.name] = String(field.value ?? '');
            }
        });

        return map;
    }, [action.fields, dependedFieldNames]);

    const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialFieldValues);

    const handleFieldChange = useCallback(
        (name: string, value: string) => {
            if (!dependedFieldNames.has(name)) {
                return;
            }

            setFieldValues((prev) => (prev[name] === value ? prev : { ...prev, [name]: value }));
        },
        [dependedFieldNames],
    );

    return (
        <Form
            action={action.href}
            method={method}
            encType={hasFileField ? 'multipart/form-data' : undefined}
            options={{ preserveScroll: true }}
            resetOnSuccess
            onSuccess={onSuccess}
            className={isDialog ? 'flex min-h-0 flex-1 flex-col' : 'space-y-4'}
        >
            {({ errors, processing }) => (
                <>
                    {isDialog ? (
                        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
                            {action.fields?.map((field) => (
                                <AdminFormField
                                    field={field}
                                    errors={errors as Record<string, string>}
                                    key={field.name}
                                    fullWidth={shouldSpanFullWidth(field)}
                                    parentValue={field.dependsOn ? fieldValues[field.dependsOn] ?? '' : undefined}
                                    onValueChange={handleFieldChange}
                                />
                            ))}
                        </div>
                    ) : (
                        action.fields?.map((field) => (
                            <AdminFormField
                                field={field}
                                errors={errors as Record<string, string>}
                                key={field.name}
                                parentValue={field.dependsOn ? fieldValues[field.dependsOn] ?? '' : undefined}
                                onValueChange={handleFieldChange}
                            />
                        ))
                    )}

                    {mode === 'confirm' ? (
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.components.admin_action.cancel')}</AlertDialogCancel>
                            <Button
                                type="submit"
                                variant={action.variant ?? 'default'}
                                disabled={processing}
                            >
                                <Icon />
                                {processing ? t('admin.components.admin_action.processing') : action.label}
                            </Button>
                        </AlertDialogFooter>
                    ) : (
                        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
                            <Button
                                type="submit"
                                variant={action.variant ?? 'default'}
                                disabled={processing}
                            >
                                <Icon />
                                {processing ? t('admin.components.admin_action.saving') : action.label}
                            </Button>
                        </DialogFooter>
                    )}
                </>
            )}
        </Form>
    );
}

function shouldSpanFullWidth(field: AdminField): boolean {
    return ['textarea', 'file', 'checkbox'].includes(field.type);
}

function AdminFormField({
    field,
    errors,
    fullWidth = false,
    parentValue,
    onValueChange,
}: {
    field: AdminField;
    errors: Record<string, string>;
    fullWidth?: boolean;
    parentValue?: string;
    onValueChange?: (name: string, value: string) => void;
}) {
    const { t } = useTranslate();
    const placeholder = field.placeholder ?? defaultPlaceholder(field, t);
    const spanClass = fullWidth ? 'sm:col-span-2' : '';

    if (field.type === 'checkbox') {
        return (
            <div className={cn('flex items-center gap-2', spanClass)}>
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
        <div className={cn('grid gap-2', spanClass)}>
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
            ) : field.type === 'cascading-select' ? (
                <CascadingSelectField
                    field={field}
                    parentValue={parentValue ?? ''}
                    placeholder={placeholder}
                />
            ) : field.type === 'select' ? (
                <select
                    id={field.name}
                    name={field.name}
                    defaultValue={String(field.value ?? '')}
                    required={field.required}
                    aria-label={placeholder}
                    onChange={(event) => onValueChange?.(field.name, event.target.value)}
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
            ) : field.type === 'file' ? (
                <Input
                    id={field.name}
                    name={field.name}
                    type="file"
                    required={field.required}
                />
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

type FieldDefaultPlaceholderTranslator = (key: string, replacements?: Record<string, string | number>) => string;

function CascadingSelectField({
    field,
    parentValue,
    placeholder,
}: {
    field: AdminField;
    parentValue: string;
    placeholder: string;
}) {
    const allOptions = field.options ?? [];
    const placeholderOption = allOptions.find((option) => option.value === '');
    const filteredOptions = useMemo(
        () =>
            allOptions.filter(
                (option) => option.value !== '' && option.parent === parentValue,
            ),
        [allOptions, parentValue],
    );
    const initialValue = String(field.value ?? '');
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (!parentValue) {
            setValue('');

            return;
        }

        if (value && !filteredOptions.some((option) => option.value === value)) {
            setValue('');
        }
    }, [parentValue, filteredOptions, value]);

    const isDisabled = !parentValue;

    return (
        <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required={field.required}
            disabled={isDisabled}
            aria-label={placeholder}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="">{placeholderOption?.label ?? placeholder}</option>
            {filteredOptions.map((option) => (
                <option value={option.value} key={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function DatePickerField({
    field,
    placeholder,
}: {
    field: AdminField;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(
        parseDate(String(field.value ?? '')),
    );
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
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground',
                        )}
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

function RupiahField({
    field,
    placeholder,
}: {
    field: AdminField;
    placeholder: string;
}) {
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

function defaultPlaceholder(field: AdminField, t: FieldDefaultPlaceholderTranslator): string {
    if (field.type === 'date') {
        return t('admin.components.admin_action.placeholder_select', { label: field.label });
    }

    if (field.type === 'select' || field.type === 'cascading-select') {
        return t('admin.components.admin_action.placeholder_select', { label: field.label });
    }

    if (field.type === 'currency' || isCurrencyField(field)) {
        return t('admin.components.admin_action.placeholder_enter_rupiah', { label: field.label });
    }

    return t('admin.components.admin_action.placeholder_enter', { label: field.label });
}

function isCurrencyField(field: AdminField): boolean {
    return [
        'amount',
        'price',
        'salary_max',
        'salary_min',
    ].includes(field.name);
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
