import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    Field,
    RupiahInput,
    Select,
    Textarea,
} from '@/components/candidate/candidate-form';
import { ProgressBar } from '@/components/candidate/candidate-ui';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { edit, update as updateProfile } from '@/routes/candidate/profile';

type Option = {
    value: string;
    label: string;
};

type ProfileProps = {
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
        linkedin_url?: string | null;
        github_url?: string | null;
        portfolio_url?: string | null;
        profile_completion: number;
        ai_cv_summary?: string | null;
        skill_ids: number[];
    };
    industries: Option[];
    skills: Option[];
};

export default function CandidateProfile({
    profile,
    industries,
    skills,
}: ProfileProps) {
    return (
        <>
            <Head title="Profil Kandidat" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Profil Kandidat"
                    description="Perbarui identitas profesional, preferensi kerja, dan link portofolio."
                />

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data kandidat</CardTitle>
                            <CardDescription>
                                Isi dengan informasi yang aman dibaca recruiter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...updateProfile.form()}
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
                                                    placeholder="Nama lengkap"
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
                                                    placeholder="Backend Engineer"
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label="Bio"
                                            name="bio"
                                            error={errors.bio}
                                        >
                                            <Textarea
                                                name="bio"
                                                defaultValue={profile.bio ?? ''}
                                                placeholder="Ringkas pengalaman dan fokus karier kamu."
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
                                                    placeholder="Bandung"
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
                                                    placeholder="Jawa Barat"
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="Expected salary min"
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
                                                label="Expected salary max"
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
                                                label="Availability"
                                                name="availability"
                                                error={errors.availability}
                                            >
                                                <Input
                                                    name="availability"
                                                    defaultValue={
                                                        profile.availability ??
                                                        ''
                                                    }
                                                    placeholder="Immediate"
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
                                                                key={
                                                                    industry.value
                                                                }
                                                                value={
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
                                                    placeholder="Data Analyst"
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <Field
                                                label="LinkedIn"
                                                name="linkedin_url"
                                                error={errors.linkedin_url}
                                            >
                                                <Input
                                                    name="linkedin_url"
                                                    defaultValue={
                                                        profile.linkedin_url ??
                                                        ''
                                                    }
                                                    placeholder="https://linkedin.com/in/..."
                                                />
                                            </Field>
                                            <Field
                                                label="GitHub"
                                                name="github_url"
                                                error={errors.github_url}
                                            >
                                                <Input
                                                    name="github_url"
                                                    defaultValue={
                                                        profile.github_url ?? ''
                                                    }
                                                    placeholder="https://github.com/..."
                                                />
                                            </Field>
                                            <Field
                                                label="Portfolio"
                                                name="portfolio_url"
                                                error={errors.portfolio_url}
                                            >
                                                <Input
                                                    name="portfolio_url"
                                                    defaultValue={
                                                        profile.portfolio_url ??
                                                        ''
                                                    }
                                                    placeholder="https://..."
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
                                                : 'Simpan Profil'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Completion</CardTitle>
                                <CardDescription>
                                    Makin lengkap profil, makin presisi match
                                    lowongan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-4xl font-semibold">
                                    {profile.profile_completion}%
                                </p>
                                <ProgressBar
                                    value={profile.profile_completion}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>AI CV summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {profile.ai_cv_summary ??
                                        'Ringkasan akan tampil setelah CV utama tersedia dan diproses.'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateProfile.layout = {
    breadcrumbs: [
        {
            title: 'Profil Kandidat',
            href: edit(),
        },
    ],
};
