import { Form, Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    BookOpen,
    Brain,
    CheckCircle2,
    Circle,
    Compass,
    DollarSign,
    Lightbulb,
    Loader2,
    Map,
    PlusCircle,
    Sparkles,
    Star,
    Target,
    Trash2,
    TrendingUp,
    Wand2,
    Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import CandidateCareerPathController from '@/actions/App/Http/Controllers/Candidate/CandidateCareerPathController';
import { Field, Textarea } from '@/components/candidate/candidate-form';
import { CareerModuleTabs } from '@/components/candidate/career-module-tabs';
import { CvReviewCard, type CvReview } from '@/components/candidate/cv-review-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index } from '@/routes/candidate/career-paths';

type SkillBreakdown = {
    name: string;
    current_level: number;
    required_level: number;
    note?: string | null;
};

type LearningStepData = {
    title: string;
    description?: string | null;
    tag?: string | null;
};

type LearningPathStep = {
    id: number;
    title: string;
    description?: string | null;
    order_number: number;
    status: 'not_started' | 'in_progress' | 'completed';
};

type Milestone = {
    title: string;
    timeframe: string;
};

type CareerPathSummary = {
    id: number;
    title: string;
    target_role: string;
    match_score?: number | null;
    is_primary: boolean;
    summary?: string | null;
    growth_potential?: string | null;
    salary_range?: string | null;
    key_gap_insight?: string | null;
    skill_breakdown: SkillBreakdown[];
    learning_steps_data: LearningStepData[];
    milestones: Milestone[];
    created_at?: string | null;
};

type CareerPathDetail = CareerPathSummary & {
    learning_path_steps: LearningPathStep[];
};

type ProfileSnapshot = {
    headline?: string | null;
    preferred_role?: string | null;
    preferred_industry?: string | null;
    years_total_experience: number;
    skill_count: number;
    top_skills: Array<{
        name: string;
        proficiency?: string | null;
        years_exp?: number | null;
    }>;
};

type CareerPathsPageProps = {
    profileSnapshot: ProfileSnapshot;
    paths: CareerPathSummary[];
    activePath: CareerPathDetail | null;
    aiEnabled: boolean;
    cvReview: CvReview;
};

export default function CandidateCareerPaths({
    profileSnapshot,
    paths,
    activePath,
    aiEnabled,
    cvReview,
}: CareerPathsPageProps) {
    const { t } = useTranslate();
    const [activePathId, setActivePathId] = useState<number | null>(
        activePath?.id ?? null,
    );

    const selectedPath = useMemo(() => {
        if (!activePathId) {
            return activePath;
        }

        if (activePath?.id === activePathId) {
            return activePath;
        }

        const summary = paths.find((path) => path.id === activePathId);

        if (!summary) {
            return activePath;
        }

        return {
            ...summary,
            learning_path_steps: [],
        } satisfies CareerPathDetail;
    }, [activePathId, activePath, paths]);

    return (
        <>
            <Head title={t('candidate.career_paths.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.career_paths.page_title')}
                    description={t('candidate.career_paths.page_description')}
                />

                <CareerModuleTabs />

                <CvReviewCard review={cvReview} />

                <PageHero
                    aiEnabled={aiEnabled}
                    profileSnapshot={profileSnapshot}
                    pathCount={paths.length}
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
                    <div className="space-y-6">
                        <GenerateCareerPathCard aiEnabled={aiEnabled} />

                        {selectedPath ? (
                            <ActivePathCard path={selectedPath} />
                        ) : (
                            <EmptyState />
                        )}

                        {selectedPath && selectedPath.skill_breakdown.length > 0 ? (
                            <SkillGapCard path={selectedPath} />
                        ) : null}

                        {selectedPath && selectedPath.learning_steps_data.length > 0 ? (
                            <LearningRecommendationCard path={selectedPath} />
                        ) : null}

                        {selectedPath?.learning_path_steps?.length ? (
                            <LearningStepsCard steps={selectedPath.learning_path_steps} />
                        ) : null}

                        {selectedPath && selectedPath.milestones.length > 0 ? (
                            <MilestoneCard milestones={selectedPath.milestones} />
                        ) : null}
                    </div>

                    <PathListColumn
                        paths={paths}
                        activeId={selectedPath?.id ?? null}
                        onSelect={(id) => setActivePathId(id)}
                    />
                </div>
            </div>
        </>
    );
}

function PageHero({
    aiEnabled,
    profileSnapshot,
    pathCount,
}: {
    aiEnabled: boolean;
    profileSnapshot: ProfileSnapshot;
    pathCount: number;
}) {
    const { t } = useTranslate();

    return (
        <Card className="overflow-hidden border-[#dde6f5] bg-gradient-to-br from-[#0F4C94] via-[#0b3a8b] to-[#1255b3] text-white shadow-md">
            <CardContent className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                    <Badge className="w-fit bg-white/15 text-white hover:bg-white/15">
                        <Sparkles className="mr-1.5 size-3.5" />
                        {t('candidate.career_paths.hero_badge')}
                    </Badge>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                            {t('candidate.career_paths.hero_title')}
                        </h2>
                        <p className="max-w-2xl text-sm leading-6 text-white/80 md:text-base">
                            {t('candidate.career_paths.hero_description')}
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <HeroStat
                            label={t('candidate.career_paths.stat_paths')}
                            value={String(pathCount)}
                            icon={Map}
                        />
                        <HeroStat
                            label={t('candidate.career_paths.stat_skills')}
                            value={String(profileSnapshot.skill_count)}
                            icon={Brain}
                        />
                        <HeroStat
                            label={t('candidate.career_paths.stat_experience')}
                            value={
                                profileSnapshot.years_total_experience > 0
                                    ? `${profileSnapshot.years_total_experience}+ ${t('candidate.career_paths.year_short')}`
                                    : '-'
                            }
                            icon={TrendingUp}
                        />
                    </div>
                </div>
                <div className="space-y-3 rounded-2xl bg-white/10 p-5 backdrop-blur">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-white/80 uppercase">
                        <Compass className="size-4" />
                        {t('candidate.career_paths.hero_profile_title')}
                    </div>
                    <p className="text-base font-semibold leading-snug">
                        {profileSnapshot.headline ??
                            profileSnapshot.preferred_role ??
                            t('candidate.career_paths.hero_profile_fallback')}
                    </p>
                    {profileSnapshot.preferred_industry ? (
                        <p className="text-sm text-white/75">
                            {t('candidate.career_paths.hero_industry')}:{' '}
                            <span className="font-semibold text-white">
                                {profileSnapshot.preferred_industry}
                            </span>
                        </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                        {profileSnapshot.top_skills.length > 0 ? (
                            profileSnapshot.top_skills.slice(0, 6).map((skill) => (
                                <Badge
                                    key={skill.name}
                                    className="bg-white/20 text-white hover:bg-white/20"
                                    variant="secondary"
                                >
                                    {skill.name}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-xs text-white/70">
                                {t('candidate.career_paths.hero_skills_empty')}
                            </p>
                        )}
                    </div>
                    {!aiEnabled ? (
                        <p className="rounded-md bg-amber-100/95 px-3 py-2 text-xs font-medium text-amber-900">
                            {t('candidate.career_paths.ai_disabled_warning')}
                        </p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

function HeroStat({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: typeof Map;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-white/70 uppercase">
                    {label}
                </p>
                <p className="text-base font-bold">{value}</p>
            </div>
        </div>
    );
}

function GenerateCareerPathCard({ aiEnabled }: { aiEnabled: boolean }) {
    const { t } = useTranslate();

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-5 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F8FF] text-[#0F4C94]">
                            <Wand2 className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0F2747]">
                                {t('candidate.career_paths.form_title')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t('candidate.career_paths.form_description')}
                            </p>
                        </div>
                    </div>
                    {aiEnabled ? (
                        <Badge className="hidden bg-emerald-100 text-emerald-700 hover:bg-emerald-100 md:inline-flex">
                            <BadgeCheck className="mr-1 size-3.5" />
                            AI Online
                        </Badge>
                    ) : null}
                </div>

                <Form
                    {...CandidateCareerPathController.generate.form()}
                    className="grid gap-4 md:grid-cols-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label={t('candidate.career_paths.form_target_role')}
                                name="target_role"
                                error={errors.target_role}
                                required
                            >
                                <Input
                                    name="target_role"
                                    placeholder={t(
                                        'candidate.career_paths.form_target_role_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.career_paths.form_focus')}
                                name="focus"
                                error={errors.focus}
                            >
                                <Input
                                    name="focus"
                                    placeholder={t(
                                        'candidate.career_paths.form_focus_placeholder',
                                    )}
                                />
                            </Field>
                            <div className="md:col-span-2">
                                <Field
                                    label={t('candidate.career_paths.form_notes')}
                                    name="notes"
                                    error={errors.notes}
                                >
                                    <Textarea
                                        name="notes"
                                        placeholder={t(
                                            'candidate.career_paths.form_notes_placeholder',
                                        )}
                                    />
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Button
                                    disabled={processing}
                                    className="h-11 w-full bg-[#0F4C94] text-sm font-bold hover:bg-[#093579] md:w-auto"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 size-4" />
                                    )}
                                    {t('candidate.career_paths.form_submit')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    const { t } = useTranslate();

    return (
        <Card className="border-dashed border-[#cfd8e8]">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#F4F8FF] text-[#0F4C94]">
                    <Compass className="size-7" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F2747]">
                    {t('candidate.career_paths.empty_title')}
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                    {t('candidate.career_paths.empty_description')}
                </p>
            </CardContent>
        </Card>
    );
}

function ActivePathCard({ path }: { path: CareerPathDetail | CareerPathSummary }) {
    const { t } = useTranslate();
    const matchScore = path.match_score ?? 0;

    return (
        <Card className="overflow-hidden border-[#E5EDF7] shadow-sm">
            <CardContent className="space-y-6 p-5 md:p-6">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                    <div className="space-y-2">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <Target className="mr-1 size-3.5" />
                            {t('candidate.career_paths.target_recommendation')}
                        </Badge>
                        <h2 className="text-2xl font-bold tracking-tight text-[#0F2747] md:text-3xl">
                            {path.target_role}
                        </h2>
                        {path.summary ? (
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                {path.summary}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3 self-start rounded-xl bg-[#F4F8FF] px-4 py-3">
                        <div className="text-3xl font-extrabold text-emerald-600">
                            {matchScore}%
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.18em] text-[#64748B] uppercase">
                                {t('candidate.career_paths.match_score')}
                            </p>
                            <p className="text-xs text-[#64748b]">
                                {t('candidate.career_paths.match_score_help')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {path.growth_potential ? (
                        <InfoTile
                            label={t('candidate.career_paths.growth_potential')}
                            value={path.growth_potential}
                            icon={TrendingUp}
                        />
                    ) : null}
                    {path.salary_range ? (
                        <InfoTile
                            label={t('candidate.career_paths.salary_estimate')}
                            value={path.salary_range}
                            icon={DollarSign}
                        />
                    ) : null}
                </div>

                {path.key_gap_insight ? (
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <Lightbulb className="size-5 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-700 uppercase">
                                {t('candidate.career_paths.key_gap_insight')}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-amber-900">
                                {path.key_gap_insight}
                            </p>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function InfoTile({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: typeof TrendingUp;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-[#E5EDF7] bg-[#F4F8FF] p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#F4F8FF] text-[#0F4C94]">
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#64748B] uppercase">
                    {label}
                </p>
                <p className="text-base font-bold text-[#0F2747]">{value}</p>
            </div>
        </div>
    );
}

function SkillGapCard({ path }: { path: CareerPathSummary | CareerPathDetail }) {
    const { t } = useTranslate();

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-5 p-5 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#eef9f1] text-emerald-600">
                        <Brain className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#0F2747]">
                            {t('candidate.career_paths.skill_gap_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.career_paths.skill_gap_description')}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {path.skill_breakdown.map((skill, index) => {
                        const gap = Math.max(
                            0,
                            (skill.required_level ?? 0) - (skill.current_level ?? 0),
                        );

                        return (
                            <div key={`${skill.name}-${index}`} className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-[#0F2747]">
                                        {skill.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                                        <span className="font-semibold text-[#0F2747]">
                                            {skill.current_level ?? 0}%
                                        </span>
                                        <span aria-hidden="true">/</span>
                                        <span>
                                            {t('candidate.career_paths.target_short')}{' '}
                                            <span className="font-semibold text-emerald-600">
                                                {skill.required_level ?? 0}%
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#eef2f6]">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                                        style={{ width: `${skill.current_level ?? 0}%` }}
                                    />
                                    <div
                                        className="absolute inset-y-0 rounded-full bg-amber-300/80"
                                        style={{
                                            left: `${skill.current_level ?? 0}%`,
                                            width: `${gap}%`,
                                        }}
                                    />
                                </div>
                                {skill.note ? (
                                    <p className="text-xs text-muted-foreground">
                                        {skill.note}
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function LearningRecommendationCard({
    path,
}: {
    path: CareerPathSummary | CareerPathDetail;
}) {
    const { t } = useTranslate();

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-5 p-5 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#fff4e5] text-amber-600">
                        <BookOpen className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#0F2747]">
                            {t('candidate.career_paths.learning_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.career_paths.learning_description')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {path.learning_steps_data.map((step, index) => (
                        <div
                            key={`${step.title}-${index}`}
                            className="space-y-3 rounded-xl border border-[#E5EDF7] bg-white p-4 transition hover:border-[#C9DBF3] hover:shadow-sm"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-[#F4F8FF] text-[#0F4C94]">
                                <Workflow className="size-5" />
                            </div>
                            {step.tag ? (
                                <span className="inline-flex items-center text-[10px] font-bold tracking-[0.16em] text-[#0F4C94] uppercase">
                                    {step.tag}
                                </span>
                            ) : null}
                            <h4 className="text-base font-bold leading-snug text-[#0F2747]">
                                {step.title}
                            </h4>
                            {step.description ? (
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {step.description}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function LearningStepsCard({ steps }: { steps: LearningPathStep[] }) {
    const { t } = useTranslate();
    const completed = steps.filter((s) => s.status === 'completed').length;

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-4 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F4F8FF] text-[#0F4C94]">
                            <Star className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0F2747]">
                                {t('candidate.career_paths.tracker_title')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t('candidate.career_paths.tracker_description')}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">
                        {completed}/{steps.length}
                    </Badge>
                </div>

                <ol className="space-y-3">
                    {steps.map((step) => {
                        const isDone = step.status === 'completed';

                        return (
                            <li
                                key={step.id}
                                className={cn(
                                    'flex items-start justify-between gap-3 rounded-xl border p-4 transition',
                                    isDone
                                        ? 'border-emerald-200 bg-emerald-50/60'
                                        : 'border-[#E5EDF7] bg-white',
                                )}
                            >
                                <div className="flex flex-1 items-start gap-3">
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0F4C94] ring-1 ring-[#cfdcf5]">
                                        {step.order_number}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p
                                            className={cn(
                                                'text-sm font-semibold',
                                                isDone
                                                    ? 'text-emerald-700 line-through'
                                                    : 'text-[#0F2747]',
                                            )}
                                        >
                                            {step.title}
                                        </p>
                                        {step.description ? (
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                {step.description}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() =>
                                        router.patch(
                                            CandidateCareerPathController.toggleStep
                                                .url({ step: step.id }),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={cn(
                                        'shrink-0 gap-1.5 rounded-lg text-xs font-bold',
                                        isDone
                                            ? 'text-emerald-700 hover:bg-emerald-100/80'
                                            : 'text-[#0F4C94] hover:bg-[#F4F8FF]',
                                    )}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="size-4" />
                                    ) : (
                                        <Circle className="size-4" />
                                    )}
                                    {isDone
                                        ? t('candidate.career_paths.step_done')
                                        : t('candidate.career_paths.step_mark')}
                                </Button>
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}

function MilestoneCard({ milestones }: { milestones: Milestone[] }) {
    const { t } = useTranslate();

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-4 p-5 md:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#eef9f1] text-emerald-600">
                        <Map className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#0F2747]">
                            {t('candidate.career_paths.milestone_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.career_paths.milestone_description')}
                        </p>
                    </div>
                </div>

                <div className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-[#dbe4f3]">
                    {milestones.map((milestone, index) => (
                        <div key={`${milestone.title}-${index}`} className="relative">
                            <span className="absolute -left-[18px] top-1 flex size-3 items-center justify-center rounded-full bg-[#0F4C94] ring-4 ring-[#F4F8FF]" />
                            <p className="text-sm font-bold text-[#0F2747]">
                                {milestone.title}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                                {milestone.timeframe}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PathListColumn({
    paths,
    activeId,
    onSelect,
}: {
    paths: CareerPathSummary[];
    activeId: number | null;
    onSelect: (id: number) => void;
}) {
    const { t } = useTranslate();

    return (
        <Card className="border-[#E5EDF7]">
            <CardContent className="space-y-4 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-[#0F2747]">
                            {t('candidate.career_paths.list_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.career_paths.list_description')}
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">
                        {paths.length}
                    </Badge>
                </div>

                {paths.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#d6dfee] bg-[#F4F8FF] p-5 text-center">
                        <PlusCircle className="mx-auto size-6 text-[#0F4C94]" />
                        <p className="mt-2 text-sm font-semibold text-[#0F2747]">
                            {t('candidate.career_paths.list_empty')}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {paths.map((path) => {
                            const isActive = path.id === activeId;
                            return (
                                <li key={path.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(path.id)}
                                        className={cn(
                                            'group w-full rounded-xl border p-4 text-left transition',
                                            isActive
                                                ? 'border-[#0F4C94] bg-[#F4F8FF] shadow-sm'
                                                : 'border-[#E5EDF7] bg-white hover:border-[#C9DBF3]',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-1">
                                                <p className="truncate text-sm font-bold text-[#0F2747]">
                                                    {path.target_role}
                                                </p>
                                                {path.created_at ? (
                                                    <p className="text-[11px] font-medium text-muted-foreground">
                                                        {path.created_at}
                                                    </p>
                                                ) : null}
                                            </div>
                                            {path.match_score !== null &&
                                            path.match_score !== undefined ? (
                                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                                    {path.match_score}%
                                                </span>
                                            ) : null}
                                        </div>
                                        {path.summary ? (
                                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                {path.summary}
                                            </p>
                                        ) : null}
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {path.is_primary ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                    <BadgeCheck className="mr-1 size-3" />
                                                    {t('candidate.career_paths.list_active')}
                                                </Badge>
                                            ) : (
                                                <Link
                                                    href={
                                                        CandidateCareerPathController.activate
                                                            .url({ careerPath: path.id })
                                                    }
                                                    method="patch"
                                                    as="button"
                                                    preserveScroll
                                                    className="inline-flex items-center rounded-md bg-[#0F4C94] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#093579]"
                                                >
                                                    {t(
                                                        'candidate.career_paths.list_activate',
                                                    )}
                                                </Link>
                                            )}
                                            <Link
                                                href={
                                                    CandidateCareerPathController.destroy
                                                        .url({ careerPath: path.id })
                                                }
                                                method="delete"
                                                as="button"
                                                preserveScroll
                                                className="inline-flex items-center gap-1 rounded-md border border-[#f0d4d4] bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="size-3" />
                                                {t('candidate.career_paths.delete')}
                                            </Link>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

CandidateCareerPaths.layout = {
    breadcrumbs: [
        {
            title: 'Jalur Karir',
            href: index(),
        },
    ],
};
