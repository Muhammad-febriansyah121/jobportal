import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeCheck,
    BriefcaseBusiness,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    History,
    Receipt,
    ScanSearch,
    Sparkles,
    TrendingUp,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import EmployerBillingCancelController from '@/actions/App/Http/Controllers/Employer/EmployerBillingCancelController';
import EmployerBillingClaimTrialController from '@/actions/App/Http/Controllers/Employer/EmployerBillingClaimTrialController';
import EmployerBillingPurchaseController from '@/actions/App/Http/Controllers/Employer/EmployerBillingPurchaseController';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { edit as companyEdit } from '@/routes/employer/company';

type PlanFeature = {
    label: string;
    included: boolean;
};

type ActiveSubscription = {
    id: number;
    plan_id: number | null;
    plan_name: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    renews_at: string | null;
    days_total: number | null;
    days_remaining: number | null;
    active_jobs_limit: number | null;
    active_jobs_used: number;
    recruiter_seat_limit: number | null;
    ai_screening_quota: number | null;
    talent_search_quota: number | null;
    features: PlanFeature[];
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
    features: PlanFeature[];
    is_trial?: boolean;
    trial_claimable?: boolean;
};

type BillingProps = {
    activeSubscription: ActiveSubscription | null;
    pendingPayment: PendingPayment | null;
    payments: Payment[];
    plans: Plan[];
    hasCompany: boolean;
    hasClaimedTrial?: boolean;
};

function formatRupiah(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function StatusPill({ status }: { status: string }) {
    const { t } = useTranslate();

    const statusMeta: Record<
        string,
        { labelKey: string; className: string; dot: string }
    > = {
        active: {
            labelKey: 'employer.billing.status_active',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
        },
        cancelled: {
            labelKey: 'employer.billing.status_cancelled',
            className: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
        },
        expired: {
            labelKey: 'employer.billing.status_expired',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
            dot: 'bg-slate-400',
        },
        past_due: {
            labelKey: 'employer.billing.status_past_due',
            className: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500',
        },
        paid: {
            labelKey: 'employer.billing.status_paid',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
        },
        pending: {
            labelKey: 'employer.billing.status_pending',
            className: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500',
        },
        failed: {
            labelKey: 'employer.billing.status_failed',
            className: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
        },
        refunded: {
            labelKey: 'employer.billing.status_refunded',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
            dot: 'bg-slate-400',
        },
    };

    const meta = statusMeta[status];
    const label = meta ? t(meta.labelKey) : status;
    const className = meta?.className ?? 'bg-slate-100 text-slate-600 border-slate-200';
    const dot = meta?.dot ?? 'bg-slate-400';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                className,
            )}
        >
            <span className={cn('size-1.5 rounded-full', dot)} />
            {label}
        </span>
    );
}

