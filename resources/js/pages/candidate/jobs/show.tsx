import { Form, Head, Link } from '@inertiajs/react';
import { Bookmark, BookmarkCheck, Send } from 'lucide-react';
import CandidateApplicationController from '@/actions/App/Http/Controllers/Candidate/CandidateApplicationController';
import CandidateReportController from '@/actions/App/Http/Controllers/Candidate/CandidateReportController';
import Heading from '@/components/heading';
import { Field, Select, Textarea } from '@/components/candidate/candidate-form';
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
import { save, show, unsave } from '@/routes/candidate/jobs';

type ScreeningQuestion = {
    id: number;
    question: string;
    type: string;
    options?: string[];
    is_required: boolean;
};

type JobShowProps = {
    job: {
        id: number;
        slug: string;
        title: string;
        company?: string | null;
        company_verified: boolean;
        industry?: string | null;
        location: string;
        work_mode_label: string;
        job_type_label: string;
        experience_level: string;
        salary_range: string;
        published_at?: string | null;
        closes_at?: string | null;
        description: string;
        responsibilities?: string | null;
        required_qualifications?: string | null;
        preferred_qualifications?: string | null;
        integrity_score?: number | null;
        company_description?: string | null;
        company_trust_score?: number | null;
        company_response_rate?: number | null;
        company_median_response_hours?: number | null;
        matched_skills: string[];
        missing_skills: string[];
        ai_match_score?: number | null;
        ai_match_explanation?: string | null;
        is_saved: boolean;
        has_applied: boolean;
        skills: Array<{ id: number; name: string }>;
        screening_questions: ScreeningQuestion[];
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
        company?: string | null;
        salary_range: string;
    }>;
};

