import { useForm } from '@inertiajs/react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';

export type PricingPlanValue = {
    id?: number;
    name: string;
    price: number;
    duration_days: number;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_interview_quota: number;
    talent_search_quota: number;
    features: string[];
    is_active: boolean;
    is_trial?: boolean;
    subscriptions_count?: number;
};

type PricingPlanFormData = {
    _method?: 'patch';
    name: string;
    price: number;
    duration_days: number;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_interview_quota: number;
    talent_search_quota: number;
    features: string;
    is_active: boolean;
    is_trial: boolean;
};

export function PricingPlanForm({
    action,
    method = 'post',
    plan,
}: {
    action: string;
    method?: 'patch' | 'post';
    plan?: PricingPlanValue;
}) {
    const { t } = useTranslate();
    const defaultFeatures = useMemo(
        () => [
            t('admin.pricing_plans_form.default_feature_1'),
            t('admin.pricing_plans_form.default_feature_2'),
            t('admin.pricing_plans_form.default_feature_3'),
        ],
        [t],
    );
    const initialFeatures = plan?.features?.length
        ? plan.features
        : defaultFeatures;
    const form = useForm<PricingPlanFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        name: plan?.name ?? '',
        price: plan?.price ?? 0,
        duration_days: plan?.duration_days ?? 30,
        active_jobs_limit: plan?.active_jobs_limit ?? 0,
        recruiter_seat_limit: plan?.recruiter_seat_limit ?? 1,
        ai_interview_quota: plan?.ai_interview_quota ?? 0,
        talent_search_quota: plan?.talent_search_quota ?? 0,
        features: initialFeatures.join('\n'),
        is_active: plan?.is_active ?? true,
        is_trial: plan?.is_trial ?? false,
    });
    const features = splitFeatures(form.data.features);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(action, {
            preserveScroll: true,
            onError: () => {
                toast.error(t('admin.pricing_plans_form.error_review'));
            },
        });
    }

    function updateNumber(
        field:
            | 'active_jobs_limit'
            | 'ai_interview_quota'
            | 'duration_days'
            | 'price'
            | 'recruiter_seat_limit'
            | 'talent_search_quota',
        value: string,
    ) {
        form.setData(field, Number(value.replace(/\D/g, '')) || 0);
    }

    function updateFeature(index: number, value: string) {
        const next = [...features];
        next[index] = value;
        form.setData('features', next.join('\n'));
    }

    function removeFeature(index: number) {
        form.setData(
            'features',
            features.filter((_, featureIndex) => featureIndex !== index).join('\n'),
        );
    }

    function addFeature() {
        form.setData('features', [...features, ''].join('\n'));
    }

    function durationLabelLocal(days: number): string {
        if (!days) {
            return t('admin.pricing_plans_form.enter_duration');
        }
        if (days === 365) {
            return t('admin.pricing_plans_form.duration_12_months');
        }
        if (days % 30 === 0) {
            return t('admin.pricing_plans_form.duration_n_months', { months: days / 30 });
        }
        return t('admin.pricing_plans_form.duration_n_days', { days });
    }

    return (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">{t('admin.pricing_plans_form.package_info')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('admin.pricing_plans_form.package_info_hint')}
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('admin.pricing_plans_form.name')}</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder={t('admin.pricing_plans_form.placeholder_name')}
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price">{t('admin.pricing_plans_form.price')}</Label>
                            <Input
                                id="price"
                                inputMode="numeric"
                                value={formatRupiah(form.data.price)}
                                onChange={(event) =>
                                    updateNumber('price', event.target.value)
                                }
                                placeholder="Rp 0"
                            />
                            <InputError message={form.errors.price} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="duration_days">{t('admin.pricing_plans_form.active_period')}</Label>
                            <Input
                                id="duration_days"
                                inputMode="numeric"
                                value={form.data.duration_days}
                                onChange={(event) =>
                                    updateNumber('duration_days', event.target.value)
                                }
                                placeholder="30"
                            />
                            <p className="text-xs font-medium text-muted-foreground">
                                {durationLabelLocal(form.data.duration_days)}
                            </p>
                            <InputError message={form.errors.duration_days} />
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border bg-[#f8fafc] px-4 py-3">
                            <Checkbox
                                checked={form.data.is_active}
                                onCheckedChange={(checked) =>
                                    form.setData('is_active', Boolean(checked))
                                }
                            />
                            <span>
                                <span className="block text-sm font-semibold">
                                    {t('admin.pricing_plans_form.active_package')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t('admin.pricing_plans_form.active_package_hint')}
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_active} />

                        <label className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                            <Checkbox
                                checked={form.data.is_trial}
                                onCheckedChange={(checked) =>
                                    form.setData('is_trial', Boolean(checked))
                                }
                            />
                            <span>
                                <span className="block text-sm font-semibold text-emerald-800">
                                    {t('admin.pricing_plans_form.trial_package')}
                                </span>
                                <span className="text-xs text-emerald-700/80">
                                    {t('admin.pricing_plans_form.trial_package_hint')}
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_trial} />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">{t('admin.pricing_plans_form.package_quota')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('admin.pricing_plans_form.package_quota_hint')}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <NumberField
                            id="active_jobs_limit"
                            label={t('admin.pricing_plans_form.active_jobs_limit')}
                            value={form.data.active_jobs_limit}
                            error={form.errors.active_jobs_limit}
                            onChange={(value) =>
                                updateNumber('active_jobs_limit', value)
                            }
                        />
                        <NumberField
                            id="recruiter_seat_limit"
                            label={t('admin.pricing_plans_form.recruiter_seat_limit')}
                            value={form.data.recruiter_seat_limit}
                            error={form.errors.recruiter_seat_limit}
                            onChange={(value) =>
                                updateNumber('recruiter_seat_limit', value)
                            }
                        />
                        <NumberField
                            id="talent_search_quota"
                            label={t('admin.pricing_plans_form.talent_search_quota')}
                            value={form.data.talent_search_quota}
                            error={form.errors.talent_search_quota}
                            onChange={(value) =>
                                updateNumber('talent_search_quota', value)
                            }
                        />
                        <NumberField
                            id="ai_interview_quota"
                            label={t('admin.pricing_plans_form.ai_interview_quota')}
                            value={form.data.ai_interview_quota}
                            error={form.errors.ai_interview_quota}
                            onChange={(value) =>
                                updateNumber('ai_interview_quota', value)
                            }
                        />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{t('admin.pricing_plans_form.feature_list')}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('admin.pricing_plans_form.feature_list_hint')}
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={addFeature}>
                            <Plus />
                            {t('admin.pricing_plans_form.add_feature')}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <div className="flex gap-2" key={index}>
                                <Input
                                    value={feature}
                                    onChange={(event) =>
                                        updateFeature(index, event.target.value)
                                    }
                                    placeholder={t('admin.pricing_plans_form.placeholder_feature')}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeFeature(index)}
                                    disabled={features.length === 1}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <InputError message={form.errors.features} className="mt-2" />
                </section>
            </div>

            <aside className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">{t('admin.pricing_plans_form.preview_title')}</h2>
                        <div className="flex items-center gap-1.5">
                            {form.data.is_trial ? (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    {t('admin.pricing_plans_form.badge_trial')}
                                </Badge>
                            ) : null}
                            <Badge
                                className={
                                    form.data.is_active
                                        ? 'bg-emerald-600 text-white'
                                        : ''
                                }
                                variant={form.data.is_active ? 'default' : 'outline'}
                            >
                                {form.data.is_active ? t('common.active') : t('common.inactive')}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border bg-[#eff4ff] p-4">
                        <p className="text-sm font-semibold text-[#0F4C94]">
                            {form.data.name || 'Nama Paket'}
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight">
                            {formatRupiah(form.data.price)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            harga paket
                        </p>
                        <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-bold text-[#0F4C94]">
                            {durationLabel(form.data.duration_days)}
                        </p>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <Quota label="Active jobs" value={form.data.active_jobs_limit} />
                        <Quota label="Recruiter seat" value={form.data.recruiter_seat_limit} />
                        <Quota label="Job Invitation" value={form.data.talent_search_quota} />
                        <Quota label="Interview AI" value={form.data.ai_interview_quota} />
                    </dl>

                    <div className="mt-5 space-y-2">
                        {features.filter(Boolean).map((feature) => (
                            <div className="flex items-start gap-2 text-sm" key={feature}>
                                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="size-3" />
                                </span>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Simpan Perubahan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Setelah tersimpan, notifikasi Sonner akan muncul otomatis.
                    </p>
                    <Button
                        type="submit"
                        className="mt-5 w-full bg-[#0F4C94] hover:bg-[#093579]"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Menyimpan...' : 'Simpan Paket'}
                    </Button>
                </section>
            </aside>
        </form>
    );
}

function NumberField({
    id,
    label,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: number;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                inputMode="numeric"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="0"
            />
            <InputError message={error} />
        </div>
    );
}

function Quota({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-white p-3">
            <dt className="text-xs font-semibold text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 text-lg font-bold">{value}</dd>
        </div>
    );
}

function splitFeatures(value: string): string[] {
    const features = value.split('\n');

    return features.length ? features : [''];
}

function formatRupiah(value: number): string {
    if (!value) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function durationLabel(days: number): string {
    if (!days) {
        return 'Masukkan masa aktif';
    }

    if (days === 365) {
        return '12 Bulan Masa Aktif';
    }

    if (days % 30 === 0) {
        return `${days / 30} Bulan Masa Aktif`;
    }

    return `${days} Hari Masa Aktif`;
}
