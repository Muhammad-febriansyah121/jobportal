import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import type { AdminAction } from '@/types';

type AiAuditLogDetail = {
    id: number;
    feature: string;
    user_name: string;
    user_email: string;
    model_name: string;
    status: string;
    input_hash: string;
    input_json: Record<string, unknown> | null;
    output_json: Record<string, unknown> | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    reasoning_tokens: number | null;
    total_tokens: number | null;
    created_at: string;
};

type Props = {
    log: AiAuditLogDetail;
    backHref: string;
    actions?: AdminAction[];
};

const STATUS_STYLES: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    retry_requested: 'bg-yellow-100 text-yellow-700',
    ai_unavailable: 'bg-primary-100 text-primary-700',
};

const RISK_STYLES: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
        >
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function MetaItem({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className="text-sm break-all">{children}</dd>
        </div>
    );
}

function Pill({
    label,
    color = 'neutral',
}: {
    label: string;
    color?: 'green' | 'yellow' | 'red' | 'neutral';
}) {
    const cls = {
        green: 'bg-green-100 text-green-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red: 'bg-red-100 text-red-700',
        neutral: 'bg-muted text-muted-foreground',
    }[color];

    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
        >
            {label}
        </span>
    );
}

function RawJsonToggle({ data }: { data: Record<string, unknown> }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslate();

    return (
        <div className="mt-4 border-t pt-4">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
                {open ? (
                    <ChevronUp className="size-3.5" />
                ) : (
                    <ChevronDown className="size-3.5" />
                )}
                {open ? t('admin.ai_audit_logs_show.hide_json') : t('admin.ai_audit_logs_show.show_json')}
            </button>
            {open && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/70">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ─── Input renderers ───────────────────────────────────────────────────────

function InputRiskDetection({ data }: { data: Record<string, unknown> }) {
    const { t } = useTranslate();
    const user = data.user as Record<string, unknown> | undefined;
    const window = data.window as Record<string, unknown> | undefined;
    const signals = data.signals as Record<string, unknown> | undefined;
    const activities = data.recent_activities as
        | Array<Record<string, unknown>>
        | undefined;

    return (
        <div className="flex flex-col gap-5">
            {/* User & Window */}
            <div className="grid gap-5 sm:grid-cols-2">
                {user && (
                    <div className="rounded-lg border p-4">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                            {t('admin.ai_audit_logs_show.user')}
                        </p>
                        <dl className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <dt className="text-muted-foreground">ID</dt>
                                <dd className="font-medium">
                                    #{String(user.id)}
                                </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                                <dt className="text-muted-foreground">Role</dt>
                                <dd className="font-medium capitalize">
                                    {String(user.role)}
                                </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                                <dt className="text-muted-foreground">
                                    {t('admin.ai_audit_logs_show.email_domain')}
                                </dt>
                                <dd className="font-medium">
                                    @{String(user.email_domain)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
                {window && (
                    <div className="rounded-lg border p-4">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                            {t('admin.ai_audit_logs_show.analysis_period')}
                        </p>
                        <dl className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <dt className="text-muted-foreground">
                                    {t('admin.ai_audit_logs_show.range')}
                                </dt>
                                <dd className="font-medium">
                                    {t('admin.ai_audit_logs_show.last_n_days', { n: String(window.days) })}
                                </dd>
                            </div>
                            <div className="flex justify-between text-sm">
                                <dt className="text-muted-foreground">{t('admin.ai_audit_logs_show.since')}</dt>
                                <dd className="font-medium">
                                    {new Date(
                                        String(window.since),
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>

            {/* Signals */}
            {signals && (
                <div className="rounded-lg border p-4">
                    <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                        {t('admin.ai_audit_logs_show.activity_signals')}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { key: 'apply_count', label: t('admin.ai_audit_logs_show.applications_sent') },
                            { key: 'failed_login_count', label: t('admin.ai_audit_logs_show.failed_logins') },
                            {
                                key: 'destructive_action_count',
                                label: t('admin.ai_audit_logs_show.destructive_actions'),
                            },
                            { key: 'unique_ip_count', label: t('admin.ai_audit_logs_show.unique_ips') },
                        ].map(({ key, label }) => (
                            <div
                                key={key}
                                className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center"
                            >
                                <span className="text-2xl font-bold">
                                    {String(signals[key] ?? 0)}
                                </span>
                                <span className="mt-0.5 text-xs text-muted-foreground">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                    {signals.heuristic_level !== undefined &&
                        signals.heuristic_level !== null && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                {t('admin.ai_audit_logs_show.heuristic_level')}
                            </span>
                            <Pill
                                label={String(
                                    signals.heuristic_level,
                                ).toUpperCase()}
                                color={
                                    (
                                        {
                                            low: 'green',
                                            medium: 'yellow',
                                            high: 'red',
                                        } as const
                                    )[String(signals.heuristic_level)] ??
                                    'neutral'
                                }
                            />
                        </div>
                        )}
                </div>
            )}

            {/* Recent activities */}
            {activities && activities.length > 0 && (
                <div className="rounded-lg border">
                    <p className="border-b px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                        {t('admin.ai_audit_logs_show.recent_activity', { n: String(activities.length) })}
                    </p>
                    <div className="divide-y">
                        {activities.map((a, i) => (
                            <div
                                key={i}
                                className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
                            >
                                <div>
                                    <span className="font-medium">
                                        {String(a.action).replace(/_/g, ' ')}
                                    </span>
                                    {a.subject !== undefined &&
                                        a.subject !== null && (
                                        <span className="ml-1.5 text-xs text-muted-foreground">
                                            → {String(a.subject)}
                                        </span>
                                        )}
                                    {a.ip !== undefined && a.ip !== null && (
                                        <span className="ml-1.5 text-xs text-muted-foreground">
                                            IP: {String(a.ip)}
                                        </span>
                                    )}
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {a.created_at
                                        ? new Date(
                                              String(a.created_at),
                                          ).toLocaleString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activities && activities.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                    {t('admin.ai_audit_logs_show.no_activity')}
                </p>
            )}

            <RawJsonToggle data={data} />
        </div>
    );
}

function InputGeneric({ data }: { data: Record<string, unknown> }) {
    const entries = Object.entries(data);

    return (
        <div className="flex flex-col gap-3">
            <div className="divide-y rounded-lg border">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex gap-4 px-4 py-3 text-sm">
                        <dt className="w-40 shrink-0 text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="font-medium wrap-break-word">
                            {typeof val === 'object' ? (
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                    {JSON.stringify(val)}
                                </code>
                            ) : (
                                String(val)
                            )}
                        </dd>
                    </div>
                ))}
            </div>
            <RawJsonToggle data={data} />
        </div>
    );
}

// ─── Output renderers ──────────────────────────────────────────────────────

function OutputRiskDetection({ data }: { data: Record<string, unknown> }) {
    const { t } = useTranslate();
    const riskLevel = String(data.risk_level ?? 'unknown');
    const riskScore = Number(data.risk_score ?? 0);
    const reasons = (data.reasons as string[] | undefined) ?? [];
    const actions = (data.recommended_actions as string[] | undefined) ?? [];
    const riskStyle =
        RISK_STYLES[riskLevel] ?? 'bg-muted text-muted-foreground';
    const barColor =
        { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' }[
            riskLevel
        ] ?? 'bg-muted';

    return (
        <div className="flex flex-col gap-5">
            {/* Risk score */}
            <div className="rounded-lg border p-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Risk Score</p>
                    <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${riskStyle}`}
                    >
                        {riskLevel.toUpperCase()}
                    </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${barColor}`}
                        style={{ width: `${riskScore}%` }}
                    />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="font-semibold text-foreground">
                        {riskScore} / 100
                    </span>
                    <span>100</span>
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                {/* Reasons */}
                {reasons.length > 0 && (
                    <div className="rounded-lg border p-4">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                            {t('admin.ai_audit_logs_show.reasons')}
                        </p>
                        <ul className="flex flex-col gap-2">
                            {reasons.map((r, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="mt-0.5 shrink-0 text-primary-500">
                                        •
                                    </span>
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommended actions */}
                {actions.length > 0 && (
                    <div className="rounded-lg border p-4">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                            {t('admin.ai_audit_logs_show.recommended_actions')}
                        </p>
                        <ul className="flex flex-col gap-2">
                            {actions.map((a, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="mt-0.5 shrink-0 text-blue-500">
                                        →
                                    </span>
                                    {a}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer meta */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {data.confidence !== undefined && data.confidence !== null && (
                    <span>
                        {t('admin.ai_audit_logs_show.confidence')}{' '}
                        <strong className="text-foreground">
                            {String(data.confidence)}
                        </strong>
                    </span>
                )}
                {data.analysis_source !== undefined &&
                    data.analysis_source !== null && (
                    <span>
                        {t('admin.ai_audit_logs_show.source')}{' '}
                        <strong className="text-foreground">
                            {String(data.analysis_source)}
                        </strong>
                    </span>
                    )}
                {data.generated_at !== undefined &&
                    data.generated_at !== null && (
                    <span>
                        {t('admin.ai_audit_logs_show.generated_at')}{' '}
                        <strong className="text-foreground">
                            {new Date(String(data.generated_at)).toLocaleString(
                                'id-ID',
                            )}
                        </strong>
                    </span>
                    )}
            </div>

            <RawJsonToggle data={data} />
        </div>
    );
}

function OutputSummary({ data }: { data: Record<string, unknown> }) {
    const { t } = useTranslate();

    return (
        <div className="flex flex-col gap-4">
            {data.summary !== undefined && data.summary !== null && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                    <p className="mb-1 text-xs font-semibold text-primary-600 uppercase">
                        {t('admin.ai_audit_logs_show.summary')}
                    </p>
                    <p className="text-sm leading-relaxed text-primary-900">
                        {String(data.summary)}
                    </p>
                </div>
            )}
            {data.generated_at !== undefined && data.generated_at !== null && (
                <p className="text-xs text-muted-foreground">
                    {t('admin.ai_audit_logs_show.generated_at')}{' '}
                    {new Date(String(data.generated_at)).toLocaleString(
                        'id-ID',
                    )}
                </p>
            )}
            <RawJsonToggle data={data} />
        </div>
    );
}

function OutputGeneric({ data }: { data: Record<string, unknown> }) {
    const entries = Object.entries(data);

    return (
        <div className="flex flex-col gap-3">
            <div className="divide-y rounded-lg border">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex gap-4 px-4 py-3 text-sm">
                        <dt className="w-40 shrink-0 text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="font-medium wrap-break-word">
                            {Array.isArray(val) ? (
                                <ul className="list-disc pl-4">
                                    {(val as unknown[]).map((item, i) => (
                                        <li key={i}>{String(item)}</li>
                                    ))}
                                </ul>
                            ) : typeof val === 'object' ? (
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                    {JSON.stringify(val)}
                                </code>
                            ) : (
                                String(val)
                            )}
                        </dd>
                    </div>
                ))}
            </div>
            <RawJsonToggle data={data} />
        </div>
    );
}

// ─── Smart JSON card ───────────────────────────────────────────────────────

function JsonCard({
    label,
    data,
    feature,
    type,
}: {
    label: string;
    data: Record<string, unknown> | null;
    feature: string;
    type: 'input' | 'output';
}) {
    const { t } = useTranslate();

    if (!data) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm italic text-muted-foreground">{t('admin.ai_audit_logs_show.no_data')}</p>
                </CardContent>
            </Card>
        );
    }

    const isRisk = feature.toLowerCase().includes('risk');
    const isSummary =
        feature.toLowerCase().includes('summary') ||
        feature.toLowerCase().includes('insight');

    let content: React.ReactNode;

    if (type === 'input') {
        content = isRisk ? (
            <InputRiskDetection data={data} />
        ) : (
            <InputGeneric data={data} />
        );
    } else {
        if (isRisk) {
content = <OutputRiskDetection data={data} />;
} else if (isSummary) {
content = <OutputSummary data={data} />;
} else {
content = <OutputGeneric data={data} />;
}
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}

function TokenUsageCard({ log }: { log: AiAuditLogDetail }) {
    const hasUsage =
        log.prompt_tokens !== null ||
        log.completion_tokens !== null ||
        log.reasoning_tokens !== null ||
        log.total_tokens !== null;

    const formatNumber = (value: number | null) =>
        value === null ? '—' : value.toLocaleString('id-ID');

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Token Usage</CardTitle>
            </CardHeader>
            <CardContent>
                {hasUsage ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Prompt', value: log.prompt_tokens },
                            { label: 'Completion', value: log.completion_tokens },
                            { label: 'Reasoning', value: log.reasoning_tokens },
                            { label: 'Total', value: log.total_tokens },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex flex-col items-center rounded-lg bg-muted/50 p-3 text-center"
                            >
                                <span className="text-2xl font-bold">
                                    {formatNumber(item.value)}
                                </span>
                                <span className="mt-0.5 text-xs text-muted-foreground">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm italic text-muted-foreground">
                        Token usage tidak tercatat (cache hit, fallback, atau panggilan sebelum tracking aktif).
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function AiAuditLogShow({ log, backHref, actions }: Props) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={`AI Audit — ${log.feature}`} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={t('admin.ai_audit_logs_show.page_title')}
                    description={log.feature}
                    backHref={backHref}
                />

                {actions && actions.length > 0 && (
                    <Card>
                        <CardContent className="flex justify-end py-3">
                            <AdminActionList actions={actions} />
                        </CardContent>
                    </Card>
                )}

                {/* Metadata card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{t('admin.ai_audit_logs_show.log_info')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <MetaItem label="Feature">{log.feature}</MetaItem>
                        <MetaItem label={t('admin.ai_audit_logs_show.user')}>
                            <span className="block font-medium">
                                {log.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {log.user_email}
                            </span>
                        </MetaItem>
                        <MetaItem label="Model">{log.model_name}</MetaItem>
                        <MetaItem label="Status">
                            <StatusBadge status={log.status} />
                        </MetaItem>
                        <MetaItem label="Input Hash">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                {log.input_hash}
                            </code>
                        </MetaItem>
                        <MetaItem label={t('admin.ai_audit_logs_show.created_at')}>{log.created_at}</MetaItem>
                    </dl>
                    </CardContent>
                </Card>

                <TokenUsageCard log={log} />

                <JsonCard
                    label="Input"
                    data={log.input_json}
                    feature={log.feature}
                    type="input"
                />
                <JsonCard
                    label="Output"
                    data={log.output_json}
                    feature={log.feature}
                    type="output"
                />
            </div>
        </>
    );
}