export default function CandidateJobShow({
    job,
    cvs,
    similarJobs,
}: JobShowProps) {
    return (
        <>
            <Head title={job.title} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={job.title}
                        description={`${job.company ?? 'Perusahaan'} · ${job.location || 'Remote'}`}
                    />
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
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail lowongan</CardTitle>
                                <CardDescription>
                                    {job.salary_range} · {job.work_mode_label} ·{' '}
                                    {job.job_type_label}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    {job.company_verified ? (
                                        <Badge>Perusahaan verified</Badge>
                                    ) : null}
                                    {job.integrity_score ? (
                                        <Badge variant="outline">
                                            Integrity {job.integrity_score}%
                                        </Badge>
                                    ) : null}
                                    {job.ai_match_score ? (
                                        <Badge variant="outline">
                                            AI match {job.ai_match_score}%
                                        </Badge>
                                    ) : null}
                                    <Badge variant="secondary">
                                        {job.experience_level}
                                    </Badge>
                                </div>

                                <Section title="Deskripsi">
                                    {job.description}
                                </Section>
                                <Section title="Tanggung jawab">
                                    {job.responsibilities ?? '-'}
                                </Section>
                                <Section title="Kualifikasi wajib">
                                    {job.required_qualifications ?? '-'}
                                </Section>
                                <Section title="Kualifikasi tambahan">
                                    {job.preferred_qualifications ?? '-'}
                                </Section>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Skill dan AI match</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                <div className="grid gap-4 md:grid-cols-2">
                                    <SkillBox
                                        title="Matched skills"
                                        items={job.matched_skills}
                                    />
                                    <SkillBox
                                        title="Missing skills"
                                        items={job.missing_skills}
                                    />
                                </div>
                                {job.ai_match_explanation ? (
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {job.ai_match_explanation}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lamar pekerjaan</CardTitle>
                                <CardDescription>
                                    Pilih CV, isi cover letter, dan jawab
                                    pertanyaan screening.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {job.has_applied ? (
                                    <p className="text-sm text-muted-foreground">
                                        Kamu sudah mengirim lamaran untuk
                                        lowongan ini.
                                    </p>
                                ) : (
                                    <Form
                                        {...CandidateApplicationController.store.form(
                                            job.id,
                                        )}
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <Field
                                                    label="CV"
                                                    name="candidate_cv_id"
                                                    error={
                                                        errors.candidate_cv_id
                                                    }
                                                >
                                                    <Select name="candidate_cv_id">
                                                        <option value="">
                                                            Pilih CV
                                                        </option>
                                                        {cvs.map((cv) => (
                                                            <option
                                                                key={cv.id}
                                                                value={cv.id}
                                                            >
                                                                CV #{cv.id}
                                                                {cv.is_primary
                                                                    ? ' - utama'
                                                                    : ''}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </Field>
                                                <Field
                                                    label="Cover letter"
                                                    name="cover_letter"
                                                    error={errors.cover_letter}
                                                >
                                                    <Textarea
                                                        name="cover_letter"
                                                        placeholder="Tulis alasan singkat kenapa kamu cocok untuk posisi ini."
                                                    />
                                                </Field>
                                                {job.screening_questions.map(
                                                    (question) => (
                                                        <ScreeningField
                                                            error={
                                                                errors[
                                                                    `screening_answers.${question.id}`
                                                                ]
                                                            }
                                                            key={question.id}
                                                            question={question}
                                                        />
                                                    ),
                                                )}
                                                <Button disabled={processing}>
                                                    <Send />
                                                    {processing
                                                        ? 'Mengirim...'
                                                        : 'Kirim Lamaran'}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Perusahaan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <Info label="Nama">{job.company ?? '-'}</Info>
                                <Info label="Trust score">
                                    {job.company_trust_score ?? '-'}
                                </Info>
                                <Info label="Response rate">
                                    {job.company_response_rate ?? '-'}
                                </Info>
                                <Info label="Median response">
                                    {job.company_median_response_hours
                                        ? `${job.company_median_response_hours} jam`
                                        : '-'}
                                </Info>
                                <p className="leading-6 text-muted-foreground">
                                    {job.company_description}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Report lowongan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...CandidateReportController.store.form(
                                        job.id,
                                    )}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label="Alasan"
                                                name="reason"
                                                error={errors.reason}
                                            >
                                                <Select name="reason">
                                                    <option value="misleading">
                                                        Informasi menyesatkan
                                                    </option>
                                                    <option value="salary_mismatch">
                                                        Salary tidak sesuai
                                                    </option>
                                                    <option value="fraud">
                                                        Dugaan penipuan
                                                    </option>
                                                    <option value="unsafe">
                                                        Tidak aman
                                                    </option>
                                                    <option value="duplicate">
                                                        Duplikat
                                                    </option>
                                                    <option value="other">
                                                        Lainnya
                                                    </option>
                                                </Select>
                                            </Field>
                                            <Field
                                                label="Catatan"
                                                name="reporter_note"
                                                error={errors.reporter_note}
                                            >
                                                <Textarea
                                                    name="reporter_note"
                                                    placeholder="Tambahkan konteks report."
                                                />
                                            </Field>
                                            <Button
                                                disabled={processing}
                                                variant="outline"
                                            >
                                                Kirim report
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lowongan serupa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {similarJobs.map((similarJob) => (
                                    <Link
                                        className="block rounded-lg border p-3 hover:bg-muted/50"
                                        href={show(similarJob.slug)}
                                        key={similarJob.id}
                                    >
                                        <p className="font-medium">
                                            {similarJob.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {similarJob.company} ·{' '}
                                            {similarJob.salary_range}
                                        </p>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {children}
            </p>
        </section>
    );
}

function SkillBox({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="font-medium">{title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {items.length ? (
                    items.map((item) => (
                        <Badge key={item} variant="outline">
                            {item}
                        </Badge>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                )}
            </div>
        </div>
    );
}

function ScreeningField({
    question,
    error,
}: {
    question: ScreeningQuestion;
    error?: string;
}) {
    const name = `screening_answers[${question.id}]`;

    return (
        <Field
            label={`${question.question}${question.is_required ? ' *' : ''}`}
            name={name}
            error={error}
        >
            {question.type === 'multiple_choice' ? (
                <Select name={name}>
                    <option value="">Pilih jawaban</option>
                    {(question.options ?? []).map((option) => (
                        <option value={option} key={option}>
                            {option}
                        </option>
                    ))}
                </Select>
            ) : question.type === 'yes_no' ? (
                <Select name={name}>
                    <option value="">Pilih jawaban</option>
                    <option value="yes">Ya</option>
                    <option value="no">Tidak</option>
                </Select>
            ) : question.type === 'number' ? (
                <Input type="number" name={name} placeholder="0" />
            ) : (
                <Textarea name={name} placeholder="Jawaban kamu" />
            )}
        </Field>
    );
}

function Info({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{children}</span>
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
