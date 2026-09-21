import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Brain,
    Briefcase,
    ChevronDown,
    FileText,
    Lightbulb,
    PlayCircle,
    RotateCcw,
    Sparkles,
    Target,
    ThumbsUp,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import {
    index as aiInterviewIndex,
    show as showInterview,
} from '@/routes/candidate/ai-interviews';
import { show as showCareerResource } from '@/routes/candidate/career-resources';

const RESOURCE_TYPE_ICONS = {
    article: BookOpen,
    video: PlayCircle,
    template: FileText,
    guide: BookOpen,
} as const;

type FeedbackPageProps = {
    session: {
        id: number;
        application_id?: number | null;
        practice_mode: 'interview' | 'skill_drill';
        target_skill?: string | null;
        skill_level?: string | null;
        drill_format?: string | null;
        candidate_name?: string | null;
        job_title?: string | null;
        company?: string | null;
        completed_at?: string | null;
        fit_score?: number | null;
        recommendation?: string | null;
        summary?: string | null;
        strengths: string[];
        weaknesses: string[];
        competency_scores?: {
            communication: number;
            technical_depth: number;
            problem_solving: number;
            cultural_fit: number;
            confidence: number;
        } | null;
        improvement_tips: string[];
        category_scores: Array<{
            category: string;
            average_score?: number | null;
            answered_count: number;
            priority_rank: number;
        }>;
        question_feedbacks: Array<{
            question?: string | null;
            category?: string | null;
            answer?: string | null;
            score?: number | null;
            analysis?: string | null;
        }>;
        recording_url?: string | null;
    };
    progress_trends: {
        categories: string[];
        points: Array<{
            session_id: number;
            label: string;
            fit_score?: number | null;
            category_scores: Record<string, number | null>;
        }>;
    };
    resources: Array<{
        id: number;
        title: string;
        slug: string;
        type: string;
        category?: string | null;
        thumbnail_path?: string | null;
    }>;
};

