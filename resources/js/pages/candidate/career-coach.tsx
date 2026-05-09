import { Form, Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Brain,
    DollarSign,
    Lightbulb,
    Loader2,
    Map,
    MoreHorizontal,
    Send,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Workflow,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import CandidateCareerCoachController from '@/actions/App/Http/Controllers/Candidate/CandidateCareerCoachController';
import { CareerModuleTabs } from '@/components/candidate/career-module-tabs';
import { CvReviewCard, type CvReview } from '@/components/candidate/cv-review-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index } from '@/routes/candidate/career-coach';
import { index as careerPathsIndex } from '@/routes/candidate/career-paths';

type CoachMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string | null;
};

type CoachSession = {
    id: number;
    title?: string | null;
    status: string;
    updated_at?: string | null;
};

type ActiveSession = {
    id: number;
    title?: string | null;
    status: string;
    messages: CoachMessage[];
};

type SkillBreakdown = {
    name: string;
    current_level: number;
    required_level: number;
    note?: string | null;
};

type LearningStep = {
    title: string;
    description?: string | null;
    tag?: string | null;
};

type TargetRecommendation = {
    id: number;
    title: string;
    target_role: string;
    match_score?: number | null;
    summary?: string | null;
    growth_potential?: string | null;
    salary_range?: string | null;
    key_gap_insight?: string | null;
    skill_breakdown: SkillBreakdown[];
    learning_steps: LearningStep[];
};

type CareerCoachProps = {
    sessions: CoachSession[];
    activeSession?: ActiveSession | null;
    targetRecommendation: TargetRecommendation | null;
    recommendations: Array<{
        id: number;
        title: string;
        match_score?: number | null;
    }>;
    quickPrompts: string[];
    aiEnabled: boolean;
    cvReview: CvReview;
};

export default function CandidateCareerCoach({
    sessions,
    activeSession,
    targetRecommendation,
    quickPrompts,
    aiEnabled,
    cvReview,
}: CareerCoachProps) {
    const { t } = useTranslate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages.length]);

    const hasMessages = (activeSession?.messages.length ?? 0) > 0;

    return (
        <>
            <Head title={t('candidate.career_coach.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.career_coach.page_title')}
                    description={t('candidate.career_coach.page_description')}
                />

                <CareerModuleTabs />

                {!aiEnabled ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                        {t('candidate.career_coach.ai_disabled')}
                    </div>
                ) : null}

                <CvReviewCard review={cvReview} />

                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <ChatPanel
                        activeSession={activeSession ?? null}
                        sessions={sessions}
                        hasMessages={hasMessages}
                        messagesEndRef={messagesEndRef}
                        quickPrompts={quickPrompts}
                    />
                    <RecommendationPanel target={targetRecommendation} />
                </div>
            </div>
        </>
    );
}

function ChatPanel({
    activeSession,
    sessions,
    hasMessages,
    messagesEndRef,
    quickPrompts,
}: {
    activeSession: ActiveSession | null;
    sessions: CoachSession[];
    hasMessages: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    quickPrompts: string[];
}) {
    const { t } = useTranslate();

    return (
        <Card
            className="flex h-[calc(100dvh-220px)] min-h-[560px] flex-col overflow-hidden border-[#e0e7f3] shadow-sm"
            aria-label={t('candidate.career_coach.chat_aria')}
        >
            <header className="flex items-center justify-between gap-3 border-b border-[#eef2f6] bg-white px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span
                        className="inline-flex size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
                        aria-hidden="true"
                    />
                    <h2 className="text-lg font-bold tracking-tight text-[#0f172a]">
                        {t('candidate.career_coach.chat_title')}
                    </h2>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-[#64748b] hover:bg-[#eef2f6]"
                    aria-label={t('candidate.career_coach.chat_more')}
                >
                    <MoreHorizontal className="size-5" />
                </Button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto bg-[#f7f9fc] px-5 py-5">
                {hasMessages && activeSession ? (
                    activeSession.messages.map((message) =>
                        message.role === 'user' ? (
                            <UserMessage key={message.id} message={message} />
                        ) : (
                            <AssistantMessage key={message.id} message={message} />
                        ),
                    )
                ) : (
                    <EmptyConversation />
                )}

                {hasMessages && quickPrompts.length > 0 ? (
                    <QuickPromptStrip
                        prompts={quickPrompts}
                        sessionId={activeSession?.id}
                    />
                ) : null}

                <div ref={messagesEndRef} />
            </div>

            <ChatComposer activeSession={activeSession} />

            {sessions.length > 1 ? (
                <div className="border-t border-[#eef2f6] bg-white px-5 py-3 text-xs text-muted-foreground">
                    {t('candidate.career_coach.session_count', {
                        count: String(sessions.length),
                    })}
                </div>
            ) : null}
        </Card>
    );
}

function EmptyConversation() {
    const { t } = useTranslate();

    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#cfd8e8] bg-white p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#eaf2ff] text-[#01296A]">
                <Sparkles className="size-6" />
            </div>
            <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0f172a]">
                    {t('candidate.career_coach.empty_title')}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    {t('candidate.career_coach.empty_conversation')}
                </p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
                <SuggestionPill
                    label={t('candidate.career_coach.suggestion_one')}
                />
                <SuggestionPill
                    label={t('candidate.career_coach.suggestion_two')}
                />
            </div>
        </div>
    );
}

