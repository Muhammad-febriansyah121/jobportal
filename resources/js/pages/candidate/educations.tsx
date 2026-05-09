import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Field } from '@/components/candidate/candidate-form';
import { EmptyState } from '@/components/candidate/candidate-ui';
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
    destroy as destroyEducation,
    index,
    store as storeEducation,
    update as updateEducation,
} from '@/routes/candidate/educations';

type Education = {
    id: number;
    institution: string;
    degree?: string | null;
    field_of_study?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    gpa?: string | number | null;
};

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; education: Education };

export default function CandidateEducations({
    educations,
}: {
    educations: Education[];
}) {
    const { t } = useTranslate();
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

    const closeDialog = () => setDialog({ mode: 'closed' });
    const dialogOpen = dialog.mode !== 'closed';
    const editing = dialog.mode === 'edit' ? dialog.education : undefined;

    return (
        <>
            <Head title={t('candidate.educations.page_title')} />
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>
                                {t('candidate.educations.history_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.educations.history_description')}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDialog({ mode: 'create' })}
                            className="shrink-0"
                        >
                            <Plus className="size-4" />
                            {t('candidate.educations.form_add_button')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {educations.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    title={t('candidate.educations.empty_title')}
                                    description={t('candidate.educations.empty_description')}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t('candidate.educations.institution')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.educations.degree')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.educations.field_of_study')}
                                            </TableHead>
                                            <TableHead>Periode</TableHead>
                                            <TableHead>
                                                {t('candidate.educations.gpa')}
                                            </TableHead>
                                            <TableHead className="w-32 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {educations.map((education) => (
                                            <TableRow key={education.id}>
                                                <TableCell className="font-medium">
                                                    {education.institution}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {education.degree ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {education.field_of_study ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {education.start_year ?? '-'} - {education.end_year ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {education.gpa ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            aria-label={t('candidate.educations.edit')}
                                                            onClick={() => setDialog({ mode: 'edit', education })}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                            aria-label={t('candidate.educations.delete')}
                                                        >
                                                            <Link
                                                                href={destroyEducation(education.id)}
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
                                ? t('candidate.educations.form_edit_title')
                                : t('candidate.educations.form_add_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.educations.history_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <EducationForm
                        education={editing}
                        onSuccess={closeDialog}
                        t={t}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function EducationForm({
    education,
    onSuccess,
    t,
}: {
    education?: Education;
    onSuccess: () => void;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(education);

    return (
        <Form
            {...(isEdit
                ? updateEducation.form(education!.id)
                : storeEducation.form())}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            resetOnSuccess={!isEdit}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <Field
                        label={t('candidate.educations.institution')}
                        name="institution"
                        error={errors.institution}
                    >
                        <Input
                            name="institution"
                            defaultValue={education?.institution ?? ''}
                            placeholder={t('candidate.educations.institution_placeholder')}
                        />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label={t('candidate.educations.degree')}
                            name="degree"
                            error={errors.degree}
                        >
                            <Input
                                name="degree"
                                defaultValue={education?.degree ?? ''}
                                placeholder={t('candidate.educations.degree_placeholder')}
                            />
                        </Field>
                        <Field
                            label={t('candidate.educations.field_of_study')}
                            name="field_of_study"
                            error={errors.field_of_study}
                        >
                            <Input
                                name="field_of_study"
                                defaultValue={education?.field_of_study ?? ''}
                                placeholder={t('candidate.educations.field_of_study_placeholder')}
                            />
                        </Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            label={t('candidate.educations.start_year')}
                            name="start_year"
                            error={errors.start_year}
                        >
                            <Input
                                type="number"
                                name="start_year"
                                defaultValue={education?.start_year ?? ''}
                                placeholder={t('candidate.educations.start_year_placeholder')}
                            />
                        </Field>
                        <Field
                            label={t('candidate.educations.end_year')}
                            name="end_year"
                            error={errors.end_year}
                        >
                            <Input
                                type="number"
                                name="end_year"
                                defaultValue={education?.end_year ?? ''}
                                placeholder={t('candidate.educations.end_year_placeholder')}
                            />
                        </Field>
                        <Field
                            label={t('candidate.educations.gpa')}
                            name="gpa"
                            error={errors.gpa}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                name="gpa"
                                defaultValue={education?.gpa ?? ''}
                                placeholder={t('candidate.educations.gpa_placeholder')}
                            />
                        </Field>
                    </div>
                    <DialogFooter>
                        <Button disabled={processing}>
                            {processing
                                ? t('candidate.form.saving')
                                : isEdit
                                  ? t('candidate.form.save_changes')
                                  : t('candidate.educations.form_add_button')}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

CandidateEducations.layout = {
    breadcrumbs: [
        {
            title: 'Pendidikan',
            href: index(),
        },
    ],
};
