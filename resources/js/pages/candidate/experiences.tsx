import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    DatePickerInput,
    Field,
    Textarea,
} from '@/components/candidate/candidate-form';
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
    destroy as destroyExperience,
    index,
    store as storeExperience,
    update as updateExperience,
} from '@/routes/candidate/experiences';

type Experience = {
    id: number;
    company_name: string;
    job_title: string;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
    description?: string | null;
    location?: string | null;
    period: string;
};

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; experience: Experience };

export default function CandidateExperiences({
    experiences,
}: {
    experiences: Experience[];
}) {
    const { t } = useTranslate();
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

    const closeDialog = () => setDialog({ mode: 'closed' });
    const dialogOpen = dialog.mode !== 'closed';
    const editing = dialog.mode === 'edit' ? dialog.experience : undefined;

    return (
        <>
            <Head title={t('candidate.experiences.page_title')} />

            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>
                                {t('candidate.experiences.history_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.experiences.history_description')}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDialog({ mode: 'create' })}
                            className="shrink-0"
                        >
                            <Plus className="size-4" />
                            {t('candidate.experiences.form_add_button')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {experiences.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    title={t('candidate.experiences.empty_title')}
                                    description={t('candidate.experiences.empty_description')}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t('candidate.experiences.job_title')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.experiences.company_name')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.experiences.location')}
                                            </TableHead>
                                            <TableHead>Periode</TableHead>
                                            <TableHead className="w-32 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {experiences.map((experience) => (
                                            <TableRow key={experience.id}>
                                                <TableCell className="font-medium">
                                                    {experience.job_title}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {experience.company_name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {experience.location || '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {experience.period}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            aria-label={t('candidate.experiences.edit')}
                                                            onClick={() => setDialog({ mode: 'edit', experience })}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                            aria-label={t('candidate.experiences.delete')}
                                                        >
                                                            <Link
                                                                href={destroyExperience(experience.id)}
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
                                ? t('candidate.experiences.form_edit_title')
                                : t('candidate.experiences.form_add_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.experiences.history_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <ExperienceForm
                        experience={editing}
                        onSuccess={closeDialog}
                        t={t}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function ExperienceForm({
    experience,
    onSuccess,
    t,
}: {
    experience?: Experience;
    onSuccess: () => void;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(experience);

    return (
        <Form
            {...(isEdit
                ? updateExperience.form(experience!.id)
                : storeExperience.form())}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            resetOnSuccess={!isEdit}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <Field
                        label={t('candidate.experiences.company_name')}
                        name="company_name"
                        error={errors.company_name}
                    >
                        <Input
                            name="company_name"
                            defaultValue={experience?.company_name ?? ''}
                            placeholder={t('candidate.experiences.company_name_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.experiences.job_title')}
                        name="job_title"
                        error={errors.job_title}
                    >
                        <Input
                            name="job_title"
                            defaultValue={experience?.job_title ?? ''}
                            placeholder={t('candidate.experiences.job_title_placeholder')}
                        />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label={t('candidate.experiences.start_date')}
                            name="start_date"
                            error={errors.start_date}
                        >
                            <DatePickerInput
                                name="start_date"
                                defaultValue={experience?.start_date}
                                placeholder={t('candidate.experiences.start_date_placeholder')}
                            />
                        </Field>
                        <Field
                            label={t('candidate.experiences.end_date')}
                            name="end_date"
                            error={errors.end_date}
                        >
                            <DatePickerInput
                                name="end_date"
                                defaultValue={experience?.end_date}
                                placeholder={t('candidate.experiences.end_date_placeholder')}
                            />
                        </Field>
                    </div>
                    <input type="hidden" name="is_current" value="0" />
                    <label className="flex items-center gap-3 text-sm">
                        <input
                            className="size-4 rounded border-input"
                            type="checkbox"
                            name="is_current"
                            value="1"
                            defaultChecked={experience?.is_current ?? false}
                        />
                        {t('candidate.experiences.is_current')}
                    </label>
                    <Field
                        label={t('candidate.experiences.location')}
                        name="location"
                        error={errors.location}
                    >
                        <Input
                            name="location"
                            defaultValue={experience?.location ?? ''}
                            placeholder={t('candidate.experiences.location_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.experiences.description')}
                        name="description"
                        error={errors.description}
                    >
                        <Textarea
                            name="description"
                            defaultValue={experience?.description ?? ''}
                            placeholder={t('candidate.experiences.description_placeholder')}
                        />
                    </Field>
                    <DialogFooter>
                        <Button disabled={processing}>
                            {processing
                                ? t('candidate.form.saving')
                                : isEdit
                                  ? t('candidate.form.save_changes')
                                  : t('candidate.experiences.form_add_button')}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

CandidateExperiences.layout = {
    breadcrumbs: [
        {
            title: 'Pengalaman Kerja',
            href: index(),
        },
    ],
};
