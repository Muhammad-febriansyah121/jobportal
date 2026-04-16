import { Form, Head, Link } from '@inertiajs/react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import CandidateSkillController from '@/actions/App/Http/Controllers/Candidate/CandidateSkillController';
import Heading from '@/components/heading';
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
    return (
        <>
            <Head title="Skill Kandidat" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Skill Kandidat"
                    description="Kelola skill utama, tahun pengalaman, proficiency, dan badge verified."
                />
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <SkillForm skills={skills} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill aktif</CardTitle>
                            <CardDescription>
                                Skill ini dipakai untuk rekomendasi lowongan dan
                                match score.
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
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Belum verified
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {skill.proficiency ?? '-'} ·{' '}
                                                    {skill.years_exp ?? 0} tahun
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
                                                    Hapus
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                Edit skill
                                            </summary>
                                            <div className="mt-4">
                                                <SkillForm
                                                    skills={skills}
                                                    skill={skill}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada skill"
                                    description="Tambahkan skill utama agar rekomendasi lowongan lebih cocok."
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
}: {
    skills: Option[];
    skill?: CandidateSkill;
}) {
    const isEdit = Boolean(skill);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit skill' : 'Tambah skill'}</CardTitle>
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
                                <Field
                                    label="Skill"
                                    name="skill_id"
                                    error={errors.skill_id}
                                >
                                    <Select name="skill_id" defaultValue="">
                                        <option value="">Pilih skill</option>
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
                            )}
                            <Field
                                label="Tahun pengalaman"
                                name="years_exp"
                                error={errors.years_exp}
                            >
                                <Input
                                    type="number"
                                    name="years_exp"
                                    defaultValue={skill?.years_exp ?? ''}
                                    placeholder="3"
                                />
                            </Field>
                            <Field
                                label="Proficiency"
                                name="proficiency"
                                error={errors.proficiency}
                            >
                                <Select
                                    name="proficiency"
                                    defaultValue={skill?.proficiency ?? ''}
                                >
                                    <option value="">Pilih level</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">
                                        Intermediate
                                    </option>
                                    <option value="advanced">Advanced</option>
                                    <option value="expert">Expert</option>
                                </Select>
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Simpan perubahan'
                                      : 'Tambah skill'}
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
