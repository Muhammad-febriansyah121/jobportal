import { Form, Head, Link } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
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
import { Input } from '@/components/ui/input';
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

export default function CandidateExperiences({
    experiences,
}: {
    experiences: Experience[];
}) {
    return (
        <>
            <Head title="Pengalaman Kerja" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Pengalaman Kerja"
                    description="Tambahkan pengalaman terbaru agar recruiter melihat konteks kerja kamu."
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <ExperienceForm />

                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat pengalaman</CardTitle>
                            <CardDescription>
                                Urutan terbaru tampil di bagian atas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {experiences.length ? (
                                experiences.map((experience) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={experience.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {experience.job_title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {experience.company_name} ·{' '}
                                                    {experience.period}
                                                </p>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {experience.location}
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Link
                                                    href={destroyExperience(
                                                        experience.id,
                                                    )}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <Trash2 />
                                                    Hapus
                                                </Link>
                                            </Button>
                                        </div>
                                        {experience.description ? (
                                            <p className="mt-3 text-sm leading-6">
                                                {experience.description}
                                            </p>
                                        ) : null}
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                Edit pengalaman
                                            </summary>
                                            <div className="mt-4">
                                                <ExperienceForm
                                                    experience={experience}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada pengalaman"
                                    description="Tambahkan pengalaman magang, kerja full time, freelance, atau project profesional."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function ExperienceForm({ experience }: { experience?: Experience }) {
    const isEdit = Boolean(experience);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit ? 'Edit pengalaman' : 'Tambah pengalaman'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateExperience.form(
                              experience!.id,
                          )
                        : storeExperience.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label="Nama perusahaan"
                                name="company_name"
                                error={errors.company_name}
                            >
                                <Input
                                    name="company_name"
                                    defaultValue={
                                        experience?.company_name ?? ''
                                    }
                                    placeholder="PT Karivia Indonesia"
                                />
                            </Field>
                            <Field
                                label="Jabatan"
                                name="job_title"
                                error={errors.job_title}
                            >
                                <Input
                                    name="job_title"
                                    defaultValue={experience?.job_title ?? ''}
                                    placeholder="Software Engineer"
                                />
                            </Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Mulai"
                                    name="start_date"
                                    error={errors.start_date}
                                >
                                    <DatePickerInput
                                        name="start_date"
                                        defaultValue={experience?.start_date}
                                        placeholder="Pilih tanggal mulai"
                                    />
                                </Field>
                                <Field
                                    label="Selesai"
                                    name="end_date"
                                    error={errors.end_date}
                                >
                                    <DatePickerInput
                                        name="end_date"
                                        defaultValue={experience?.end_date}
                                        placeholder="Pilih tanggal selesai"
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
                                    defaultChecked={
                                        experience?.is_current ?? false
                                    }
                                />
                                Masih bekerja di sini
                            </label>
                            <Field
                                label="Lokasi"
                                name="location"
                                error={errors.location}
                            >
                                <Input
                                    name="location"
                                    defaultValue={experience?.location ?? ''}
                                    placeholder="Jakarta"
                                />
                            </Field>
                            <Field
                                label="Deskripsi"
                                name="description"
                                error={errors.description}
                            >
                                <Textarea
                                    name="description"
                                    defaultValue={
                                        experience?.description ?? ''
                                    }
                                    placeholder="Tulis impact, stack, dan tanggung jawab utama."
                                />
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Simpan perubahan'
                                      : 'Tambah pengalaman'}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
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
