import { Head, Link, router } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import { CalendarClock, CheckIcon, Coins, Info, ReceiptText, Sparkles, Wallet } from 'lucide-react';
import type { ComponentType } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as cvBuilderIndex } from '@/routes/candidate/cvs';
import { claimTrial as claimTrialPricing, purchase as purchasePricing } from '@/routes/candidate/pricing';

type CandidatePricingMenu = {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    price_label: string;
    ai_token_amount: number;
    cv_builder_quota: number;
    ai_interview_quota?: number;
    validity_days?: number;
    features: string[];
    is_default_free: boolean;
    is_trial?: boolean;
    trial_claimable?: boolean;
};

type CandidateWallet = {
    ai_token_balance: number;
    cv_builder_quota_balance: number;
    ai_interview_quota_balance: number;
    ai_interview_quota_expires_at: string | null;
    cv_builder_quota_expires_at: string | null;
    draft_token_cost: number;
    draft_quota_cost: number;
};

type CandidatePricingPageProps = {
    wallet: CandidateWallet;
    menus: CandidatePricingMenu[];
    hasClaimedTrial?: boolean;
    pendingTopup?: {
        id: number;
        order_id: string;
        amount: number;
        check_action: string;
        payment_url?: string | null;
        created_at?: string | null;
    } | null;
    recentTransactions: Array<{
        id: number;
        source: string;
        type: string;
        ai_token_delta: number;
        cv_builder_quota_delta: number;
        amount: number;
        status: string;
        created_at?: string | null;
    }>;
};

