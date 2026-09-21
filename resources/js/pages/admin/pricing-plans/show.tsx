import { Head } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarDays,
    Check,
    Search,
    Sparkles,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import type { AdminAction } from '@/types';

type PricingPlanDetail = {
    id: number;
    name: string;
    slug: string;
    price: number;
    price_label: string;
    duration_days: number;
    duration_label: string;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_interview_quota: number;
    talent_search_quota: number;
    features: string[];
    is_active: boolean;
    subscriptions_count: number;
    created_at: string | null;
    updated_at: string | null;
};

type PricingPlanShowProps = {
    title: string;
    description?: string;
    backHref: string;
    plan: PricingPlanDetail;
    actions?: AdminAction[];
};

export default function PricingPlanShow({
    title,
    description,
    backHref,
    plan,
    actions = [],
}: PricingPlanShowProps) {
    const { t } = useTranslate();
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
                        <Badge className="bg-[#0F4C94] text-white">
                            {plan.slug}
                        </Badge>
                        <Badge
                            className={
                                plan.is_active
                                    ? 'bg-emerald-600 text-white'
                                    : ''
                            }
                            variant={plan.is_active ? 'default' : 'outline'}
                        >
                            {plan.is_active ? t('admin.pricing_plans_show.active') : t('admin.pricing_plans_show.inactive')}
                        </Badge>
                        <Badge variant="outline">
                            {plan.subscriptions_count} {t('admin.pricing_plans_show.subscription')}
                        </Badge>
                    </div>
                    <AdminActionList actions={actions} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                    <section className="rounded-lg border bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold text-[#0F4C94]">
                            {t('admin.pricing_plans_show.pricing_plan')}
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight">
                            {plan.name}
                        </h1>
                        <p className="mt-4 text-4xl font-bold tracking-tight">
                            {plan.price_label}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('admin.pricing_plans_show.price_label')}
                        </p>
                        <p className="mt-5 inline-flex rounded-md bg-[#F4F8FF] px-3 py-2 text-sm font-bold text-[#0F4C94]">
                            {plan.duration_label}
                        </p>

                        <div className="mt-6 space-y-3">
                            {plan.features.length ? (
                                plan.features.map((feature) => (
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
                                    {t('admin.pricing_plans_show.no_features')}
                                </p>
                            )}
                        </div>
                    </section>

                    <div className="space-y-6">
                        <section className="grid gap-4 md:grid-cols-2">
                            <Metric
                                icon={CalendarDays}
                                label={t('admin.pricing_plans_show.active_period')}
                                value={plan.duration_days}
                                suffix={t('admin.pricing_plans_show.days')}
                            />
                            <Metric
                                icon={BriefcaseBusiness}
                                label={t('admin.pricing_plans_show.active_jobs')}
                                value={plan.active_jobs_limit}
                            />
                            <Metric
                                icon={Users}
                                label={t('admin.pricing_plans_show.recruiter_seat')}
                                value={plan.recruiter_seat_limit}
                            />
                            <Metric
                                icon={Search}
                                label={t('admin.pricing_plans_show.talent_search')}
                                value={plan.talent_search_quota}
                            />
                            <Metric
                                icon={Sparkles}
                                label={t('admin.pricing_plans_show.ai_interview_quota')}
                                value={plan.ai_interview_quota}
                            />
                        </section>

                        <section className="rounded-lg border bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">
                                {t('admin.pricing_plans_show.brief_audit')}
                            </h2>
                            <dl className="mt-4 grid gap-4 md:grid-cols-3">
                                <Info label={t('admin.pricing_plans_show.created_at')} value={plan.created_at ?? '-'} />
                                <Info
                                    label={t('admin.pricing_plans_show.last_update')}
                                    value={plan.updated_at ?? '-'}
                                />
                                <Info
                                    label={t('admin.pricing_plans_show.active_subscription')}
                                    value={String(plan.subscriptions_count)}
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
    suffix,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    suffix?: string;
}) {
    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#F4F8FF] text-[#0F4C94]">
                <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold">
                {value}
                {suffix ? (
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                        {suffix}
                    </span>
                ) : null}
            </p>
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
