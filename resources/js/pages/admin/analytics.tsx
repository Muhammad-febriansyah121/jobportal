import { Head } from '@inertiajs/react';
import { Activity, Bot, ClipboardList, CreditCard } from 'lucide-react';

type SeriesPoint = {
    month: string;
    total: number;
};

type AnalyticsProps = {
    series: Record<string, SeriesPoint[]>;
    revenueSeries: SeriesPoint[];
    summary: {
        conversion_apply: number;
        subscription_revenue: number;
        report_pending: number;
        ai_failed: number;
    };
};

const labels: Record<string, string> = {
    users: 'Growth user',
    companies: 'Growth company',
    candidates: 'Growth candidate',
    jobs: 'Job posted',
    applications: 'Application volume',
    reports: 'Report metrics',
    aiUsage: 'AI usage metrics',
};

export default function AdminAnalytics({ series, revenueSeries, summary }: AnalyticsProps) {
    const cards = [
        { label: 'Conversion apply', value: `${summary.conversion_apply}%`, icon: Activity },
        { label: 'Subscription revenue', value: `Rp ${summary.subscription_revenue.toLocaleString('id-ID')}`, icon: CreditCard },
        { label: 'Report pending', value: summary.report_pending.toLocaleString('id-ID'), icon: ClipboardList },
        { label: 'AI failed', value: summary.ai_failed.toLocaleString('id-ID'), icon: Bot },
    ];

    return (
        <>
            <Head title="Platform Analytics" />

            <div className="flex flex-col gap-6 p-6">
                <div className="border-b pb-5">
                    <h1 className="text-2xl font-semibold tracking-normal">Platform Analytics</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Growth, conversion apply, report metrics, AI usage, dan revenue subscription.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <div className="rounded-md border bg-background p-4" key={card.label}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                <card.icon className="size-5 text-[#ED6A2F]" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    {Object.entries(series).map(([key, points]) => (
                        <SeriesPanel key={key} title={labels[key] ?? key} points={points} />
                    ))}
                    <SeriesPanel title="Subscription revenue" points={revenueSeries} currency />
                </div>
            </div>
        </>
    );
}

function SeriesPanel({ title, points, currency = false }: { title: string; points: SeriesPoint[]; currency?: boolean }) {
    const max = Math.max(1, ...points.map((point) => point.total));

    return (
        <section className="space-y-4 rounded-md border bg-background p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="space-y-3">
                {points.map((point) => (
                    <div className="grid gap-2" key={`${title}-${point.month}`}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span>{point.month}</span>
                            <span className="font-medium">
                                {currency ? `Rp ${point.total.toLocaleString('id-ID')}` : point.total.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-[#ED6A2F]" style={{ width: `${(point.total / max) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
