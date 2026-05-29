import { Form, Head, Link } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
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
    const { t } = useTranslate();
    const isEdit = mode === 'edit' && job !== null;

    return (
        <>
            <Head title={isEdit ? t('employer.job_form.head_edit') : t('employer.job_form.head_create')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={isEdit ? t('employer.job_form.heading_title_edit') : t('employer.job_form.heading_title_create')}
                        description={t('employer.job_form.heading_desc')}
                    />
                    <Button variant="outline" asChild>
                        <Link href={index()}>{t('employer.job_form.back_to_list')}</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.job_form.card_basic_title')}</CardTitle>
                        <CardDescription>
                            {t('employer.job_form.card_basic_desc')}
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
                                            label={t('employer.job_form.field_title')}
                                            name="title"
                                            error={errors.title}
                                        >
                                            <Input
                                                name="title"
                                                defaultValue={job?.title ?? ''}
                                                placeholder={t('employer.job_form.field_title_placeholder')}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <Field
                                            label={t('employer.job_form.field_industry')}
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
                                                    {t('employer.job_form.field_industry_placeholder')}
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
                                            label={t('employer.job_form.field_work_mode')}
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
                                            label={t('employer.job_form.field_job_type')}
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
                                            label={t('employer.job_form.field_experience_level')}
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
                                                    {t('employer.job_form.experience_entry')}
                                                </option>
                                                <option value="mid">
                                                    {t('employer.job_form.experience_mid')}
                                                </option>
                                                <option value="senior">
                                                    {t('employer.job_form.experience_senior')}
                                                </option>
                                                <option value="lead">
                                                    {t('employer.job_form.experience_lead')}
                                                </option>
                                                <option value="manager">
                                                    {t('employer.job_form.experience_manager')}
                                                </option>
                                            </select>
                                        </Field>
                                    </div>

                                    <Field
                                        label={t('employer.job_form.field_description')}
                                        name="description"
                                        error={errors.description}
                                    >
                                        <textarea
                                            name="description"
                                            defaultValue={
                                                job?.description ?? ''
                                            }
                                            rows={5}
                                            placeholder={t('employer.job_form.field_description_placeholder')}
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <Field
                                            label={t('employer.job_form.field_responsibilities')}
                                            name="responsibilities"
                                            error={errors.responsibilities}
                                        >
                                            <textarea
                                                name="responsibilities"
                                                defaultValue={
                                                    job?.responsibilities ?? ''
                                                }
                                                rows={5}
                                                placeholder={t('employer.job_form.field_responsibilities_placeholder')}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_required_qualifications')}
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
                                                placeholder={t('employer.job_form.field_required_qualifications_placeholder')}
                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        label={t('employer.job_form.field_preferred_qualifications')}
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
                                            placeholder={t('employer.job_form.field_preferred_qualifications_placeholder')}
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <Field
                                            label={t('employer.job_form.field_city')}
                                            name="location_city"
                                            error={errors.location_city}
                                        >
                                            <Input
                                                name="location_city"
                                                defaultValue={
                                                    job?.location_city ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_city_placeholder')}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_province')}
                                            name="location_province"
                                            error={errors.location_province}
                                        >
                                            <Input
                                                name="location_province"
                                                defaultValue={
                                                    job?.location_province ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_province_placeholder')}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_salary_min')}
                                            name="salary_min"
                                            error={errors.salary_min}
                                        >
                                            <Input
                                                type="number"
                                                name="salary_min"
                                                defaultValue={
                                                    job?.salary_min ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_salary_min_placeholder')}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_salary_max')}
                                            name="salary_max"
                                            error={errors.salary_max}
                                        >
                                            <Input
                                                type="number"
                                                name="salary_max"
                                                defaultValue={
                                                    job?.salary_max ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_salary_max_placeholder')}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field
                                            label={t('employer.job_form.field_currency')}
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
                                            label={t('employer.job_form.field_sla')}
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
                                                placeholder={t('employer.job_form.field_sla_placeholder')}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_closes_at')}
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
                                            {t('employer.job_form.salary_visible_label')}
                                        </label>
                                    </div>
                                    <InputError
                                        message={errors.is_salary_visible}
                                    />

                                    <div className="flex items-center gap-3">
                                        <Button disabled={processing}>
                                            {isEdit
                                                ? t('employer.job_form.btn_save_changes')
                                                : t('employer.job_form.btn_save_draft')}
                                        </Button>
                                        {isEdit ? (
                                            <span className="text-sm text-muted-foreground">
                                                {t('employer.job_form.step_hint_edit_status', { status: job?.status.replaceAll('_', ' ') ?? '' })}
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
