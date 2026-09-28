import { Form, Head, Link } from '@inertiajs/react';
import {
    ExternalLink,
    Eye,
    FileText,
    Plus,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { dashboard as candidateDashboard } from '@/routes/candidate';
import {
    destroy as destroyCv,
    primary as primaryCv,
    store as storeCv,
} from '@/routes/candidate/cvs';
import { edit as candidateProfile } from '@/routes/candidate/profile';

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

type DialogState =
    | { mode: 'closed' }
    | { mode: 'upload' }
    | { mode: 'preview'; cv: CvItem };

export default function CandidateCvsIndex({ cvs }: Props) {
    const { t } = useTranslate();
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

    const closeDialog = () => setDialog({ mode: 'closed' });
    const dialogOpen = dialog.mode !== 'closed';

    return (
        <>
            <Head title={t('candidate.cvs.page_title')} />

            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>{t('candidate.cvs.list_title')}</CardTitle>
                            <CardDescription>
                                {t('candidate.cvs.upload_desc')}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDialog({ mode: 'upload' })}
                            className="shrink-0"
                        >
                            <Plus className="size-4" />
                            {t('candidate.cvs.btn_upload')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {cvs.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    title={t('candidate.cvs.empty_title')}
                                    description={t('candidate.cvs.empty_desc')}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>CV</TableHead>
                                            <TableHead>
                                                {t('candidate.cvs.uploaded_at')}
                                            </TableHead>
                                            <TableHead>Format</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-44 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cvs.map((cv) => (
                                            <TableRow key={cv.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="size-4 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            CV #{cv.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {cv.uploaded_at ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {cv.is_pdf ? 'PDF' : (cv.source || 'DOC').toUpperCase()}
                                                </TableCell>
                                                <TableCell>
                                                    {cv.is_primary ? (
                                                        <Badge>
                                                            {t('candidate.cvs.badge_primary')}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {cv.is_pdf ? (
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-8"
                                                                aria-label={t('candidate.cvs.btn_preview')}
                                                                onClick={() => setDialog({ mode: 'preview', cv })}
                                                            >
                                                                <Eye className="size-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                asChild
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-8"
                                                                aria-label={t('candidate.cvs.btn_open')}
                                                            >
                                                                <a
                                                                    href={cv.file_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <ExternalLink className="size-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {!cv.is_primary ? (
                                                            <Form {...primaryCv.form(cv.id)}>
                                                                {({ processing }) => (
                                                                    <Button
                                                                        type="submit"
                                                                        disabled={processing}
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="size-8"
                                                                        aria-label={t('candidate.cvs.btn_make_primary')}
                                                                    >
                                                                        <Star className="size-4" />
                                                                    </Button>
                                                                )}
                                                            </Form>
                                                        ) : null}
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                            aria-label={t('candidate.cvs.btn_delete')}
                                                        >
                                                            <Link
                                                                href={destroyCv(cv.id)}
                                                                method="delete"
                                                                as="button"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upload modal */}
            <Dialog
                open={dialogOpen && dialog.mode === 'upload'}
                onOpenChange={(open) => !open && closeDialog()}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('candidate.cvs.upload_title')}</DialogTitle>
                        <DialogDescription>
                            {t('candidate.cvs.upload_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...storeCv.form()}
                        options={{ preserveScroll: true }}
                        onSuccess={closeDialog}
                        className="space-y-4"
                        encType="multipart/form-data"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field
                                    label={t('candidate.cvs.cv_file')}
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
                                    {t('candidate.cvs.label_make_primary')}
                                </label>
                                <DialogFooter>
                                    <Button disabled={processing}>
                                        <Upload className="size-4" />
                                        {processing
                                            ? t('candidate.cvs.btn_uploading')
                                            : t('candidate.cvs.btn_upload')}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Preview modal */}
            <Dialog
                open={dialogOpen && dialog.mode === 'preview'}
                onOpenChange={(open) => !open && closeDialog()}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('candidate.cvs.preview_title')}
                            {dialog.mode === 'preview' ? ` — CV #${dialog.cv.id}` : ''}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.cvs.preview_pdf_title')}
                        </DialogDescription>
                    </DialogHeader>
                    {dialog.mode === 'preview' ? (
                        <div className="space-y-3">
                            <div className="overflow-hidden rounded-md border bg-muted/20">
                                <iframe
                                    src={dialog.cv.preview_url}
                                    title={t('candidate.cvs.preview_pdf_title')}
                                    className="h-[70vh] w-full"
                                />
                            </div>
                            <DialogFooter>
                                <Button asChild variant="outline">
                                    <a
                                        href={dialog.cv.preview_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink className="size-4" />
                                        {t('candidate.cvs.btn_open_tab')}
                                    </a>
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}

CandidateCvsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: candidateDashboard() },
        { title: 'Data Profil', href: candidateProfile() },
        { title: 'CV' },
    ],
};
