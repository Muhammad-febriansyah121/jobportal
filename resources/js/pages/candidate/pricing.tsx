import { Head, Link, router } from '@inertiajs/react';
import {
    CheckIcon,
    Coins,
    MinusIcon,
    ReceiptText,
    Sparkles,
    Wallet,
} from 'lucide-react';
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
import { purchase as purchasePricing } from '@/routes/candidate/pricing';

type CandidatePricingMenu = {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    price_label: string;
    ai_token_amount: number;
    cv_builder_quota: number;
    features: string[];
    is_default_free: boolean;
};

type CandidateWallet = {
    ai_token_balance: number;
    cv_builder_quota_balance: number;
    draft_token_cost: number;
    draft_quota_cost: number;
};

type CandidatePricingPageProps = {
    wallet: CandidateWallet;
    menus: CandidatePricingMenu[];
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
    pendingTopup,
    recentTransactions,
}: CandidatePricingPageProps) {
    const buyMenu = (menuId: number) => {
        router.post(purchasePricing(menuId).url);
    };

    const comparisonRows: Array<{
        label: string;
        get: (m: CandidatePricingMenu) => string | boolean | null;
    }> = [
        {
            label: 'Harga',
            get: (m) => m.price_label,
        },
        {
            label: 'Token AI',
            get: (m) =>
                m.ai_token_amount === 0
                    ? null
                    : m.ai_token_amount.toLocaleString('id-ID') + ' token',
        },
        {
            label: 'Kuota CV Builder',
            get: (m) => `${m.cv_builder_quota}x`,
        },
        {
            label: 'Template CV ATS-Friendly',
            get: (_) => true,
        },
        {
            label: 'Optimasi AI',
            get: (m) => m.ai_token_amount > 0,
        },
        {
            label: 'Regenerasi Draft',
            get: (m) => m.ai_token_amount > 0,
        },
    ];

    return (
        <>
            <Head title="Paket & Saldo" />

            <div className="space-y-8 p-4 md:p-6">
                <Heading
                    title="Paket & Saldo"
                    description="Free 1x CV Builder, selanjutnya bisa topup token AI + kuota CV Builder."
                />

                {/* Wallet balance */}
                <Card className="border-[#d6e0f5] bg-[#eff4ff]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wallet className="size-4 text-[#01296A]" />
                            Saldo Saat Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <Metric
                            icon={Coins}
                            label="Token AI"
                            value={wallet.ai_token_balance.toLocaleString(
                                'id-ID',
                            )}
                        />
                        <Metric
                            icon={Sparkles}
                            label="Kuota CV Builder"
                            value={wallet.cv_builder_quota_balance.toLocaleString(
                                'id-ID',
                            )}
                        />
                        <Metric
                            icon={ReceiptText}
                            label="Biaya per Draft"
                            value={`${wallet.draft_token_cost.toLocaleString('id-ID')} token + ${wallet.draft_quota_cost} kuota`}
                        />
                    </CardContent>
                </Card>

                {/* Pending payment */}
                {pendingTopup?.payment_url ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pembayaran Pending</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Order {pendingTopup.order_id} dibuat{' '}
                                {pendingTopup.created_at ?? '-'}.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <a
                                        href={pendingTopup.payment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Lanjutkan Pembayaran
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
                                    Cek Status Pembayaran
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={cvBuilderIndex()}>
                                        Kembali ke CV Builder
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Plan cards */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Pilih Paket</h2>
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
                                                ✦ Terpopuler
                                            </span>
                                        </div>
                                    )}

                                    {menu.is_default_free && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                                                Gratis
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
                                                ? 'Tanpa token AI'
                                                : `${menu.ai_token_amount.toLocaleString('id-ID')} Token AI`}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isPopular ? 'bg-white/15 text-white' : 'bg-muted/60 text-foreground'}`}
                                        >
                                            <Sparkles className="size-3.5" />
                                            {menu.cv_builder_quota}x CV Builder
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
                                            Paket otomatis diberikan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => buyMenu(menu.id)}
                                            className={`w-full rounded-xl py-3 text-center text-sm font-bold transition-all active:scale-[0.98] ${
                                                isPopular
                                                    ? 'bg-white text-[#01296A] hover:bg-white/90'
                                                    : 'bg-[#01296A] text-white hover:bg-[#001D4D]'
                                            }`}
                                        >
                                            Topup Sekarang
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Comparison table */}
                <div>
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-foreground">
                            Perbandingan Paket
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Bandingkan fitur setiap paket sebelum melakukan
                            topup.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-120">
                                <thead>
                                    <tr>
                                        <th className="w-44 border-b border-border px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                                            Fitur
                                        </th>
                                        {menus.map((menu) => {
                                            const isPopular =
                                                !menu.is_default_free &&
                                                menu.ai_token_amount === 5000;
                                            return (
                                                <th
                                                    key={menu.id}
                                                    className={`border-b border-border px-4 py-4 text-center ${isPopular ? 'bg-[#01296A]/5' : ''}`}
                                                >
                                                    <p
                                                        className={`text-sm font-bold ${isPopular ? 'text-[#01296A]' : 'text-foreground'}`}
                                                    >
                                                        {menu.name}
                                                    </p>
                                                    <p
                                                        className={`mt-0.5 text-xs font-medium ${isPopular ? 'text-[#01296A]/70' : 'text-muted-foreground'}`}
                                                    >
                                                        {menu.price_label}
                                                    </p>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row, i) => (
                                        <tr
                                            key={row.label}
                                            className={
                                                i % 2 === 1
                                                    ? 'bg-gray-50/60'
                                                    : 'bg-white'
                                            }
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {row.label}
                                            </td>
                                            {menus.map((menu) => {
                                                const isPopular =
                                                    !menu.is_default_free &&
                                                    menu.ai_token_amount ===
                                                        5000;
                                                const val = row.get(menu);
                                                return (
                                                    <td
                                                        key={menu.id}
                                                        className={`px-4 py-4 text-center text-sm ${isPopular ? 'bg-[#01296A]/5' : ''}`}
                                                    >
                                                        {val === true ? (
                                                            <CheckIcon
                                                                className="mx-auto size-5 text-[#01296A]"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        ) : val === false ? (
                                                            <MinusIcon className="mx-auto size-4 text-muted-foreground/30" />
                                                        ) : val === null ? (
                                                            <MinusIcon className="mx-auto size-4 text-muted-foreground/30" />
                                                        ) : (
                                                            <span
                                                                className={`font-medium ${isPopular ? 'text-[#01296A]' : 'text-foreground'}`}
                                                            >
                                                                {val as string}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* CTA row */}
                                    <tr className="border-t border-border">
                                        <td className="px-6 py-5" />
                                        {menus.map((menu) => {
                                            const isPopular =
                                                !menu.is_default_free &&
                                                menu.ai_token_amount === 5000;
                                            return (
                                                <td
                                                    key={menu.id}
                                                    className={`px-4 py-5 text-center ${isPopular ? 'bg-[#01296A]/5' : ''}`}
                                                >
                                                    {menu.is_default_free ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Otomatis
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                buyMenu(menu.id)
                                                            }
                                                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-[0.98] ${
                                                                isPopular
                                                                    ? 'bg-[#01296A] text-white hover:bg-[#001D4D]'
                                                                    : 'border border-[#01296A] text-[#01296A] hover:bg-[#01296A]/5'
                                                            }`}
                                                        >
                                                            Topup
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Transaction history */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Riwayat Wallet
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTransactions.length ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sumber</TableHead>
                                            <TableHead>Waktu</TableHead>
                                            <TableHead className="text-right">
                                                Token
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Kuota
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Status
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
                                                    <TableCell className="text-right font-semibold">
                                                        {transaction.ai_token_delta >
                                                        0
                                                            ? '+'
                                                            : ''}
                                                        {transaction.ai_token_delta.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        token
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {transaction.cv_builder_quota_delta >
                                                        0
                                                            ? '+'
                                                            : ''}
                                                        {
                                                            transaction.cv_builder_quota_delta
                                                        }{' '}
                                                        kuota
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
                                Belum ada transaksi wallet.
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
