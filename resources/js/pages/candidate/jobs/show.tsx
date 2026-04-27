import { Form, Head, Link } from '@inertiajs/react';
import {
    BadgeCheck,
    Share2,
    Bookmark,
    BookmarkCheck,
    Building2,
    CheckCircle2,
    ExternalLink,
    FileText,
    Globe,
    Lightbulb,
    MapPin,
    Shield,
    Sparkles,
    Star,
    Target,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import CandidateReportController from '@/actions/App/Http/Controllers/Candidate/CandidateReportController';
import { Field, Select, Textarea } from '@/components/candidate/candidate-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as aiInterviewIndex } from '@/routes/candidate/ai-interviews';
import { save, show, unsave } from '@/routes/candidate/jobs';

type JobShowProps = {
    job: {
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        company_verified: boolean;
        company_logo?: string | null;
        company_slug?: string | null;
        company_size?: string | null;
        company_industry?: string | null;
        industry?: string | null;
        location: string;
        work_mode_label: string;
        job_type_label: string;
        experience_level: string;
        salary_range: string;
        published_at?: string | null;
        closes_at?: string | null;
        response_sla_hours?: number | null;
        description: string;
        responsibilities?: string | null;
        required_qualifications?: string | null;
        preferred_qualifications?: string | null;
        benefits?: string | null;
        integrity_score?: number | null;
        company_description?: string | null;
        company_culture?: string | null;
        company_benefits?: string | null;
        company_trust_score?: number | null;
        company_response_rate?: number | null;
        company_median_response_hours?: number | null;
        matched_skills: string[];
        missing_skills: string[];
        is_saved: boolean;
        has_applied: boolean;
        ai_interview_application_id?: number | null;
        skills: Array<{ id: number; name: string }>;
    };
    cvs: Array<{
        id: number;
        file_url: string;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
    similarJobs: Array<{
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        company_logo?: string | null;
        location: string;
        salary_range: string;
    }>;
};

export default function CandidateJobShow({ job, similarJobs }: JobShowProps) {
    const { t } = useTranslate();
    const [reportOpen, setReportOpen] = useState(false);
    const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

    const slaDays = job.response_sla_hours
        ? Math.ceil(job.response_sla_hours / 24)
        : null;
    const companyInitials =
        job.company
            ?.split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? 'CO';
    const companyCultureItems = splitListText(job.company_culture);
    const companyBenefitItems = splitListText(job.company_benefits);

    const integrityLabel =
        (job.integrity_score ?? 0) >= 90
            ? t('candidate.jobs_show.integrity_high')
            : (job.integrity_score ?? 0) >= 70
              ? t('candidate.jobs_show.integrity_medium')
              : t('candidate.jobs_show.integrity_low');

    const handleShare = async (): Promise<void> => {
        const shareUrl =
            typeof window === 'undefined'
                ? show(job.slug).url
                : window.location.href;

        if (
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function'
        ) {
            try {
                await navigator.share({
                    title: job.title,
                    text: `Cek lowongan ${job.title} di ${job.company ?? 'Karivia'}`,
                    url: shareUrl,
                });

                return;
            } catch {
                // Fall back to clipboard action.
            }
        }

        if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard?.writeText
        ) {
            await navigator.clipboard.writeText(shareUrl);
            setShareState('copied');
            window.setTimeout(() => setShareState('idle'), 1500);
        }
    };

    return (
        <>
            <Head title={job.title} />

            <div className="space-y-5 p-4 md:p-6">
                {/* Job Header */}
                <Card>
                    <CardContent className="pt-5 pb-5">
                        <div className="flex gap-4">
                            <Avatar className="size-16 shrink-0 rounded-xl">
                                {!job.is_anonymous && (
                                    <AvatarImage
                                        src={job.company_logo ?? undefined}
                                    />
                                )}
                                <AvatarFallback
                                    className={`rounded-xl text-lg font-bold ${job.is_anonymous ? 'bg-amber-100 text-amber-600' : ''}`}
                                >
                                    {job.is_anonymous ? '?' : companyInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold">
                                        {job.title}
                                    </h1>
                                    {job.is_anonymous ? (
                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                            {t('candidate.jobs_show.anonymous')}
                                        </Badge>
                                    ) : job.company_verified ? (
                                        <Badge className="border-green-200 bg-green-50 text-green-700">
                                            <CheckCircle2 className="size-3" />
                                            {t('candidate.jobs_show.verified')}
                                        </Badge>
                                    ) : null}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="size-3.5" />
                                        {job.is_anonymous ? (
                                            <span className="italic">
                                                {t(
                                                    'candidate.jobs_show.anonymous_company',
                                                )}
                                            </span>
                                        ) : (
                                            (job.company ??
                                            t(
                                                'candidate.jobs_show.company_fallback',
                                            ))
                                        )}
                                    </span>
                                    {job.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3.5" />
                                            {job.location}
                                        </span>
                                    )}
                                    <Badge
                                        variant="outline"
                                        className="border-primary-300 bg-primary-50 text-primary-600"
                                    >
                                        {job.job_type_label}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {job.work_mode_label}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            {job.has_applied ? (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 sm:flex-none"
                                    disabled
                                >
                                    <CheckCircle2 />
                                    {t('candidate.jobs_show.already_applied')}
                                </Button>
                            ) : (
                                <Button className="flex-1 sm:flex-none" asChild>
                                    <Link
                                        href={show(job.slug, {
                                            query: { apply: 1 },
                                        })}
                                    >
                                        {t('candidate.jobs_show.apply_now')}
                                    </Link>
                                </Button>
                            )}
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
                            <Button
                                variant="outline"
                                onClick={() => void handleShare()}
                            >
                                <Share2 />
                                {shareState === 'copied'
                                    ? t('candidate.jobs_show.link_copied')
                                    : t('candidate.jobs_show.share')}
                            </Button>
                            {job.has_applied &&
                            job.ai_interview_application_id ? (
                                <Button asChild variant="secondary">
                                    <Link
                                        href={aiInterviewIndex({
                                            query: {
                                                application_id:
                                                    job.ai_interview_application_id,
                                                interview_mode: 'text',
                                                interview_language: 'id',
                                                interview_focus: 'mixed',
                                                candidate_level: 'junior',
                                                question_count: 5,
                                                duration_minutes: 30,
                                            },
                                        })}
                                    >
                                        <Sparkles />
                                        {t(
                                            'candidate.jobs_show.ai_interview_practice',
                                        )}
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
                    {/* Main Column */}
                    <div className="space-y-5">
                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Card>
                                <CardContent className="pt-4 pb-4">
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'candidate.jobs_show.salary_range_monthly',
                                        )}
                                    </p>
                                    <p className="mt-1 text-base font-bold text-primary-600">
                                        {job.salary_range}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {t('candidate.jobs_show.salary_note')}
                                    </p>
                                </CardContent>
                            </Card>
                            {job.integrity_score ? (
                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'candidate.jobs_show.integrity_score',
                                            )}
                                        </p>
                                        <p className="mt-1 text-base font-bold text-green-600">
                                            {job.integrity_score}/100
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {integrityLabel}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : null}
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="deskripsi">
                            <TabsList
                                variant="line"
                                className="h-auto w-full justify-start rounded-none border-b pb-0"
                            >
                                <TabsTrigger
                                    value="deskripsi"
                                    className="px-1 pb-3"
                                >
                                    {t('candidate.jobs_show.tab_description')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tanggung-jawab"
                                    className="px-1 pb-3"
                                >
                                    {t(
                                        'candidate.jobs_show.tab_responsibility',
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="kualifikasi"
                                    className="px-1 pb-3"
                                >
                                    {t('candidate.jobs_show.tab_qualification')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="deskripsi"
                                className="mt-5 space-y-6"
                            >
                                <ContentSection
                                    title={t('candidate.jobs_show.about_job')}
                                    icon={FileText}
                                >
                                    <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
                                        {job.description}
                                    </p>
                                </ContentSection>

                                <div>
                                    <h3 className="mb-3 font-semibold">
                                        {t(
                                            'candidate.jobs_show.required_skills',
                                        )}
                                    </h3>
                                    {job.matched_skills.length > 0 ||
                                    job.missing_skills.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <SkillBox
                                                title={t(
                                                    'candidate.jobs_show.matched_skills',
                                                )}
                                                items={job.matched_skills}
                                                variant="matched"
                                            />
                                            <SkillBox
                                                title={t(
                                                    'candidate.jobs_show.missing_skills',
                                                )}
                                                items={job.missing_skills}
                                                variant="missing"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.map((skill) => (
                                                <Badge
                                                    key={skill.id}
                                                    variant="outline"
                                                >
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {job.benefits && (
                                    <ContentSection
                                        title={t(
                                            'candidate.jobs_show.position_benefits',
                                        )}
                                        icon={Zap}
                                    >
                                        <BulletList text={job.benefits} />
                                    </ContentSection>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="tanggung-jawab"
                                className="mt-5 space-y-5"
                            >
                                <ContentSection
                                    title={t(
                                        'candidate.jobs_show.main_responsibility',
                                    )}
                                    icon={Target}
                                >
                                    {job.responsibilities ? (
                                        <BulletList
                                            text={job.responsibilities}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'candidate.jobs_show.no_responsibility',
                                            )}
                                        </p>
                                    )}
                                </ContentSection>
                            </TabsContent>

                            <TabsContent
                                value="kualifikasi"
                                className="mt-5 space-y-5"
                            >
                                {job.required_qualifications && (
                                    <ContentSection
                                        title={t(
                                            'candidate.jobs_show.required_qualification',
                                        )}
                                        icon={BadgeCheck}
                                    >
                                        <BulletList
                                            text={job.required_qualifications}
                                        />
                                    </ContentSection>
                                )}
                                {job.preferred_qualifications && (
                                    <ContentSection
                                        title={t(
                                            'candidate.jobs_show.additional_qualification',
                                        )}
                                        icon={Star}
                                    >
                                        <BulletList
                                            text={job.preferred_qualifications}
                                        />
                                    </ContentSection>
                                )}
                                {!job.required_qualifications &&
                                    !job.preferred_qualifications && (
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'candidate.jobs_show.no_qualification',
                                            )}
                                        </p>
                                    )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Respon Cepat */}
                        {slaDays !== null && (
                            <Card className="border-primary-200">
                                <CardContent className="pt-4 pb-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Zap className="size-4 text-primary-500" />
                                        <p className="text-sm font-semibold">
                                            Respon Cepat
                                        </p>
                                    </div>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Rekruter kami berkomitmen untuk
                                        memproses lamaran Anda dalam waktu
                                        maksimal{' '}
                                        <strong className="text-foreground">
                                            {slaDays} hari kerja
                                        </strong>
                                        .
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pekerjaan Serupa */}
                        {similarJobs.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Pekerjaan Serupa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    {similarJobs.map((sj) => (
                                        <Link
                                            key={sj.id}
                                            href={show(sj.slug)}
                                            className="-mx-2 flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                                        >
                                            <Avatar className="size-8 shrink-0 rounded-lg">
                                                {!sj.is_anonymous && (
                                                    <AvatarImage
                                                        src={
                                                            sj.company_logo ??
                                                            undefined
                                                        }
                                                    />
                                                )}
                                                <AvatarFallback
                                                    className={`rounded-lg text-xs ${sj.is_anonymous ? 'bg-amber-100 text-amber-600' : ''}`}
                                                >
                                                    {sj.is_anonymous
                                                        ? '?'
                                                        : (sj.company
                                                              ?.slice(0, 2)
                                                              .toUpperCase() ??
                                                          'CO')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium">
                                                    {sj.title}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {sj.is_anonymous
                                                        ? t(
                                                              'candidate.jobs_show.anonymous_company',
                                                          )
                                                        : sj.company}
                                                    {sj.location
                                                        ? ` · ${sj.location}`
                                                        : ''}
                                                </p>
                                                <p className="text-[11px] font-semibold text-primary-600">
                                                    {sj.salary_range}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                    <div className="pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs"
                                            asChild
                                        >
                                            <Link href="/candidate/jobs">
                                                {t(
                                                    'candidate.jobs_show.view_all_recommendations',
                                                )}
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tentang Perusahaan */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-1.5 text-sm">
                                    {t('candidate.jobs_show.about_company')}{' '}
                                    {job.is_anonymous
                                        ? t(
                                              'candidate.jobs_show.company_fallback',
                                          )
                                        : (job.company ??
                                          t(
                                              'candidate.jobs_show.company_fallback',
                                          ))}
                                    {!job.is_anonymous &&
                                        job.company_verified && (
                                            <Shield className="size-3.5 text-green-500" />
                                        )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {job.is_anonymous ? (
                                    <div className="rounded-md bg-amber-50 p-3 text-center">
                                        <p className="text-xs font-medium text-amber-700">
                                            {t(
                                                'candidate.jobs_show.company_hidden',
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-amber-600">
                                            {t(
                                                'candidate.jobs_show.company_hidden_hint',
                                            )}
                                        </p>
                                    </div>
                                ) : null}
                                {!job.is_anonymous &&
                                    job.company_description && (
                                        <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">
                                            {job.company_description}
                                        </p>
                                    )}
                                {!job.is_anonymous &&
                                    companyCultureItems.length > 0 && (
                                        <div className="rounded-md bg-muted/40 p-2.5">
                                            <p className="text-[11px] font-semibold text-muted-foreground">
                                                {t(
                                                    'candidate.jobs_show.work_culture',
                                                )}
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                                {companyCultureItems
                                                    .slice(0, 3)
                                                    .map((item) => (
                                                        <li
                                                            key={item}
                                                            className="truncate text-xs text-foreground/80"
                                                        >
                                                            • {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                {!job.is_anonymous &&
                                    companyBenefitItems.length > 0 && (
                                        <div className="rounded-md bg-muted/40 p-2.5">
                                            <p className="text-[11px] font-semibold text-muted-foreground">
                                                {t(
                                                    'candidate.jobs_show.company_benefits',
                                                )}
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                                {companyBenefitItems
                                                    .slice(0, 3)
                                                    .map((item) => (
                                                        <li
                                                            key={item}
                                                            className="truncate text-xs text-foreground/80"
                                                        >
                                                            • {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                {!job.is_anonymous &&
                                    (job.company_size ||
                                        job.company_industry) && (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {job.company_size && (
                                                <div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {t(
                                                            'candidate.jobs_show.employee',
                                                        )}
                                                    </p>
                                                    <p className="text-xs font-medium">
                                                        {job.company_size}
                                                    </p>
                                                </div>
                                            )}
                                            {job.company_industry && (
                                                <div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {t(
                                                            'candidate.jobs.industry',
                                                        )}
                                                    </p>
                                                    <p className="text-xs font-medium">
                                                        {job.company_industry}
                                                    </p>
                                                </div>
                                            )}
                                            {job.company_trust_score !=
                                                null && (
                                                <div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Trust Score
                                                    </p>
                                                    <p className="text-xs font-medium">
                                                        {
                                                            job.company_trust_score
                                                        }
                                                        /100
                                                    </p>
                                                </div>
                                            )}
                                            {job.company_response_rate !=
                                                null && (
                                                <div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Response Rate
                                                    </p>
                                                    <p className="text-xs font-medium">
                                                        {
                                                            job.company_response_rate
                                                        }
                                                        %
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {!job.is_anonymous && job.company_slug && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        asChild
                                    >
                                        <Link
                                            href={`/companies/${job.company_slug}`}
                                        >
                                            <Globe className="size-3" />
                                            {t(
                                                'candidate.jobs_show.visit_profile',
                                            )}
                                            <ExternalLink className="size-3" />
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Report link */}
                        <div className="text-center">
                            <button
                                onClick={() => setReportOpen(true)}
                                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                            >
                                {t('candidate.jobs_show.report_job')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {t('candidate.jobs_show.report_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.jobs_show.report_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...CandidateReportController.store.form(job.id)}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field
                                    label={t('candidate.jobs_show.reason')}
                                    name="reason"
                                    error={errors.reason}
                                >
                                    <Select name="reason">
                                        <option value="misleading">
                                            {t(
                                                'candidate.jobs_show.reason_misleading',
                                            )}
                                        </option>
                                        <option value="salary_mismatch">
                                            {t(
                                                'candidate.jobs_show.reason_salary_mismatch',
                                            )}
                                        </option>
                                        <option value="fraud">
                                            {t(
                                                'candidate.jobs_show.reason_fraud',
                                            )}
                                        </option>
                                        <option value="unsafe">
                                            {t(
                                                'candidate.jobs_show.reason_unsafe',
                                            )}
                                        </option>
                                        <option value="duplicate">
                                            {t(
                                                'candidate.jobs_show.reason_duplicate',
                                            )}
                                        </option>
                                        <option value="other">
                                            {t(
                                                'candidate.jobs_show.reason_other',
                                            )}
                                        </option>
                                    </Select>
                                </Field>
                                <Field
                                    label={t('candidate.jobs_show.note')}
                                    name="reporter_note"
                                    error={errors.reporter_note}
                                >
                                    <Textarea
                                        name="reporter_note"
                                        placeholder={t(
                                            'candidate.jobs_show.note_placeholder',
                                        )}
                                    />
                                </Field>
                                <Button
                                    disabled={processing}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {t('candidate.jobs_show.send_report')}
                                </Button>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ContentSection({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Icon className="size-4 text-muted-foreground" />
                {title}
            </h3>
            {children}
        </section>
    );
}

function BulletList({ text }: { text: string }) {
    const lines = text
        .split('\n')
        .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);

    return (
        <ul className="space-y-2 text-sm text-muted-foreground">
            {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-500" />
                    <span className="leading-7">{line}</span>
                </li>
            ))}
        </ul>
    );
}

function splitListText(value?: string | null): string[] {
    if (!value) {
        return [];
    }

    return value
        .split('\n')
        .map((line) => line.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
}

function SkillBox({
    title,
    items,
    variant,
}: {
    title: string;
    items: string[];
    variant: 'matched' | 'missing';
}) {
    const Icon = variant === 'matched' ? CheckCircle2 : Lightbulb;

    return (
        <div
            className={cn(
                'rounded-lg border p-3',
                variant === 'matched'
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-primary-200 bg-primary-50/50',
            )}
        >
            <p
                className={cn(
                    'mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase',
                    variant === 'matched'
                        ? 'text-green-700'
                        : 'text-primary-700',
                )}
            >
                <Icon className="size-3.5" />
                {title}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {items.length ? (
                    items.map((item) => (
                        <Badge
                            key={item}
                            variant="outline"
                            className={cn(
                                'text-xs',
                                variant === 'matched'
                                    ? 'border-green-300 bg-green-100 text-green-700'
                                    : 'border-primary-300 bg-primary-100 text-primary-700',
                            )}
                        >
                            {item}
                        </Badge>
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground">-</p>
                )}
            </div>
        </div>
    );
}

CandidateJobShow.layout = ({ job }: JobShowProps) => ({
    breadcrumbs: [
        {
            title: 'Cari Lowongan',
            href: '/candidate/jobs',
        },
        {
            title: job.title,
            href: show(job.slug),
        },
    ],
});
