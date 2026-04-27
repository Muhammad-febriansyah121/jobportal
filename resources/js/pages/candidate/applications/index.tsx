import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { index, show, withdraw } from '@/routes/candidate/applications';
import type { AdminPaginatedRows } from '@/types';

type Application = {
    id: number;
    job_title?: string | null;
    job_slug?: string | null;
    company?: string | null;
    status: string;
    status_label: string;
    applied_at?: string | null;
    updated_at?: string | null;
};

type ApplicationsIndexProps = {
    filters: {
        status?: string;
    };
    applications: {
        data: Application[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

const STATUS_TONES: Record<
    string,
    'danger' | 'neutral' | 'success' | 'warning'
> = {
    applied: 'neutral',
    screened: 'neutral',
    shortlisted: 'warning',
    interview: 'warning',
    offer: 'success',
    hired: 'success',
    rejected: 'danger',
    withdrawn: 'neutral',
};

const TERMINAL_STATUSES = ['hired', 'rejected', 'withdrawn'];

export default function CandidateApplicationsIndex({
    filters,
    applications,
}: ApplicationsIndexProps) {
    const { t } = useTranslate();

    const COLUMNS = useMemo(
        () => [
            {
                key: 'job_title',
                label: t('candidate.applications.col_position'),
            },
            { key: 'company', label: t('candidate.applications.col_company') },
            { key: 'status', label: t('candidate.applications.col_status') },
            {
                key: 'applied_at',
                label: t('candidate.applications.col_applied_at'),
            },
            {
                key: 'updated_at',
                label: t('candidate.applications.col_updated_at'),
            },
        ],
        [t],
    );

    const toRows = (apps: Application[]): AdminPaginatedRows['data'] =>
        apps.map((app) => ({
            id: app.id,
            job_title: app.job_title ?? '-',
            company: app.company ?? '-',
            status: {
                label: app.status_label,
                tone: STATUS_TONES[app.status] ?? 'neutral',
            },
            applied_at: app.applied_at ?? '-',
            updated_at: app.updated_at ?? '-',
            actions: [
                {
                    label: t('candidate.applications.action_detail'),
                    href: show(app.id).url,
                    icon: 'eye',
                    method: 'get' as const,
                },
                ...(!TERMINAL_STATUSES.includes(app.status)
                    ? [
                          {
                              label: t(
                                  'candidate.applications.action_withdraw',
                              ),
                              href: withdraw(app.id).url,
                              icon: 'x',
                              method: 'patch' as const,
                              variant: 'destructive' as const,
                              confirmTitle: t(
                                  'candidate.applications.confirm_withdraw_title',
                              ),
                              confirmDescription: t(
                                  'candidate.applications.confirm_withdraw_description',
                              ),
                          },
                      ]
                    : []),
            ],
        }));

    const rows: AdminPaginatedRows = {
        data: toRows(applications.data),
        links: applications.links,
    };

    return (
        <>
            <Head title={t('candidate.applications.title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.applications.title')}
                    description={t('candidate.applications.subtitle')}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('candidate.applications.filter_status_title')}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'candidate.applications.filter_status_description',
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex flex-col gap-3 md:flex-row"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                router.get(
                                    index(),
                                    {
                                        status:
                                            formData
                                                .get('status')
                                                ?.toString() ?? '',
                                    },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                        >
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:max-w-64"
                            >
                                <option value="">
                                    {t('candidate.applications.status_all')}
                                </option>
                                <option value="applied">
                                    {t('candidate.applications.status_applied')}
                                </option>
                                <option value="screened">
                                    {t(
                                        'candidate.applications.status_screened',
                                    )}
                                </option>
                                <option value="shortlisted">
                                    {t(
                                        'candidate.applications.status_shortlisted',
                                    )}
                                </option>
                                <option value="interview">
                                    {t(
                                        'candidate.applications.status_interview',
                                    )}
                                </option>
                                <option value="offer">
                                    {t('candidate.applications.status_offer')}
                                </option>
                                <option value="hired">
                                    {t('candidate.applications.status_hired')}
                                </option>
                                <option value="rejected">
                                    {t(
                                        'candidate.applications.status_rejected',
                                    )}
                                </option>
                                <option value="withdrawn">
                                    {t(
                                        'candidate.applications.status_withdrawn',
                                    )}
                                </option>
                            </select>
                            <Button type="submit" variant="outline">
                                {t('candidate.applications.btn_apply')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AdminDataTable
                    columns={COLUMNS}
                    rows={rows}
                    emptyState={t('candidate.applications.empty')}
                />
            </div>
        </>
    );
}

CandidateApplicationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Lamaran Saya',
            href: index(),
        },
    ],
};
