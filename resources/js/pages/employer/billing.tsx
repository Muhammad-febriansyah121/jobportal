import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    ScanSearch,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import EmployerBillingCancelController from '@/actions/App/Http/Controllers/Employer/EmployerBillingCancelController';
import EmployerBillingPurchaseController from '@/actions/App/Http/Controllers/Employer/EmployerBillingPurchaseController';
import { edit as companyEdit } from '@/routes/employer/company';

type ActiveSubscription = {
    id: number;
    plan_name: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    renews_at: string | null;
    active_jobs_limit: number | null;
    recruiter_seat_limit: number | null;
    ai_screening_quota: number | null;
    talent_search_quota: number | null;
    features: string[];
};

type PendingPayment = {
    id: number;
    amount: number;
    plan_name: string;
    provider_reference: string;
    payment_url: string;
};

type Payment = {
    id: number;
    amount: number;
    status: string;
    provider: string;
    provider_reference: string;
    paid_at: string;
};

type Plan = {
    id: number;
    name: string;
    slug: string;
    price: number;
    duration_days: number | null;
    active_jobs_limit: number | null;
    recruiter_seat_limit: number | null;
    ai_screening_quota: number | null;
    talent_search_quota: number | null;
    features: string[];
};

type BillingProps = {
    activeSubscription: ActiveSubscription | null;
    pendingPayment: PendingPayment | null;
    payments: Payment[];
    plans: Plan[];
    hasCompany: boolean;
};

