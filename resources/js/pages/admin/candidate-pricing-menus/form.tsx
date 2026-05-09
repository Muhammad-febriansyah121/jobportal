import { useForm } from '@inertiajs/react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';

export type CandidatePricingMenuValue = {
    id?: number;
    name: string;
    description?: string | null;
    price: number;
    ai_interview_quota: number;
    cv_builder_quota: number;
    validity_days: number;
    features: string[];
    is_default_free: boolean;
    is_active: boolean;
    is_trial?: boolean;
};

type CandidatePricingMenuFormData = {
    _method?: 'patch';
    name: string;
    description: string;
    price: number;
    ai_interview_quota: number;
    cv_builder_quota: number;
    validity_days: number;
    features: string;
    is_default_free: boolean;
    is_active: boolean;
    is_trial: boolean;
};

const defaultFeatures = [
    'Simulasi belajar interview AI 5x dalam sebulan & dijelaskan kelebihan dan kekurangan',
    'Pembuatan CV ATS',
    'Analisa CV',
    'Career Coach',
];

export function CandidatePricingMenuForm({
    action,
    method = 'post',
    menu,
}: {
    action: string;
    method?: 'patch' | 'post';
    menu?: CandidatePricingMenuValue;
}) {
    const { t } = useTranslate();
    const initialFeatures = menu?.features?.length
        ? menu.features
        : defaultFeatures;
    const form = useForm<CandidatePricingMenuFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        name: menu?.name ?? '',
        description: menu?.description ?? '',
        price: menu?.price ?? 0,
        ai_interview_quota: menu?.ai_interview_quota ?? 0,
        cv_builder_quota: menu?.cv_builder_quota ?? 1,
        validity_days: menu?.validity_days ?? 30,
        features: initialFeatures.join('\n'),
        is_default_free: menu?.is_default_free ?? false,
        is_active: menu?.is_active ?? true,
        is_trial: menu?.is_trial ?? false,
    });
    const features = splitFeatures(form.data.features);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(action, {
            preserveScroll: true,
            onError: () => {
                toast.error(t('admin.pricing.form.error_toast'));
            },
        });
    }

    function updateNumber(
        field:
            | 'ai_interview_quota'
            | 'cv_builder_quota'
            | 'price'
            | 'validity_days',
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

    function toggleDefaultFree(checked: boolean) {
        form.setData('is_default_free', checked);

        if (checked) {
            form.setData('price', 0);
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">{t("admin.pricing.form.section_info_title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Nama paket kandidat, harga topup, dan status publikasi.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="name">{t("admin.pricing.form.name")}</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder={t("admin.pricing.form.name_placeholder")}
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="description">{t("admin.pricing.form.desc")}</Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData('description', event.target.value)
                                }
                                placeholder={t("admin.pricing.form.desc_placeholder")}
                                rows={4}
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price">{t("admin.pricing.form.price")}</Label>
                            <Input
                                id="price"
                                inputMode="numeric"
                                value={formatRupiah(form.data.price)}
                                onChange={(event) =>
                                    updateNumber('price', event.target.value)
                                }
                                placeholder="Rp 0"
                                disabled={form.data.is_default_free}
                            />
                            <InputError message={form.errors.price} />
                        </div>

                        <label className="flex items-center gap-3 rounded-lg border bg-[#f8fafc] px-4 py-3">
                            <Checkbox
                                checked={form.data.is_default_free}
                                onCheckedChange={(checked) =>
                                    toggleDefaultFree(Boolean(checked))
                                }
                            />
                            <span>
                                <span className="block text-sm font-semibold">
                                    {t('admin.candidate_pricing_form.default_free')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t('admin.candidate_pricing_form.default_free_hint')}
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_default_free} />

                        <label className="flex items-center gap-3 rounded-lg border bg-[#f8fafc] px-4 py-3">
                            <Checkbox
                                checked={form.data.is_active}
                                onCheckedChange={(checked) =>
                                    form.setData('is_active', Boolean(checked))
                                }
                            />
                            <span>
                                <span className="block text-sm font-semibold">
                                    {t('admin.candidate_pricing_form.active_package')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t('admin.candidate_pricing_form.active_package_hint')}
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
                                    {t('admin.candidate_pricing_form.trial_package')}
                                </span>
                                <span className="text-xs text-emerald-700/80">
                                    {t('admin.candidate_pricing_form.trial_package_hint')}
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_trial} />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">{t("admin.pricing.form.section_quota_title")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tentukan kuota Simulasi Interview AI (latihan kandidat), CV Builder, dan masa berlaku paket.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <NumberField
                            id="ai_interview_quota"
                            label="Kuota Simulasi Interview AI"
                            value={form.data.ai_interview_quota}
                            error={form.errors.ai_interview_quota}
                            onChange={(value) => updateNumber('ai_interview_quota', value)}
                        />
                        <NumberField
                            id="cv_builder_quota"
                            label={t("admin.pricing.form.cv_quota")}
                            value={form.data.cv_builder_quota}
                            error={form.errors.cv_builder_quota}
                            onChange={(value) => updateNumber('cv_builder_quota', value)}
                        />
                        <NumberField
                            id="validity_days"
                            label="Masa aktif (hari)"
                            value={form.data.validity_days}
                            error={form.errors.validity_days}
                            onChange={(value) => updateNumber('validity_days', value)}
                        />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{t("admin.pricing.form.section_benefit_title")}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tulis satu benefit per baris agar tampil jelas di halaman pricing.
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={addFeature}>
                            <Plus />
                            Tambah Benefit
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
                                    placeholder={t("admin.pricing.form.benefit_placeholder")}
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
                        <h2 className="text-lg font-semibold">{t("admin.pricing.form.preview_title")}</h2>
                        <div className="flex items-center gap-1.5">
                            {form.data.is_trial ? (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    {t('admin.candidate_pricing_form.badge_trial')}
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
                                {form.data.is_active ? t('admin.pricing.form.status_active') : t('admin.pricing.form.status_inactive')}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border bg-[#eff4ff] p-4">
                        <p className="text-sm font-semibold text-[#01296A]">
                            {form.data.name || t('admin.pricing.form.preview_name_empty')}
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight">
                            {formatRupiah(form.data.price)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('admin.candidate_pricing_form.price_label')}
                        </p>
                        <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-bold text-[#01296A]">
                            {form.data.is_default_free
                                ? t('admin.pricing.form.badge_free')
                                : t('admin.pricing.form.badge_topup')}
                        </p>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <Quota
                            label="Simulasi Interview AI"
                            value={formatNumber(form.data.ai_interview_quota)}
                        />
                        <Quota
                            label={t("admin.pricing.show.metric_cv")}
                            value={formatNumber(form.data.cv_builder_quota)}
                        />
                        <Quota
                            label="Masa aktif"
                            value={`${form.data.validity_days} hari`}
                        />
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
                    <h2 className="text-lg font-semibold">{t("admin.pricing.form.section_save_title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Setelah tersimpan, notifikasi Sonner akan muncul otomatis.
                    </p>
                    <Button
                        type="submit"
                        className="mt-5 w-full bg-[#01296A] hover:bg-[#001D4D]"
                        disabled={form.processing}
                    >
                        {form.processing ? t('admin.pricing.form.btn_saving') : t('admin.pricing.form.btn_save')}
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

function Quota({ label, value }: { label: string; value: string }) {
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

function formatNumber(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value || 0);
}
