import { Head, Link, router } from '@inertiajs/react';
import { Bookmark, BookmarkCheck, Search } from 'lucide-react';
import {
    Field,
    RupiahInput,
    Select,
} from '@/components/candidate/candidate-form';
import {
    EmptyState,
    PaginationLinks,
} from '@/components/candidate/candidate-ui';
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
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import { index, save, show, unsave } from '@/routes/candidate/jobs';

type Option = {
    value: string;
    label: string;
};

type Job = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    company?: string | null;
    company_verified: boolean;
    industry?: string | null;
    location: string;
    work_mode: string;
    work_mode_label: string;
    job_type: string;
    job_type_label: string;
    salary_range: string;
    published_at?: string | null;
    matched_skills_count?: number | null;
    ai_match_score?: number | null;
    is_saved: boolean;
    has_applied: boolean;
    skills: Array<{ id: number; name: string }>;
};

type JobsIndexProps = {
    filters: {
        tab: string;
        search?: string;
        location?: string;
        work_mode?: string;
        job_type?: string;
        experience_level?: string;
        industry_id?: string;
        salary_min?: string;
        verified_company: boolean;
        skill_match: boolean;
    };
    has_intent_data: boolean;
    industries: Option[];
    jobs: {
        data: Job[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function CandidateJobsIndex({
    filters,
    has_intent_data,
    industries,
    jobs,
}: JobsIndexProps) {
    const { t } = useTranslate();

    const tabs = [
        ['recommended', t('candidate.jobs.tabs.recommended')],
        ['all', t('candidate.jobs.tabs.all')],
        ['remote', t('candidate.jobs.tabs.remote')],
        ['salary-transparent', t('candidate.jobs.tabs.salary_transparent')],
    ] as const;

    return (
        <>
            <Head title={t('candidate.jobs.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.jobs.page_title')}
                    description={t('candidate.jobs.page_description')}
                />

                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(([tab, label]) => (
                            <Button
                                asChild
                                key={tab}
                                variant={
                                    filters.tab === tab ? 'default' : 'outline'
                                }
                                size="sm"
                            >
                                <Link href={index({ query: { tab } })}>
                                    {label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                    {filters.tab === 'recommended' && has_intent_data && (
                        <p className="text-xs text-muted-foreground">
                            {t('candidate.jobs.intent_hint')}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('candidate.jobs.filter_title')}
                        </CardTitle>
                        <CardDescription>
                            {t('candidate.jobs.filter_description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4 lg:grid-cols-4"
                            onSubmit={(event) => {
                                event.preventDefault();

                                const formData = new FormData(
                                    event.currentTarget,
                                );

                                router.get(
                                    index(),
                                    Object.fromEntries(formData.entries()),
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                        >
                            <input
                                type="hidden"
                                name="tab"
                                value={filters.tab}
                            />
                            <Field
                                label={t('candidate.jobs.keyword')}
                                name="search"
                            >
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder={t(
                                        'candidate.jobs.keyword_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.jobs.location')}
                                name="location"
                            >
                                <Input
                                    name="location"
                                    defaultValue={filters.location ?? ''}
                                    placeholder={t(
                                        'candidate.jobs.location_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.jobs.work_mode')}
                                name="work_mode"
                            >
                                <Select
                                    name="work_mode"
                                    defaultValue={filters.work_mode ?? ''}
                                >
                                    <option value="">
                                        {t('candidate.jobs.all_modes')}
                                    </option>
                                    <option value="remote">
                                        {t('candidate.jobs.mode_remote')}
                                    </option>
                                    <option value="hybrid">
                                        {t('candidate.jobs.mode_hybrid')}
                                    </option>
                                    <option value="onsite">
                                        {t('candidate.jobs.mode_onsite')}
                                    </option>
                                </Select>
                            </Field>
                            <Field
                                label={t('candidate.jobs.job_type')}
                                name="job_type"
                            >
                                <Select
                                    name="job_type"
                                    defaultValue={filters.job_type ?? ''}
                                >
                                    <option value="">
                                        {t('candidate.jobs.all_types')}
                                    </option>
                                    <option value="full_time">
                                        {t('candidate.jobs.type_full_time')}
                                    </option>
                                    <option value="part_time">
                                        {t('candidate.jobs.type_part_time')}
                                    </option>
                                    <option value="contract">
                                        {t('candidate.jobs.type_contract')}
                                    </option>
                                    <option value="internship">
                                        {t('candidate.jobs.type_internship')}
                                    </option>
                                    <option value="freelance">
                                        {t('candidate.jobs.type_freelance')}
                                    </option>
                                </Select>
                            </Field>
                            <Field
                                label={t('candidate.jobs.experience')}
                                name="experience_level"
                            >
                                <Select
                                    name="experience_level"
                                    defaultValue={
                                        filters.experience_level ?? ''
                                    }
                                >
                                    <option value="">
                                        {t('candidate.jobs.all_levels')}
                                    </option>
                                    <option value="entry">
                                        {t('candidate.jobs.level_entry')}
                                    </option>
                                    <option value="mid">
                                        {t('candidate.jobs.level_mid')}
                                    </option>
                                    <option value="senior">
                                        {t('candidate.jobs.level_senior')}
                                    </option>
                                    <option value="lead">
                                        {t('candidate.jobs.level_lead')}
                                    </option>
                                    <option value="manager">
                                        {t('candidate.jobs.level_manager')}
                                    </option>
                                </Select>
                            </Field>
                            <Field
                                label={t('candidate.jobs.industry')}
                                name="industry_id"
                            >
                                <Select
                                    name="industry_id"
                                    defaultValue={filters.industry_id ?? ''}
                                >
                                    <option value="">
                                        {t('candidate.jobs.all_industries')}
                                    </option>
                                    {industries.map((industry) => (
                                        <option
                                            key={industry.value}
                                            value={industry.value}
                                        >
                                            {industry.label}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field
                                label={t('candidate.jobs.salary_min')}
                                name="salary_min"
                            >
                                <RupiahInput
                                    name="salary_min"
                                    defaultValue={filters.salary_min}
                                    placeholder={t(
                                        'candidate.jobs.salary_min_placeholder',
                                    )}
                                />
                            </Field>
                            <div className="flex flex-col justify-end gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        className="size-4 rounded border-input"
                                        type="checkbox"
                                        name="verified_company"
                                        value="1"
                                        defaultChecked={
                                            filters.verified_company
                                        }
                                    />
                                    {t('candidate.jobs.verified_company')}
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        className="size-4 rounded border-input"
                                        type="checkbox"
                                        name="skill_match"
                                        value="1"
                                        defaultChecked={filters.skill_match}
                                    />
                                    {t('candidate.jobs.skill_match')}
                                </label>
                            </div>
                            <div className="lg:col-span-4">
                                <Button type="submit">
                                    <Search />
                                    {t('candidate.jobs.apply_filter')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    {jobs.data.length ? (
                        jobs.data.map((job) => (
                            <JobCard job={job} key={job.id} t={t} />
                        ))
                    ) : (
                        <EmptyState
                            title={t('candidate.jobs.empty_title')}
                            description={t('candidate.jobs.empty_description')}
                        />
                    )}
                </div>

                <PaginationLinks links={jobs.links} />
            </div>
        </>
    );
}

function JobCard({
    job,
    t,
}: {
    job: Job;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div>
                            <Link
                                className="text-lg font-semibold underline-offset-4 hover:underline"
                                href={show(job.slug)}
                            >
                                {job.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                                {job.is_anonymous ? (
                                    <span className="italic">
                                        {t('candidate.jobs.anonymous_company')}
                                    </span>
                                ) : (
                                    job.company
                                )}{' '}
                                ·{' '}
                                {job.location ||
                                    t('candidate.jobs.mode_remote')}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.is_anonymous ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    {t('candidate.jobs.anonymous_badge')}
                                </Badge>
                            ) : job.company_verified ? (
                                <Badge>
                                    {t('candidate.jobs.verified_badge')}
                                </Badge>
                            ) : null}
                            <Badge variant="secondary">
                                {job.work_mode_label}
                            </Badge>
                            <Badge variant="secondary">
                                {job.job_type_label}
                            </Badge>
                            {job.ai_match_score ? (
                                <Badge variant="outline">
                                    {t('candidate.jobs.ai_match', {
                                        score: job.ai_match_score,
                                    })}
                                </Badge>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 6).map((skill) => (
                                <Badge key={skill.id} variant="outline">
                                    {skill.name}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {job.salary_range} · {t('candidate.jobs.publish')}{' '}
                            {job.published_at ?? '-'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {job.is_saved ? (
                            <Button asChild variant="outline">
                                <Link
                                    href={unsave(job.id)}
                                    method="delete"
                                    as="button"
                                >
                                    <BookmarkCheck />
                                    {t('candidate.jobs.saved')}
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline">
                                <Link
                                    href={save(job.id)}
                                    method="post"
                                    as="button"
                                >
                                    <Bookmark />
                                    {t('candidate.jobs.save')}
                                </Link>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={show(job.slug)}>
                                {job.has_applied
                                    ? t('candidate.jobs.view_application')
                                    : t('candidate.jobs.detail')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

CandidateJobsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Cari Lowongan',
            href: index(),
        },
    ],
};