function SuggestionPill({ label }: { label: string }) {
    return (
        <div className="rounded-xl border border-[#dde6f5] bg-[#eaf2ff] px-3 py-2.5 text-left text-xs font-semibold text-[#01296A]">
            {label}
        </div>
    );
}

function UserMessage({ message }: { message: CoachMessage }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] space-y-1">
                <div className="rounded-2xl rounded-tr-sm bg-[#01296A] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    {message.content}
                </div>
                {message.created_at ? (
                    <p className="pr-1 text-right text-[10px] font-medium tracking-wide text-muted-foreground">
                        {message.created_at}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function AssistantMessage({ message }: { message: CoachMessage }) {
    const { t } = useTranslate();

    return (
        <div className="flex justify-start">
            <div className="flex w-full max-w-[88%] gap-3">
                <span
                    className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[#01296A]"
                    aria-hidden="true"
                >
                    <Sparkles className="size-4" />
                </span>
                <div className="flex-1 space-y-1.5">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-[#01296A] uppercase">
                        {t('candidate.career_coach.assistant_label')}
                    </p>
                    <div className="space-y-2 rounded-2xl rounded-tl-sm border border-[#e6ebf3] bg-white px-4 py-3 text-sm leading-7 text-[#0f172a] shadow-sm">
                        {renderRichText(message.content)}
                    </div>
                    {message.created_at ? (
                        <p className="pl-1 text-[10px] font-medium tracking-wide text-muted-foreground">
                            {message.created_at}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function renderRichText(content: string) {
    const paragraphs = content.split(/\n{2,}/g);

    return paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
            {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
                const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);

                if (boldMatch) {
                    return (
                        <strong key={partIndex} className="font-bold text-[#01296A]">
                            {boldMatch[1]}
                        </strong>
                    );
                }

                return <span key={partIndex}>{part}</span>;
            })}
        </p>
    ));
}

function QuickPromptStrip({
    prompts,
    sessionId,
}: {
    prompts: string[];
    sessionId?: number;
}) {
    const sendPrompt = (content: string) => {
        router.post(
            CandidateCareerCoachController.message.url(),
            {
                session_id: sessionId,
                content,
            },
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-wrap gap-2 pl-11">
            {prompts.map((label, index) => (
                <button
                    key={`${label}-${index}`}
                    type="button"
                    onClick={() => sendPrompt(label)}
                    className="inline-flex items-center rounded-full border border-[#dbe4f3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#01296A] transition hover:border-[#01296A] hover:bg-[#eaf2ff]"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function ChatComposer({ activeSession }: { activeSession: ActiveSession | null }) {
    const { t } = useTranslate();

    return (
        <div className="border-t border-[#eef2f6] bg-white px-4 py-4 md:px-5">
            <Form
                {...CandidateCareerCoachController.message.form()}
                resetOnSuccess
                className="space-y-2"
            >
                {({ processing, errors }) => (
                    <>
                        {activeSession ? (
                            <input
                                type="hidden"
                                name="session_id"
                                value={activeSession.id}
                            />
                        ) : null}
                        <div className="flex items-end gap-2 rounded-2xl border border-[#dde6f5] bg-white px-3 py-2 shadow-xs focus-within:border-[#01296A] focus-within:ring-2 focus-within:ring-[#01296A]/20">
                            <label htmlFor="career-coach-content" className="sr-only">
                                {t('candidate.career_coach.message_label')}
                            </label>
                            <textarea
                                id="career-coach-content"
                                name="content"
                                rows={1}
                                placeholder={t(
                                    'candidate.career_coach.composer_placeholder',
                                )}
                                className="min-h-9 max-h-32 flex-1 resize-none border-0 bg-transparent text-sm leading-6 text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:ring-0"
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' &&
                                        !event.shiftKey &&
                                        !processing
                                    ) {
                                        event.preventDefault();
                                        event.currentTarget.form?.requestSubmit();
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={processing}
                                aria-label={t('candidate.career_coach.send_message')}
                                className="size-10 shrink-0 rounded-xl bg-[#01296A] text-white hover:bg-[#001D4D] disabled:opacity-60"
                            >
                                {processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                            </Button>
                        </div>
                        {errors.content ? (
                            <p
                                role="alert"
                                className="text-xs font-medium text-rose-600"
                            >
                                {errors.content}
                            </p>
                        ) : null}
                        <p className="text-[11px] leading-5 text-muted-foreground">
                            {t('candidate.career_coach.disclaimer')}
                        </p>
                    </>
                )}
            </Form>
        </div>
    );
}

function RecommendationPanel({ target }: { target: TargetRecommendation | null }) {
    const { t } = useTranslate();

    if (!target) {
        return <RecommendationEmpty />;
    }

    const matchScore = target.match_score ?? 0;

    return (
        <div className="space-y-5">
            <Card className="overflow-hidden border-[#e0e7f3] shadow-sm">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <Badge className="bg-emerald-100 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-emerald-700 uppercase hover:bg-emerald-100">
                        <Target className="mr-1 size-3.5" />
                        {t('candidate.career_coach.target_recommendation')}
                    </Badge>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] md:text-4xl">
                                {target.target_role}
                            </h2>
                            {target.title && target.title !== target.target_role ? (
                                <p className="text-base font-semibold text-[#01296A]">
                                    ({target.title})
                                </p>
                            ) : null}
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-extrabold leading-none text-emerald-600 md:text-4xl">
                                {matchScore}%
                            </p>
                            <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[#64748b] uppercase">
                                {t('candidate.career_coach.match_score')}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-[1.55fr_minmax(220px,1fr)]">
                        <div className="space-y-4 rounded-2xl bg-white p-1">
                            <div className="space-y-3 rounded-2xl bg-[#f7f9fc] p-5">
                                <div className="flex items-center gap-2 text-[#0f172a]">
                                    <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <Star className="size-4" fill="currentColor" />
                                    </span>
                                    <h3 className="text-base font-bold">
                                        {t('candidate.career_coach.why_path')}
                                    </h3>
                                </div>
                                <p className="text-sm leading-7 text-[#1f2937]">
                                    {target.summary ??
                                        t('candidate.career_coach.why_path_fallback')}
                                </p>
                                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                    {target.growth_potential ? (
                                        <StatTile
                                            label={t(
                                                'candidate.career_coach.growth_potential',
                                            )}
                                            value={target.growth_potential}
                                            tone="growth"
                                        />
                                    ) : null}
                                    {target.salary_range ? (
                                        <StatTile
                                            label={t(
                                                'candidate.career_coach.salary_estimate',
                                            )}
                                            value={target.salary_range}
                                            tone="salary"
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <SkillGapAside target={target} />
                    </div>
                </CardContent>
            </Card>

            {target.learning_steps.length > 0 ? (
                <Card className="border-[#e0e7f3]">
                    <CardContent className="space-y-5 p-5 md:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff4e5] text-amber-600">
                                    <BookOpen className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0f172a]">
                                        {t('candidate.career_coach.bridge_title')}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('candidate.career_coach.bridge_description')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={careerPathsIndex()}
                                className="hidden text-xs font-bold text-[#01296A] hover:underline md:inline"
                            >
                                {t('candidate.career_coach.see_full_path')} →
                            </Link>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            {target.learning_steps
                                .slice(0, 3)
                                .map((step, index) => (
                                    <LearningCard
                                        key={`${step.title}-${index}`}
                                        step={step}
                                        index={index}
                                    />
                                ))}
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

function StatTile({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'growth' | 'salary';
}) {
    const Icon = tone === 'growth' ? TrendingUp : DollarSign;

    return (
        <div className="rounded-2xl bg-[#eaf2ff] p-4">
            <div className="flex items-center gap-2 text-[#01296A]">
                <Icon className="size-4" />
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase">
                    {label}
                </p>
            </div>
            <p className="mt-3 text-xl font-extrabold leading-tight text-[#01296A] md:text-2xl">
                {value}
            </p>
        </div>
    );
}

function SkillGapAside({ target }: { target: TargetRecommendation }) {
    const { t } = useTranslate();

    return (
        <aside className="space-y-4 rounded-2xl bg-[#eaf2ff] p-5">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold leading-snug text-[#0f172a]">
                    {t('candidate.career_coach.skill_gap_title')}
                </h3>
                <span className="flex size-7 items-center justify-center rounded-md bg-white text-[#01296A]">
                    <BarChart3 className="size-4" />
                </span>
            </div>

            {target.skill_breakdown.length > 0 ? (
                <ul className="space-y-3">
                    {target.skill_breakdown.slice(0, 3).map((skill) => {
                        const current = clampPercent(skill.current_level);
                        const required = clampPercent(skill.required_level);
                        const isCritical = current < 50 && required - current >= 30;

                        return (
                            <li key={skill.name} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-[#0f172a]">
                                        {skill.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-sm font-bold tabular-nums',
                                            isCritical
                                                ? 'text-rose-600'
                                                : 'text-emerald-600',
                                        )}
                                    >
                                        {current}%
                                    </span>
                                </div>
                                <div
                                    className="relative h-2 overflow-hidden rounded-full bg-white"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={current}
                                    aria-label={t(
                                        'candidate.career_coach.skill_progress_aria',
                                        { skill: skill.name },
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute inset-y-0 left-0 rounded-full',
                                            isCritical
                                                ? 'bg-rose-500'
                                                : 'bg-emerald-500',
                                        )}
                                        style={{ width: `${current}%` }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-xs leading-5 text-muted-foreground">
                    {t('candidate.career_coach.skill_gap_empty')}
                </p>
            )}

            {target.key_gap_insight ? (
                <div className="flex gap-2 rounded-xl bg-white/80 p-3 text-xs italic leading-5 text-[#1f2937]">
                    <Lightbulb className="size-4 shrink-0 text-amber-500" />
                    <span>&ldquo;{target.key_gap_insight}&rdquo;</span>
                </div>
            ) : null}
        </aside>
    );
}

function LearningCard({ step, index }: { step: LearningStep; index: number }) {
    const Icon = pickLearningIcon(index);

    return (
        <article className="space-y-3 rounded-2xl border border-[#e6ebf3] bg-white p-4 transition hover:border-[#bcd0f0] hover:shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#01296A]">
                <Icon className="size-5" />
            </span>
            {step.tag ? (
                <span className="block text-[10px] font-bold tracking-[0.18em] text-[#01296A] uppercase">
                    {step.tag}
                </span>
            ) : null}
            <h4 className="text-base font-bold leading-snug text-[#0f172a]">
                {step.title}
            </h4>
            {step.description ? (
                <p className="text-xs leading-5 text-muted-foreground line-clamp-3">
                    {step.description}
                </p>
            ) : null}
        </article>
    );
}

function RecommendationEmpty() {
    const { t } = useTranslate();

    return (
        <Card className="flex h-full items-center justify-center border-dashed border-[#cfd8e8] py-16">
            <CardContent className="max-w-md space-y-3 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf2ff] text-[#01296A]">
                    <Map className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">
                    {t('candidate.career_coach.target_empty_title')}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    {t('candidate.career_coach.target_empty_description')}
                </p>
                <Link
                    href={careerPathsIndex()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#01296A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#001D4D]"
                >
                    <Sparkles className="size-4" />
                    {t('candidate.career_coach.target_empty_cta')}
                </Link>
            </CardContent>
        </Card>
    );
}

function clampPercent(value: number | null | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
}

function pickLearningIcon(index: number) {
    const icons = [Brain, BarChart3, Workflow];
    return icons[index % icons.length];
}

CandidateCareerCoach.layout = {
    breadcrumbs: [
        {
            title: 'Career Coach',
            href: index(),
        },
    ],
};
