import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpen,
    Brain,
    Briefcase,
    ChevronDown,
    Clock,
    Code2,
    Cpu,
    Flame,
    History,
    ListChecks,
    Mic,
    Plus,
    Puzzle,
    Sparkles,
    Type,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import CandidateAiInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateAiInterviewController';
import { EmptyState } from '@/components/candidate/candidate-ui';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { history, index, show } from '@/routes/candidate/ai-interviews';

type Option = { value: string; label: string };
type DescribedOption = Option & { description?: string };

type QuickStartConfig = {
    practice_mode: 'interview';
    interview_mode?: string;
    interview_focus: string;
    candidate_level: string;
    question_count: number;
    duration_minutes: number;
};

type QuickStartPreset = {
    key: string;
    label: string;
    description: string;
    icon: 'flame' | 'users' | 'cpu' | 'puzzle';
    config: QuickStartConfig;
};

type ApplicationItem = {
    id: number;
    job_title?: string | null;
    company?: string | null;
    status: string;
};

type RecentSession = {
    id: number;
    practice_mode: 'interview' | 'skill_drill';
    target_skill?: string | null;
    skill_level?: string | null;
    drill_format?: string | null;
    job_title?: string | null;
    company?: string | null;
    status: string;
    interview_mode?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    is_employer_scheduled?: boolean;
};

type AiInterviewIndexProps = {
    applications: ApplicationItem[];
    recentSessions: RecentSession[];
    suggestedSkills: string[];
    candidateHeadline?: string | null;
    setup: {
        defaults: {
            application_id?: number | null;
            interview_mode: string;
            interview_language: string;
            interview_focus: string;
            candidate_level: string;
            question_count: number;
            duration_minutes: number;
            skill_level: string;
            drill_format: string;
        };
        options: {
            interview_modes: Option[];
            interview_languages: Option[];
            interview_focuses: Option[];
            candidate_levels: Option[];
            skill_levels: DescribedOption[];
            drill_formats: DescribedOption[];
            question_counts: number[];
            duration_minutes: number[];
            quick_starts: QuickStartPreset[];
            quota: {
                balance: number;
                expires_at: string | null;
                expires_label: string | null;
                topup_url: string;
            };
        };
    };
};

const quickStartIcons: Record<
    QuickStartPreset['icon'],
    ComponentType<{ className?: string }>
> = {
    flame: Flame,
    users: Users,
    cpu: Cpu,
    puzzle: Puzzle,
};

const drillFormatIcons: Record<
    string,
    ComponentType<{ className?: string }>
> = {
    concept: BookOpen,
    case: Puzzle,
    coding: Code2,
};

