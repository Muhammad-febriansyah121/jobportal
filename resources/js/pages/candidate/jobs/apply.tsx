import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import CandidateApplicationController from '@/actions/App/Http/Controllers/Candidate/CandidateApplicationController';
import { Field, Select } from '@/components/candidate/candidate-form';
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
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/candidate/jobs';

type ScreeningQuestion = {
    id: number;
    question: string;
    type: string;
    options?: string[];
    is_required: boolean;
};

type ApplyJobPageProps = {
    job: {
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        location: string;
        work_mode_label: string;
        job_type_label: string;
        salary_range: string;
        has_applied: boolean;
        screening_questions: ScreeningQuestion[];
    };
    application_chance?: {
        percentage: number;
        total_years_experience: number;
        summary: string;
    } | null;
    cvs: Array<{
        id: number;
        file_url: string;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
};

export default function CandidateJobApplyPage({
    job,
    application_chance,
    cvs,
}: ApplyJobPageProps) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={`Lamar ${job.title}`} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={`Lamar ${job.title}`}
                        description={`Lengkapi data lamaran untuk ${job.is_anonymous ? t('candidate.apply.anonymous_company') : (job.company ?? t('candidate.apply.anonymous_company'))} dengan benar sebelum submit.`}
                    />
                    <Button variant="outline" asChild>
                        <Link href={show(job.slug)}>
                            <ArrowLeft className="size-4" />
                            {t('candidate.apply.back')}
                        </Link>
                    </Button>
                </div>

                <Card className="border-primary-200 bg-primary-50/60">
                    <CardContent className="flex flex-wrap items-center gap-2 pt-5 text-sm text-muted-foreground">
                        <Badge variant="secondary">{t('candidate.apply.step')}</Badge>
                        <span>
                            Pastikan CV dan jawaban screening terisi sebelum
                            kirim.
                        </span>
                    </CardContent>
                </Card>

                {application_chance ? (
                    <Card className="border-amber-200 bg-amber-50/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-amber-900">
                                Prediksi peluang diterima
                            </CardTitle>
                            <CardDescription className="text-amber-800">
                                Estimasi awal berdasarkan latar pengalaman
                                kandidat dan karakter lowongan saat ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-amber-950">
                            <p className="text-2xl font-bold">
                                {application_chance.percentage}%
                            </p>
                            <p>
                                Total pengalaman terbaca sekitar{' '}
                                <b>
                                    {application_chance.total_years_experience}{' '}
                                    tahun
                                </b>
                                .
                            </p>
                            <p className="leading-6">
                                {application_chance.summary}
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="size-5 text-primary-600" />
                                {t('candidate.apply.form_title')}
                            </CardTitle>
                            <CardDescription>
                                Field bertanda{' '}
                                <span className="text-red-500">*</span> wajib
                                diisi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...CandidateApplicationController.store.form(
                                    job.id,
                                )}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            label={t('candidate.apply.cv_label')}
                                            name="candidate_cv_id"
                                            error={errors.candidate_cv_id}
                                            required
                                        >
                                            {cvs.length === 0 ? (
                                                <p className="text-sm text-amber-700">
                                                    Kamu belum punya CV.{' '}
                                                    <Link
                                                        href="/candidate/cv"
                                                        className="underline underline-offset-2 hover:text-amber-900"
                                                    >
                                                        Upload CV terlebih dahulu
                                                    </Link>{' '}
                                                    sebelum melamar.
                                                </p>
                                            ) : (
                                                <Select
                                                    name="candidate_cv_id"
                                                    required
                                                >
                                                    <option value="">
                                                        {t('candidate.apply.cv_placeholder')}
                                                    </option>
                                                    {cvs.map((cv) => (
                                                        <option
                                                            key={cv.id}
                                                            value={cv.id}
                                                        >
                                                            {cv.is_primary ? 'CV Utama' : `CV #${cv.id}`}
                                                            {cv.uploaded_at
                                                                ? ` — ${cv.uploaded_at}`
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </Select>
                                            )}
                                        </Field>

                                        <Field
                                            label={t('candidate.apply.cover_letter_label')}
                                            name="cover_letter"
                                            error={errors.cover_letter}
                                        >
                                            <RichTextEditor
                                                name="cover_letter"
                                                placeholder={t('candidate.apply.cover_letter_placeholder')}
                                                minLength={100}
                                                maxLength={5000}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Opsional. Jika diisi, minimal
                                                100 dan maksimal 5.000 karakter.
                                                Contoh: pengalaman relevan,
                                                skill utama, dan kapan bisa
                                                mulai kerja.
                                            </p>
                                        </Field>

                                        {job.screening_questions.map(
                                            (question) => (
                                                <ScreeningField
                                                    key={question.id}
                                                    question={question}
                                                    error={
                                                        errors[
                                                            `screening_answers.${question.id}`
                                                        ]
                                                    }
                                                />
                                            ),
                                        )}

                                        {errors.job ? (
                                            <p className="text-sm font-medium text-red-600">
                                                {errors.job}
                                            </p>
                                        ) : null}

                                        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                            <Button variant="outline" asChild>
                                                <Link href={show(job.slug)}>
                                                    {t('candidate.apply.btn_cancel')}
                                                </Link>
                                            </Button>
                                            <Button disabled={processing}>
                                                <Send className="size-4" />
                                                {processing
                                                    ? t('candidate.apply.btn_submitting')
                                                    : t('candidate.apply.btn_submit')}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Ringkasan Posisi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p className="font-semibold text-foreground">
                                    {job.title}
                                </p>
                                <p>{job.is_anonymous ? t('candidate.apply.anonymous_company') : (job.company ?? '-')}</p>
                                <p>{job.location}</p>
                                <p>
                                    {job.work_mode_label} · {job.job_type_label}
                                </p>
                                <p className="font-medium text-primary-600">
                                    {job.salary_range}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Tips Cepat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    1. Gunakan CV terbaru dan relevan untuk
                                    posisi ini.
                                </p>
                                <p>
                                    2. Jawab pertanyaan screening dengan contoh
                                    konkret.
                                </p>
                                <p>
                                    3. Cek ulang jawaban sebelum menekan tombol
                                    kirim.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function ScreeningField({
    question,
    error,
}: {
    question: ScreeningQuestion;
    error?: string;
}) {
    const { t } = useTranslate();
    const name = `screening_answers[${question.id}]`;

    return (
        <Field
            label={question.question}
            name={name}
            error={error}
            required={question.is_required}
        >
            {question.type === 'multiple_choice' ? (
                <Select name={name} required={question.is_required}>
                    <option value="">{t('candidate.apply.select_answer')}</option>
                    {(question.options ?? []).map((option) => (
                        <option value={option} key={option}>
                            {option}
                        </option>
                    ))}
                </Select>
            ) : question.type === 'yes_no' ? (
                <Select name={name} required={question.is_required}>
                    <option value="">{t('candidate.apply.select_answer')}</option>
                    <option value="yes">{t('candidate.apply.yes')}</option>
                    <option value="no">{t('candidate.apply.no')}</option>
                </Select>
            ) : question.type === 'number' ? (
                <Input
                    type="number"
                    name={name}
                    placeholder="0"
                    required={question.is_required}
                />
            ) : (
                <RichTextEditor
                    name={name}
                    placeholder={t('candidate.apply.text_answer_placeholder')}
                    required={question.is_required}
                />
            )}
        </Field>
    );
}

function RichTextEditor({
    name,
    placeholder,
    required = false,
    maxLength,
    minLength,
}: {
    name: string;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
    minLength?: number;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [plainLength, setPlainLength] = useState(0);

    const syncValue = (): void => {
        const rawHtml = editorRef.current?.innerHTML ?? '';
        const normalized = normalizeRichContent(rawHtml);

        if (hiddenRef.current) {
            hiddenRef.current.value = normalized;
        }

        const plain = rawHtml
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .trim();

        setIsEmpty(plain === '');
        setPlainLength(plain.length);
    };

    return (
        <div className="overflow-hidden rounded-md border border-input bg-transparent">
            <div className="flex flex-wrap gap-1 border-b bg-muted/20 p-2">
                <EditorButton onClick={() => document.execCommand('bold')}>
                    B
                </EditorButton>
                <EditorButton onClick={() => document.execCommand('italic')}>
                    I
                </EditorButton>
                <EditorButton onClick={() => document.execCommand('underline')}>
                    U
                </EditorButton>
                <EditorButton
                    onClick={() => document.execCommand('insertUnorderedList')}
                >
                    • List
                </EditorButton>
                <EditorButton
                    onClick={() => document.execCommand('insertOrderedList')}
                >
                    1. List
                </EditorButton>
                <EditorButton
                    onClick={() => document.execCommand('removeFormat')}
                >
                    Clear
                </EditorButton>
            </div>

            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    className={cn(
                        'min-h-28 w-full overflow-x-hidden px-3 py-2 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap outline-none',
                        '[&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-1 [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc',
                        focused && 'ring-[3px] ring-ring/50',
                    )}
                    onInput={syncValue}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        syncValue();
                        setFocused(false);
                    }}
                    onPaste={(event) => {
                        event.preventDefault();
                        const text = event.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                        syncValue();
                    }}
                />
                {isEmpty && !focused && placeholder ? (
                    <p className="pointer-events-none absolute top-0 left-0 px-3 py-2 text-sm text-muted-foreground">
                        {placeholder}
                    </p>
                ) : null}
            </div>

            <input
                ref={hiddenRef}
                type="hidden"
                name={name}
                defaultValue=""
                required={required}
            />

            {(maxLength ?? minLength) ? (
                <div className="flex justify-between border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                    <span>
                        {minLength && plainLength > 0 && plainLength < minLength ? (
                            <span className="text-amber-600">
                                Minimal {minLength} karakter
                            </span>
                        ) : null}
                    </span>
                    <span
                        className={
                            maxLength && plainLength > maxLength
                                ? 'font-semibold text-red-600'
                                : ''
                        }
                    >
                        {plainLength.toLocaleString('id-ID')}
                        {maxLength ? ` / ${maxLength.toLocaleString('id-ID')}` : ''}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function EditorButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
                onClick();
            }}
            className="rounded-md border bg-white px-2.5 py-1 text-xs font-semibold hover:bg-muted"
        >
            {children}
        </button>
    );
}

function normalizeRichContent(rawHtml: string): string {
    const plainText = rawHtml
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .trim();

    if (plainText === '') {
        return '';
    }

    return rawHtml;
}

CandidateJobApplyPage.layout = ({ job }: ApplyJobPageProps) => ({
    breadcrumbs: [
        {
            title: 'Cari Lowongan',
            href: index(),
        },
        {
            title: job.title,
            href: show(job.slug),
        },
        {
            title: 'Lamar',
            href: show(job.slug, { query: { apply: 1 } }),
        },
    ],
});
