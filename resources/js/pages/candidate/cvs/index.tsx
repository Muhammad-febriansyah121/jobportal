import { Form, Head, Link } from '@inertiajs/react';
import {
    ExternalLink,
    Eye,
    FileText,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { Field } from '@/components/candidate/candidate-form';
import { EmptyState } from '@/components/candidate/candidate-ui';

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
    primary as primaryCv,
    store as storeCv,
} from '@/routes/candidate/cvs';

type CvItem = {
    id: number;
    file_url: string;
    preview_url: string;
    source: string;
    is_pdf: boolean;
    is_primary: boolean;
    uploaded_at?: string | null;
};

type Props = {
    cvs: CvItem[];
};

export default function CandidateCvsIndex({ cvs }: Props) {
    const [previewCvUrl, setPreviewCvUrl] = useState<string | null>(
        () =>
            cvs.find((cv) => cv.is_primary && cv.is_pdf)?.preview_url ??
            cvs.find((cv) => cv.is_pdf)?.preview_url ??
            null,
    );

    return (
        <>
            <Head title="Data Profil – CV" />

            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload CV File</CardTitle>
                            <CardDescription>
                                Simpan versi file PDF atau DOC yang sudah final.
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
                                            <Upload className="size-4" />
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
                            <CardTitle>Daftar CV</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
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
                                                        CV #{cv.id}
                                                    </p>
                                                    {cv.is_primary ? (
                                                        <Badge>Utama</Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Upload: {cv.uploaded_at}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {cv.is_pdf
                                                        ? 'PDF dapat dipreview langsung.'
                                                        : 'Preview hanya tersedia untuk file PDF.'}
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
                                                        Preview
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
                                                            Buka File
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
                                                        <Trash2 className="size-4" />
                                                        Hapus
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada CV upload"
                                    description="Upload CV final untuk dipakai saat melamar."
                                />
                            )}

                            {previewCvUrl ? (
                                <div className="space-y-2 rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium">
                                            Preview CV PDF
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
                                                Buka di tab baru
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-md border bg-muted/20">
                                        <iframe
                                            src={previewCvUrl}
                                            title="Preview CV PDF"
                                            className="h-[68vh] w-full"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CandidateCvsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/candidate/dashboard' },
        { title: 'Data Profil', href: '/candidate/profile/edit' },
        { title: 'CV' },
    ],
};