export default function CandidateAiInterviewFeedback({
    session,
    progress_trends: progressTrends,
    resources,
}: FeedbackPageProps) {
    const { t } = useTranslate();
    const isSkillDrill = session.practice_mode === 'skill_drill';
    const fitScore = Math.max(0, Math.min(100, session.fit_score ?? 0));
    const totalQuestions = session.question_feedbacks.length;
    const answeredCount = session.question_feedbacks.filter(
        (item) => item.score !== null && item.score !== undefined,
    ).length;
    const avgScore =
        answeredCount > 0
            ? Math.round(
                  session.question_feedbacks.reduce(
                      (sum, item) => sum + (item.score ?? 0),
                      0,
                  ) / answeredCount,
              )
            : null;

    const sortedCategories = [...session.category_scores].sort(
        (a, b) => (b.average_score ?? 0) - (a.average_score ?? 0),
    );
    const strongestCategories = sortedCategories
        .filter((c) => (c.average_score ?? 0) >= 70)
        .slice(0, 3);
    const weakestCategories = sortedCategories
        .filter((c) => (c.average_score ?? 0) < 70)
        .slice(-3)
        .reverse();

    const firstWeakCategory =
        session.category_scores.find((item) => item.priority_rank === 1)
            ?.category ?? 'mixed';
    const retryFocus = focusFromCategory(firstWeakCategory);

    const retryUrl = isSkillDrill
        ? aiInterviewIndex().url + '?tab=skill'
        : aiInterviewIndex({
              query: session.application_id
                  ? {
                        application_id: session.application_id,
                        interview_focus: retryFocus,
                        question_count: 5,
                        duration_minutes: 30,
                    }
                  : { interview_focus: retryFocus, question_count: 5 },
          }).url;

    const sessionTitle = isSkillDrill
        ? t('candidate.ai_interview_feedback.skill_drill_title', {
              skill: session.target_skill ?? t('candidate.ai_interview_feedback.default_skill'),
          })
        : session.job_title
          ? `${session.job_title}${session.company ? ` · ${session.company}` : ''}`
          : t('candidate.ai_interview_feedback.general_practice');

    return (
        <>
            <Head title={t('candidate.ai_interview_feedback.page_title')} />

            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto max-w-5xl space-y-5">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <Link
                            href={aiInterviewIndex().url}
                            className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                            <ArrowRight className="size-3.5 rotate-180" />
                            {t('candidate.ai_interview_feedback.back_to_simulator')}
                        </Link>
                        <span aria-hidden>•</span>
                        <span>
                            {session.completed_at
                                ? t('candidate.ai_interview_feedback.completed_at', {
                                      date: session.completed_at,
                                  })
                                : t('candidate.ai_interview_feedback.completed')}
                        </span>
                    </div>

                    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0F4C94] to-[#136BB4] text-white shadow-lg">
                        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-8">
                            <ScoreCircle score={fitScore} />
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="border-0 bg-white/15 text-white">
                                        {isSkillDrill ? (
                                            <>
                                                <Brain className="mr-1 size-3" />
                                                {t('candidate.ai_interview_feedback.skill_drill')}
                                            </>
                                        ) : (
                                            <>
                                                <Briefcase className="mr-1 size-3" />
                                                {t('candidate.ai_interview_feedback.mock_interview')}
                                            </>
                                        )}
                                    </Badge>
                                    <Badge className="border-0 bg-white/15 text-white capitalize">
                                        {scoreLabel(fitScore, t)}
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                                    {t('candidate.ai_interview_feedback.session_done_heading', {
                                        name: session.candidate_name ?? t('candidate.ai_interview_feedback.default_candidate'),
                                    })}
                                </h1>
                                <p className="text-sm text-white/80">
                                    {sessionTitle}
                                </p>
                                <div className="grid grid-cols-3 gap-2 pt-2 md:max-w-md">
                                    <Stat
                                        label={t('candidate.ai_interview_feedback.stat_questions')}
                                        value={totalQuestions}
                                    />
                                    <Stat
                                        label={t('candidate.ai_interview_feedback.stat_answered')}
                                        value={answeredCount}
                                    />
                                    <Stat
                                        label={t('candidate.ai_interview_feedback.stat_average')}
                                        value={avgScore !== null ? `${avgScore}` : '—'}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {session.recording_url && (
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PlayCircle className="size-4 text-primary" />
                                    {t('candidate.ai_interview_feedback.recording_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-5">
                                <video
                                    src={session.recording_url}
                                    controls
                                    controlsList="nodownload"
                                    className="w-full rounded-xl bg-black"
                                    style={{ maxHeight: '480px' }}
                                >
                                    {t('candidate.ai_interview_feedback.video_unsupported')}
                                </video>
                            </CardContent>
                        </Card>
                    )}

                    {session.summary || session.recommendation ? (
                        <Card>
                            <CardContent className="flex gap-3 py-5">
                                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0F4C94]/10">
                                    <Sparkles className="size-4 text-[#0F4C94]" />
                                </span>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold tracking-[0.2em] text-[#0F4C94] uppercase">
                                        {t('candidate.ai_interview_feedback.ai_notes')}
                                    </p>
                                    {session.summary ? (
                                        <p className="text-sm leading-6 text-foreground/80">
                                            {session.summary}
                                        </p>
                                    ) : null}
                                    {session.recommendation ? (
                                        <p className="text-sm leading-6 font-medium text-foreground">
                                            {session.recommendation}
                                        </p>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-emerald-200 bg-emerald-50/40">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ThumbsUp className="size-4 text-emerald-600" />
                                    {t('candidate.ai_interview_feedback.strengths_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {strongestCategories.length > 0 ? (
                                    strongestCategories.map((item) => (
                                        <ScoreRow
                                            key={`strong-${item.category}`}
                                            label={formatReadableLabel(
                                                item.category,
                                            )}
                                            score={item.average_score ?? 0}
                                            tone="positive"
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('candidate.ai_interview_feedback.strengths_empty')}
                                    </p>
                                )}
                                {session.strengths.length > 0 ? (
                                    <ul className="space-y-1.5 pt-2 text-sm leading-6">
                                        {session.strengths
                                            .slice(0, 4)
                                            .map((item, index) => (
                                                <li
                                                    key={`strength-${index}`}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span
                                                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500"
                                                        aria-hidden
                                                    />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                    </ul>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card className="border-amber-200 bg-amber-50/40">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Target className="size-4 text-amber-600" />
                                    {t('candidate.ai_interview_feedback.weaknesses_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {weakestCategories.length > 0 ? (
                                    weakestCategories.map((item) => (
                                        <ScoreRow
                                            key={`weak-${item.category}`}
                                            label={formatReadableLabel(
                                                item.category,
                                            )}
                                            score={item.average_score ?? 0}
                                            tone="warning"
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('candidate.ai_interview_feedback.weaknesses_empty')}
                                    </p>
                                )}
                                {session.weaknesses.length > 0 ? (
                                    <ul className="space-y-1.5 pt-2 text-sm leading-6">
                                        {session.weaknesses
                                            .slice(0, 4)
                                            .map((item, index) => (
                                                <li
                                                    key={`weakness-${index}`}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span
                                                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500"
                                                        aria-hidden
                                                    />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                    </ul>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    {session.competency_scores ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Brain className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.competency_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CompetencyBreakdown
                                    scores={session.competency_scores}
                                />
                            </CardContent>
                        </Card>
                    ) : null}

                    {session.improvement_tips.length > 0 ? (
                        <Card className="border-[#0F4C94]/15 bg-[#eff4ff]/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Lightbulb className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.improvement_tips_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-2.5">
                                    {session.improvement_tips.map((tip, index) => (
                                        <li
                                            key={`tip-${index}`}
                                            className="flex items-start gap-3 text-sm leading-6"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0F4C94] text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <span className="pt-0.5">{tip}</span>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    ) : null}

                    {session.category_scores.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.category_breakdown_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {session.category_scores.map(
                                        (scoreItem) => (
                                            <CategoryCard
                                                key={scoreItem.category}
                                                item={scoreItem}
                                            />
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {session.question_feedbacks.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Lightbulb className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.question_feedback_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {session.question_feedbacks.map(
                                    (feedback, index) => (
                                        <QuestionFeedbackItem
                                            key={`q-${index}`}
                                            index={index + 1}
                                            feedback={feedback}
                                        />
                                    ),
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    {progressTrends.points.length > 1 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.progress_trends_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProgressTrendChart
                                    points={progressTrends.points}
                                    categories={progressTrends.categories}
                                />
                            </CardContent>
                        </Card>
                    ) : null}

                    {resources.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BookOpen className="size-4 text-[#0F4C94]" />
                                    {t('candidate.ai_interview_feedback.suggested_resources_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {resources.map((resource) => (
                                    <EducationResourceCard
                                        key={resource.id}
                                        resource={resource}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="border-[#0F4C94]/15 bg-gradient-to-br from-[#eff4ff] to-background">
                        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <p className="text-base font-semibold">
                                    {t('candidate.ai_interview_feedback.cta_title')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {weakestCategories.length > 0
                                        ? t('candidate.ai_interview_feedback.cta_focus_area', {
                                              area: formatReadableLabel(weakestCategories[0]?.category ?? ''),
                                          })
                                        : t('candidate.ai_interview_feedback.cta_try_other')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild size="lg">
                                    <Link href={retryUrl}>
                                        <RotateCcw className="size-4" />
                                        {t('candidate.ai_interview_feedback.retry_button')}
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href={showInterview(session.id).url}>
                                        {t('candidate.ai_interview_feedback.detail_button')}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function ScoreCircle({ score }: { score: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative mx-auto size-32 md:size-36">
            <svg viewBox="0 0 120 120" className="-rotate-90">
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="10"
                    fill="none"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl leading-none font-black md:text-5xl">
                    {score}
                </span>
                <span className="mt-0.5 text-[10px] tracking-[0.2em] text-white/70 uppercase">
                    / 100
                </span>
            </div>
        </div>
    );
}

function Stat({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-lg bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold leading-tight">{value}</p>
            <p className="text-[10px] tracking-wider text-white/70 uppercase">
                {label}
            </p>
        </div>
    );
}

function ScoreRow({
    label,
    score,
    tone,
}: {
    label: string;
    score: number;
    tone: 'positive' | 'warning';
}) {
    const trackClass =
        tone === 'positive' ? 'bg-emerald-100' : 'bg-amber-100';
    const fillClass =
        tone === 'positive' ? 'bg-emerald-500' : 'bg-amber-500';
    const scoreClass =
        tone === 'positive' ? 'text-emerald-700' : 'text-amber-700';
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium capitalize">{label}</span>
                <span className={cn('font-semibold', scoreClass)}>
                    {score}
                </span>
            </div>
            <div className={cn('h-1.5 w-full rounded-full', trackClass)}>
                <div
                    className={cn('h-full rounded-full transition-all', fillClass)}
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                />
            </div>
        </div>
    );
}

function CompetencyBreakdown({
    scores,
}: {
    scores: NonNullable<FeedbackPageProps['session']['competency_scores']>;
}) {
    const { t } = useTranslate();
    const dimensions: Array<{ key: keyof typeof scores; label: string }> = [
        {
            key: 'communication',
            label: t('candidate.ai_interview_feedback.competency_communication'),
        },
        {
            key: 'technical_depth',
            label: t('candidate.ai_interview_feedback.competency_technical_depth'),
        },
        {
            key: 'problem_solving',
            label: t('candidate.ai_interview_feedback.competency_problem_solving'),
        },
        {
            key: 'cultural_fit',
            label: t('candidate.ai_interview_feedback.competency_cultural_fit'),
        },
        {
            key: 'confidence',
            label: t('candidate.ai_interview_feedback.competency_confidence'),
        },
    ];

    return (
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {dimensions.map((dimension) => {
                const score = Math.max(
                    0,
                    Math.min(100, scores[dimension.key] ?? 0),
                );
                const fillClass =
                    score >= 80
                        ? 'bg-emerald-500'
                        : score >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500';
                const scoreClass =
                    score >= 80
                        ? 'text-emerald-700'
                        : score >= 60
                          ? 'text-amber-700'
                          : 'text-rose-700';

                return (
                    <div key={dimension.key} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{dimension.label}</span>
                            <span className={cn('font-bold', scoreClass)}>
                                {score}
                                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                                    /100
                                </span>
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    fillClass,
                                )}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CategoryCard({
    item,
}: {
    item: FeedbackPageProps['session']['category_scores'][number];
}) {
    const { t } = useTranslate();
    const score = Math.max(0, Math.min(100, item.average_score ?? 0));
    const tone =
        score >= 80 ? 'good' : score >= 60 ? 'medium' : 'low';
    const styles = {
        good: {
            border: 'border-emerald-200',
            bg: 'bg-emerald-50/40',
            track: 'bg-emerald-100',
            fill: 'bg-emerald-500',
            text: 'text-emerald-700',
        },
        medium: {
            border: 'border-amber-200',
            bg: 'bg-amber-50/40',
            track: 'bg-amber-100',
            fill: 'bg-amber-500',
            text: 'text-amber-700',
        },
        low: {
            border: 'border-rose-200',
            bg: 'bg-rose-50/40',
            track: 'bg-rose-100',
            fill: 'bg-rose-500',
            text: 'text-rose-700',
        },
    }[tone];

    return (
        <div className={cn('rounded-lg border p-3', styles.border, styles.bg)}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {formatReadableLabel(item.category)}
                </p>
                {item.priority_rank <= 2 ? (
                    <Badge variant="outline" className="text-[10px]">
                        #{item.priority_rank}
                    </Badge>
                ) : null}
            </div>
            <p
                className={cn(
                    'mt-2 text-2xl font-bold leading-none',
                    styles.text,
                )}
            >
                {item.average_score ?? '—'}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                    /100
                </span>
            </p>
            <div className={cn('mt-3 h-1.5 rounded-full', styles.track)}>
                <div
                    className={cn(
                        'h-full rounded-full transition-all',
                        styles.fill,
                    )}
                    style={{ width: `${score}%` }}
                />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
                {t('candidate.ai_interview_feedback.answers_rated', {
                    count: item.answered_count,
                })}
            </p>
        </div>
    );
}

function QuestionFeedbackItem({
    index,
    feedback,
}: {
    index: number;
    feedback: FeedbackPageProps['session']['question_feedbacks'][number];
}) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const score = feedback.score ?? null;
    const scoreClass =
        score === null
            ? 'bg-slate-100 text-slate-700'
            : score >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : score >= 60
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800';

    return (
        <div className="overflow-hidden rounded-lg border">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/40"
            >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index}
                </span>
                <p className="flex-1 text-sm leading-tight">
                    {feedback.question
                        ? stripHtml(feedback.question)
                        : t('candidate.ai_interview_feedback.question_unavailable')}
                </p>
                <span
                    className={cn(
                        'shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold',
                        scoreClass,
                    )}
                >
                    {score !== null ? `${score}` : '—'}
                </span>
                <ChevronDown
                    className={cn(
                        'size-4 shrink-0 text-muted-foreground transition',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open ? (
                <div className="space-y-3 border-t bg-muted/20 px-3 py-3 text-sm leading-6">
                    {feedback.category ? (
                        <Badge variant="outline" className="text-[10px] capitalize">
                            {formatReadableLabel(feedback.category)}
                        </Badge>
                    ) : null}
                    <div className="rounded-md border border-border/60 bg-background p-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('candidate.ai_interview_feedback.your_answer_label')}
                        </p>
                        <p className="whitespace-pre-line text-foreground/90">
                            {feedback.answer?.trim()
                                ? feedback.answer
                                : t('candidate.ai_interview_feedback.answer_unavailable')}
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('candidate.ai_interview_feedback.ai_feedback_label')}
                        </p>
                        <p className="text-foreground/80">
                            {feedback.analysis ||
                                t('candidate.ai_interview_feedback.analysis_unavailable')}
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ProgressTrendChart({
    points,
    categories,
}: {
    points: FeedbackPageProps['progress_trends']['points'];
    categories: FeedbackPageProps['progress_trends']['categories'];
}) {
    const { t } = useTranslate();
    const chartWidth = 760;
    const chartHeight = 220;
    const leftPad = 28;
    const rightPad = 16;
    const topPad = 16;
    const bottomPad = 30;
    const innerWidth = chartWidth - leftPad - rightPad;
    const innerHeight = chartHeight - topPad - bottomPad;
    const safeDivisor = Math.max(points.length - 1, 1);
    const colorPalette = ['#1D4ED8', '#EA580C', '#7C3AED', '#059669'];

    const getX = (i: number): number =>
        leftPad + (i / safeDivisor) * innerWidth;
    const getY = (value: number): number =>
        topPad + ((100 - value) / 100) * innerHeight;

    const fitSeries = points
        .map((point, index) =>
            point.fit_score === null || point.fit_score === undefined
                ? null
                : {
                      x: getX(index),
                      y: getY(point.fit_score),
                      value: point.fit_score,
                  },
        )
        .filter(
            (point): point is { x: number; y: number; value: number } =>
                point !== null,
        );

    const categorySeries = categories.map((category, categoryIndex) => {
        const pointsForCategory = points
            .map((point, index) => {
                const score = point.category_scores[category];
                return score === null || score === undefined
                    ? null
                    : { x: getX(index), y: getY(score), value: score };
            })
            .filter(
                (point): point is { x: number; y: number; value: number } =>
                    point !== null,
            );
        return {
            category,
            color: colorPalette[categoryIndex % colorPalette.length],
            points: pointsForCategory,
        };
    });

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border bg-background p-2">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-52 w-full min-w-[600px]"
                >
                    {[0, 25, 50, 75, 100].map((tick) => {
                        const y = getY(tick);
                        return (
                            <g key={`tick-${tick}`}>
                                <line
                                    x1={leftPad}
                                    y1={y}
                                    x2={chartWidth - rightPad}
                                    y2={y}
                                    stroke="#E2E8F0"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={4}
                                    y={y + 4}
                                    fontSize="10"
                                    fill="#64748B"
                                >
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {fitSeries.length > 1 ? (
                        <polyline
                            fill="none"
                            stroke="#0F4C94"
                            strokeWidth="2.5"
                            points={fitSeries
                                .map((point) => `${point.x},${point.y}`)
                                .join(' ')}
                        />
                    ) : null}

                    {fitSeries.map((point, index) => (
                        <circle
                            key={`fit-dot-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill="#0F4C94"
                        />
                    ))}

                    {categorySeries.map((series) =>
                        series.points.length > 1 ? (
                            <polyline
                                key={`line-${series.category}`}
                                fill="none"
                                stroke={series.color}
                                strokeWidth="1.5"
                                strokeDasharray="4 3"
                                points={series.points
                                    .map((point) => `${point.x},${point.y}`)
                                    .join(' ')}
                            />
                        ) : null,
                    )}

                    {categorySeries.map((series) =>
                        series.points.map((point, index) => (
                            <circle
                                key={`${series.category}-dot-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r="2.4"
                                fill={series.color}
                            />
                        )),
                    )}
                </svg>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                    <span
                        className="size-2 rounded-full bg-[#0F4C94]"
                        aria-hidden
                    />
                    {t('candidate.ai_interview_feedback.fit_score_legend')}
                </span>
                {categorySeries.map((series) => (
                    <span
                        key={`legend-${series.category}`}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 capitalize"
                    >
                        <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: series.color }}
                            aria-hidden
                        />
                        {formatReadableLabel(series.category)}
                    </span>
                ))}
            </div>
        </div>
    );
}

function EducationResourceCard({
    resource,
}: {
    resource: FeedbackPageProps['resources'][number];
}) {
    const { t } = useTranslate();
    const Icon =
        RESOURCE_TYPE_ICONS[
            resource.type as keyof typeof RESOURCE_TYPE_ICONS
        ] ?? BookOpen;

    const resourceTypeLabels: Record<string, string> = {
        article: t('candidate.ai_interview_feedback.resource_type_article'),
        video: t('candidate.ai_interview_feedback.resource_type_video'),
        template: t('candidate.ai_interview_feedback.resource_type_template'),
        guide: t('candidate.ai_interview_feedback.resource_type_guide'),
    };

    const typeLabel =
        resourceTypeLabels[resource.type] ?? formatReadableLabel(resource.type);

    return (
        <Link
            href={showCareerResource(resource.slug)}
            className="group flex h-full items-start gap-3 rounded-lg border p-3 transition hover:border-[#0F4C94]/40 hover:shadow-sm"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#0F4C94]/10 text-[#0F4C94]">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {typeLabel}
                </p>
                <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-[#0F4C94]">
                    {resource.title}
                </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-[#0F4C94]" />
        </Link>
    );
}

function formatReadableLabel(value: string): string {
    return value
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function stripHtml(value: string): string {
    return value
        // Remove complete HTML tags first
        .replace(/<\/?[a-zA-Z][^<>]*>/g, ' ')
        // Remove dangling/truncated tag fragments like "<st" or "<strong data-start"
        .replace(/<\/?[a-zA-Z][^<>]*$/g, ' ')
        // Remove leftover tag-opener fragments mid-string
        .replace(/<\/?[a-zA-Z][^\s<>]*\b/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

function focusFromCategory(category: string): string {
    switch (category) {
        case 'technical':
            return 'technical';
        case 'behavioral':
            return 'behavioral';
        case 'case_study':
        case 'problem_solving':
            return 'case';
        default:
            return 'mixed';
    }
}

function scoreLabel(score: number, t: (key: string) => string): string {
    if (score >= 80) {
        return t('candidate.ai_interview_feedback.score_label_strong');
    }
    if (score >= 60) {
        return t('candidate.ai_interview_feedback.score_label_good');
    }
    return t('candidate.ai_interview_feedback.score_label_needs_improvement');
}

CandidateAiInterviewFeedback.layout = ({ session }: FeedbackPageProps) => ({
    breadcrumbs: [
        {
            title: 'AI Simulator',
            href: aiInterviewIndex(),
        },
        {
            title: 'Hasil Latihan',
            href: showInterview(session.id),
        },
    ],
});
