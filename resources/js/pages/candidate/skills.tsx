import { Form, Head, Link } from '@inertiajs/react';
import { ShieldCheck, Trash2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
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

export default function CandidateSkills({
    candidateSkills,
    skills,
}: {
    candidateSkills: CandidateSkill[];
    skills: Option[];
}) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.skills.page_title')} />
            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <SkillForm skills={skills} t={t} />
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.skills.active_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.skills.active_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {candidateSkills.length ? (
                                candidateSkills.map((skill) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={skill.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">
                                                        {skill.name}
                                                    </p>
                                                    {skill.verified_at ? (
                                                        <Badge>
                                                            <ShieldCheck className="size-3" />
                                                            {t(
                                                                'candidate.skills.verified',
                                                            )}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            {t(
                                                                'candidate.skills.not_verified',
                                                            )}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {skill.proficiency ?? '-'} ·{' '}
                                                    {skill.years_exp ?? 0}{' '}
                                                    {t('candidate.skills.year')}
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Link
                                                    href={CandidateSkillController.destroy(
                                                        skill.id,
                                                    )}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <Trash2 />
                                                    {t(
                                                        'candidate.skills.delete',
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                {t(
                                                    'candidate.skills.edit_skill',
                                                )}
                                            </summary>
                                            <div className="mt-4">
                                                <SkillForm
                                                    skills={skills}
                                                    skill={skill}
                                                    t={t}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title={t('candidate.skills.empty_title')}
                                    description={t(
                                        'candidate.skills.empty_description',
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function SkillForm({
    skills,
    skill,
    t,
}: {
    skills: Option[];
    skill?: CandidateSkill;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(skill);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit
                        ? t('candidate.skills.form_edit_title')
                        : t('candidate.skills.form_add_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? CandidateSkillController.update.form(skill!.id)
                        : CandidateSkillController.store.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {isEdit ? null : (
                                <>
                                    <Field
                                        label={t(
                                            'candidate.skills.select_skill',
                                        )}
                                        name="skill_id"
                                        error={errors.skill_id}
                                    >
                                        <Select name="skill_id" defaultValue="">
                                            <option value="">
                                                {t(
                                                    'candidate.skills.choose_existing',
                                                )}
                                            </option>
                                            {skills.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
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
                                            placeholder={t(
                                                'candidate.skills.new_skill_placeholder',
                                            )}
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
                                    placeholder={t(
                                        'candidate.skills.years_exp_placeholder',
                                    )}
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
                                    <option value="">
                                        {t('candidate.skills.select_level')}
                                    </option>
                                    <option value="beginner">
                                        {t('candidate.skills.level_beginner')}
                                    </option>
                                    <option value="intermediate">
                                        {t(
                                            'candidate.skills.level_intermediate',
                                        )}
                                    </option>
                                    <option value="advanced">
                                        {t('candidate.skills.level_advanced')}
                                    </option>
                                    <option value="expert">
                                        {t('candidate.skills.level_expert')}
                                    </option>
                                </Select>
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? t('candidate.form.saving')
                                    : isEdit
                                      ? t('candidate.form.save_changes')
                                      : t('candidate.skills.form_add_button')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
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
