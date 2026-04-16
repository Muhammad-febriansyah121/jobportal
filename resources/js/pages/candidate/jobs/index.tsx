import { Head, Link, router } from '@inertiajs/react';
import { Bookmark, BookmarkCheck, Search } from 'lucide-react';
import Heading from '@/components/heading';
import {
    Field,
    RupiahInput,
    Select,
} from '@/components/candidate/candidate-form';
import { EmptyState, PaginationLinks } from '@/components/candidate/candidate-ui';
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
import {
    index,
    save,
    show,
    unsave,
} from '@/routes/candidate/jobs';

type Option = {
    value: string;
    label: string;
};

type Job = {
    id: number;
    slug: string;
    title: string;
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
    const tabs = [
        ['recommended', 'Rekomendasi'],
        ['all', 'Semua'],
        ['remote', 'Remote'],
        ['salary-transparent', 'Salary transparan'],
    ] as const;

    return (
        <>
            <Head title="Cari Lowongan" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Cari Lowongan"
                    description="Cari, filter, simpan, dan lamar lowongan aktif yang sesuai dengan profil kamu."
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
                            Diurutkan berdasarkan aktivitas dan minat Anda
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter lowongan</CardTitle>
                        <CardDescription>
                            Gunakan keyword, lokasi, salary, dan skill match.
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
                            <Field label="Keyword" name="search">
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="React, data analyst, fintech"
                                />
                            </Field>
                            <Field label="Lokasi" name="location">
                                <Input
                                    name="location"
                                    defaultValue={filters.location ?? ''}
                                    placeholder="Jakarta, Bandung, remote"
                                />
                            </Field>
                            <Field label="Mode kerja" name="work_mode">
                                <Select
                                    name="work_mode"
                                    defaultValue={filters.work_mode ?? ''}
                                >
                                    <option value="">Semua mode</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="onsite">Onsite</option>
                                </Select>
                            </Field>
                            <Field label="Job type" name="job_type">
                                <Select
                                    name="job_type"
                                    defaultValue={filters.job_type ?? ''}
                                >
                                    <option value="">Semua tipe</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">
                                        Internship
                                    </option>
                                    <option value="freelance">Freelance</option>
                                </Select>
                            </Field>
                            <Field
                                label="Experience"
                                name="experience_level"
                            >
                                <Select
                                    name="experience_level"
                                    defaultValue={
                                        filters.experience_level ?? ''
                                    }
                                >
                                    <option value="">Semua level</option>
                                    <option value="entry">Entry</option>
                                    <option value="mid">Mid</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Lead</option>
                                    <option value="manager">Manager</option>
                                </Select>
                            </Field>
                            <Field label="Industri" name="industry_id">
                                <Select
                                    name="industry_id"
                                    defaultValue={filters.industry_id ?? ''}
                                >
                                    <option value="">Semua industri</option>
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
                            <Field label="Salary min" name="salary_min">
                                <RupiahInput
                                    name="salary_min"
                                    defaultValue={filters.salary_min}
                                    placeholder="Rp10.000.000"
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
                                    Perusahaan verified
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        className="size-4 rounded border-input"
                                        type="checkbox"
                                        name="skill_match"
                                        value="1"
                                        defaultChecked={filters.skill_match}
                                    />
                                    Skill match
                                </label>
                            </div>
                            <div className="lg:col-span-4">
                                <Button type="submit">
                                    <Search />
                                    Terapkan filter
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    {jobs.data.length ? (
                        jobs.data.map((job) => <JobCard job={job} key={job.id} />)
                    ) : (
                        <EmptyState
                            title="Lowongan tidak ditemukan"
                            description="Coba ubah keyword, lokasi, atau filter salary."
                        />
                    )}
                </div>

                <PaginationLinks links={jobs.links} />
            </div>
        </>
    );
}

function JobCard({ job }: { job: Job }) {
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
                                {job.company} · {job.location || 'Remote'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.company_verified ? (
                                <Badge>Verified</Badge>
                            ) : null}
                            <Badge variant="secondary">
                                {job.work_mode_label}
                            </Badge>
                            <Badge variant="secondary">
                                {job.job_type_label}
                            </Badge>
                            {job.ai_match_score ? (
                                <Badge variant="outline">
                                    AI match {job.ai_match_score}%
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
                            {job.salary_range} · Publish {job.published_at ?? '-'}
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
                                    Tersimpan
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
                                    Simpan
                                </Link>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={show(job.slug)}>
                                {job.has_applied ? 'Lihat lamaran' : 'Detail'}
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