export default function EmployerBilling({
    activeSubscription,
    pendingPayment,
    payments,
    plans,
    hasCompany,
    hasClaimedTrial = false,
}: BillingProps) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('employer.billing.title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.billing.title')}
                    description={t('employer.billing.description')}
                />

                {!hasCompany ? (
                    <Card className="border-primary-200 bg-primary-50/80">
                        <CardHeader>
                            <CardTitle>{t('employer.billing.no_company_title')}</CardTitle>
                            <CardDescription>
                                {t('employer.billing.no_company_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href={companyEdit()}>
                                    {t('employer.billing.start_onboarding')}
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
                                <SubscriptionHero
                                    subscription={activeSubscription}
                                />

                                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                                    <QuotaPanel
                                        subscription={activeSubscription}
                                    />
                                    {activeSubscription.features.length > 0 && (
                                        <FeaturesPanel
                                            features={activeSubscription.features}
                                        />
                                    )}
                                </div>

                                <PaymentHistoryPanel payments={payments} />
                            </>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                                        <Sparkles className="size-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold">
                                            {t('employer.billing.no_active_plan_title')}
                                        </p>
                                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                            {t('employer.billing.no_active_plan_desc')}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {plans.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {activeSubscription
                                            ? t('employer.billing.upgrade_plan')
                                            : t('employer.billing.choose_plan')}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {activeSubscription
                                            ? t('employer.billing.upgrade_plan_desc')
                                            : t('employer.billing.choose_plan_desc')}
                                    </p>
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {plans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            isCurrent={
                                                activeSubscription?.plan_id ===
                                                plan.id
                                            }
                                            hasClaimedTrial={hasClaimedTrial}
                                        />
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

function SubscriptionHero({
    subscription,
}: {
    subscription: ActiveSubscription;
}) {
    const { t } = useTranslate();
    const total = subscription.days_total ?? 0;
    const remaining = subscription.days_remaining ?? 0;
    const used = Math.max(0, total - remaining);
    const progress =
        total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

    const remainingTone =
        remaining <= 7
            ? 'text-red-600'
            : remaining <= 30
              ? 'text-amber-600'
              : 'text-emerald-600';

    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary-500/95 via-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/20">
            <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <BadgeCheck className="size-5" />
                            <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">
                                {t('employer.billing.active_plan_label')}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold md:text-4xl">
                                {subscription.plan_name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-90">
                                <StatusPill status={subscription.status} />
                                {subscription.starts_at && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Calendar className="size-3.5" />
                                        {t('employer.billing.starts_at')} {subscription.starts_at}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/15 p-5 backdrop-blur-sm lg:min-w-[280px]">
                        <div className="flex items-center justify-between text-sm">
                            <span className="opacity-80">{t('employer.billing.days_remaining_label')}</span>
                            <span className="font-semibold">
                                {subscription.days_remaining !== null
                                    ? `${subscription.days_remaining} ${t('employer.billing.days')}`
                                    : '-'}
                            </span>
                        </div>
                        {total > 0 && (
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all"
                                    style={{ width: `${100 - progress}%` }}
                                />
                            </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs opacity-80">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="size-3" />
                                {t('employer.billing.expires')}
                            </span>
                            <span className="font-medium">
                                {subscription.ends_at ?? '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="bg-white p-1">
                <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
                    <HeroStatTile
                        icon={<TrendingUp className="size-4" />}
                        label={t('employer.billing.days_remaining_stat')}
                        value={
                            subscription.days_remaining !== null
                                ? `${subscription.days_remaining}`
                                : '-'
                        }
                        valueClassName={remainingTone}
                    />
                    <HeroStatTile
                        icon={<BriefcaseBusiness className="size-4" />}
                        label={t('employer.billing.jobs_used')}
                        value={`${subscription.active_jobs_used}${
                            subscription.active_jobs_limit &&
                            subscription.active_jobs_limit > 0
                                ? ` / ${subscription.active_jobs_limit}`
                                : ''
                        }`}
                    />
                    <HeroStatTile
                        icon={<Calendar className="size-4" />}
                        label={t('employer.billing.renewal')}
                        value={subscription.renews_at ?? '-'}
                    />
                </div>
            </div>
        </Card>
    );
}

function HeroStatTile({
    icon,
    label,
    value,
    valueClassName,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-center gap-3 bg-white px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                {icon}
            </span>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                    className={cn(
                        'text-base font-semibold text-foreground',
                        valueClassName,
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function QuotaPanel({ subscription }: { subscription: ActiveSubscription }) {
    const { t } = useTranslate();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4 text-primary-600" />
                    {t('employer.billing.quota_title')}
                </CardTitle>
                <CardDescription>
                    {t('employer.billing.quota_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <QuotaRow
                    icon={<BriefcaseBusiness className="size-4" />}
                    label={t('employer.billing.active_jobs')}
                    used={subscription.active_jobs_used}
                    limit={subscription.active_jobs_limit}
                />
                <QuotaRow
                    icon={<Users className="size-4" />}
                    label={t('employer.billing.recruiter_seats')}
                    used={null}
                    limit={subscription.recruiter_seat_limit}
                />
                <QuotaRow
                    icon={<ScanSearch className="size-4" />}
                    label={t('employer.billing.talent_search')}
                    used={null}
                    limit={subscription.talent_search_quota}
                />
                {subscription.ai_screening_quota !== null && (
                    <QuotaRow
                        icon={<Sparkles className="size-4" />}
                        label={t('employer.billing.ai_screening')}
                        used={null}
                        limit={subscription.ai_screening_quota}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function QuotaRow({
    icon,
    label,
    used,
    limit,
}: {
    icon: React.ReactNode;
    label: string;
    used: number | null;
    limit: number | null;
}) {
    const { t } = useTranslate();

    if (limit === null || limit === 0) {
        return (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed bg-muted/20 p-3 text-sm">
                <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        {icon}
                    </span>
                    <span className="font-medium">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {t('employer.billing.not_available')}
                </span>
            </div>
        );
    }

    if (limit < 0) {
        return (
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-emerald-50/50 p-3 text-sm">
                <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                        {icon}
                    </span>
                    <span className="font-medium">{label}</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                    {t('employer.billing.unlimited')}
                </span>
            </div>
        );
    }

    const usedValue = used ?? 0;
    const percent = Math.min(100, Math.max(0, (usedValue / limit) * 100));
    const tone =
        percent >= 90
            ? { bar: 'bg-red-500', text: 'text-red-700' }
            : percent >= 70
              ? { bar: 'bg-amber-500', text: 'text-amber-700' }
              : { bar: 'bg-emerald-500', text: 'text-emerald-700' };

    return (
        <div className="space-y-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                        {icon}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="text-sm">
                    {used !== null ? (
                        <>
                            <span className={cn('font-bold', tone.text)}>
                                {usedValue}
                            </span>
                            <span className="text-muted-foreground">
                                {' '}
                                / {limit}
                            </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            {t('employer.billing.max')} {limit}
                        </span>
                    )}
                </div>
            </div>
            {used !== null && (
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={cn('h-full rounded-full', tone.bar)}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function FeaturesPanel({ features }: { features: PlanFeature[] }) {
    const { t } = useTranslate();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-violet-600" />
                    {t('employer.billing.features_title')}
                </CardTitle>
                <CardDescription>
                    {t('employer.billing.features_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2.5">
                    {features.map((f) => (
                        <li
                            key={f.label}
                            className="flex items-start gap-2.5 text-sm"
                        >
                            {f.included ? (
                                <>
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                    <span>{f.label}</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="mt-0.5 size-4 shrink-0 text-slate-300" />
                                    <span className="text-muted-foreground line-through">
                                        {f.label}
                                    </span>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function PaymentHistoryPanel({ payments }: { payments: Payment[] }) {
    const { t } = useTranslate();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <History className="size-4 text-blue-600" />
                    {t('employer.billing.payment_history_title')}
                </CardTitle>
                <CardDescription>
                    {t('employer.billing.payment_history_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className={payments.length > 0 ? 'p-0' : ''}>
                {payments.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Receipt className="size-5" />
                        </div>
                        <p className="text-sm font-medium">
                            {t('employer.billing.no_payments')}
                        </p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                            {t('employer.billing.no_payments_desc')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden">
                            <ul className="divide-y">
                                {payments.map((payment) => (
                                    <li
                                        key={payment.id}
                                        className="space-y-2 px-4 py-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-semibold">
                                                {formatRupiah(payment.amount)}
                                            </span>
                                            <StatusPill status={payment.status} />
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                            <span className="capitalize">
                                                {payment.provider}
                                            </span>
                                            <span>{payment.paid_at}</span>
                                        </div>
                                        <p className="font-mono text-[11px] text-muted-foreground">
                                            {payment.provider_reference}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('employer.billing.col_amount')}</TableHead>
                                        <TableHead>{t('employer.billing.col_status')}</TableHead>
                                        <TableHead>{t('employer.billing.col_provider')}</TableHead>
                                        <TableHead>{t('employer.billing.col_reference')}</TableHead>
                                        <TableHead className="text-right">
                                            {t('employer.billing.col_date')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-semibold">
                                                {formatRupiah(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusPill
                                                    status={payment.status}
                                                />
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {payment.provider}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {payment.provider_reference}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {payment.paid_at}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function PendingPaymentBanner({
    pendingPayment,
}: {
    pendingPayment: PendingPayment;
}) {
    const { t } = useTranslate();
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
        <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">
                            {t('employer.billing.pending_payment_title')}
                        </p>
                        <p className="text-sm text-amber-800">
                            {t('employer.billing.pending_payment_plan')}{' '}
                            <span className="font-medium">
                                {pendingPayment.plan_name}
                            </span>{' '}
                            &mdash;{' '}
                            <span className="font-medium">
                                {formatRupiah(pendingPayment.amount)}
                            </span>
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-amber-700">
                            {pendingPayment.provider_reference}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        asChild
                        size="sm"
                        className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                    >
                        <a
                            href={pendingPayment.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="size-3.5" />
                            {t('employer.billing.continue_payment')}
                        </a>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancelling}
                        onClick={handleCancel}
                        className="gap-1.5 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    >
                        <X className="size-3.5" />
                        {t('employer.billing.cancel_payment')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const POPULAR_SLUG = 'medium';

function PlanCard({
    plan,
    isCurrent,
    hasClaimedTrial,
}: {
    plan: Plan;
    isCurrent: boolean;
    hasClaimedTrial: boolean;
}) {
    const { t } = useTranslate();
    const [processing, setProcessing] = useState(false);
    const isPopular = plan.slug === POPULAR_SLUG;
    const isTrial = Boolean(plan.is_trial);
    const trialClaimable = Boolean(plan.trial_claimable);
    const isEnterprise = plan.slug === 'enterprise';

    function handlePurchase() {
        setProcessing(true);
        router.post(
            EmployerBillingPurchaseController(plan.id).url,
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    function handleClaimTrial() {
        setProcessing(true);
        router.post(
            EmployerBillingClaimTrialController(plan.id).url,
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    const duration = plan.duration_days
        ? plan.duration_days % 365 === 0
            ? t('employer.billing.duration_year', { count: plan.duration_days / 365 })
            : plan.duration_days % 30 === 0
              ? t('employer.billing.duration_month', { count: plan.duration_days / 30 })
              : t('employer.billing.duration_days', { count: plan.duration_days })
        : t('employer.billing.duration_flexible');

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-2xl border bg-card transition-all',
                isCurrent
                    ? 'border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-200'
                    : isPopular
                      ? 'border-primary-400 shadow-lg shadow-primary-500/10'
                      : 'border-border shadow-sm hover:shadow-md',
            )}
        >
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className="border-0 bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                        <BadgeCheck className="size-3" />
                        {t('employer.billing.my_plan')}
                    </Badge>
                </div>
            )}
            {!isCurrent && isPopular && !isTrial && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className="border-0 bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow">
                        <Sparkles className="size-3" />
                        {t('employer.billing.most_popular')}
                    </Badge>
                </div>
            )}
            {!isCurrent && isTrial && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className="border-0 bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
                        <Sparkles className="size-3" />
                        {t('employer.billing.trial_badge')}
                    </Badge>
                </div>
            )}

            <div
                className={cn(
                    'rounded-t-2xl px-5 pt-6 pb-5',
                    isCurrent
                        ? 'bg-emerald-50/60'
                        : isPopular
                          ? 'bg-primary-50/60'
                          : 'bg-muted/30',
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        {plan.name}
                    </p>
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            isCurrent
                                ? 'bg-emerald-100 text-emerald-700'
                                : isPopular
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {duration}
                    </span>
                </div>
                <p
                    className={cn(
                        'mt-3 text-3xl font-extrabold',
                        isCurrent
                            ? 'text-emerald-700'
                            : isPopular
                              ? 'text-primary-700'
                              : 'text-foreground',
                    )}
                >
                    {isEnterprise
                        ? t('employer.billing.custom_price')
                        : plan.price === 0
                          ? t('employer.billing.free')
                          : formatRupiah(plan.price)}
                </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex flex-wrap gap-2">
                    <LimitPill
                        label={t('employer.billing.jobs_label')}
                        value={plan.active_jobs_limit}
                        icon={<BriefcaseBusiness className="size-3" />}
                    />
                    <LimitPill
                        label={t('employer.billing.recruiter_label')}
                        value={plan.recruiter_seat_limit}
                        icon={<Users className="size-3" />}
                    />
                    <LimitPill
                        label={t('employer.billing.talent_search_label')}
                        value={plan.talent_search_quota}
                        icon={<ScanSearch className="size-3" />}
                    />
                </div>

                {plan.features.length > 0 && (
                    <ul className="space-y-2 border-t pt-4">
                        {plan.features.map((f) => (
                            <li
                                key={f.label}
                                className="flex items-center gap-2 text-sm"
                            >
                                {f.included ? (
                                    <>
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                        <span>{f.label}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="size-4 shrink-0 text-muted-foreground/40" />
                                        <span className="text-muted-foreground/60 line-through">
                                            {f.label}
                                        </span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto pt-2">
                    {isCurrent ? (
                        <Button
                            className="w-full gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            variant="outline"
                            disabled
                        >
                            <CheckCircle2 className="size-4" />
                            {t('employer.billing.currently_active')}
                        </Button>
                    ) : isTrial ? (
                        trialClaimable ? (
                            <Button
                                className="w-full gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                                onClick={handleClaimTrial}
                                disabled={processing}
                            >
                                {processing ? (
                                    t('employer.billing.processing')
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        {t('employer.billing.try_free')}
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button className="w-full" variant="outline" disabled>
                                {hasClaimedTrial
                                    ? t('employer.billing.trial_claimed')
                                    : t('employer.billing.trial_unavailable')}
                            </Button>
                        )
                    ) : plan.price === 0 ? (
                        <Button className="w-full" variant="outline" disabled>
                            {t('employer.billing.contact_admin')}
                        </Button>
                    ) : (
                        <Button
                            className={cn(
                                'w-full gap-1.5',
                                isPopular
                                    ? ''
                                    : 'bg-foreground text-background hover:bg-foreground/90',
                            )}
                            onClick={handlePurchase}
                            disabled={processing}
                        >
                            {processing ? (
                                t('employer.billing.processing')
                            ) : (
                                <>
                                    <CreditCard className="size-4" />
                                    {t('employer.billing.buy_plan')}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LimitPill({
    label,
    value,
    icon,
}: {
    label: string;
    value: number | null;
    icon: React.ReactNode;
}) {
    const display =
        value === null || value === 0 ? '-' : value < 0 ? '∞' : String(value);

    return (
        <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {icon}
            <span className="font-semibold text-foreground">{display}</span>
            <span>{label}</span>
        </div>
    );
}
