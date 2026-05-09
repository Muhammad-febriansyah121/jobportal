import { Form, Head, Link } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DatePickerInput, Field } from '@/components/candidate/candidate-form';
import { EmptyState } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
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
import {
    destroy as destroyCertification,
    index,
    store as storeCertification,
    update as updateCertification,
} from '@/routes/candidate/certifications';

type Certification = {
    id: number;
    name: string;
    issuing_org?: string | null;
    issue_date?: string | null;
    credential_url?: string | null;
};

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; certification: Certification };

export default function CandidateCertifications({
    certifications,
}: {
    certifications: Certification[];
}) {
    const { t } = useTranslate();
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

    const closeDialog = () => setDialog({ mode: 'closed' });
    const dialogOpen = dialog.mode !== 'closed';
    const editing = dialog.mode === 'edit' ? dialog.certification : undefined;

    return (
        <>
            <Head title={t('candidate.certifications.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.certifications.heading_title')}
                    description={t('candidate.certifications.heading_description')}
                />

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>
                                {t('candidate.certifications.list_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.certifications.list_description')}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDialog({ mode: 'create' })}
                            className="shrink-0"
                        >
                            <Plus className="size-4" />
                            {t('candidate.certifications.form_add_button')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {certifications.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    title={t('candidate.certifications.empty_title')}
                                    description={t('candidate.certifications.empty_description')}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t('candidate.certifications.name')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.certifications.issuer')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.certifications.issue_date')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.certifications.credential')}
                                            </TableHead>
                                            <TableHead className="w-32 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {certifications.map((certification) => (
                                            <TableRow key={certification.id}>
                                                <TableCell className="font-medium">
                                                    {certification.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {certification.issuing_org ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {certification.issue_date ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {certification.credential_url ? (
                                                        <a
                                                            className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                                                            href={certification.credential_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                            {t('candidate.certifications.credential')}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            aria-label={t('candidate.certifications.edit')}
                                                            onClick={() => setDialog({ mode: 'edit', certification })}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                            aria-label={t('candidate.certifications.delete')}
                                                        >
                                                            <Link
                                                                href={destroyCertification(certification.id)}
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

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? t('candidate.certifications.form_edit_title')
                                : t('candidate.certifications.form_add_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.certifications.list_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <CertificationForm
                        certification={editing}
                        onSuccess={closeDialog}
                        t={t}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function CertificationForm({
    certification,
    onSuccess,
    t,
}: {
    certification?: Certification;
    onSuccess: () => void;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(certification);

    return (
        <Form
            {...(isEdit
                ? updateCertification.form(certification!.id)
                : storeCertification.form())}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            resetOnSuccess={!isEdit}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <Field
                        label={t('candidate.certifications.name')}
                        name="name"
                        error={errors.name}
                    >
                        <Input
                            name="name"
                            defaultValue={certification?.name ?? ''}
                            placeholder={t('candidate.certifications.name_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.certifications.issuer')}
                        name="issuing_org"
                        error={errors.issuing_org}
                    >
                        <Input
                            name="issuing_org"
                            defaultValue={certification?.issuing_org ?? ''}
                            placeholder={t('candidate.certifications.issuer_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.certifications.issue_date')}
                        name="issue_date"
                        error={errors.issue_date}
                    >
                        <DatePickerInput
                            name="issue_date"
                            defaultValue={certification?.issue_date}
                            placeholder={t('candidate.certifications.issue_date_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.certifications.credential_url')}
                        name="credential_url"
                        error={errors.credential_url}
                    >
                        <Input
                            name="credential_url"
                            defaultValue={certification?.credential_url ?? ''}
                            placeholder={t('candidate.certifications.credential_url_placeholder')}
                        />
                    </Field>
                    <DialogFooter>
                        <Button disabled={processing}>
                            {processing
                                ? t('candidate.form.saving')
                                : isEdit
                                  ? t('candidate.form.save_changes')
                                  : t('candidate.certifications.form_add_button')}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

CandidateCertifications.layout = {
    breadcrumbs: [
        {
            title: 'Sertifikasi',
            href: index(),
        },
    ],
};