function formatRupiah(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
        expired: 'bg-gray-100 text-gray-600',
        past_due: 'bg-orange-100 text-orange-700',
        paid: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700',
        refunded: 'bg-gray-100 text-gray-600',
    };
    const label: Record<string, string> = {
        active: 'Aktif',
        cancelled: 'Dibatalkan',
        expired: 'Kadaluarsa',
        past_due: 'Jatuh Tempo',
        paid: 'Lunas',
        pending: 'Menunggu',
        failed: 'Gagal',
        refunded: 'Refund',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function LimitBadge({ value }: { value: number | null }) {
    if (value === null || value === 0) {
        return <span className="text-sm text-muted-foreground">Tidak ada</span>;
    }
    if (value < 0) {
        return (
            <span className="text-sm font-semibold text-green-600">
                Tidak terbatas
            </span>
        );
    }
    return <span className="text-sm font-semibold">{value}</span>;
}

export default function EmployerBilling({
    activeSubscription,
    pendingPayment,
    payments,
    plans,
    hasCompany,
}: BillingProps) {
    return (
        <>
            <Head title="Billing & Paket" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Billing & Paket"
                    description="Kelola paket aktif, limit rekrutmen, dan riwayat pembayaran perusahaan."
                />

                {!hasCompany ? (
                    <Card className="border-orange-200 bg-orange-50/80">
                        <CardHeader>
                            <CardTitle>Perusahaan belum disiapkan</CardTitle>
                            <CardDescription>
                                Lengkapi profil perusahaan lebih dulu sebelum
                                mengelola billing dan paket.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href={companyEdit()}>
                                    Mulai onboarding perusahaan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {pendingPayment && (
                            <PendingPaymentBanner
                                pendingPayment={pendingPayment}
                            />
                        )}

                        {activeSubscription ? (
                            <>
                                {/* Active subscription card */}
                                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                                    <Card>
                                        <CardHeader className="flex-row items-start justify-between gap-4">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BadgeCheck className="size-5 text-green-500" />
                                                    {
                                                        activeSubscription.plan_name
                                                    }
                                                </CardTitle>
                                                <CardDescription>
                                                    Paket aktif perusahaan Anda
                                                    saat ini.
                                                </CardDescription>
                                            </div>
                                            {statusBadge(
                                                activeSubscription.status,
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <InfoTile
                                                    icon={
                                                        <CalendarDays className="size-4" />
                                                    }
                                                    label="Mulai"
                                                >
                                                    {activeSubscription.starts_at ??
                                                        '-'}
                                                </InfoTile>
                                                <InfoTile
                                                    icon={
                                                        <CalendarDays className="size-4" />
                                                    }
                                                    label="Berakhir"
                                                >
                                                    {activeSubscription.ends_at ??
                                                        '-'}
                                                </InfoTile>
                                                <InfoTile
                                                    icon={
                                                        <CalendarDays className="size-4" />
                                                    }
                                                    label="Pembaruan"
                                                >
                                                    {activeSubscription.renews_at ??
                                                        '-'}
                                                </InfoTile>
                                            </div>

                                            <Separator />

                                            <div>
                                                <p className="mb-3 text-sm font-medium">
                                                    Limit & Kuota
                                                </p>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <QuotaTile
                                                        icon={
                                                            <BriefcaseBusiness className="size-4" />
                                                        }
                                                        label="Lowongan aktif"
                                                        value={
                                                            activeSubscription.active_jobs_limit
                                                        }
                                                    />
                                                    <QuotaTile
                                                        icon={
                                                            <Users className="size-4" />
                                                        }
                                                        label="Seat recruiter"
                                                        value={
                                                            activeSubscription.recruiter_seat_limit
                                                        }
                                                    />
                                                    <QuotaTile
                                                        icon={
                                                            <BadgeCheck className="size-4" />
                                                        }
                                                        label="AI screening"
                                                        value={
                                                            activeSubscription.ai_screening_quota
                                                        }
                                                    />
                                                    <QuotaTile
                                                        icon={
                                                            <ScanSearch className="size-4" />
                                                        }
                                                        label="Pencarian talenta"
                                                        value={
                                                            activeSubscription.talent_search_quota
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Features */}
                                    {activeSubscription.features.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Fitur paket
                                                </CardTitle>
                                                <CardDescription>
                                                    Yang termasuk dalam paket
                                                    aktif Anda.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {activeSubscription.features.map(
                                                        (f) => (
                                                            <li
                                                                key={f}
                                                                className="flex items-start gap-2 text-sm"
                                                            >
                                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                                                {f}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Payment history */}
                                {payments.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <CreditCard className="size-5" />
                                                Riwayat Pembayaran
                                            </CardTitle>
                                            <CardDescription>
                                                Histori transaksi untuk paket
                                                aktif Anda.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Nominal
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead>
                                                            Provider
                                                        </TableHead>
                                                        <TableHead>
                                                            Referensi
                                                        </TableHead>
                                                        <TableHead>
                                                            Tanggal
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {payments.map((payment) => (
                                                        <TableRow
                                                            key={payment.id}
                                                        >
                                                            <TableCell className="font-medium">
                                                                {formatRupiah(
                                                                    payment.amount,
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {statusBadge(
                                                                    payment.status,
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    payment.provider
                                                                }
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                                {
                                                                    payment.provider_reference
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    payment.paid_at
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            /* No active subscription — show available plans */
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Perusahaan Anda belum memiliki paket aktif.
                                    Pilih salah satu paket di bawah untuk
                                    memulai rekrutmen penuh.
                                </p>
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {plans.map((plan) => (
                                        <PlanCard key={plan.id} plan={plan} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Show plans as upgrade options when subscription is active */}
                        {activeSubscription && plans.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">
                                    Paket Tersedia
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Tingkatkan paket untuk mendapatkan lebih
                                    banyak kuota dan fitur.
                                </p>
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {plans.map((plan) => (
                                        <PlanCard key={plan.id} plan={plan} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

function PendingPaymentBanner({
    pendingPayment,
}: {
    pendingPayment: PendingPayment;
}) {
    const [cancelling, setCancelling] = useState(false);

    function handleCancel() {
        setCancelling(true);
        router.post(
            EmployerBillingCancelController({ payment: pendingPayment.id }).url,
            {},
            { onFinish: () => setCancelling(false) },
        );
    }

    return (
        <Card className="border-yellow-300 bg-yellow-50/80">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-yellow-600" />
                    <div>
                        <p className="text-sm font-semibold text-yellow-800">
                            Ada pembayaran yang menunggu konfirmasi
                        </p>
                        <p className="text-sm text-yellow-700">
                            Paket{' '}
                            <span className="font-medium">
                                {pendingPayment.plan_name}
                            </span>{' '}
                            &mdash;{' '}
                            <span className="font-medium">
                                {formatRupiah(pendingPayment.amount)}
                            </span>
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-yellow-600">
                            {pendingPayment.provider_reference}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        asChild
                        size="sm"
                        className="gap-1.5 bg-yellow-600 hover:bg-yellow-700"
                    >
                        <a
                            href={pendingPayment.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="size-3.5" />
                            Lanjutkan Bayar
                        </a>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancelling}
                        onClick={handleCancel}
                        className="gap-1.5 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-900"
                    >
                        <X className="size-3.5" />
                        Batalkan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoTile({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                {label}
            </div>
            <p className="text-sm font-medium">{children}</p>
        </div>
    );
}

function QuotaTile({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | null;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <span className="text-muted-foreground">{icon}</span>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <LimitBadge value={value} />
            </div>
        </div>
    );
}

function PlanCard({ plan }: { plan: Plan }) {
    const [processing, setProcessing] = useState(false);

    function handlePurchase() {
        setProcessing(true);
        router.post(
            EmployerBillingPurchaseController(plan.id).url,
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                    {plan.duration_days
                        ? plan.duration_days % 365 === 0
                            ? `${plan.duration_days / 365} tahun`
                            : plan.duration_days % 30 === 0
                              ? `${plan.duration_days / 30} bulan`
                              : `${plan.duration_days} hari`
                        : 'Durasi fleksibel'}
                </CardDescription>
                <p className="text-2xl font-bold text-foreground">
                    {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                    <LimitRow label="Lowongan" value={plan.active_jobs_limit} />
                    <LimitRow
                        label="Recruiter"
                        value={plan.recruiter_seat_limit}
                    />
                    <LimitRow
                        label="AI screening"
                        value={plan.ai_screening_quota}
                    />
                    <LimitRow
                        label="Talent search"
                        value={plan.talent_search_quota}
                    />
                </div>
                {plan.features.length > 0 && (
                    <ul className="space-y-1.5 border-t pt-3">
                        {plan.features.map((f) => (
                            <li
                                key={f}
                                className="flex items-start gap-2 text-sm"
                            >
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                {f}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-auto pt-2">
                    {plan.price === 0 ? (
                        <Button className="w-full" variant="outline" disabled>
                            Hubungi Admin
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={handlePurchase}
                            disabled={processing}
                        >
                            {processing ? 'Memproses...' : 'Beli Paket'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function LimitRow({ label, value }: { label: string; value: number | null }) {
    const display =
        value === null || value === 0 ? '-' : value < 0 ? '∞' : String(value);
    return (
        <div className="text-sm">
            <span className="text-muted-foreground">{label}: </span>
            <span className="font-medium">{display}</span>
        </div>
    );
}
