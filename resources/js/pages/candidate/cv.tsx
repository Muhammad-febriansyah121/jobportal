import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    FileSearch,
    FileText,
    Files,
    Github,
    Globe,
    Linkedin,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    Plus,
    Save,
    Sparkles,
    Star,
    Trash2,
    User,
    Wand2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/candidate/candidate-form';
import { EmptyState, ProgressBar } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import {
    builderDraft,
    builderPdf,
    builderPhoto,
    builderReview,
    builderReviewStream,
    builderSave,
    destroy as destroyCv,
    index,
    primary as primaryCv,
} from '@/routes/candidate/cvs';

type CvBuilderItem = {
    job_title?: string;
    company_name?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
};

type CvEducationItem = {
    school_name?: string;
    degree?: string;
    field_of_study?: string;
    start_year?: string;
    end_year?: string;
    description?: string;
};

type CvProjectItem = {
    name?: string;
    role?: string;
    link?: string;
    description?: string;
};

type CvCertificationItem = {
    name?: string;
    issuer?: string;
    year?: string;
};

type CvAiReview = {
    text: string;
};

type CvLanguageItem = {
    name?: string;
    level?: string;
};

type CvBuilderData = {
    template: 'ats' | 'modern';
    title: string;
    summary: string;
    personal: {
        full_name: string;
        headline: string;
        degree_title: string;
        birth_place: string;
        birth_date: string;
        email: string;
        phone: string;
        city: string;
        linkedin: string;
        github: string;
        portfolio: string;
        photo_path: string;
    };
    skills: string[];
    academic: string[];
    experiences: CvBuilderItem[];
    educations: CvEducationItem[];
    projects: CvProjectItem[];
    certifications: CvCertificationItem[];
    languages: CvLanguageItem[];
    ai_review?: CvAiReview | null;
};