export default function CandidatePricing({
    wallet,
    menus,
    hasClaimedTrial = false,
    pendingTopup,
    recentTransactions,
}: CandidatePricingPageProps) {
    const { t } = useTranslate();
    const buyMenu = (menuId: number) => {
        router.post(purchasePricing(menuId).url);
    };
    const claimTrial = (menuId: number) => {
        router.post(claimTrialPricing(menuId).url, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('candidate.pricing.page_title')} />

            <div className="space-y-8 p-4 md:p-6">
                <Heading
                    title={t('candidate.pricing.page_title')}
                    description={t('candidate.pricing.page_description')}
                />

                {/* Wallet balance */}
                <Card className="border-[#d6e0f5] bg-[#eff4ff]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="size-4 text-[#01296A]" />
                            {t('candidate.pricing.current_balance')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Metric
                                icon={Sparkles}
                                label={t('candidate.pricing.cv_builder_quota')}
                                value={wallet.cv_builder_quota_balance.toLocaleString(
                                    'id-ID',
                                )}
                            />
                            <Metric
                                icon={ReceiptText}
                                label={t('candidate.pricing.cost_per_draft')}
                                value={t('candidate.pricing.cost_per_draft_quota_only', { quota: wallet.draft_quota_cost })}
                            />
                        </div>

                        {(wallet.ai_interview_quota_expires_at || wallet.cv_builder_quota_expires_at) ? (
                            <ExpiryAlert
                                cvExpiresAt={wallet.cv_builder_quota_expires_at}
                                interviewExpiresAt={wallet.ai_interview_quota_expires_at}
                            />
                        ) : null}

                        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                            <Info className="mt-0.5 size-3.5 shrink-0" />
                            <span>{t('candidate.pricing.topup_accumulative_note')}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending payment */}
                {pendingTopup?.payment_url ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('candidate.pricing.pending_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {t('candidate.pricing.order_created', { order: pendingTopup.order_id, time: pendingTopup.created_at ?? '-' })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <a
                                        href={pendingTopup.payment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t('candidate.pricing.continue_payment')}
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.post(
                                            pendingTopup.check_action,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    {t('candidate.pricing.check_payment_status')}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={cvBuilderIndex()}>
                                        {t('candidate.pricing.back_to_cv_builder')}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Plan cards */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">{t('candidate.pricing.plans_title')}</h2>
                    <div className="grid gap-5 lg:grid-cols-3">
                        {menus.map((menu) => {
                            const isPopular =
                                !menu.is_default_free &&
                                menu.ai_token_amount === 5000;

                            return (
                                <div
                                    key={menu.id}
                                    className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                                        isPopular
                                            ? 'border-[#01296A] bg-[#01296A] text-white shadow-xl shadow-[#01296A]/20'
                                            : 'border-border bg-white shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#01296A] shadow-sm">
                                                {t('candidate.pricing.most_popular')}
                                            </span>
                                        </div>
                                    )}

                                    {menu.is_default_free && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                                                {t('candidate.pricing.free')}
                                            </span>
                                        </div>
                                    )}

                                    {menu.is_trial && !menu.is_default_free && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                                                {t('candidate.pricing.trial_badge')}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-5">
                                        <p
                                            className={`text-xs font-bold tracking-widest uppercase ${isPopular ? 'text-white/70' : 'text-muted-foreground'}`}
                                        >
                                            {menu.name}
                                        </p>
                                        <p
                                            className={`mt-3 text-3xl font-extrabold ${isPopular ? 'text-white' : 'text-foreground'}`}
                                        >
                                            {menu.price_label}
                                        </p>
                                        {menu.description && (
                                            <p
                                                className={`mt-1 text-sm ${isPopular ? 'text-white/70' : 'text-muted-foreground'}`}
                                            >
                                                {menu.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Stats pills */}
                                    <div className="mb-5 flex flex-wrap gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isPopular ? 'bg-white/15 text-white' : 'bg-muted/60 text-foreground'}`}
                                        >
                                            <Coins className="size-3.5" />
                                            {menu.ai_token_amount === 0
                                                ? t('candidate.pricing.without_ai_token')
                                                : t('candidate.pricing.ai_token_amount', { count: menu.ai_token_amount.toLocaleString('id-ID') })}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isPopular ? 'bg-white/15 text-white' : 'bg-muted/60 text-foreground'}`}
                                        >
                                            <Sparkles className="size-3.5" />
                                            {t('candidate.pricing.cv_builder_count', { count: menu.cv_builder_quota })}
                                        </span>
                                    </div>

                                    {/* Feature list */}
                                    <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                                        {menu.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2.5 text-sm"
                                            >
                                                <span
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isPopular ? 'bg-white/20 text-white' : 'bg-[#01296A]/10 text-[#01296A]'}`}
                                                >
                                                    <CheckIcon
                                                        className="size-2.5"
                                                        strokeWidth={3}
                                                    />
                                                </span>
                                                <span
                                                    className={
                                                        isPopular
                                                            ? 'text-white/90'
                                                            : 'text-foreground'
                                                    }
                                                >
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {menu.is_default_free ? (
                                        <button
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-3 text-center text-sm font-bold text-muted-foreground/60"
                                        >
                                            {t('candidate.pricing.default_plan_auto')}
                                        </button>
                                    ) : menu.is_trial ? (
                                        menu.trial_claimable ? (
                                            <button
                                                onClick={() => claimTrial(menu.id)}
                                                className="w-full rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-[0.98]"
                                            >
                                                {t('candidate.pricing.try_free')}
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="w-full cursor-not-allowed rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-3 text-center text-sm font-bold text-muted-foreground/60"
                                            >
                                                {hasClaimedTrial
                                                    ? t('candidate.pricing.trial_claimed')
                                                    : t('candidate.pricing.trial_unavailable')}
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => buyMenu(menu.id)}
                                            className={`w-full rounded-xl py-3 text-center text-sm font-bold transition-all active:scale-[0.98] ${
                                                isPopular
                                                    ? 'bg-white text-[#01296A] hover:bg-white/90'
                                                    : 'bg-[#01296A] text-white hover:bg-[#001D4D]'
                                            }`}
                                        >
                                            {t('candidate.pricing.topup_now')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Transaction history */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t('candidate.pricing.wallet_history')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTransactions.length ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-120">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('candidate.pricing.col_source')}</TableHead>
                                            <TableHead>{t('candidate.pricing.col_time')}</TableHead>
                                            <TableHead className="text-right">
                                                {t('candidate.pricing.quota')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('candidate.pricing.status')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentTransactions.map(
                                            (transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell className="font-medium">
                                                        {transaction.source}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {transaction.created_at ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {transaction.cv_builder_quota_delta >
                                                        0
                                                            ? '+'
                                                            : ''}
                                                        {
                                                            transaction.cv_builder_quota_delta
                                                        }{' '}
                                                        {t('candidate.pricing.unit.quota')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span
                                                            className={
                                                                transaction.status ===
                                                                'completed'
                                                                    ? 'font-semibold text-green-600'
                                                                    : transaction.status ===
                                                                        'pending'
                                                                      ? 'font-semibold text-secondary-600'
                                                                      : 'text-muted-foreground'
                                                            }
                                                        >
                                                            {
                                                                transaction.status
                                                            }
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t('candidate.pricing.empty_wallet_history')}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-md border bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Icon className="size-4 text-[#01296A]" />
                {label}
            </p>
            <p className="mt-2 text-base font-bold">{value}</p>
        </div>
    );
}

function ExpiryAlert({
    cvExpiresAt,
    interviewExpiresAt,
}: {
    cvExpiresAt: string | null;
    interviewExpiresAt: string | null;
}) {
    const { t } = useTranslate();
    const earliest = [cvExpiresAt, interviewExpiresAt]
        .filter((v): v is string => Boolean(v))
        .map((v) => new Date(v))
        .sort((a, b) => a.getTime() - b.getTime())[0];

    if (!earliest) return null;

    const daysLeft = Math.ceil(
        (earliest.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const formatted = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(earliest);

    const isExpired = daysLeft <= 0;
    const isWarning = daysLeft > 0 && daysLeft <= 7;
    const tone = isExpired
        ? 'border-red-200 bg-red-50 text-red-900'
        : isWarning
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900';

    return (
        <div
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${tone}`}
        >
            <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
            <span>
                {isExpired
                    ? t('candidate.pricing.expiry_expired', { date: formatted })
                    : t('candidate.pricing.expiry_active', {
                          date: formatted,
                          days: daysLeft,
                      })}
            </span>
        </div>
    );
}
