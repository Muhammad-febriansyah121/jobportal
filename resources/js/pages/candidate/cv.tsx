import { Form, Head, Link } from '@inertiajs/react';
import { FileText, Star, Trash2, Upload } from 'lucide-react';
import Heading from '@/components/heading';
import { Field } from '@/components/candidate/candidate-form';
import { EmptyState, ProgressBar } from '@/components/candidate/candidate-ui';
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
    destroy as destroyCv,
    index,
    primary as primaryCv,
    store as storeCv,
} from '@/routes/candidate/cvs';

type CvPageProps = {
    cvs: Array<{
        id: number;
        file_url: string;
        source: string;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
    aiSummary?: string | null;
    profileCompletion: number;
};

export default function CandidateCv({
    cvs,
    aiSummary,
    profileCompletion,
}: CvPageProps) {
    return (
        <>
            <Head title="CV Kandidat" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="CV Kandidat"
                    description="Upload, preview, pilih CV utama, dan kelola CV yang dipakai untuk melamar."
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload CV</CardTitle>
                                <CardDescription>
                                    Format PDF, DOC, atau DOCX maksimal 5 MB.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...storeCv.form()}
                                    className="space-y-4"
                                    encType="multipart/form-data"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label="File CV"
                                                name="cv_file"
                                                error={errors.cv_file}
                                            >
                                                <Input
                                                    type="file"
                                                    name="cv_file"
                                                    accept=".pdf,.doc,.docx"
                                                />
                                            </Field>
                                            <label className="flex items-center gap-3 text-sm">
                                                <input
                                                    className="size-4 rounded border-input"
                                                    name="is_primary"
                                                    type="checkbox"
                                                    value="1"
                                                />
                                                Jadikan CV utama
                                            </label>
                                            <Button disabled={processing}>
                                                <Upload />
                                                {processing
                                                    ? 'Mengunggah...'
                                                    : 'Upload CV'}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>AI CV summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {aiSummary ??
                                        'Ringkasan akan tampil setelah CV utama diproses.'}
                                </p>
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span>Profile completion</span>
                                        <span>{profileCompletion}%</span>
                                    </div>
                                    <ProgressBar value={profileCompletion} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar CV</CardTitle>
                            <CardDescription>
                                CV utama dipilih otomatis jika baru ada satu CV.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cvs.length ? (
                                cvs.map((cv) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={cv.id}
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-4" />
                                                    <p className="font-medium">
                                                        CV #{cv.id}
                                                    </p>
                                                    {cv.is_primary ? (
                                                        <Badge>Utama</Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Upload: {cv.uploaded_at}
                                                </p>
                                                <a
                                                    className="text-sm text-primary underline-offset-4 hover:underline"
                                                    href={cv.file_url}
                                                    target="_blank"
                                                >
                                                    Preview CV
                                                </a>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
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
                                                                <Star />
                                                                Jadikan utama
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
                                                        <Trash2 />
                                                        Hapus
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada CV"
                                    description="Upload CV pertama agar kamu bisa melamar lowongan."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CandidateCv.layout = {
    breadcrumbs: [
        {
            title: 'CV Kandidat',
            href: index(),
        },
    ],
};