type CvPageProps = {
    cvs: Array<{
        id: number;
        file_url: string;
        preview_url: string;
        source: string;
        is_pdf: boolean;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
    aiSummary?: string | null;
    profileCompletion: number;
    builderData: CvBuilderData;
    builderUpdatedAt?: string | null;
    aiEnabled: boolean;
    wallet: {
        ai_token_balance: number;
        cv_builder_quota_balance: number;
        draft_token_cost: number;
        draft_quota_cost: number;
        has_free_draft_available: boolean;
        pricing_href: string;
    };
};

export default function CandidateCv({
    cvs,
    aiSummary,
    profileCompletion,
    builderData,
    builderUpdatedAt,
    aiEnabled,
    wallet,
}: CvPageProps) {
    const { t } = useTranslate();
    const [isDrafting, setIsDrafting] = useState(false);
    const [aiDraftSheetOpen, setAiDraftSheetOpen] = useState(false);
    const [savedCvsSheetOpen, setSavedCvsSheetOpen] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(
        () => typeof window !== 'undefined' && window.innerWidth >= 1280,
    );
    const [rightPanelView, setRightPanelView] = useState<'preview' | 'review'>('preview');
    const [openSections, setOpenSections] = useState<Set<string>>(
        () => new Set(['data-dasar']),
    );
    const toggleSection = (key: string) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };
    const [previewCvUrl, setPreviewCvUrl] = useState<string | null>(
        () =>
            cvs.find((cv) => cv.is_primary && cv.is_pdf)?.preview_url ??
            cvs.find((cv) => cv.is_pdf)?.preview_url ??
            null,
    );
    const form = useForm<CvBuilderData>(builderData);
    const draftForm = useForm<{
        target_role: string;
        years_experience: number | '';
        focus_skills_text: string;
        achievements: string;
        language: 'id' | 'en';
    }>({
        target_role: builderData.personal.headline || '',
        years_experience: '',
        focus_skills_text: builderData.skills.join(', '),
        achievements: '',
        language: 'id',
    });
    const [reviewStreaming, setReviewStreaming] = useState(false);
    const [reviewStreamChars, setReviewStreamChars] = useState(0);
    const [reviewStreamText, setReviewStreamText] = useState('');
    const reviewAbortRef = useRef<AbortController | null>(null);
    const canGenerateDraft =
        wallet.has_free_draft_available ||
        (wallet.ai_token_balance >= wallet.draft_token_cost &&
            wallet.cv_builder_quota_balance >= wallet.draft_quota_cost);

    // Inertia useForm tidak auto-sync prop baru. Saat server membalas (AI Draft
    // mengganti data CV, AI Review menambahkan ai_review, atau Simpan
    // menormalisasi data), builderUpdatedAt berubah dan kita re-apply ke form.
    useEffect(() => {
        form.setData(builderData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [builderUpdatedAt]);

    const experienceTemplate: CvBuilderItem = {
        job_title: '',
        company_name: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
    };
    const educationTemplate: CvEducationItem = {
        school_name: '',
        degree: '',
        field_of_study: '',
        start_year: '',
        end_year: '',
        description: '',
    };
    const projectTemplate: CvProjectItem = {
        name: '',
        role: '',
        link: '',
        description: '',
    };
    const certificationTemplate: CvCertificationItem = {
        name: '',
        issuer: '',
        year: '',
    };
    const languageTemplate: CvLanguageItem = {
        name: '',
        level: '',
    };

    const saveBuilder = () => {
        form.post(builderSave().url, {
            preserveScroll: true,
        });
    };

    const generateDraft = () => {
        const payload = draftForm.data;

        setIsDrafting(true);
        router.post(
            builderDraft().url,
            {
                target_role: payload.target_role,
                years_experience:
                    payload.years_experience === ''
                        ? null
                        : payload.years_experience,
                focus_skills: payload.focus_skills_text
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                achievements: payload.achievements,
                language: payload.language,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsDrafting(false),
            },
        );
    };

    const generateReview = async () => {
        const xsrf = decodeURIComponent(
            document.cookie
                .split('; ')
                .find((r) => r.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? '',
        );

        reviewAbortRef.current?.abort();
        const controller = new AbortController();
        reviewAbortRef.current = controller;

        setReviewStreaming(true);
        setReviewStreamChars(0);
        setReviewStreamText('');

        try {
            const response = await fetch(builderReviewStream().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'text/event-stream',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrf,
                },
                body: JSON.stringify({
                    ...form.data,
                    target_job: form.data.personal.headline || '',
                    ai_review: undefined,
                }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error(
                    response.status === 502
                        ? 'AI tidak dapat memulai review. Coba lagi.'
                        : `HTTP ${response.status}`,
                );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;

                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]' || payload === '') continue;

                    try {
                        const event = JSON.parse(payload);
                        if (event.type === 'text_delta' && event.delta) {
                            fullText += event.delta;
                            setReviewStreamText(fullText);
                            setReviewStreamChars(fullText.length);
                        } else if (event.type === 'error') {
                            throw new Error(
                                event.message ||
                                    'AI mengalami error. Coba review lagi.',
                            );
                        }
                    } catch (parseErr) {
                        if ((parseErr as Error).message?.includes('AI')) {
                            throw parseErr;
                        }
                    }
                }
            }

            if (fullText.trim() === '') {
                throw new Error('AI tidak merespons. Coba beberapa saat lagi.');
            }

            form.setData('ai_review', { text: fullText });

            router.reload({
                only: ['builderData', 'builderUpdatedAt'],
                onSuccess: () => {
                    toast.success('Review CV dari AI berhasil diperbarui.');
                },
            });
        } catch (error) {
            if ((error as Error).name === 'AbortError') return;

            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Gagal melakukan review.',
            );
        } finally {
            setReviewStreaming(false);
            setReviewStreamChars(0);
            reviewAbortRef.current = null;
        }
    };

    const cancelReview = () => {
        reviewAbortRef.current?.abort();
        reviewAbortRef.current = null;
        setReviewStreaming(false);
        setReviewStreamChars(0);
    };

    const isDataDasarFilled = Boolean(
        form.data.personal.full_name?.trim() &&
        form.data.personal.email?.trim() &&
        form.data.summary?.trim() &&
        form.data.skills.length > 0,
    );
    const filledExperiences = form.data.experiences.filter(
        (item) => item.job_title || item.company_name,
    ).length;
    const filledEducations = form.data.educations.filter(
        (item) => item.school_name || item.degree,
    ).length;
    const filledProjects = form.data.projects.filter(
        (item) => item.name || item.role,
    ).length;
    const filledCertifications = form.data.certifications.filter(
        (item) => item.name || item.issuer,
    ).length;
    const filledLanguages = form.data.languages.filter(
        (item) => item.name,
    ).length;

    return (
        <>
            <Head title={t('candidate.cv_builder.page_title')} />

            <div className="space-y-5 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title={t('candidate.cv_builder.page_title')}
                        description={t('candidate.cv_builder.page_description')}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            onClick={saveBuilder}
                            disabled={form.processing}
                            size="sm"
                        >
                            <Save className="size-4" />
                            {form.processing
                                ? t('candidate.form.saving')
                                : t('candidate.cv_builder.save')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAiDraftSheetOpen(true)}
                        >
                            <Wand2 className="size-4" />
                            {t('candidate.cv_builder.ai_draft')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setPreviewVisible(true);
                                setRightPanelView('review');
                                if (typeof document !== 'undefined') {
                                    requestAnimationFrame(() => {
                                        document
                                            .getElementById('cv-right-panel')
                                            ?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                    });
                                }
                            }}
                        >
                            <FileSearch className="size-4" />
                            {t('candidate.cv_builder.ai_review')}
                            {form.data.ai_review?.text ? (
                                <Badge className="ml-1" variant="secondary">
                                    <CheckCircle2 className="size-3" />
                                </Badge>
                            ) : null}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <MoreVertical className="size-4" />
                                    {t('candidate.cv_builder.actions') !==
                                    'candidate.cv_builder.actions'
                                        ? t('candidate.cv_builder.actions')
                                        : 'Aksi'}
                                    <ChevronDown className="size-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    {t(
                                        'candidate.cv_builder.actions_files_label',
                                    ) !==
                                    'candidate.cv_builder.actions_files_label'
                                        ? t(
                                              'candidate.cv_builder.actions_files_label',
                                          )
                                        : 'Berkas CV'}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => setSavedCvsSheetOpen(true)}
                                >
                                    <Files className="size-4" />
                                    {t('candidate.cvs.list_title')}
                                    {cvs.length ? (
                                        <Badge
                                            className="ml-auto"
                                            variant="secondary"
                                        >
                                            {cvs.length}
                                        </Badge>
                                    ) : null}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href={builderPdf().url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Download className="size-4" />
                                        {t('candidate.cv_builder.download_pdf')}
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* AI Draft Sheet — controlled */}
                <Sheet
                    open={aiDraftSheetOpen}
                    onOpenChange={setAiDraftSheetOpen}
                >
                    <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <Sparkles className="size-5 text-[#0F4C94]" />
                                {t('candidate.cv_builder.ai_cv_draft')}
                            </SheetTitle>
                            <SheetDescription>
                                {t('candidate.cv_builder.ai_draft_description')}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-4 px-4 pb-6">
                            <div className="rounded-lg border bg-[#eff4ff] p-3 text-sm">
                                <p className="font-semibold text-[#0F4C94]">
                                    {t('candidate.cv_builder.balance_title')}
                                </p>
                                {wallet.has_free_draft_available ? (
                                    <p className="mt-1 text-emerald-700">
                                        Kamu masih punya 1x generate
                                        {t(
                                            'candidate.cv_builder.free_generate_left',
                                        )}
                                    </p>
                                ) : null}
                                <p className="mt-1 text-muted-foreground">
                                    {t('candidate.pricing.ai_token')}:{' '}
                                    <span className="font-semibold text-foreground">
                                        {wallet.ai_token_balance.toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>{' '}
                                    • {t('candidate.pricing.cv_builder_quota')}:{' '}
                                    <span className="font-semibold text-foreground">
                                        {wallet.cv_builder_quota_balance.toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {wallet.has_free_draft_available
                                        ? t(
                                              'candidate.cv_builder.first_generate_free',
                                          )
                                        : t(
                                              'candidate.cv_builder.generate_cost',
                                              {
                                                  token: wallet.draft_token_cost.toLocaleString(
                                                      'id-ID',
                                                  ),
                                                  quota: wallet.draft_quota_cost,
                                              },
                                          )}
                                </p>
                                {!canGenerateDraft ? (
                                    <Link
                                        href={wallet.pricing_href}
                                        className="mt-2 inline-flex text-xs font-semibold text-[#0F4C94] hover:underline"
                                    >
                                        {t('candidate.pricing.topup_now')}
                                    </Link>
                                ) : null}
                            </div>

                            <Field
                                label={t('candidate.cv_builder.target_role')}
                                name="target_role"
                                error={draftForm.errors.target_role}
                            >
                                <Input
                                    value={draftForm.data.target_role}
                                    onChange={(event) =>
                                        draftForm.setData(
                                            'target_role',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'candidate.cv_builder.target_role_placeholder',
                                    )}
                                />
                            </Field>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field
                                    label={t(
                                        'candidate.cv_builder.years_experience',
                                    )}
                                    name="years_experience"
                                    error={
                                        draftForm.errors.years_experience
                                            ? String(
                                                  draftForm.errors
                                                      .years_experience,
                                              )
                                            : undefined
                                    }
                                >
                                    <Input
                                        type="number"
                                        value={draftForm.data.years_experience}
                                        onChange={(event) =>
                                            draftForm.setData(
                                                'years_experience',
                                                event.target.value === ''
                                                    ? ''
                                                    : Number(
                                                          event.target.value,
                                                      ),
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.cv_builder.language')}
                                    name="language"
                                >
                                    <select
                                        className="h-10 rounded-md border border-input px-3 text-sm"
                                        value={draftForm.data.language}
                                        onChange={(event) =>
                                            draftForm.setData(
                                                'language',
                                                event.target.value as
                                                    | 'id'
                                                    | 'en',
                                            )
                                        }
                                    >
                                        <option value="id">
                                            {t('candidate.cv_builder.lang_id')}
                                        </option>
                                        <option value="en">
                                            {t('candidate.cv_builder.lang_en')}
                                        </option>
                                    </select>
                                </Field>
                            </div>
                            <Field
                                label={t('candidate.cv_builder.focus_skills')}
                                name="focus_skills_text"
                            >
                                <Input
                                    value={draftForm.data.focus_skills_text}
                                    onChange={(event) =>
                                        draftForm.setData(
                                            'focus_skills_text',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'candidate.cv_builder.focus_skills_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t(
                                    'candidate.cv_builder.main_achievement',
                                )}
                                name="achievements"
                            >
                                <textarea
                                    className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm"
                                    value={draftForm.data.achievements}
                                    onChange={(event) =>
                                        draftForm.setData(
                                            'achievements',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'candidate.cv_builder.main_achievement_placeholder',
                                    )}
                                />
                            </Field>
                            <Button
                                type="button"
                                className="w-full"
                                disabled={
                                    isDrafting ||
                                    !aiEnabled ||
                                    !canGenerateDraft
                                }
                                onClick={generateDraft}
                            >
                                <Sparkles className="size-4" />
                                {isDrafting
                                    ? t('candidate.cv_builder.processing')
                                    : t(
                                          'candidate.cv_builder.generate_ai_draft',
                                      )}
                            </Button>
                            {!canGenerateDraft ? (
                                <p className="text-xs text-secondary-600">
                                    {t(
                                        'candidate.cv_builder.insufficient_balance',
                                    )}
                                </p>
                            ) : null}
                            {!aiEnabled ? (
                                <p className="text-xs text-secondary-600">
                                    {t('candidate.cv_builder.ai_key_missing')}
                                </p>
                            ) : null}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Saved CVs Sheet — controlled */}
                <Sheet
                    open={savedCvsSheetOpen}
                    onOpenChange={setSavedCvsSheetOpen}
                >
                    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                        <SheetHeader>
                            <SheetTitle>
                                {t('candidate.cv_builder.saved_cvs_title')}
                            </SheetTitle>
                            <SheetDescription>
                                {t(
                                    'candidate.cv_builder.saved_cvs_description',
                                )}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-3 px-4 pb-6">
                            {cvs.length ? (
                                cvs.map((cv) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={cv.id}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-4" />
                                                    <p className="font-medium">
                                                        {t(
                                                            'candidate.cvs.cv_item',
                                                            {
                                                                id: cv.id,
                                                            },
                                                        )}
                                                    </p>
                                                    {cv.is_primary ? (
                                                        <Badge>
                                                            {t(
                                                                'candidate.cvs.primary',
                                                            )}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        'candidate.cvs.uploaded_at',
                                                    )}
                                                    : {cv.uploaded_at}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {cv.is_pdf
                                                        ? t(
                                                              'candidate.cvs.pdf_preview_available',
                                                          )
                                                        : t(
                                                              'candidate.cvs.pdf_preview_only',
                                                          )}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {cv.is_pdf ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setPreviewCvUrl(
                                                                cv.preview_url,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                        {t(
                                                            'candidate.cvs.preview',
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        asChild
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <a
                                                            href={cv.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                            {t(
                                                                'candidate.cvs.open_file',
                                                            )}
                                                        </a>
                                                    </Button>
                                                )}
                                                {!cv.is_primary ? (
                                                    <Form
                                                        {...primaryCv.form(
                                                            cv.id,
                                                        )}
                                                    >
                                                        {({ processing }) => (
                                                            <Button
                                                                disabled={
                                                                    processing
                                                                }
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                <Star className="size-4" />
                                                                {t(
                                                                    'candidate.cvs.make_primary_button',
                                                                )}
                                                            </Button>
                                                        )}
                                                    </Form>
                                                ) : null}
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="destructive"
                                                >
                                                    <Link
                                                        href={destroyCv(cv.id)}
                                                        method="delete"
                                                        as="button"
                                                    >
                                                        <Trash2 className="size-4" />
                                                        {t(
                                                            'candidate.cvs.delete',
                                                        )}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title={t('candidate.cvs.empty_title')}
                                    description={t(
                                        'candidate.cvs.empty_description',
                                    )}
                                />
                            )}

                            {previewCvUrl ? (
                                <div className="space-y-2 rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium">
                                            {t(
                                                'candidate.cvs.preview_pdf_title',
                                            )}
                                        </p>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <a
                                                href={previewCvUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink className="size-4" />
                                                {t(
                                                    'candidate.cvs.open_new_tab',
                                                )}
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-md border bg-muted/20">
                                        <iframe
                                            src={previewCvUrl}
                                            title={t(
                                                'candidate.cvs.preview_iframe_title',
                                            )}
                                            className="h-[60vh] w-full"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </SheetContent>
                </Sheet>

                <Card>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    {t(
                                        'candidate.cv_builder.profile_completion',
                                    )}
                                </span>
                                <span className="text-muted-foreground">
                                    {profileCompletion}%
                                </span>
                            </div>
                            <ProgressBar value={profileCompletion} />
                        </div>
                        {builderUpdatedAt ? (
                            <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
                                {t('candidate.cv_builder.last_updated', {
                                    time: builderUpdatedAt,
                                })}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
                                {t('candidate.cv_builder.ats_note')}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {aiSummary ? (
                    <Card className="border-[#0F4C94]/20 bg-[#eff4ff]/50">
                        <CardContent className="flex gap-3 py-4">
                            <Sparkles className="mt-0.5 size-5 shrink-0 text-[#0F4C94]" />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold tracking-wide text-[#0F4C94] uppercase">
                                    {t('candidate.cv_builder.ai_summary')}
                                </p>
                                <p className="text-sm leading-6 text-foreground/80">
                                    {aiSummary}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <div
                    className={`grid gap-6 ${previewVisible ? 'xl:grid-cols-[1.1fr_0.9fr]' : 'xl:grid-cols-1'}`}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle>
                                    {t('candidate.cv_builder.editor_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'candidate.cv_builder.editor_description',
                                    )}
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewVisible((v) => !v)}
                            >
                                {previewVisible ? (
                                    <>
                                        <EyeOff className="size-3.5" />
                                        <span className="hidden sm:inline">Sembunyikan</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="size-3.5" />
                                        <span className="hidden sm:inline">Tampilkan Preview</span>
                                        <span className="sm:hidden">Preview</span>
                                    </>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-3">
                                <AccordionSection
                                    sectionKey="data-dasar"
                                    title={t('candidate.cv_builder.tab_basics')}
                                    open={openSections.has('data-dasar')}
                                    onToggle={() => toggleSection('data-dasar')}
                                    badge={
                                        isDataDasarFilled ? (
                                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        ) : null
                                    }
                                    className="space-y-7"
                                >
                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_cv_identity_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_cv_identity_description',
                                        )}
                                    >
                                        <div className="grid items-start gap-4 md:grid-cols-[1.4fr_1fr]">
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.cv_title_label',
                                                )}
                                                name="title"
                                                error={form.errors.title}
                                            >
                                                <Input
                                                    value={form.data.title}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'title',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.cv_title_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">
                                                    {t(
                                                        'candidate.cv_builder.format_label',
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(
                                                        [
                                                            {
                                                                value: 'ats' as const,
                                                                label: 'ATS',
                                                                desc: t(
                                                                    'candidate.cv_builder.ats_expansion',
                                                                ),
                                                            },
                                                            {
                                                                value: 'modern' as const,
                                                                label: t(
                                                                    'candidate.cv_builder.template_modern_label',
                                                                ),
                                                                desc: t(
                                                                    'candidate.cv_builder.template_modern_desc',
                                                                ),
                                                            },
                                                        ]
                                                    ).map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() =>
                                                                form.setData(
                                                                    'template',
                                                                    opt.value,
                                                                )
                                                            }
                                                            className={`flex flex-col gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition ${
                                                                form.data
                                                                    .template ===
                                                                opt.value
                                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                    : 'bg-muted/40 hover:bg-muted'
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-1.5 font-medium">
                                                                {form.data
                                                                    .template ===
                                                                    opt.value && (
                                                                    <CheckCircle2 className="size-3.5 text-primary" />
                                                                )}
                                                                {opt.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {opt.desc}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <FieldHint>
                                                    {t(
                                                        'candidate.cv_builder.format_hint',
                                                    )}
                                                </FieldHint>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_personal_identity_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_personal_identity_description',
                                        )}
                                    >
                                        <div className="grid items-start gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.full_name_label',
                                                )}
                                                name="personal.full_name"
                                                required
                                                error={
                                                    form.errors[
                                                        'personal.full_name' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={User}
                                                    value={
                                                        form.data.personal
                                                            .full_name
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                full_name:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.full_name_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.headline_label',
                                                )}
                                                name="personal.headline"
                                                error={
                                                    form.errors[
                                                        'personal.headline' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <Input
                                                    value={
                                                        form.data.personal
                                                            .headline
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                headline:
                                                                    event.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.headline_placeholder',
                                                    )}
                                                />
                                                <FieldHint>
                                                    {t(
                                                        'candidate.cv_builder.headline_hint',
                                                    )}
                                                </FieldHint>
                                            </Field>
                                        </div>

                                        {form.data.template === 'modern' && (
                                            <div className="mt-4 space-y-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                                                <p className="text-xs font-medium text-primary">
                                                    {t(
                                                        'candidate.cv_builder.modern_extra_hint',
                                                    )}
                                                </p>
                                                <div className="grid items-start gap-4 md:grid-cols-2">
                                                    <Field
                                                        label={t(
                                                            'candidate.cv_builder.degree_title_label',
                                                        )}
                                                        name="personal.degree_title"
                                                    >
                                                        <Input
                                                            value={
                                                                form.data
                                                                    .personal
                                                                    .degree_title
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'personal',
                                                                    {
                                                                        ...form
                                                                            .data
                                                                            .personal,
                                                                        degree_title:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.degree_title_placeholder',
                                                            )}
                                                        />
                                                    </Field>
                                                    <PhotoUploader
                                                        photoPath={
                                                            form.data.personal
                                                                .photo_path
                                                        }
                                                    />
                                                    <Field
                                                        label={t(
                                                            'candidate.cv_builder.birth_place_label',
                                                        )}
                                                        name="personal.birth_place"
                                                    >
                                                        <Input
                                                            value={
                                                                form.data
                                                                    .personal
                                                                    .birth_place
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'personal',
                                                                    {
                                                                        ...form
                                                                            .data
                                                                            .personal,
                                                                        birth_place:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.birth_place_placeholder',
                                                            )}
                                                        />
                                                    </Field>
                                                    <Field
                                                        label={t(
                                                            'candidate.cv_builder.birth_date_label',
                                                        )}
                                                        name="personal.birth_date"
                                                    >
                                                        <Input
                                                            value={
                                                                form.data
                                                                    .personal
                                                                    .birth_date
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'personal',
                                                                    {
                                                                        ...form
                                                                            .data
                                                                            .personal,
                                                                        birth_date:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.birth_date_placeholder',
                                                            )}
                                                        />
                                                    </Field>
                                                </div>
                                            </div>
                                        )}
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_contact_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_contact_description',
                                        )}
                                    >
                                        <div className="grid items-start gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.email_label',
                                                )}
                                                name="personal.email"
                                                required
                                                error={
                                                    form.errors[
                                                        'personal.email' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={Mail}
                                                    type="email"
                                                    value={
                                                        form.data.personal.email
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                email: value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.email_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.phone_label',
                                                )}
                                                name="personal.phone"
                                                error={
                                                    form.errors[
                                                        'personal.phone' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={Phone}
                                                    type="tel"
                                                    value={
                                                        form.data.personal.phone
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                phone: value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.phone_placeholder',
                                                    )}
                                                />
                                                <FieldHint>
                                                    {t(
                                                        'candidate.cv_builder.phone_hint',
                                                    )}
                                                </FieldHint>
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.city_label',
                                                )}
                                                name="personal.city"
                                                error={
                                                    form.errors[
                                                        'personal.city' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={MapPin}
                                                    value={
                                                        form.data.personal.city
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                city: value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.city_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_online_profile_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_online_profile_description',
                                        )}
                                    >
                                        <div className="grid items-start gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.linkedin_label',
                                                )}
                                                name="personal.linkedin"
                                                error={
                                                    form.errors[
                                                        'personal.linkedin' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={Linkedin}
                                                    type="url"
                                                    value={
                                                        form.data.personal
                                                            .linkedin
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                linkedin: value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.linkedin_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.github_label',
                                                )}
                                                name="personal.github"
                                                error={
                                                    form.errors[
                                                        'personal.github' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={Github}
                                                    type="url"
                                                    value={
                                                        form.data.personal
                                                            .github
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                github: value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.github_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.cv_builder.portfolio_label',
                                                )}
                                                name="personal.portfolio"
                                                error={
                                                    form.errors[
                                                        'personal.portfolio' as keyof typeof form.errors
                                                    ]
                                                }
                                            >
                                                <InputWithIcon
                                                    icon={Globe}
                                                    type="url"
                                                    value={
                                                        form.data.personal
                                                            .portfolio
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            'personal',
                                                            {
                                                                ...form.data
                                                                    .personal,
                                                                portfolio:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.cv_builder.portfolio_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_summary_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_summary_description',
                                        )}
                                    >
                                        <SummaryEditor
                                            value={form.data.summary}
                                            onChange={(value) =>
                                                form.setData('summary', value)
                                            }
                                            t={t}
                                        />
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_skills_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_skills_description',
                                        )}
                                    >
                                        <SkillChipInput
                                            skills={form.data.skills}
                                            onChange={(value) =>
                                                form.setData('skills', value)
                                            }
                                            t={t}
                                        />
                                    </FormSection>

                                    <FormSection
                                        title={t(
                                            'candidate.cv_builder.section_academic_title',
                                        )}
                                        description={t(
                                            'candidate.cv_builder.section_academic_description',
                                        )}
                                    >
                                        <textarea
                                            className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={form.data.academic.join('\n')}
                                            onChange={(event) =>
                                                form.setData(
                                                    'academic',
                                                    event.target.value.split(
                                                        '\n',
                                                    ),
                                                )
                                            }
                                            placeholder={t(
                                                'candidate.cv_builder.academic_placeholder',
                                            )}
                                        />
                                        <FieldHint>
                                            {t(
                                                'candidate.cv_builder.academic_hint',
                                            )}
                                        </FieldHint>
                                    </FormSection>
                                </AccordionSection>

                                <AccordionSection
                                    sectionKey="pengalaman"
                                    title={t(
                                        'candidate.cv_builder.tab_experience',
                                    )}
                                    open={openSections.has('pengalaman')}
                                    onToggle={() => toggleSection('pengalaman')}
                                    badge={
                                        filledExperiences > 0 ? (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 px-1.5"
                                            >
                                                {filledExperiences}
                                            </Badge>
                                        ) : null
                                    }
                                    className="space-y-4"
                                >
                                    <ArraySection
                                        title={t(
                                            'candidate.cv_builder.section_experience_title',
                                        )}
                                        addLabel={t(
                                            'candidate.cv_builder.add_experience',
                                        )}
                                        emptyTitle={t(
                                            'candidate.cv_builder.empty_experience_title',
                                        )}
                                        emptyDescription={t(
                                            'candidate.cv_builder.empty_experience_description',
                                        )}
                                        isEmpty={
                                            form.data.experiences.length === 0
                                        }
                                        onAdd={() =>
                                            form.setData('experiences', [
                                                ...form.data.experiences,
                                                experienceTemplate,
                                            ])
                                        }
                                    >
                                        {form.data.experiences.map(
                                            (item, index) => (
                                                <div
                                                    key={`experience-${index}`}
                                                    className="space-y-3 rounded-lg border p-4"
                                                >
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <Input
                                                            value={
                                                                item.job_title ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.position_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .experiences,
                                                                    index,
                                                                    {
                                                                        job_title:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'experiences',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.company_name ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.company_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .experiences,
                                                                    index,
                                                                    {
                                                                        company_name:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'experiences',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.location ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.location_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .experiences,
                                                                    index,
                                                                    {
                                                                        location:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'experiences',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                            <Input
                                                                value={
                                                                    item.start_date ??
                                                                    ''
                                                                }
                                                                placeholder={t(
                                                                    'candidate.cv_builder.start_placeholder',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateItem(
                                                                        form
                                                                            .data
                                                                            .experiences,
                                                                        index,
                                                                        {
                                                                            start_date:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                        (
                                                                            next,
                                                                        ) =>
                                                                            form.setData(
                                                                                'experiences',
                                                                                next,
                                                                            ),
                                                                    )
                                                                }
                                                            />
                                                            <Input
                                                                value={
                                                                    item.end_date ??
                                                                    ''
                                                                }
                                                                placeholder={t(
                                                                    'candidate.cv_builder.end_placeholder',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateItem(
                                                                        form
                                                                            .data
                                                                            .experiences,
                                                                        index,
                                                                        {
                                                                            end_date:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                        (
                                                                            next,
                                                                        ) =>
                                                                            form.setData(
                                                                                'experiences',
                                                                                next,
                                                                            ),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm"
                                                        value={
                                                            item.description ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.cv_builder.impact_placeholder',
                                                        )}
                                                        onChange={(event) =>
                                                            updateItem(
                                                                form.data
                                                                    .experiences,
                                                                index,
                                                                {
                                                                    description:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                                (next) =>
                                                                    form.setData(
                                                                        'experiences',
                                                                        next,
                                                                    ),
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            form.setData(
                                                                'experiences',
                                                                form.data.experiences.filter(
                                                                    (
                                                                        _,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        {t(
                                                            'candidate.cv_builder.delete_item',
                                                        )}
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                    </ArraySection>
                                </AccordionSection>

                                <AccordionSection
                                    sectionKey="pendidikan"
                                    title={t(
                                        'candidate.cv_builder.tab_education',
                                    )}
                                    open={openSections.has('pendidikan')}
                                    onToggle={() => toggleSection('pendidikan')}
                                    badge={
                                        filledEducations > 0 ? (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 px-1.5"
                                            >
                                                {filledEducations}
                                            </Badge>
                                        ) : null
                                    }
                                    className="space-y-4"
                                >
                                    <ArraySection
                                        title={t(
                                            'candidate.cv_builder.section_education_title',
                                        )}
                                        addLabel={t(
                                            'candidate.cv_builder.add_education',
                                        )}
                                        emptyTitle={t(
                                            'candidate.cv_builder.empty_education_title',
                                        )}
                                        emptyDescription={t(
                                            'candidate.cv_builder.empty_education_description',
                                        )}
                                        isEmpty={
                                            form.data.educations.length === 0
                                        }
                                        onAdd={() =>
                                            form.setData('educations', [
                                                ...form.data.educations,
                                                educationTemplate,
                                            ])
                                        }
                                    >
                                        {form.data.educations.map(
                                            (item, index) => (
                                                <SimpleArrayCard
                                                    key={`education-${index}`}
                                                    title={
                                                        item.school_name ||
                                                        'Pendidikan'
                                                    }
                                                    onRemove={() =>
                                                        form.setData(
                                                            'educations',
                                                            form.data.educations.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <Input
                                                            value={
                                                                item.school_name ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.school_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .educations,
                                                                    index,
                                                                    {
                                                                        school_name:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'educations',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.degree ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.degree_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .educations,
                                                                    index,
                                                                    {
                                                                        degree: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'educations',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.field_of_study ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.major_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .educations,
                                                                    index,
                                                                    {
                                                                        field_of_study:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'educations',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                            <Input
                                                                value={
                                                                    item.start_year ??
                                                                    ''
                                                                }
                                                                placeholder={t(
                                                                    'candidate.cv_builder.start_placeholder',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateItem(
                                                                        form
                                                                            .data
                                                                            .educations,
                                                                        index,
                                                                        {
                                                                            start_year:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                        (
                                                                            next,
                                                                        ) =>
                                                                            form.setData(
                                                                                'educations',
                                                                                next,
                                                                            ),
                                                                    )
                                                                }
                                                            />
                                                            <Input
                                                                value={
                                                                    item.end_year ??
                                                                    ''
                                                                }
                                                                placeholder={t(
                                                                    'candidate.cv_builder.end_placeholder',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateItem(
                                                                        form
                                                                            .data
                                                                            .educations,
                                                                        index,
                                                                        {
                                                                            end_year:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                        (
                                                                            next,
                                                                        ) =>
                                                                            form.setData(
                                                                                'educations',
                                                                                next,
                                                                            ),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </SimpleArrayCard>
                                            ),
                                        )}
                                    </ArraySection>
                                </AccordionSection>

                                <AccordionSection
                                    sectionKey="proyek"
                                    title={t(
                                        'candidate.cv_builder.tab_projects',
                                    )}
                                    open={openSections.has('proyek')}
                                    onToggle={() => toggleSection('proyek')}
                                    badge={
                                        filledProjects > 0 ? (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 px-1.5"
                                            >
                                                {filledProjects}
                                            </Badge>
                                        ) : null
                                    }
                                    className="space-y-4"
                                >
                                    <ArraySection
                                        title={t(
                                            'candidate.cv_builder.section_project_title',
                                        )}
                                        addLabel={t(
                                            'candidate.cv_builder.add_project',
                                        )}
                                        emptyTitle={t(
                                            'candidate.cv_builder.empty_project_title',
                                        )}
                                        emptyDescription={t(
                                            'candidate.cv_builder.empty_project_description',
                                        )}
                                        isEmpty={
                                            form.data.projects.length === 0
                                        }
                                        onAdd={() =>
                                            form.setData('projects', [
                                                ...form.data.projects,
                                                projectTemplate,
                                            ])
                                        }
                                    >
                                        {form.data.projects.map(
                                            (item, index) => (
                                                <SimpleArrayCard
                                                    key={`project-${index}`}
                                                    title={
                                                        item.name || 'Project'
                                                    }
                                                    onRemove={() =>
                                                        form.setData(
                                                            'projects',
                                                            form.data.projects.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <Input
                                                            value={
                                                                item.name ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.project_name_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .projects,
                                                                    index,
                                                                    {
                                                                        name: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'projects',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.role ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.role_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .projects,
                                                                    index,
                                                                    {
                                                                        role: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'projects',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            className="md:col-span-2"
                                                            value={
                                                                item.link ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.project_link_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .projects,
                                                                    index,
                                                                    {
                                                                        link: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'projects',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <textarea
                                                        className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm"
                                                        value={
                                                            item.description ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.cv_builder.project_description_placeholder',
                                                        )}
                                                        onChange={(event) =>
                                                            updateItem(
                                                                form.data
                                                                    .projects,
                                                                index,
                                                                {
                                                                    description:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                                (next) =>
                                                                    form.setData(
                                                                        'projects',
                                                                        next,
                                                                    ),
                                                            )
                                                        }
                                                    />
                                                </SimpleArrayCard>
                                            ),
                                        )}
                                    </ArraySection>
                                </AccordionSection>

                                <AccordionSection
                                    sectionKey="sertifikasi"
                                    title={t(
                                        'candidate.cv_builder.tab_certifications',
                                    )}
                                    open={openSections.has('sertifikasi')}
                                    onToggle={() =>
                                        toggleSection('sertifikasi')
                                    }
                                    badge={
                                        filledCertifications > 0 ? (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 px-1.5"
                                            >
                                                {filledCertifications}
                                            </Badge>
                                        ) : null
                                    }
                                    className="space-y-4"
                                >
                                    <ArraySection
                                        title={t(
                                            'candidate.cv_builder.section_certification_title',
                                        )}
                                        addLabel={t(
                                            'candidate.cv_builder.add_certification',
                                        )}
                                        emptyTitle={t(
                                            'candidate.cv_builder.empty_certification_title',
                                        )}
                                        emptyDescription={t(
                                            'candidate.cv_builder.empty_certification_description',
                                        )}
                                        isEmpty={
                                            form.data.certifications.length ===
                                            0
                                        }
                                        onAdd={() =>
                                            form.setData('certifications', [
                                                ...form.data.certifications,
                                                certificationTemplate,
                                            ])
                                        }
                                    >
                                        {form.data.certifications.map(
                                            (item, index) => (
                                                <SimpleArrayCard
                                                    key={`certification-${index}`}
                                                    title={
                                                        item.name ||
                                                        'Sertifikasi'
                                                    }
                                                    onRemove={() =>
                                                        form.setData(
                                                            'certifications',
                                                            form.data.certifications.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="grid gap-3 md:grid-cols-3">
                                                        <Input
                                                            value={
                                                                item.name ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.name_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .certifications,
                                                                    index,
                                                                    {
                                                                        name: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'certifications',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.issuer ??
                                                                ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.issuer_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .certifications,
                                                                    index,
                                                                    {
                                                                        issuer: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'certifications',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.year ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.year_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .certifications,
                                                                    index,
                                                                    {
                                                                        year: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'certifications',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </SimpleArrayCard>
                                            ),
                                        )}
                                    </ArraySection>
                                </AccordionSection>

                                <AccordionSection
                                    sectionKey="bahasa"
                                    title={t('candidate.cv_builder.tab_languages')}
                                    open={openSections.has('bahasa')}
                                    onToggle={() => toggleSection('bahasa')}
                                    badge={
                                        filledLanguages > 0 ? (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 px-1.5"
                                            >
                                                {filledLanguages}
                                            </Badge>
                                        ) : null
                                    }
                                    className="space-y-4"
                                >
                                    <ArraySection
                                        title={t(
                                            'candidate.cv_builder.section_language_title',
                                        )}
                                        addLabel={t(
                                            'candidate.cv_builder.add_language',
                                        )}
                                        emptyTitle={t(
                                            'candidate.cv_builder.empty_language_title',
                                        )}
                                        emptyDescription={t(
                                            'candidate.cv_builder.empty_language_description',
                                        )}
                                        isEmpty={
                                            form.data.languages.length === 0
                                        }
                                        onAdd={() =>
                                            form.setData('languages', [
                                                ...form.data.languages,
                                                languageTemplate,
                                            ])
                                        }
                                    >
                                        {form.data.languages.map(
                                            (item, index) => (
                                                <SimpleArrayCard
                                                    key={`language-${index}`}
                                                    title={
                                                        item.name || 'Bahasa'
                                                    }
                                                    onRemove={() =>
                                                        form.setData(
                                                            'languages',
                                                            form.data.languages.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <Input
                                                            value={
                                                                item.name ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.language_name_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .languages,
                                                                    index,
                                                                    {
                                                                        name: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'languages',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        <Input
                                                            value={
                                                                item.level ?? ''
                                                            }
                                                            placeholder={t(
                                                                'candidate.cv_builder.language_level_placeholder',
                                                            )}
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    form.data
                                                                        .languages,
                                                                    index,
                                                                    {
                                                                        level: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    (next) =>
                                                                        form.setData(
                                                                            'languages',
                                                                            next,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </SimpleArrayCard>
                                            ),
                                        )}
                                    </ArraySection>
                                </AccordionSection>
                            </div>

                            <InputError
                                message={
                                    form.errors.personal || form.errors.summary
                                }
                            />

                            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    onClick={saveBuilder}
                                    disabled={form.processing}
                                >
                                    <Save className="size-4" />
                                    {form.processing
                                        ? t(
                                              'candidate.cv_builder.saving_changes',
                                          )
                                        : t(
                                              'candidate.cv_builder.save_changes',
                                          )}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'candidate.cv_builder.save_hint_after_edit',
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {previewVisible ? (
                        <div
                            id="cv-right-panel"
                            className="xl:sticky xl:top-4 xl:self-start"
                        >
                            <Card>
                                <Tabs
                                    value={rightPanelView}
                                    onValueChange={(value) =>
                                        setRightPanelView(
                                            value as 'preview' | 'review',
                                        )
                                    }
                                >
                                    <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-1">
                                            <CardTitle>
                                                {rightPanelView === 'review'
                                                    ? t(
                                                          'candidate.cv_builder.ai_reviewer',
                                                      )
                                                    : t(
                                                          'candidate.cv_builder.live_preview_title',
                                                      )}
                                            </CardTitle>
                                            <CardDescription>
                                                {rightPanelView === 'review'
                                                    ? t(
                                                          'candidate.cv_builder.ai_review_description',
                                                      )
                                                    : t(
                                                          'candidate.cv_builder.live_preview_description',
                                                      )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {rightPanelView === 'preview' ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <a
                                                        href={builderPdf().url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Download className="size-4" />
                                                        PDF
                                                    </a>
                                                </Button>
                                            ) : null}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setPreviewVisible(false)
                                                }
                                                aria-label="Tutup panel"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <div className="px-6">
                                        <TabsList className="w-full">
                                            <TabsTrigger
                                                value="preview"
                                                className="flex-1 gap-1.5"
                                            >
                                                <Eye className="size-3.5" />
                                                {t(
                                                    'candidate.cv_builder.live_preview_title',
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="review"
                                                className="flex-1 gap-1.5"
                                            >
                                                <FileSearch className="size-3.5" />
                                                {t(
                                                    'candidate.cv_builder.ai_review',
                                                )}
                                                {form.data.ai_review?.text ? (
                                                    <Badge
                                                        className="ml-1"
                                                        variant="secondary"
                                                    >
                                                        <CheckCircle2 className="size-3" />
                                                    </Badge>
                                                ) : null}
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="preview" className="mt-3">
                                        <CardContent className="max-h-[65vh] overflow-y-auto p-0 xl:max-h-[82vh]">
                                            <CvLivePreview
                                                data={form.data}
                                                t={t}
                                            />
                                        </CardContent>
                                    </TabsContent>
                                    <TabsContent value="review" className="mt-3">
                                        <CardContent className="max-h-[65vh] space-y-4 overflow-y-auto xl:max-h-[82vh]">
                                            <Button
                                                type="button"
                                                onClick={generateReview}
                                                disabled={
                                                    !aiEnabled ||
                                                    reviewStreaming
                                                }
                                                className="w-full"
                                            >
                                                <FileSearch className="size-4" />
                                                {reviewStreaming
                                                    ? t(
                                                          'candidate.cv_builder.analyzing_cv',
                                                      )
                                                    : t(
                                                          'candidate.cv_builder.review_with_ai',
                                                      )}
                                            </Button>

                                            {reviewStreaming && (
                                                <div className="space-y-2 rounded-xl border border-primary-200 bg-primary-50 p-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2 font-bold text-primary-800">
                                                            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary-500" />
                                                            AI sedang menulis review...
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={cancelReview}
                                                            className="text-primary-700 underline-offset-2 hover:underline"
                                                        >
                                                            Batalkan
                                                        </button>
                                                    </div>
                                                    <p className="font-mono text-[11px] text-primary-700 tabular-nums">
                                                        {reviewStreamChars.toLocaleString('id-ID')} karakter diterima
                                                    </p>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-primary-100">
                                                        <div
                                                            className="h-full rounded-full bg-primary-500 transition-all duration-300"
                                                            style={{
                                                                width: `${Math.min(100, Math.round((reviewStreamChars / 4000) * 100))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(reviewStreaming ? reviewStreamText : form.data.ai_review?.text) ? (
                                                <div className="rounded-lg border p-4">
                                                    <MarkdownText
                                                        text={reviewStreaming ? reviewStreamText : form.data.ai_review!.text}
                                                    />
                                                    {reviewStreaming && (
                                                        <span className="inline-block size-2 animate-pulse rounded-full bg-primary-500" />
                                                    )}
                                                </div>
                                            ) : (
                                                !reviewStreaming && (
                                                    <EmptyState
                                                        title={t(
                                                            'candidate.cv_builder.no_review',
                                                        )}
                                                        description={t(
                                                            'candidate.cv_builder.no_review_description',
                                                        )}
                                                    />
                                                )
                                            )}
                                        </CardContent>
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function CvLivePreview({
    data,
    t,
}: {
    data: CvBuilderData;
    t: (key: string) => string;
}) {
    if (data.template === 'modern') {
        return <CvModernPreview data={data} t={t} />;
    }

    const personal = data.personal;
    const contactLine = [personal.city, personal.email, personal.phone]
        .filter((value) => value && value.trim() !== '')
        .join(' • ');
    const profileLinks = [
        personal.linkedin && {
            label: t('candidate.cv_builder.linkedin_label'),
            href: personal.linkedin,
        },
        personal.github && {
            label: t('candidate.cv_builder.github_label'),
            href: personal.github,
        },
        personal.portfolio && {
            label: t('candidate.cv_builder.portfolio_short_label'),
            href: personal.portfolio,
        },
    ].filter(Boolean) as Array<{ label: string; href: string }>;
    const skills = data.skills.filter((value) => value.trim() !== '');
    const experiences = data.experiences.filter(
        (item) => item.company_name || item.job_title || item.description,
    );
    const educations = data.educations.filter(
        (item) => item.school_name || item.degree || item.field_of_study,
    );
    const projects = data.projects.filter(
        (item) => item.name || item.role || item.description,
    );
    const certifications = data.certifications.filter(
        (item) => item.name || item.issuer,
    );

    const formatBullets = (description?: string): string[] => {
        if (!description) {
            return [];
        }

        return description
            .split(/\r\n|\r|\n|•|- /)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    };

    const period = (start?: string, end?: string, isCurrent?: boolean) => {
        const startLabel = start?.trim() ?? '';
        const endLabel = isCurrent
            ? t('candidate.cv_builder.now')
            : (end?.trim() ?? '');

        if (!startLabel && !endLabel) {
            return '';
        }

        if (!startLabel) {
            return endLabel;
        }

        if (!endLabel) {
            return startLabel;
        }

        return `${startLabel} — ${endLabel}`;
    };

    return (
        <div className="rounded-b-xl bg-slate-200/80 px-4 py-5 sm:px-5">
            <div
                className="mx-auto bg-white font-serif text-[11px] leading-[1.55] text-slate-900"
                style={{
                    aspectRatio: '1 / 1.414',
                    width: '100%',
                    maxWidth: '720px',
                    minHeight: '720px',
                    boxShadow:
                        '0 1px 2px rgba(15, 23, 42, 0.08), 0 12px 28px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                }}
            >
                <div className="space-y-4 px-[8.5%] py-[7%]">
                    <header className="space-y-1.5 border-b border-slate-300 pb-3">
                        <h2 className="text-[22px] leading-tight font-bold tracking-tight">
                            {personal.full_name ||
                                t('candidate.cv_builder.full_name_fallback')}
                        </h2>
                        {personal.headline ? (
                            <p className="text-[13px] font-medium text-slate-700">
                                {personal.headline}
                            </p>
                        ) : null}
                        {contactLine ? (
                            <p className="text-[10px] text-slate-600">
                                {contactLine}
                            </p>
                        ) : null}
                        {profileLinks.length > 0 ? (
                            <p className="text-[10px] text-slate-600">
                                {profileLinks.map((link, index) => (
                                    <span key={link.href}>
                                        {index > 0 ? ' • ' : ''}
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:underline"
                                        >
                                            {link.label}
                                        </a>
                                    </span>
                                ))}
                            </p>
                        ) : null}
                    </header>

                    {data.summary ? (
                        <section className="space-y-1">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_summary_title',
                                )}
                            />
                            <p className="text-justify text-slate-800">
                                {data.summary}
                            </p>
                        </section>
                    ) : null}

                    {skills.length > 0 ? (
                        <section className="space-y-1">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_skills_title',
                                )}
                            />
                            <p className="text-slate-800">
                                {skills.join(' • ')}
                            </p>
                        </section>
                    ) : null}

                    {experiences.length > 0 ? (
                        <section className="space-y-2">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_experience_title',
                                )}
                            />
                            {experiences.map((item, index) => {
                                const bullets = formatBullets(item.description);

                                return (
                                    <div
                                        key={`exp-${index}`}
                                        className="space-y-0.5"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <p className="font-semibold">
                                                {item.company_name ||
                                                    t(
                                                        'candidate.cv_builder.company_name_fallback',
                                                    )}
                                            </p>
                                            <p className="text-[10px] text-slate-600">
                                                {[
                                                    item.location,
                                                    period(
                                                        item.start_date,
                                                        item.end_date,
                                                        item.is_current,
                                                    ),
                                                ]
                                                    .filter((v) => v)
                                                    .join(' • ')}
                                            </p>
                                        </div>
                                        {item.job_title ? (
                                            <p className="text-slate-700 italic">
                                                {item.job_title}
                                            </p>
                                        ) : null}
                                        {bullets.length > 0 ? (
                                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                                {bullets.map(
                                                    (bullet, bIndex) => (
                                                        <li key={bIndex}>
                                                            {bullet}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </section>
                    ) : null}

                    {educations.length > 0 ? (
                        <section className="space-y-2">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_education_title',
                                )}
                            />
                            {educations.map((item, index) => (
                                <div
                                    key={`edu-${index}`}
                                    className="space-y-0.5"
                                >
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <p className="font-semibold">
                                            {item.school_name ||
                                                t(
                                                    'candidate.cv_builder.school_name_fallback',
                                                )}
                                        </p>
                                        <p className="text-[10px] text-slate-600">
                                            {period(
                                                item.start_year,
                                                item.end_year,
                                            )}
                                        </p>
                                    </div>
                                    {item.degree || item.field_of_study ? (
                                        <p className="text-slate-700 italic">
                                            {[item.degree, item.field_of_study]
                                                .filter((v) => v)
                                                .join(' — ')}
                                        </p>
                                    ) : null}
                                    {item.description ? (
                                        <p className="text-slate-800">
                                            {item.description}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </section>
                    ) : null}

                    {projects.length > 0 ? (
                        <section className="space-y-2">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_project_title',
                                )}
                            />
                            {projects.map((item, index) => (
                                <div
                                    key={`proj-${index}`}
                                    className="space-y-0.5"
                                >
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <p className="font-semibold">
                                            {item.name ||
                                                t(
                                                    'candidate.cv_builder.project_name_fallback',
                                                )}
                                        </p>
                                        {item.link ? (
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-slate-600 hover:underline"
                                            >
                                                {item.link}
                                            </a>
                                        ) : null}
                                    </div>
                                    {item.role ? (
                                        <p className="text-slate-700 italic">
                                            {item.role}
                                        </p>
                                    ) : null}
                                    {item.description ? (
                                        <p className="text-slate-800">
                                            {item.description}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </section>
                    ) : null}

                    {certifications.length > 0 ? (
                        <section className="space-y-1">
                            <PreviewSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_certification_title',
                                )}
                            />
                            <ul className="space-y-0.5 text-slate-800">
                                {certifications.map((item, index) => (
                                    <li
                                        key={`cert-${index}`}
                                        className="flex flex-wrap items-baseline justify-between gap-2"
                                    >
                                        <span>
                                            {[item.name, item.issuer]
                                                .filter((v) => v)
                                                .join(' — ')}
                                        </span>
                                        <span className="text-[10px] text-slate-600">
                                            {item.year}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {!data.summary &&
                    experiences.length === 0 &&
                    educations.length === 0 &&
                    skills.length === 0 ? (
                        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-[10px] text-slate-500">
                            {t('candidate.cv_builder.preview_empty_message')}
                        </p>
                    ) : null}
                </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
                {t('candidate.cv_builder.preview_footer')}
            </p>
        </div>
    );
}

function PreviewSectionTitle({ title }: { title: string }) {
    return (
        <h3 className="mb-1.5 border-b border-slate-300 pb-1 text-[10px] font-bold tracking-[0.2em] text-slate-700 uppercase">
            {title}
        </h3>
    );
}

function ModernSectionTitle({ title }: { title: string }) {
    return (
        <h3 className="mb-1.5 border-b-[1.5px] border-slate-900 pb-1 text-[11px] font-bold tracking-[0.08em] text-[#093579] uppercase">
            {title}
        </h3>
    );
}

function CvModernPreview({
    data,
    t,
}: {
    data: CvBuilderData;
    t: (key: string) => string;
}) {
    const p = data.personal;
    const birthLine = [p.birth_place, p.birth_date]
        .filter((v) => v && v.trim() !== '')
        .join(', ');
    const links = [p.linkedin, p.github, p.portfolio].filter(
        (v) => v && v.trim() !== '',
    );
    const photoUrl = p.photo_path ? `/storage/${p.photo_path}` : null;

    const bullets = (description?: string): string[] =>
        (description ?? '')
            .split(/\r\n|\r|\n|•|- /)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

    const period = (start?: string, end?: string, isCurrent?: boolean) => {
        const s = start?.trim() ?? '';
        const e = isCurrent
            ? t('candidate.cv_builder.now')
            : (end?.trim() ?? '');
        if (!s && !e) return '';
        if (!s) return e;
        if (!e) return s;
        return `${s} - ${e}`;
    };

    const skills = data.skills.filter((v) => v.trim() !== '');
    const academic = data.academic.filter((v) => v.trim() !== '');
    const experiences = data.experiences.filter(
        (i) => i.company_name || i.job_title || i.description,
    );
    const educations = data.educations.filter(
        (i) => i.school_name || i.degree || i.field_of_study,
    );
    const certifications = data.certifications.filter((i) => i.name || i.issuer);
    const languages = data.languages
        .map((l) =>
            l.level ? `${l.name ?? ''} (${l.level})` : (l.name ?? ''),
        )
        .filter((v) => v.trim() !== '');

    return (
        <div className="rounded-b-xl bg-slate-200/80 px-4 py-5 sm:px-5">
            <div
                className="mx-auto bg-white font-serif text-[11px] leading-[1.5] text-slate-900"
                style={{
                    aspectRatio: '1 / 1.414',
                    width: '100%',
                    maxWidth: '720px',
                    minHeight: '720px',
                    boxShadow:
                        '0 1px 2px rgba(15, 23, 42, 0.08), 0 12px 28px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                }}
            >
                <div className="space-y-3.5 px-[7%] py-[6%]">
                    <header className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-[20px] leading-tight font-bold text-[#093579]">
                                {(
                                    p.full_name ||
                                    t('candidate.cv_builder.full_name_fallback')
                                ).toUpperCase()}
                            </h2>
                            {birthLine ? (
                                <p className="text-slate-800">{birthLine}</p>
                            ) : null}
                            {p.degree_title || p.headline ? (
                                <p className="text-slate-800">
                                    {p.degree_title || p.headline}
                                </p>
                            ) : null}
                            <div className="space-y-0.5 pt-1 text-[10.5px] text-slate-700">
                                {p.city ? (
                                    <p className="flex items-center gap-1.5">
                                        <MapPin className="size-3 text-[#093579]" />
                                        {p.city}
                                    </p>
                                ) : null}
                                {p.phone ? (
                                    <p className="flex items-center gap-1.5">
                                        <Phone className="size-3 text-[#093579]" />
                                        {p.phone}
                                    </p>
                                ) : null}
                                {p.email ? (
                                    <p className="flex items-center gap-1.5">
                                        <Mail className="size-3 text-[#093579]" />
                                        {p.email}
                                    </p>
                                ) : null}
                                {links.map((link) => (
                                    <p
                                        key={link}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Globe className="size-3 text-[#093579]" />
                                        {link}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="size-[88px] shrink-0 overflow-hidden border-2 border-slate-300 bg-slate-100">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center">
                                    <User className="size-7 text-slate-400" />
                                </div>
                            )}
                        </div>
                    </header>

                    {data.summary ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_summary_title',
                                )}
                            />
                            <p className="text-justify text-slate-800">
                                {data.summary}
                            </p>
                        </section>
                    ) : null}

                    {educations.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_education_title',
                                )}
                            />
                            {educations.map((item, index) => (
                                <div key={`edu-${index}`} className="mb-1.5">
                                    <p className="font-bold">
                                        {item.school_name}
                                    </p>
                                    {item.degree || item.field_of_study ? (
                                        <p className="text-slate-800">
                                            {[item.degree, item.field_of_study]
                                                .filter((v) => v)
                                                .join(' | ')}
                                        </p>
                                    ) : null}
                                    {period(
                                        item.start_year,
                                        item.end_year,
                                    ) ? (
                                        <p className="text-[10px] text-slate-600">
                                            {period(
                                                item.start_year,
                                                item.end_year,
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </section>
                    ) : null}

                    {academic.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.section_academic_title',
                                )}
                            />
                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                {academic.map((item, index) => (
                                    <li key={`aca-${index}`}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {experiences.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_experience_title',
                                )}
                            />
                            {experiences.map((item, index) => {
                                const lines = bullets(item.description);

                                return (
                                    <div
                                        key={`exp-${index}`}
                                        className="mb-2 space-y-0.5"
                                    >
                                        {item.company_name ? (
                                            <p className="font-bold">
                                                {item.company_name}
                                            </p>
                                        ) : null}
                                        {[
                                            item.location,
                                            period(
                                                item.start_date,
                                                item.end_date,
                                                item.is_current,
                                            ),
                                        ]
                                            .filter((v) => v)
                                            .join(' | ') ? (
                                            <p className="text-[10px] text-slate-600">
                                                {[
                                                    item.location,
                                                    period(
                                                        item.start_date,
                                                        item.end_date,
                                                        item.is_current,
                                                    ),
                                                ]
                                                    .filter((v) => v)
                                                    .join(' | ')}
                                            </p>
                                        ) : null}
                                        {item.job_title ? (
                                            <p className="text-slate-800">
                                                {item.job_title}
                                            </p>
                                        ) : null}
                                        {lines.length > 0 ? (
                                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                                {lines.map((b, bIndex) => (
                                                    <li key={bIndex}>{b}</li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </section>
                    ) : null}

                    {skills.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_skills_title',
                                )}
                            />
                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                {skills.map((skill, index) => (
                                    <li key={`skill-${index}`}>{skill}</li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {certifications.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t(
                                    'candidate.cv_builder.preview_certification_title',
                                )}
                            />
                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                {certifications.map((item, index) => (
                                    <li key={`cert-${index}`}>
                                        {[item.name, item.issuer, item.year]
                                            .filter((v) => v)
                                            .join(' - ')}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {languages.length > 0 ? (
                        <section>
                            <ModernSectionTitle
                                title={t('candidate.cv_builder.tab_languages')}
                            />
                            <ul className="ml-4 list-disc space-y-0.5 text-slate-800">
                                {languages.map((lang, index) => (
                                    <li key={`lang-${index}`}>{lang}</li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
                {t('candidate.cv_builder.preview_footer')}
            </p>
        </div>
    );
}

function ArraySection({
    title,
    onAdd,
    isEmpty = false,
    emptyTitle,
    emptyDescription,
    addLabel,
    children,
}: {
    title: string;
    onAdd: () => void;
    isEmpty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    addLabel?: string;
    children: React.ReactNode;
}) {
    const { t } = useTranslate();
    const resolvedAddLabel = addLabel ?? t('candidate.cv_builder.add');

    if (isEmpty) {
        return (
            <EmptyState
                title={
                    emptyTitle ??
                    t('candidate.cv_builder.empty_generic_title', {
                        section: title.toLowerCase(),
                    })
                }
                description={
                    emptyDescription ??
                    t('candidate.cv_builder.empty_generic_description', {
                        section: title.toLowerCase(),
                    })
                }
            >
                <Button type="button" onClick={onAdd}>
                    <Plus className="size-4" />
                    {resolvedAddLabel}
                </Button>
            </EmptyState>
        );
    }

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                >
                    <Plus className="size-4" />
                    {resolvedAddLabel}
                </Button>
            </div>
            {children}
        </section>
    );
}

function SimpleArrayCard({
    title,
    onRemove,
    children,
}: {
    title: string;
    onRemove: () => void;
    children: React.ReactNode;
}) {
    const { t } = useTranslate();

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{title}</p>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRemove}
                >
                    <Trash2 className="size-4" />
                    {t('candidate.cv_builder.delete')}
                </Button>
            </div>
            {children}
        </div>
    );
}

function updateItem<T extends object>(
    list: T[],
    index: number,
    patch: Partial<T>,
    onChange: (nextList: T[]) => void,
) {
    const next = list.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
    );
    onChange(next);
}

function PhotoUploader({ photoPath }: { photoPath: string }) {
    const { t } = useTranslate();
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const previewUrl = photoPath ? `/storage/${photoPath}` : null;

    const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        router.post(
            builderPhoto().url,
            { photo: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setUploading(false);
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                },
            },
        );
    };

    return (
        <Field
            label={t('candidate.cv_builder.photo_label')}
            name="personal.photo_path"
        >
            <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt=""
                            className="size-full object-cover"
                        />
                    ) : (
                        <User className="size-6 text-muted-foreground" />
                    )}
                </div>
                <div className="space-y-1">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={onPick}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => inputRef.current?.click()}
                    >
                        {uploading
                            ? t('candidate.cv_builder.photo_uploading')
                            : t('candidate.cv_builder.photo_button')}
                    </Button>
                    <FieldHint>
                        {t('candidate.cv_builder.photo_hint')}
                    </FieldHint>
                </div>
            </div>
        </Field>
    );
}

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-lg border bg-card/40 p-4 sm:p-5">
            <div className="space-y-1">
                <h3 className="text-base leading-tight font-semibold">
                    {title}
                </h3>
                {description ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

function FieldHint({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs leading-5 text-muted-foreground">{children}</p>
    );
}

function InputWithIcon({
    icon: Icon,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div className="relative">
            <Input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="pl-9"
            />
            <span className="pointer-events-none absolute top-0 left-0 flex h-9 w-9 items-center justify-center text-muted-foreground">
                <Icon className="size-4" />
            </span>
        </div>
    );
}

function SummaryEditor({
    value,
    onChange,
    t,
}: {
    value: string;
    onChange: (value: string) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const length = value.trim().length;
    const minTarget = 120;
    const maxTarget = 400;
    const status: 'too_short' | 'good' | 'too_long' =
        length === 0 || length < minTarget
            ? 'too_short'
            : length > maxTarget
              ? 'too_long'
              : 'good';
    const counterStyle = {
        too_short: 'text-amber-600',
        good: 'text-emerald-600',
        too_long: 'text-rose-600',
    }[status];

    return (
        <div className="space-y-2">
            <textarea
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('candidate.cv_builder.summary_placeholder')}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-3" />{' '}
                        {t('candidate.cv_builder.summary_tip')}
                    </span>
                </div>
                <span className={`font-medium ${counterStyle}`}>
                    {length} / {maxTarget}{' '}
                    {t('candidate.cv_builder.characters')}
                    {status === 'too_short' && length > 0
                        ? ` • ${t('candidate.cv_builder.summary_too_short')}`
                        : ''}
                    {status === 'good'
                        ? ` • ${t('candidate.cv_builder.summary_good')}`
                        : ''}
                    {status === 'too_long'
                        ? ` • ${t('candidate.cv_builder.summary_too_long')}`
                        : ''}
                </span>
            </div>
        </div>
    );
}

function SkillChipInput({
    skills,
    onChange,
    t,
}: {
    skills: string[];
    onChange: (skills: string[]) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const [draft, setDraft] = useState('');

    const add = (raw: string) => {
        const next = raw.trim();

        if (next === '') {
            return;
        }

        if (
            skills.some((skill) => skill.toLowerCase() === next.toLowerCase())
        ) {
            setDraft('');

            return;
        }

        onChange([...skills, next]);
        setDraft('');
    };

    const remove = (skill: string) => {
        onChange(skills.filter((item) => item !== skill));
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add(draft);
        } else if (event.key === 'Backspace' && draft === '' && skills.length) {
            remove(skills[skills.length - 1]);
        }
    };

    const suggestions = [
        'JavaScript',
        'TypeScript',
        'React',
        'Tailwind CSS',
        'Laravel',
        'Node.js',
        'PostgreSQL',
        'Git',
        'Komunikasi',
        'Problem solving',
    ].filter(
        (suggestion) =>
            !skills.some(
                (skill) => skill.toLowerCase() === suggestion.toLowerCase(),
            ),
    );

    return (
        <div className="space-y-3">
            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2 py-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
                {skills.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-md bg-[#0F4C94]/10 py-1 pr-1 pl-2.5 text-sm text-[#0F4C94]"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={() => remove(skill)}
                            className="rounded-sm p-0.5 transition hover:bg-[#0F4C94]/15"
                            aria-label={t(
                                'candidate.cv_builder.remove_skill_aria',
                                {
                                    skill,
                                },
                            )}
                        >
                            <X className="size-3.5" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => add(draft)}
                    placeholder={
                        skills.length === 0
                            ? t('candidate.cv_builder.skill_input_placeholder')
                            : t('candidate.cv_builder.add_skill_placeholder')
                    }
                    className="min-w-35 flex-1 bg-transparent px-1 text-sm outline-none"
                />
            </div>
            {suggestions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {t('candidate.cv_builder.suggestions_label')}
                    </span>
                    {suggestions.slice(0, 6).map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => add(suggestion)}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
                        >
                            <Plus className="size-3" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
                {t('candidate.cv_builder.skills_added', {
                    count: skills.length,
                })}
            </p>
        </div>
    );
}

function MarkdownText({ text }: { text: string }) {
    const renderInline = (content: string, key: number) => {
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        return (
            <span key={key}>
                {parts.map((part, idx) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={idx}>{part.slice(2, -2)}</strong>
                    ) : (
                        part
                    ),
                )}
            </span>
        );
    };

    return (
        <div className="space-y-1">
            {text.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                    return (
                        <h2
                            key={i}
                            className="mt-4 mb-1 text-sm font-bold text-foreground first:mt-0"
                        >
                            {renderInline(line.slice(3), i)}
                        </h2>
                    );
                }
                if (line.startsWith('### ')) {
                    return (
                        <h3
                            key={i}
                            className="mt-3 mb-0.5 text-xs font-semibold text-foreground uppercase tracking-wide"
                        >
                            {renderInline(line.slice(4), i)}
                        </h3>
                    );
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <div
                            key={i}
                            className="flex gap-2 text-sm leading-6 text-foreground/80"
                        >
                            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/30" />
                            <span>{renderInline(line.slice(2), i)}</span>
                        </div>
                    );
                }
                const numberedMatch = line.match(/^(\d+)\. (.*)/);
                if (numberedMatch) {
                    return (
                        <div
                            key={i}
                            className="flex gap-2 text-sm leading-6 text-foreground/80"
                        >
                            <span className="shrink-0 font-semibold text-foreground/50">
                                {numberedMatch[1]}.
                            </span>
                            <span>
                                {renderInline(numberedMatch[2], i)}
                            </span>
                        </div>
                    );
                }
                if (line.trim() === '') {
                    return <div key={i} className="h-1" />;
                }
                return (
                    <p
                        key={i}
                        className="text-sm leading-6 text-foreground/80"
                    >
                        {renderInline(line, i)}
                    </p>
                );
            })}
        </div>
    );
}

function AccordionSection({
    sectionKey,
    title,
    open,
    onToggle,
    badge,
    children,
    className,
}: {
    sectionKey: string;
    title: string;
    open: boolean;
    onToggle: () => void;
    badge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={`acc-${sectionKey}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
            >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {title}
                    {badge}
                </span>
                <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open ? (
                <div
                    id={`acc-${sectionKey}`}
                    className={`border-t bg-muted/10 p-4 sm:p-5 ${className ?? ''}`}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}

CandidateCv.layout = {
    breadcrumbs: [
        {
            title: 'CV Builder',
            href: index(),
        },
    ],
};
