import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CandidateSkillController from '@/actions/App/Http/Controllers/Candidate/CandidateSkillController';
import { Field, Select } from '@/components/candidate/candidate-form';
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
import { index } from '@/routes/candidate/skills';

type Option = {
    value: string;
    label: string;
};

type CandidateSkill = {
    id: number;
    name: string;
    category?: string | null;
    years_exp?: number | null;
    proficiency?: string | null;
    verified_at?: string | null;
};

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; skill: CandidateSkill };

export default function CandidateSkills({
    candidateSkills,
    skills,
}: {
    candidateSkills: CandidateSkill[];
    skills: Option[];
}) {
    const { t } = useTranslate();
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

    const closeDialog = () => setDialog({ mode: 'closed' });
    const dialogOpen = dialog.mode !== 'closed';
    const editing = dialog.mode === 'edit' ? dialog.skill : undefined;

    return (
        <>
            <Head title={t('candidate.skills.page_title')} />
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>{t('candidate.skills.active_title')}</CardTitle>
                            <CardDescription>
                                {t('candidate.skills.active_description')}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDialog({ mode: 'create' })}
                            className="shrink-0"
                        >
                            <Plus className="size-4" />
                            {t('candidate.skills.form_add_button')}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {candidateSkills.length === 0 ? (
                            <div className="px-6 py-8">
                                <EmptyState
                                    title={t('candidate.skills.empty_title')}
                                    description={t('candidate.skills.empty_description')}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Skill</TableHead>
                                            <TableHead>
                                                {t('candidate.skills.proficiency')}
                                            </TableHead>
                                            <TableHead>
                                                {t('candidate.skills.years_exp')}
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-32 text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {candidateSkills.map((skill) => (
                                            <TableRow key={skill.id}>
                                                <TableCell className="font-medium">
                                                    {skill.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground capitalize">
                                                    {skill.proficiency ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {skill.years_exp ?? 0} {t('candidate.skills.year')}
                                                </TableCell>
                                                <TableCell>
                                                    {skill.verified_at ? (
                                                        <Badge>
                                                            <ShieldCheck className="size-3" />
                                                            {t('candidate.skills.verified')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            {t('candidate.skills.not_verified')}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            aria-label={t('candidate.skills.edit_skill')}
                                                            onClick={() => setDialog({ mode: 'edit', skill })}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:text-destructive"
                                                            aria-label={t('candidate.skills.delete')}
                                                        >
                                                            <Link
                                                                href={CandidateSkillController.destroy(skill.id)}
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
                                ? t('candidate.skills.form_edit_title')
                                : t('candidate.skills.form_add_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('candidate.skills.active_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <SkillForm
                        skills={skills}
                        skill={editing}
                        onSuccess={closeDialog}
                        t={t}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function SkillForm({
    skills,
    skill,
    onSuccess,
    t,
}: {
    skills: Option[];
    skill?: CandidateSkill;
    onSuccess: () => void;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(skill);

    return (
        <Form
            {...(isEdit
                ? CandidateSkillController.update.form(skill!.id)
                : CandidateSkillController.store.form())}
            options={{ preserveScroll: true }}
            onSuccess={onSuccess}
            resetOnSuccess={!isEdit}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    {isEdit ? null : (
                        <>
                            <Field
                                label={t('candidate.skills.select_skill')}
                                name="skill_id"
                                error={errors.skill_id}
                            >
                                <Select name="skill_id" defaultValue="">
                                    <option value="">
                                        {t('candidate.skills.choose_existing')}
                                    </option>
                                    {skills.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </Field>

                            <Field
                                label={t('candidate.skills.new_skill')}
                                name="skill_name"
                                error={errors.skill_name}
                            >
                                <Input
                                    name="skill_name"
                                    placeholder={t('candidate.skills.new_skill_placeholder')}
                                />
                            </Field>
                        </>
                    )}
                    <Field
                        label={t('candidate.skills.years_exp')}
                        name="years_exp"
                        error={errors.years_exp}
                    >
                        <Input
                            type="number"
                            name="years_exp"
                            defaultValue={skill?.years_exp ?? ''}
                            placeholder={t('candidate.skills.years_exp_placeholder')}
                        />
                    </Field>
                    <Field
                        label={t('candidate.skills.proficiency')}
                        name="proficiency"
                        error={errors.proficiency}
                    >
                        <Select
                            name="proficiency"
                            defaultValue={skill?.proficiency ?? ''}
                        >
                            <option value="">{t('candidate.skills.select_level')}</option>
                            <option value="beginner">
                                {t('candidate.skills.level_beginner')}
                            </option>
                            <option value="intermediate">
                                {t('candidate.skills.level_intermediate')}
                            </option>
                            <option value="advanced">
                                {t('candidate.skills.level_advanced')}
                            </option>
                            <option value="expert">
                                {t('candidate.skills.level_expert')}
                            </option>
                        </Select>
                    </Field>
                    <DialogFooter>
                        <Button disabled={processing}>
                            {processing
                                ? t('candidate.form.saving')
                                : isEdit
                                  ? t('candidate.form.save_changes')
                                  : t('candidate.skills.form_add_button')}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

CandidateSkills.layout = {
    breadcrumbs: [
        {
            title: 'Skill Kandidat',
            href: index(),
        },
    ],
};
