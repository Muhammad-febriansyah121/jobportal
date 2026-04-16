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

export type PricingPlanValue = {
    id?: number;
    name: string;
    slug: string;
    price: number;
    duration_days: number;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_screening_quota: number;
    talent_search_quota: number;
    features: string[];
    is_active: boolean;
    subscriptions_count?: number;
};

type PricingPlanFormData = {
    _method?: 'patch';
    name: string;
    slug: string;
    price: number;
    duration_days: number;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_screening_quota: number;
    talent_search_quota: number;
    features: string;
    is_active: boolean;
};

const defaultFeatures = [
    'AI screening kandidat',
    'Talent search',
    'Dashboard analytics',
];

export function PricingPlanForm({
    action,
    method = 'post',
    plan,
}: {
    action: string;
    method?: 'patch' | 'post';
    plan?: PricingPlanValue;
}) {
    const initialFeatures = plan?.features?.length
        ? plan.features
        : defaultFeatures;
    const form = useForm<PricingPlanFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        name: plan?.name ?? '',
        slug: plan?.slug ?? '',
        price: plan?.price ?? 0,
        duration_days: plan?.duration_days ?? 30,
        active_jobs_limit: plan?.active_jobs_limit ?? 0,
        recruiter_seat_limit: plan?.recruiter_seat_limit ?? 1,
        ai_screening_quota: plan?.ai_screening_quota ?? 0,
        talent_search_quota: plan?.talent_search_quota ?? 0,
        features: initialFeatures.join('\n'),
        is_active: plan?.is_active ?? true,
    });
    const features = splitFeatures(form.data.features);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(action, {
            preserveScroll: true,
            onError: () => {
                toast.error('Periksa kembali data pricing plan.');
            },
        });
    }

    function updateNumber(
        field:
            | 'active_jobs_limit'
            | 'ai_screening_quota'
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

    return (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">Informasi Paket</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Nama paket, slug, harga, dan status tampil di halaman billing employer.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Paket</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Contoh: Growth"
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                onChange={(event) =>
                                    form.setData('slug', event.target.value)
                                }
                                placeholder="Otomatis dari nama jika kosong"
                            />
                            <InputError message={form.errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="price">Harga</Label>
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
                            <Label htmlFor="duration_days">Masa Aktif</Label>
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
                                {durationLabel(form.data.duration_days)}
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
                                    Paket aktif
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Paket bisa dipakai untuk subscription baru.
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_active} />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">Kuota Paket</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tentukan batas lowongan aktif, seat recruiter, dan kuota AI.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <NumberField
                            id="active_jobs_limit"
                            label="Active jobs limit"
                            value={form.data.active_jobs_limit}
                            error={form.errors.active_jobs_limit}
                            onChange={(value) =>
                                updateNumber('active_jobs_limit', value)
                            }
                        />
                        <NumberField
                            id="recruiter_seat_limit"
                            label="Recruiter seat limit"
                            value={form.data.recruiter_seat_limit}
                            error={form.errors.recruiter_seat_limit}
                            onChange={(value) =>
                                updateNumber('recruiter_seat_limit', value)
                            }
                        />
                        <NumberField
                            id="ai_screening_quota"
                            label="AI screening quota"
                            value={form.data.ai_screening_quota}
                            error={form.errors.ai_screening_quota}
                            onChange={(value) =>
                                updateNumber('ai_screening_quota', value)
                            }
                        />
                        <NumberField
                            id="talent_search_quota"
                            label="Talent search quota"
                            value={form.data.talent_search_quota}
                            error={form.errors.talent_search_quota}
                            onChange={(value) =>
                                updateNumber('talent_search_quota', value)
                            }
                        />
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Feature List</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tulis satu benefit per baris. Ini akan muncul sebagai daftar fitur paket.
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={addFeature}>
                            <Plus />
                            Tambah Fitur
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
                                    placeholder="Contoh: 10 kuota AI screening"
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
                        <h2 className="text-lg font-semibold">Preview Paket</h2>
                        <Badge
                            className={
                                form.data.is_active
                                    ? 'bg-emerald-600 text-white'
                                    : ''
                            }
                            variant={form.data.is_active ? 'default' : 'outline'}
                        >
                            {form.data.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>

                    <div className="mt-5 rounded-lg border bg-[#fff8f4] p-4">
                        <p className="text-sm font-semibold text-[#f45113]">
                            {form.data.name || 'Nama Paket'}
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight">
                            {formatRupiah(form.data.price)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            harga paket
                        </p>
                        <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-bold text-[#f45113]">
                            {durationLabel(form.data.duration_days)}
                        </p>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <Quota label="Active jobs" value={form.data.active_jobs_limit} />
                        <Quota label="Recruiter seat" value={form.data.recruiter_seat_limit} />
                        <Quota label="AI screening" value={form.data.ai_screening_quota} />
                        <Quota label="Talent search" value={form.data.talent_search_quota} />
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
                        className="mt-5 w-full bg-[#f45113] hover:bg-[#d94710]"
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
