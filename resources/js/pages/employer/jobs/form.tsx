import { Form, Head, Link } from '@inertiajs/react';
import EmployerJobListingController from '@/actions/App/Http/Controllers/Employer/EmployerJobListingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/employer/jobs';

type JobFormProps = {
    mode: 'create' | 'edit';
    job: {
        id: number;
        title: string;
        industry_id?: number | null;
        description?: string | null;
        responsibilities?: string | null;
        required_qualifications?: string | null;
        preferred_qualifications?: string | null;
        location_city?: string | null;
        location_province?: string | null;
        work_mode: string;
        job_type: string;
        experience_level: string;
        salary_min?: number | null;
        salary_max?: number | null;
        salary_currency: string;
        is_salary_visible: boolean;
        response_sla_hours?: number | null;
        closes_at?: string | null;
        status: string;
    } | null;
    industries: Array<{
        value: string;
        label: string;
    }>;
};

export default function EmployerJobForm({
    mode,
    job,
    industries,
}: JobFormProps) {
    const isEdit = mode === 'edit' && job !== null;

    return (
        <>
            <Head title={isEdit ? 'Edit Lowongan' : 'Buat Lowongan'} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={isEdit ? 'Edit Lowongan' : 'Buat Lowongan'}
                        description="Lengkapi informasi posisi, salary, dan SLA recruiter sebelum publish."
                    />
                    <Button variant="outline" asChild>
                        <Link href={index()}>Kembali ke daftar lowongan</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Form lowongan</CardTitle>
                        <CardDescription>
                            Simpan sebagai draft lebih dulu. Publish tersedia
                            dari halaman daftar lowongan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...(isEdit
                                ? EmployerJobListingController.update.form(
                                      job.id,
                                  )
                                : EmployerJobListingController.store.form())}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field
                                            label="Judul posisi"
                                            name="title"
                                            error={errors.title}
                                        >
                                            <Input
                                                name="title"
                                                defaultValue={job?.title ?? ''}
                                                placeholder="Senior Backend Engineer"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <Field
                                            label="Industri"
                                            name="industry_id"
                                            error={errors.industry_id}
                                        >
                                            <select
                                                name="industry_id"
                                                defaultValue={
                                                    job?.industry_id?.toString() ??
                                                    ''
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                            >
                                                <option value="">
                                                    Pilih industri
                                                </option>
                                                {industries.map((industry) => (
                                                    <option
                                                        key={industry.value}
                                                        value={industry.value}
                                                    >
                                                        {industry.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field
                                            label="Mode kerja"
                                            name="work_mode"
                                            error={errors.work_mode}
                                        >
                                            <select
                                                name="work_mode"
                                                defaultValue={
                                                    job?.work_mode ?? 'onsite'
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                            >
                                                <option value="remote">
                                                    Remote
                                                </option>
                                                <option value="hybrid">
                                                    Hybrid
                                                </option>
                                                <option value="onsite">
                                                    Onsite
                                                </option>
                                            </select>
                                        </Field>
                                        <Field
                                            label="Jenis pekerjaan"
                                            name="job_type"
                                            error={errors.job_type}
                                        >
                                            <select
                                                name="job_type"
                                                defaultValue={
                                                    job?.job_type ?? 'full_time'
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                            >
                                                <option value="full_time">
                                                    Full Time
                                                </option>
                                                <option value="part_time">
                                                    Part Time
                                                </option>
                                                <option value="contract">
                                                    Contract
                                                </option>
                                                <option value="internship">
                                                    Internship
                                                </option>
                                                <option value="freelance">
                                                    Freelance
                                                </option>
                                            </select>
                                        </Field>
                                        <Field
                                            label="Level pengalaman"
                                            name="experience_level"
                                            error={errors.experience_level}
                                        >
                                            <select
                                                name="experience_level"
                                                defaultValue={
                                                    job?.experience_level ??
                                                    'mid'
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                            >
                                                <option value="entry">
                                                    Entry
                                                </option>
                                                <option value="mid">Mid</option>
                                                <option value="senior">
                                                    Senior
                                                </option>
                                                <option value="lead">
                                                    Lead
                                                </option>
                                                <option value="manager">
                                                    Manager
                                                </option>
                                            </select>
                                        </Field>
                                    </div>

                                    <Field
                                        label="Deskripsi pekerjaan"
                                        name="description"
                                        error={errors.description}
                                    >
                                        <textarea
                                            name="description"
                                            defaultValue={
                                                job?.description ?? ''
                                            }
                                            rows={5}
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <Field
                                            label="Tanggung jawab"
                                            name="responsibilities"
                                            error={errors.responsibilities}
                                        >
                                            <textarea
                                                name="responsibilities"
                                                defaultValue={
                                                    job?.responsibilities ?? ''
                                                }
                                                rows={5}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                        </Field>
                                        <Field
                                            label="Kualifikasi wajib"
                                            name="required_qualifications"
                                            error={
                                                errors.required_qualifications
                                            }
                                        >
                                            <textarea
                                                name="required_qualifications"
                                                defaultValue={
                                                    job?.required_qualifications ??
                                                    ''
                                                }
                                                rows={5}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        label="Kualifikasi tambahan"
                                        name="preferred_qualifications"
                                        error={errors.preferred_qualifications}
                                    >
                                        <textarea
                                            name="preferred_qualifications"
                                            defaultValue={
                                                job?.preferred_qualifications ??
                                                ''
                                            }
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <Field
                                            label="Kota"
                                            name="location_city"
                                            error={errors.location_city}
                                        >
                                            <Input
                                                name="location_city"
                                                defaultValue={
                                                    job?.location_city ?? ''
                                                }
                                                placeholder="Jakarta Selatan"
                                            />
                                        </Field>
                                        <Field
                                            label="Provinsi"
                                            name="location_province"
                                            error={errors.location_province}
                                        >
                                            <Input
                                                name="location_province"
                                                defaultValue={
                                                    job?.location_province ?? ''
                                                }
                                                placeholder="DKI Jakarta"
                                            />
                                        </Field>
                                        <Field
                                            label="Salary min"
                                            name="salary_min"
                                            error={errors.salary_min}
                                        >
                                            <Input
                                                type="number"
                                                name="salary_min"
                                                defaultValue={
                                                    job?.salary_min ?? ''
                                                }
                                                placeholder="12000000"
                                            />
                                        </Field>
                                        <Field
                                            label="Salary max"
                                            name="salary_max"
                                            error={errors.salary_max}
                                        >
                                            <Input
                                                type="number"
                                                name="salary_max"
                                                defaultValue={
                                                    job?.salary_max ?? ''
                                                }
                                                placeholder="18000000"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field
                                            label="Mata uang"
                                            name="salary_currency"
                                            error={errors.salary_currency}
                                        >
                                            <Input
                                                name="salary_currency"
                                                defaultValue={
                                                    job?.salary_currency ??
                                                    'IDR'
                                                }
                                                placeholder="IDR"
                                            />
                                        </Field>
                                        <Field
                                            label="Response SLA (jam)"
                                            name="response_sla_hours"
                                            error={errors.response_sla_hours}
                                        >
                                            <Input
                                                type="number"
                                                name="response_sla_hours"
                                                defaultValue={
                                                    job?.response_sla_hours ??
                                                    ''
                                                }
                                                placeholder="48"
                                            />
                                        </Field>
                                        <Field
                                            label="Tanggal tutup"
                                            name="closes_at"
                                            error={errors.closes_at}
                                        >
                                            <Input
                                                type="date"
                                                name="closes_at"
                                                defaultValue={
                                                    job?.closes_at ?? ''
                                                }
                                            />
                                        </Field>
                                    </div>

                                    <div className="rounded-xl border p-4">
                                        <input
                                            type="hidden"
                                            name="is_salary_visible"
                                            value="0"
                                        />
                                        <label className="flex items-center gap-3 text-sm text-foreground">
                                            <input
                                                type="checkbox"
                                                name="is_salary_visible"
                                                value="1"
                                                defaultChecked={
                                                    job?.is_salary_visible ??
                                                    true
                                                }
                                                className="size-4 rounded border-input"
                                            />
                                            Tampilkan salary range di halaman
                                            public
                                        </label>
                                    </div>
                                    <InputError
                                        message={errors.is_salary_visible}
                                    />

                                    <div className="flex items-center gap-3">
                                        <Button disabled={processing}>
                                            {isEdit
                                                ? 'Simpan Perubahan'
                                                : 'Simpan Draft'}
                                        </Button>
                                        {isEdit ? (
                                            <span className="text-sm text-muted-foreground">
                                                Status saat ini:{' '}
                                                {job?.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function Field({
    label,
    name,
    error,
    children,
}: {
    label: string;
    name: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

EmployerJobForm.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Lowongan',
            href: index(),
        },
    ],
};
