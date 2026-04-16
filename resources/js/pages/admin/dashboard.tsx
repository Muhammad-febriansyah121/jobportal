import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    BriefcaseBusiness,
    Building2,
    ClipboardList,
    FileCheck2,
    Users,
    WalletCards,
} from 'lucide-react';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index as adminCompanies } from '@/routes/admin/companies';
import { index as adminJobs } from '@/routes/admin/jobs';
import { index as adminReports } from '@/routes/admin/reports';
import { index as adminUsers } from '@/routes/admin/users';

type Metrics = {
    total_users: number;
    total_candidates: number;
    total_companies: number;
    total_mentors: number;
    active_jobs: number;
    total_applications: number;
    pending_company_verifications: number;
    pending_reports: number;
    active_subscriptions: number;
    ai_usage: {
        total: number;
        failed: number;
        success: number;
    };
};

type DashboardProps = {
    metrics: Metrics;
    aiUsageByFeature: Array<{ feature: string; total: number }>;
    recentActivity: Array<{
        id: number;
        actor: string;
        action: string;
        subject: string;
        created_at: string;
    }>;
};

export default function AdminDashboard({ metrics, aiUsageByFeature, recentActivity }: DashboardProps) {
    const metricCards = [
        { label: 'Total user', value: metrics.total_users, icon: Users, href: adminUsers() },
        { label: 'Kandidat', value: metrics.total_candidates, icon: Users, href: adminUsers({ query: { role: 'candidate' } }) },
        { label: 'Perusahaan', value: metrics.total_companies, icon: Building2, href: adminCompanies() },
        { label: 'Mentor', value: metrics.total_mentors, icon: Users, href: adminUsers({ query: { role: 'mentor' } }) },
        { label: 'Lowongan aktif', value: metrics.active_jobs, icon: BriefcaseBusiness, href: adminJobs({ query: { status: 'published' } }) },
        { label: 'Lamaran', value: metrics.total_applications, icon: ClipboardList },
        { label: 'Verifikasi pending', value: metrics.pending_company_verifications, icon: FileCheck2 },
        { label: 'Report pending', value: metrics.pending_reports, icon: AlertTriangle, href: adminReports({ query: { status: 'open' } }) },
        { label: 'Subscription aktif', value: metrics.active_subscriptions, icon: WalletCards },
        { label: 'AI usage', value: metrics.ai_usage.total, icon: Bot },
    ];

    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex flex-col gap-6 p-6">
                <div className="border-b pb-5">
                    <h1 className="text-2xl font-semibold tracking-normal">Dashboard Admin</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ringkasan operasional Karivia, trust, moderasi, subscription, dan audit AI.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {metricCards.map((metric) => (
                        <div className="rounded-md border bg-background p-4" key={metric.label}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <metric.icon className="size-5 text-[#ED6A2F]" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold">{metric.value.toLocaleString('id-ID')}</p>
                            {metric.href && (
                                <Button asChild variant="outline" size="sm" className="mt-4">
                                    <Link href={metric.href}>Lihat Detail</Link>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">AI usage summary</h2>
                            <Badge variant={metrics.ai_usage.failed > 0 ? 'destructive' : 'outline'}>
                                {metrics.ai_usage.failed.toLocaleString('id-ID')} failed
                            </Badge>
                        </div>
                        <div className="space-y-3 rounded-md border bg-background p-4">
                            {aiUsageByFeature.length ? (
                                aiUsageByFeature.map((item) => (
                                    <div className="grid gap-2" key={item.feature}>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span>{item.feature}</span>
                                            <span className="font-medium">{item.total.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-[#ED6A2F]"
                                                style={{ width: `${Math.min(item.total, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada audit AI.</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Platform activity terbaru</h2>
                        <AdminDataTable
                            columns={[
                                { key: 'actor', label: 'Actor' },
                                { key: 'action', label: 'Action' },
                                { key: 'subject', label: 'Subject' },
                                { key: 'created_at', label: 'Waktu' },
                            ]}
                            rows={recentActivity}
                            emptyState="Belum ada activity."
                        />
                    </section>
                </div>
            </div>
        </>
    );
}