export default function CandidateAiInterviewIndex({
    applications,
    recentSessions,
    suggestedSkills,
    candidateHeadline,
    setup,
}: AiInterviewIndexProps) {
    const { t } = useTranslate();
    const storeUrl = CandidateAiInterviewController.store.form().action;

    return (
        <>
            <Head title={t('candidate.ai_interviews.title')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title={t('candidate.ai_interviews.title')}
                        description={t('candidate.ai_interviews.subtitle')}
                    />
                    <Button asChild variant="outline">
                        <Link href={history().url}>
                            <History className="size-4" />
                            {t('candidate.ai_interviews.btn_history')}
                        </Link>
                    </Button>
                </div>

                <div
                    className={cn(
                        'flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between',
                        setup.options.quota.balance < 1
                            ? 'border-destructive/40 bg-destructive/5'
                            : setup.options.quota.balance <= 2
                              ? 'border-orange-400/40 bg-orange-50 dark:bg-orange-950/20'
                              : 'border-primary/20 bg-primary/5',
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                'flex size-12 shrink-0 items-center justify-center rounded-full',
                                setup.options.quota.balance < 1
                                    ? 'bg-destructive/15 text-destructive'
                                    : setup.options.quota.balance <= 2
                                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-primary/10 text-primary',
                            )}
                        >
                            {setup.options.quota.balance < 1 ? (
                                <AlertCircle className="size-6" />
                            ) : setup.options.quota.balance <= 2 ? (
                                <Zap className="size-6" />
                            ) : (
                                <Zap className="size-6" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <p
                                className={cn(
                                    'text-base font-bold',
                                    setup.options.quota.balance < 1
                                        ? 'text-destructive'
                                        : setup.options.quota.balance <= 2
                                          ? 'text-orange-600 dark:text-orange-400'
                                          : 'text-primary',
                                )}
                            >
                                Sisa kuota simulasi:{' '}
                                <span className="text-2xl">{setup.options.quota.balance}x</span>
                            </p>
                            {setup.options.quota.expires_label ? (
                                <p className="text-sm text-muted-foreground">
                                    Berlaku sampai {setup.options.quota.expires_label}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {setup.options.quota.balance < 1
                                        ? 'Kuota habis. Topup untuk melanjutkan simulasi.'
                                        : 'Topup paket Jobseeker untuk 5x simulasi/bulan.'}
                                </p>
                            )}
                        </div>
                    </div>
                    {setup.options.quota.balance <= 2 ? (
                        <Button
                            asChild
                            size="default"
                            variant={setup.options.quota.balance < 1 ? 'destructive' : 'default'}
                            className="shrink-0"
                        >
                            <Link href={setup.options.quota.topup_url}>Topup Sekarang</Link>
                        </Button>
                    ) : null}
                </div>

                <Tabs defaultValue="interview">
                    <TabsList className="mb-4">
                        <TabsTrigger value="interview">
                            <Briefcase className="size-4" />
                            {t('candidate.ai_interviews.tab_mock')}
                        </TabsTrigger>
                        <TabsTrigger value="skill">
                            <Brain className="size-4" />
                            {t('candidate.ai_interviews.tab_skill')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="interview" className="space-y-5">
                        <MockInterviewSection
                            storeUrl={storeUrl}
                            applications={applications}
                            quickStarts={setup.options.quick_starts}
                            interviewLanguages={
                                setup.options.interview_languages
                            }
                            interviewFocuses={setup.options.interview_focuses}
                            candidateLevels={setup.options.candidate_levels}
                            interviewModes={setup.options.interview_modes}
                            questionCounts={setup.options.question_counts}
                            durationMinutes={setup.options.duration_minutes}
                            defaults={setup.defaults}
                            candidateHeadline={candidateHeadline}
                        />
                        <RecentSessionsCard sessions={recentSessions} />
                    </TabsContent>

                    <TabsContent value="skill">
                        <SkillDrillSection
                            storeUrl={storeUrl}
                            suggestedSkills={suggestedSkills}
                            skillLevels={setup.options.skill_levels}
                            drillFormats={setup.options.drill_formats}
                            interviewLanguages={
                                setup.options.interview_languages
                            }
                            questionCounts={setup.options.question_counts}
                            defaults={setup.defaults}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function MockInterviewSection({
    storeUrl,
    applications,
    quickStarts,
    interviewLanguages,
    interviewFocuses,
    candidateLevels,
    interviewModes,
    questionCounts,
    durationMinutes,
    defaults,
    candidateHeadline,
}: {
    storeUrl: string;
    applications: ApplicationItem[];
    quickStarts: QuickStartPreset[];
    interviewLanguages: Option[];
    interviewFocuses: Option[];
    candidateLevels: Option[];
    interviewModes: Option[];
    questionCounts: number[];
    durationMinutes: number[];
    defaults: AiInterviewIndexProps['setup']['defaults'];
    candidateHeadline?: string | null;
}) {
    const { t, locale } = useTranslate();
    const [showCustom, setShowCustom] = useState(false);

    return (
        <div className="space-y-5">
            <Card className="border-[#01296A]/15 bg-gradient-to-br from-[#eff4ff] to-background">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-[#01296A]" />
                        {t('candidate.ai_interviews.quickstart_title')}
                    </CardTitle>
                    <CardDescription>
                        {t('candidate.ai_interviews.quickstart_description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickStarts.map((preset) => (
                            <QuickStartCard
                                key={preset.key}
                                preset={preset}
                                storeUrl={storeUrl}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {t('candidate.ai_interviews.from_apps_title')}
                    </CardTitle>
                    <CardDescription>
                        {t('candidate.ai_interviews.from_apps_description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applications.length === 0 ? (
                        <EmptyState
                            title={t(
                                'candidate.ai_interviews.empty_apps_title',
                            )}
                            description={t(
                                'candidate.ai_interviews.empty_apps_description',
                            )}
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {applications.slice(0, 6).map((application) => (
                                <ApplicationStartCard
                                    key={application.id}
                                    application={application}
                                    storeUrl={storeUrl}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <button
                    type="button"
                    onClick={() => setShowCustom((value) => !value)}
                    className="flex w-full items-center justify-between rounded-t-xl px-6 py-4 text-left transition hover:bg-muted/40"
                >
                    <div className="space-y-0.5">
                        <p className="font-semibold">
                            {t('candidate.ai_interviews.custom_title')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('candidate.ai_interviews.custom_description')}
                        </p>
                    </div>
                    <ChevronDown
                        className={`size-4 shrink-0 transition ${showCustom ? 'rotate-180' : ''}`}
                    />
                </button>
                {showCustom ? (
                    <CardContent className="border-t pt-5">
                        <Form
                            action={storeUrl}
                            method="post"
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="practice_mode"
                                        value="interview"
                                    />

                                    {applications.length > 0 ? (
                                        <FormRow
                                            label={t(
                                                'candidate.ai_interviews.label_application_optional',
                                            )}
                                        >
                                            <select
                                                name="application_id"
                                                defaultValue={
                                                    defaults.application_id
                                                        ? String(
                                                              defaults.application_id,
                                                          )
                                                        : ''
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="">
                                                    {t(
                                                        'candidate.ai_interviews.option_general_practice',
                                                        {
                                                            role:
                                                                candidateHeadline ||
                                                                t(
                                                                    'candidate.ai_interviews.your_role',
                                                                ),
                                                        },
                                                    )}
                                                </option>
                                                {applications.map(
                                                    (application) => (
                                                        <option
                                                            key={application.id}
                                                            value={
                                                                application.id
                                                            }
                                                        >
                                                            {
                                                                application.job_title
                                                            }{' '}
                                                            —{' '}
                                                            {
                                                                application.company
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <FieldError
                                                message={errors.application_id}
                                            />
                                        </FormRow>
                                    ) : null}

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormRow
                                            label={t(
                                                'candidate.ai_interviews.label_focus',
                                            )}
                                        >
                                            <select
                                                name="interview_focus"
                                                defaultValue={
                                                    defaults.interview_focus
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {interviewFocuses.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </FormRow>
                                        <FormRow
                                            label={t(
                                                'candidate.ai_interviews.label_candidate_level',
                                            )}
                                        >
                                            <select
                                                name="candidate_level"
                                                defaultValue={
                                                    defaults.candidate_level
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {candidateLevels.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </FormRow>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <FormRow
                                            label={t(
                                                'candidate.ai_interviews.label_mode',
                                            )}
                                        >
                                            <select
                                                name="interview_mode"
                                                defaultValue={
                                                    defaults.interview_mode
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {interviewModes.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </FormRow>
                                        {/* Language picker hidden — auto-detected from user locale (navbar flag). */}
                                        <input
                                            type="hidden"
                                            name="interview_language"
                                            value={
                                                locale === 'en' ? 'en' : 'id'
                                            }
                                        />
                                        <FormRow
                                            label={t(
                                                'candidate.ai_interviews.label_duration',
                                            )}
                                        >
                                            <select
                                                name="duration_minutes"
                                                defaultValue={String(
                                                    defaults.duration_minutes,
                                                )}
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {durationMinutes.map(
                                                    (duration) => (
                                                        <option
                                                            key={duration}
                                                            value={duration}
                                                        >
                                                            {t(
                                                                'candidate.ai_interviews.minutes_short',
                                                                {
                                                                    minutes:
                                                                        duration,
                                                                },
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </FormRow>
                                    </div>

                                    <FormRow
                                        label={t(
                                            'candidate.ai_interviews.label_question_count',
                                        )}
                                    >
                                        <PillRadio
                                            name="question_count"
                                            options={questionCounts.map(
                                                (count) => ({
                                                    value: String(count),
                                                    label: t(
                                                        'candidate.ai_interviews.questions_count',
                                                        { count },
                                                    ),
                                                }),
                                            )}
                                            defaultValue={String(
                                                defaults.question_count,
                                            )}
                                        />
                                    </FormRow>

                                    <Button disabled={processing}>
                                        <ListChecks className="size-4" />
                                        {processing
                                            ? t(
                                                  'candidate.ai_interviews.btn_starting',
                                              )
                                            : t(
                                                  'candidate.ai_interviews.btn_start_custom',
                                              )}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                ) : null}
            </Card>
        </div>
    );
}

function QuickStartCard({
    preset,
    storeUrl,
}: {
    preset: QuickStartPreset;
    storeUrl: string;
}) {
    const { t } = useTranslate();
    const Icon = quickStartIcons[preset.icon] ?? Sparkles;
    const form = useForm<QuickStartConfig>(preset.config);

    return (
        <button
            type="button"
            onClick={() => form.post(storeUrl, { preserveScroll: false })}
            disabled={form.processing}
            className="group flex h-full flex-col gap-3 rounded-lg border bg-background p-4 text-left transition hover:border-[#01296A]/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
            <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#01296A]/10 p-2 text-[#01296A]">
                    <Icon className="size-4" />
                </span>
                <p className="text-sm font-semibold">{preset.label}</p>
            </div>
            <p className="flex-1 text-xs text-muted-foreground">
                {preset.description}
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-[#01296A] group-hover:underline">
                {form.processing
                    ? t('candidate.ai_interviews.btn_starting')
                    : t('candidate.ai_interviews.btn_start')}
                <span aria-hidden>→</span>
            </div>
        </button>
    );
}

function ApplicationStartCard({
    application,
    storeUrl,
}: {
    application: ApplicationItem;
    storeUrl: string;
}) {
    const { t } = useTranslate();
    const [mode, setMode] = useState<'voice' | 'text'>('voice');

    return (
        <Form
            action={storeUrl}
            method="post"
            className="flex h-full flex-col gap-3 rounded-lg border p-4 transition hover:border-[#01296A]/40 hover:shadow-sm"
        >
            {({ processing }) => (
                <>
                    <input
                        type="hidden"
                        name="practice_mode"
                        value="interview"
                    />
                    <input
                        type="hidden"
                        name="application_id"
                        value={application.id}
                    />
                    <input type="hidden" name="interview_focus" value="mixed" />
                    <input type="hidden" name="question_count" value="5" />
                    <input type="hidden" name="interview_mode" value={mode} />

                    <div className="space-y-1">
                        <p className="leading-tight font-semibold">
                            {application.job_title ||
                                t('candidate.ai_interviews.fallback_position')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {application.company ||
                                t('candidate.ai_interviews.fallback_company')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="capitalize">
                            {application.status}
                        </Badge>
                    </div>
                    <div className="mt-auto space-y-2">
                        <div className="inline-flex rounded-md border p-0.5">
                            {(['voice', 'text'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setMode(option)}
                                    className={cn(
                                        'flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition',
                                        mode === option
                                            ? 'bg-[#01296A] text-white'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {option === 'voice' ? (
                                        <Mic className="size-3" />
                                    ) : (
                                        <Type className="size-3" />
                                    )}
                                    {option === 'voice'
                                        ? t(
                                              'candidate.ai_interviews.mode_voice_short',
                                          )
                                        : t(
                                              'candidate.ai_interviews.mode_text_short',
                                          )}
                                </button>
                            ))}
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            className="self-start"
                        >
                            {processing
                                ? t('candidate.ai_interviews.btn_starting')
                                : t('candidate.ai_interviews.btn_practice_role')}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function SkillDrillSection({
    storeUrl,
    suggestedSkills,
    skillLevels,
    drillFormats,
    interviewLanguages,
    questionCounts,
    defaults,
}: {
    storeUrl: string;
    suggestedSkills: string[];
    skillLevels: DescribedOption[];
    drillFormats: DescribedOption[];
    interviewLanguages: Option[];
    questionCounts: number[];
    defaults: AiInterviewIndexProps['setup']['defaults'];
}) {
    const { t } = useTranslate();
    const [skill, setSkill] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [skillLevel, setSkillLevel] = useState(defaults.skill_level);
    const [drillFormat, setDrillFormat] = useState(defaults.drill_format);
    const [interviewMode, setInterviewMode] = useState(defaults.interview_mode);
    const [interviewLanguage, setInterviewLanguage] = useState(
        defaults.interview_language,
    );
    const [questionCount, setQuestionCount] = useState(defaults.question_count);
    const [submitting, setSubmitting] = useState(false);

    const filteredSuggestions = useMemo(
        () =>
            suggestedSkills.filter(
                (item) => item.toLowerCase() !== skill.toLowerCase(),
            ),
        [suggestedSkills, skill],
    );

    function confirmSkill(value: string) {
        const trimmed = value.trim();

        if (trimmed) {
            setSkill(trimmed);
            setInputValue('');
        }
    }

    function clearSkill() {
        setSkill('');
        setInputValue('');
    }

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const finalSkill = skill || inputValue.trim();

        if (!finalSkill) {
            return;
        }

        setSubmitting(true);
        router.post(
            storeUrl,
            {
                practice_mode: 'skill_drill',
                target_skill: finalSkill,
                skill_level: skillLevel,
                drill_format: drillFormat,
                interview_mode: interviewMode,
                interview_language: interviewLanguage,
                question_count: questionCount,
                duration_minutes: 30,
            },
            {
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="size-5 text-[#01296A]" />
                    {t('candidate.ai_interviews.skill_drill_title')}
                </CardTitle>
                <CardDescription>
                    {t('candidate.ai_interviews.skill_drill_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <FormRow
                        label={t('candidate.ai_interviews.label_target_skill')}
                        description={t(
                            'candidate.ai_interviews.target_skill_hint',
                        )}
                    >
                        <div className="space-y-2">
                            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
                                {skill && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#01296A]/10 py-1 pr-1 pl-2.5 text-sm text-[#01296A]">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={clearSkill}
                                            aria-label={t(
                                                'candidate.ai_interviews.aria_remove_skill',
                                            )}
                                            className="rounded-sm p-0.5 hover:bg-[#01296A]/15"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </span>
                                )}
                                {!skill && (
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(event) =>
                                            setInputValue(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                confirmSkill(inputValue);
                                            }
                                        }}
                                        placeholder={t(
                                            'candidate.ai_interviews.placeholder_skill',
                                        )}
                                        className="flex-1 bg-transparent text-sm outline-none"
                                    />
                                )}
                            </div>
                            {filteredSuggestions.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {t(
                                            'candidate.ai_interviews.from_cv_label',
                                        )}
                                    </span>
                                    {filteredSuggestions
                                        .slice(0, 10)
                                        .map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() =>
                                                    confirmSkill(suggestion)
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
                                            >
                                                <Plus className="size-3" />
                                                {suggestion}
                                            </button>
                                        ))}
                                </div>
                            ) : null}
                        </div>
                    </FormRow>

                    <FormRow
                        label={t('candidate.ai_interviews.label_skill_depth')}
                        description={t(
                            'candidate.ai_interviews.skill_depth_hint',
                        )}
                    >
                        <RadioCardGroup
                            name="skill_level"
                            options={skillLevels}
                            value={skillLevel}
                            onChange={setSkillLevel}
                        />
                    </FormRow>

                    <FormRow
                        label={t('candidate.ai_interviews.label_drill_format')}
                        description={t(
                            'candidate.ai_interviews.drill_format_hint',
                        )}
                    >
                        <RadioCardGroup
                            name="drill_format"
                            options={drillFormats}
                            value={drillFormat}
                            onChange={setDrillFormat}
                            iconMap={drillFormatIcons}
                        />
                    </FormRow>

                    <div className="grid gap-4 md:grid-cols-3">
                        <FormRow
                            label={t(
                                'candidate.ai_interviews.label_answer_mode',
                            )}
                        >
                            <select
                                value={interviewMode}
                                onChange={(event) =>
                                    setInterviewMode(event.target.value)
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="voice">
                                    {t(
                                        'candidate.ai_interviews.mode_voice_short',
                                    )}
                                </option>
                                <option value="text">
                                    {t(
                                        'candidate.ai_interviews.mode_text_short',
                                    )}
                                </option>
                            </select>
                        </FormRow>
                        <FormRow
                            label={t('candidate.ai_interviews.label_language')}
                        >
                            <select
                                value={interviewLanguage}
                                onChange={(event) =>
                                    setInterviewLanguage(event.target.value)
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {interviewLanguages.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </FormRow>
                        <FormRow
                            label={t(
                                'candidate.ai_interviews.label_problem_count',
                            )}
                        >
                            <select
                                value={questionCount}
                                onChange={(event) =>
                                    setQuestionCount(Number(event.target.value))
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {questionCounts.map((count) => (
                                    <option key={count} value={count}>
                                        {t(
                                            'candidate.ai_interviews.problems_count',
                                            { count },
                                        )}
                                    </option>
                                ))}
                            </select>
                        </FormRow>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting || (!skill && !inputValue.trim())}
                        size="lg"
                        className="w-full md:w-auto"
                    >
                        <Brain className="size-4" />
                        {submitting
                            ? t('candidate.ai_interviews.btn_starting')
                            : !skill && !inputValue.trim()
                              ? t(
                                    'candidate.ai_interviews.btn_pick_skill_first',
                                )
                              : t(
                                    'candidate.ai_interviews.btn_start_practice_skill',
                                    {
                                        skill: skill || inputValue.trim(),
                                    },
                                )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function RecentSessionsCard({ sessions }: { sessions: RecentSession[] }) {
    const { t } = useTranslate();

    if (sessions.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle>
                        {t('candidate.ai_interviews.recent_sessions_title')}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'candidate.ai_interviews.recent_sessions_description',
                        )}
                    </CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                    <Link href={history().url}>
                        {t('candidate.ai_interviews.see_all')}
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                    {sessions.map((session) => (
                        <RecentSessionItem key={session.id} session={session} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function RecentSessionItem({ session }: { session: RecentSession }) {
    const { t } = useTranslate();
    const isSkill = session.practice_mode === 'skill_drill';
    const title = isSkill
        ? session.target_skill ||
          t('candidate.ai_interviews.fallback_skill_practice')
        : session.job_title ||
          t('candidate.ai_interviews.fallback_general_practice');
    const subtitle = isSkill
        ? `${session.skill_level ?? ''} • ${session.drill_format ?? ''}`
              .replace(/^•\s|\s•$/g, '')
              .trim()
        : session.company || '';
    const Icon = isSkill ? Brain : Briefcase;
    const statusStyle =
        session.status === 'completed'
            ? 'bg-emerald-100 text-emerald-800'
            : session.status === 'in_progress'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700';

    return (
        <Link
            href={show(session.id).url}
            className="flex items-start gap-3 rounded-lg border p-3 transition hover:border-[#01296A]/40 hover:shadow-sm"
        >
            <span className="mt-0.5 rounded-md bg-muted/40 p-2 text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <div className="flex-1 space-y-0.5">
                <p className="leading-tight font-medium">{title}</p>
                {subtitle ? (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyle}`}
                    >
                        {session.status.replace('_', ' ')}
                    </span>
                    {session.is_employer_scheduled ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#01296A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#01296A]">
                            <Briefcase className="size-3" />
                            {t(
                                'candidate.ai_interviews.company_interview_label',
                            )}
                        </span>
                    ) : null}
                    {session.interview_mode ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            {session.interview_mode === 'voice' ? (
                                <Mic className="size-3" />
                            ) : (
                                <Type className="size-3" />
                            )}
                            {session.interview_mode}
                        </span>
                    ) : null}
                    {session.completed_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            {session.completed_at}
                        </span>
                    ) : session.started_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            {session.started_at}
                        </span>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}

function FormRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                {description ? (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </div>
    );
}

function FieldError({ message }: { message?: string | null }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-rose-600">{message}</p>;
}

function PillRadio({
    name,
    options,
    defaultValue,
}: {
    name: string;
    options: Array<{ value: string; label: string }>;
    defaultValue: string;
}) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <label
                    key={option.value}
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition ${
                        value === option.value
                            ? 'border-[#01296A] bg-[#01296A]/5 font-medium text-[#01296A]'
                            : 'border-input hover:border-foreground/30'
                    }`}
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => setValue(option.value)}
                        className="sr-only"
                    />
                    {option.label}
                </label>
            ))}
        </div>
    );
}

function RadioCardGroup({
    name,
    options,
    value,
    onChange,
    iconMap,
}: {
    name: string;
    options: DescribedOption[];
    value: string;
    onChange: (value: string) => void;
    iconMap?: Record<string, ComponentType<{ className?: string }>>;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            {options.map((option) => {
                const Icon = iconMap?.[option.value];
                const active = value === option.value;

                return (
                    <label
                        key={option.value}
                        className={`flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 transition ${
                            active
                                ? 'border-[#01296A] bg-[#01296A]/5 ring-2 ring-[#01296A]/20'
                                : 'border-input hover:border-foreground/30'
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={active}
                            onChange={() => onChange(option.value)}
                            className="sr-only"
                        />
                        <div className="flex items-center gap-2">
                            {Icon ? (
                                <Icon
                                    className={`size-4 ${active ? 'text-[#01296A]' : 'text-muted-foreground'}`}
                                />
                            ) : null}
                            <p
                                className={`text-sm font-semibold ${active ? 'text-[#01296A]' : ''}`}
                            >
                                {option.label}
                            </p>
                        </div>
                        {option.description ? (
                            <p className="text-xs text-muted-foreground">
                                {option.description}
                            </p>
                        ) : null}
                    </label>
                );
            })}
        </div>
    );
}

CandidateAiInterviewIndex.layout = {
    breadcrumbs: [
        {
            title: 'AI Simulator',
            href: index(),
        },
    ],
};
