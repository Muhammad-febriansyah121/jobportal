import { Head } from '@inertiajs/react';
import {
    Check,
    Coins,
    FilePenLine,
    Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import type { AdminAction } from '@/types';

type CandidatePricingMenuDetail = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    price_label: string;
    ai_token_amount: number;
    cv_builder_quota: number;
    features: string[];
    is_default_free: boolean;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type CandidatePricingMenuShowProps = {
    title: string;
    description?: string;
    backHref: string;
    menu: CandidatePricingMenuDetail;
    actions?: AdminAction[];
};

export default function CandidatePricingMenuShow({
    title,
    description,
    backHref,
    menu,
    actions = [],
}: CandidatePricingMenuShowProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#01296A] text-white">
                            {menu.slug}
                        </Badge>
                        <Badge
                            className={
                                menu.is_default_free
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-secondary-500 text-white'
                            }
                        >
                            {menu.is_default_free ? 'Gratis Default' : 'Topup'}
                        </Badge>
                        <Badge
                            className={
                                menu.is_active
                                    ? 'bg-emerald-600 text-white'
                                    : ''
                            }
                            variant={menu.is_active ? 'default' : 'outline'}
                        >
                            {menu.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    </div>
                    <AdminActionList actions={actions} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                    <section className="rounded-lg border bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold text-[#01296A]">
                            Pricing Kandidat
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight">
                            {menu.name}
                        </h1>
                        <p className="mt-4 text-4xl font-bold tracking-tight">
                            {menu.price_label}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            harga paket
                        </p>

                        <p className="mt-5 rounded-lg border bg-[#eaf2ff] px-3 py-3 text-sm text-[#01296A]">
                            {menu.description || 'Tidak ada deskripsi paket.'}
                        </p>

                        <div className="mt-6 space-y-3">
                            {menu.features.length ? (
                                menu.features.map((feature) => (
                                    <div
                                        className="flex items-start gap-3 text-sm"
                                        key={feature}
                                    >
                                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                            <Check className="size-3" />
                                        </span>
                                        <span>{feature}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada benefit ditulis.
                                </p>
                            )}
                        </div>
                    </section>

                    <div className="space-y-6">
                        <section className="grid gap-4 md:grid-cols-3">
                            <Metric
                                icon={Coins}
                                label="Token AI"
                                value={formatNumber(menu.ai_token_amount)}
                            />
                            <Metric
                                icon={FilePenLine}
                                label="Kuota CV Builder"
                                value={formatNumber(menu.cv_builder_quota)}
                            />
                            <Metric
                                icon={Ticket}
                                label="Tipe Paket"
                                value={menu.is_default_free ? 'Gratis' : 'Topup'}
                            />
                        </section>

                        <section className="rounded-lg border bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">
                                Audit Ringkas
                            </h2>
                            <dl className="mt-4 grid gap-4 md:grid-cols-3">
                                <Info label="Dibuat" value={menu.created_at ?? '-'} />
                                <Info
                                    label="Terakhir update"
                                    value={menu.updated_at ?? '-'}
                                />
                                <Info
                                    label="Status"
                                    value={menu.is_active ? 'Aktif' : 'Nonaktif'}
                                />
                            </dl>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#01296A]">
                <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-[#f8fafc] p-4">
            <dt className="text-xs font-semibold text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-bold">{value}</dd>
        </div>
    );
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value || 0);
}
