import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import CandidateScrapedJobApplicationController from '@/actions/App/Http/Controllers/Candidate/CandidateScrapedJobApplicationController';
import { Field, Select, Textarea } from '@/components/candidate/candidate-form';
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
import { index as cvsIndex } from '@/routes/candidate/cvs';

type ScrapedApplyPageProps = {
    job: {
        id: number;
        title: string;
        company: string;
        location?: string | null;
        work_mode: string;
        job_type: string;
        salary_range: string;
        detail_url: string;
        recipient_email: string;
    };
    cvs: Array<{
        id: number;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
    candidate_phone?: string | null;
    email_delivery_ready: boolean;
};

export default function ScrapedJobApplyPage({
    job,
    cvs,
    candidate_phone,
    email_delivery_ready,
}: ScrapedApplyPageProps) {
    return (
        <>
            <Head title={'Lamar ' + job.title} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={'Lamar ' + job.title}
                        description={
                            'CV akan dikirim ke email HR ' +
                            job.recipient_email +
                            '.'
                        }
                    />
                    <Button variant="outline" asChild>
                        <Link href={job.detail_url}>
                            <ArrowLeft className="size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Card
                    className={
                        email_delivery_ready
                            ? 'border-emerald-200 bg-emerald-50/70'
                            : 'border-amber-200 bg-amber-50/80'
                    }
                >
                    <CardContent className="flex flex-wrap items-center gap-3 pt-5 text-sm">
                        <Badge variant="secondary">
                            {email_delivery_ready
                                ? 'Email siap dikirim'
                                : 'Email menunggu SMTP'}
                        </Badge>
                        <span>
                            {email_delivery_ready
                                ? 'Setelah submit, sistem memasukkan email lamaran ke queue.'
                                : 'Lamaran tetap disimpan. Email akan dikirim setelah admin mengaktifkan SMTP.'}
                        </span>
                    </CardContent>
                </Card>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="size-5 text-primary-600" />
                                Data lamaran
                            </CardTitle>
                            <CardDescription>
                                CV wajib dipilih. Surat lamaran bersifat opsional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...CandidateScrapedJobApplicationController.store.form(
                                    job.id,
                                )}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            label="Nomor WhatsApp"
                                            name="phone"
                                            error={errors.phone}
                                            required
                                        >
                                            <Input
                                                type="tel"
                                                name="phone"
                                                inputMode="tel"
                                                defaultValue={candidate_phone ?? ''}
                                                placeholder="08xxxxxxxxxx"
                                                required
                                            />
                                        </Field>

                                        <Field
                                            label="CV"
                                            name="candidate_cv_id"
                                            error={errors.candidate_cv_id}
                                            required
                                        >
                                            {cvs.length === 0 ? (
                                                <p className="text-sm text-amber-700">
                                                    Kamu belum punya CV.{' '}
                                                    <Link
                                                        href={cvsIndex()}
                                                        className="underline underline-offset-2"
                                                    >
                                                        Upload CV terlebih dahulu.
                                                    </Link>
                                                </p>
                                            ) : (
                                                <Select
                                                    name="candidate_cv_id"
                                                    required
                                                >
                                                    <option value="">
                                                        Pilih CV
                                                    </option>
                                                    {cvs.map((cv) => (
                                                        <option
                                                            key={cv.id}
                                                            value={cv.id}
                                                        >
                                                            {cv.is_primary
                                                                ? 'CV Utama'
                                                                : 'CV #' + cv.id}
                                                            {cv.uploaded_at
                                                                ? ' — ' + cv.uploaded_at
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </Select>
                                            )}
                                        </Field>

                                        <Field
                                            label="Surat lamaran"
                                            name="cover_letter"
                                            error={errors.cover_letter}
                                        >
                                            <Textarea
                                                name="cover_letter"
                                                placeholder="Jelaskan pengalaman dan alasan kamu cocok untuk posisi ini."
                                                minLength={100}
                                                maxLength={5000}
                                                className="min-h-40"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Jika diisi, minimal 100 dan maksimal
                                                5.000 karakter.
                                            </p>
                                        </Field>

                                        <Field
                                            label="Persetujuan"
                                            name="consent_to_email"
                                            error={errors.consent_to_email}
                                            required
                                        >
                                            <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    name="consent_to_email"
                                                    value="1"
                                                    required
                                                    className="mt-1 size-4 rounded border-input accent-primary-600"
                                                />
                                                <span>
                                                    Saya menyetujui CV dan data
                                                    lamaran dikirim ke perusahaan
                                                    untuk posisi ini.
                                                </span>
                                            </label>
                                        </Field>

                                        {errors.job ? (
                                            <p className="text-sm font-medium text-red-600">
                                                {errors.job}
                                            </p>
                                        ) : null}

                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    processing || cvs.length === 0
                                                }
                                            >
                                                <Send className="size-4" />
                                                {processing
                                                    ? 'Mengirim...'
                                                    : 'Kirim lamaran'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Ringkasan posisi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p className="font-semibold text-foreground">
                                {job.title}
                            </p>
                            <p>{job.company}</p>
                            <p>{job.location || 'Lokasi tidak dicantumkan'}</p>
                            <p>
                                {job.work_mode} · {job.job_type}
                            </p>
                            <p className="font-medium text-primary-600">
                                {job.salary_range}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
