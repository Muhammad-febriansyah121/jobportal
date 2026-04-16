import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    Field,
    RupiahInput,
    Select,
    Textarea,
} from '@/components/candidate/candidate-form';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { store as storeCv } from '@/routes/candidate/cvs';
import { edit } from '@/routes/candidate/onboarding';
import { store as storeOnboarding } from '@/routes/candidate/onboarding';

type Option = {
    value: string;
    label: string;
};

type OnboardingProps = {
    profile: {
        full_name: string;
        headline?: string | null;
        bio?: string | null;
        location_city?: string | null;
        location_province?: string | null;
        expected_salary_min?: number | null;
        expected_salary_max?: number | null;
        work_mode_pref: string;
        availability?: string | null;
        preferred_industry_id?: number | null;
        preferred_role?: string | null;
        skill_ids: number[];
        primary_cv?: {
            file_url: string;
        } | null;
    };
    industries: Option[];
    skills: Option[];
};

export default function CandidateOnboarding({
    profile,
    industries,
    skills,
}: OnboardingProps) {
    return (
        <>
            <Head title="Onboarding Kandidat" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Onboarding Kandidat"
                    description="Isi data inti agar rekomendasi lowongan dan lamaran pertama kamu siap diproses."
                />

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil awal</CardTitle>
                            <CardDescription>
                                Data ini dipakai untuk match lowongan dan
                                ringkasan kandidat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...storeOnboarding.form()}
                                className="space-y-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Nama lengkap"
                                                name="full_name"
                                                error={errors.full_name}
                                            >
                                                <Input
                                                    name="full_name"
                                                    defaultValue={
                                                        profile.full_name
                                                    }
                                                    placeholder="Muhammad Febriansyah"
                                                />
                                            </Field>
                                            <Field
                                                label="Headline"
                                                name="headline"
                                                error={errors.headline}
                                            >
                                                <Input
                                                    name="headline"
                                                    defaultValue={
                                                        profile.headline ?? ''
                                                    }
                                                    placeholder="Frontend Developer"
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label="Bio singkat"
                                            name="bio"
                                            error={errors.bio}
                                        >
                                            <Textarea
                                                name="bio"
                                                defaultValue={profile.bio ?? ''}
                                                placeholder="Ceritakan pengalaman, fokus skill, dan target karier kamu."
                                            />
                                        </Field>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Kota"
                                                name="location_city"
                                                error={errors.location_city}
                                            >
                                                <Input
                                                    name="location_city"
                                                    defaultValue={
                                                        profile.location_city ??
                                                        ''
                                                    }
                                                    placeholder="Jakarta Selatan"
                                                />
                                            </Field>
                                            <Field
                                                label="Provinsi"
                                                name="location_province"
                                                error={
                                                    errors.location_province
                                                }
                                            >
                                                <Input
                                                    name="location_province"
                                                    defaultValue={
                                                        profile.location_province ??
                                                        ''
                                                    }
                                                    placeholder="DKI Jakarta"
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Ekspektasi salary min"
                                                name="expected_salary_min"
                                                error={
                                                    errors.expected_salary_min
                                                }
                                            >
                                                <RupiahInput
                                                    name="expected_salary_min"
                                                    defaultValue={
                                                        profile.expected_salary_min
                                                    }
                                                    placeholder="Rp8.000.000"
                                                />
                                            </Field>
                                            <Field
                                                label="Ekspektasi salary max"
                                                name="expected_salary_max"
                                                error={
                                                    errors.expected_salary_max
                                                }
                                            >
                                                <RupiahInput
                                                    name="expected_salary_max"
                                                    defaultValue={
                                                        profile.expected_salary_max
                                                    }
                                                    placeholder="Rp15.000.000"
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Mode kerja"
                                                name="work_mode_pref"
                                                error={errors.work_mode_pref}
                                            >
                                                <Select
                                                    name="work_mode_pref"
                                                    defaultValue={
                                                        profile.work_mode_pref
                                                    }
                                                >
                                                    <option value="any">
                                                        Fleksibel
                                                    </option>
                                                    <option value="remote">
                                                        Remote
                                                    </option>
                                                    <option value="hybrid">
                                                        Hybrid
                                                    </option>
                                                    <option value="onsite">
                                                        Onsite
                                                    </option>
                                                </Select>
                                            </Field>
                                            <Field
                                                label="Ketersediaan"
                                                name="availability"
                                                error={errors.availability}
                                            >
                                                <Input
                                                    name="availability"
                                                    defaultValue={
                                                        profile.availability ??
                                                        ''
                                                    }
                                                    placeholder="Bisa mulai 30 hari lagi"
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Industri minat"
                                                name="preferred_industry_id"
                                                error={
                                                    errors.preferred_industry_id
                                                }
                                            >
                                                <Select
                                                    name="preferred_industry_id"
                                                    defaultValue={
                                                        profile.preferred_industry_id?.toString() ??
                                                        ''
                                                    }
                                                >
                                                    <option value="">
                                                        Pilih industri
                                                    </option>
                                                    {industries.map(
                                                        (industry) => (
                                                            <option
                                                                value={
                                                                    industry.value
                                                                }
                                                                key={
                                                                    industry.value
                                                                }
                                                            >
                                                                {industry.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </Select>
                                            </Field>
                                            <Field
                                                label="Role minat"
                                                name="preferred_role"
                                                error={errors.preferred_role}
                                            >
                                                <Input
                                                    name="preferred_role"
                                                    defaultValue={
                                                        profile.preferred_role ??
                                                        ''
                                                    }
                                                    placeholder="Product Designer"
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label="Skill utama"
                                            name="skill_ids"
                                            error={errors.skill_ids}
                                        >
                                            <Select
                                                name="skill_ids[]"
                                                multiple
                                                defaultValue={profile.skill_ids.map(
                                                    String,
                                                )}
                                                className="h-40 py-2"
                                            >
                                                {skills.map((skill) => (
                                                    <option
                                                        key={skill.value}
                                                        value={skill.value}
                                                    >
                                                        {skill.label}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>

                                        <Button disabled={processing}>
                                            {processing
                                                ? 'Menyimpan...'
                                                : 'Selesaikan Onboarding'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>CV utama</CardTitle>
                                <CardDescription>
                                    Upload CV agar lamaran pertama bisa langsung
                                    dikirim.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profile.primary_cv ? (
                                    <div className="space-y-3">
                                        <a
                                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                            href={profile.primary_cv.file_url}
                                            target="_blank"
                                        >
                                            Lihat CV utama
                                        </a>
                                        <p className="text-sm text-muted-foreground">
                                            Kamu bisa mengganti CV utama dari
                                            halaman CV.
                                        </p>
                                    </div>
                                ) : (
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
                                                <input
                                                    type="hidden"
                                                    name="is_primary"
                                                    value="1"
                                                />
                                                <Button
                                                    disabled={processing}
                                                    variant="outline"
                                                >
                                                    Upload CV
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Setelah onboarding</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>Tambahkan pengalaman kerja dan pendidikan.</p>
                                <p>Simpan lowongan yang menarik.</p>
                                <p>Kirim lamaran dengan CV utama.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateOnboarding.layout = {
    breadcrumbs: [
        {
            title: 'Onboarding Kandidat',
            href: edit(),
        },
    ],
};
