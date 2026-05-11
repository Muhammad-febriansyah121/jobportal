import { Form, Head, Link } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import { Banknote, Briefcase, FileText, MapPin, Settings2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import EmployerJobListingController from '@/actions/App/Http/Controllers/Employer/EmployerJobListingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { LocationCombobox } from '@/components/location-combobox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { cn } from '@/lib/utils';
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
        benefits?: string | null;
        location_city?: string | null;
        location_province?: string | null;
        work_mode: string;
        job_type: string;
        experience_level: string;
        qualification?: string | null;
        experience_min_years?: number | null;
        experience_max_years?: number | null;
        salary_min?: number | null;
        salary_max?: number | null;
        salary_currency: string;
        is_salary_visible: boolean;
        is_anonymous: boolean;
        is_urgent: boolean;
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
    const totalSteps = 4;
    const stepItems = [
        {
            id: 1,
            title: t('employer.job_form.step_basic'),
            description: t('employer.job_form.step_basic_desc'),
        },
        {
            id: 2,
            title: t('employer.job_form.step_description'),
            description: t('employer.job_form.step_description_desc'),
        },
        {
            id: 3,
            title: t('employer.job_form.step_location_salary'),
            description: t('employer.job_form.step_location_salary_desc'),
        },
        {
            id: 4,
            title: t('employer.job_form.step_settings'),
            description: t('employer.job_form.step_settings_desc'),
        },
    ] as const;
    const [selectedProvince, setSelectedProvince] = useState(
        job?.location_province ?? '',
    );
    const [currentStep, setCurrentStep] = useState(1);
    const [publishMode, setPublishMode] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const submitRef = useRef<HTMLButtonElement>(null);
    const publishMandatoryFields = [
        'title',
        'work_mode',
        'job_type',
        'experience_level',
        'description',
        'required_qualifications',
    ] as const;

    const readFieldValue = (name: string): string => {
        const elements = document.querySelectorAll(
            `[name="${name}"]`,
        );

        for (const element of Array.from(elements)) {
            if (
                element instanceof HTMLInputElement &&
                element.type === 'checkbox'
            ) {
                if (element.checked) {
                    return '1';
                }

                continue;
            }

            if (
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
            ) {
                const raw = element.value;
                const value = typeof raw === 'string' ? raw.trim() : '';

                if (value !== '') {
                    return value;
                }
            }
        }

        return '';
    };

    const validateStep = (step: number): boolean => {
        const requiredByStep: Record<number, string[]> = {
            1: ['title', 'work_mode', 'job_type', 'experience_level'],
            3: ['salary_currency'],
        };

        const requiredFields = requiredByStep[step] ?? [];
        const invalidField = requiredFields.find(
            (field) => readFieldValue(field) === '',
        );

        if (!invalidField) {
            return true;
        }

        toast.warning(t('employer.job_form.validate_complete_required'));

        return false;
    };

    const goToStep = (nextStep: number): void => {
        if (nextStep < 1 || nextStep > totalSteps) {
            return;
        }

        if (nextStep <= currentStep) {
            setCurrentStep(nextStep);

            return;
        }

        for (let step = currentStep; step < nextStep; step += 1) {
            if (!validateStep(step)) {
                return;
            }
        }

        setCurrentStep(nextStep);
    };

    const resolveStepByField = (field: string): number => {
        const stepByField: Record<string, number> = {
            title: 1,
            industry_id: 1,
            work_mode: 1,
            job_type: 1,
            experience_level: 1,
            description: 2,
            responsibilities: 2,
            required_qualifications: 2,
            preferred_qualifications: 2,
            benefits: 2,
            location_province: 3,
            location_city: 3,
            salary_currency: 3,
            salary_min: 3,
            salary_max: 3,
            qualification: 3,
            experience_min_years: 3,
            experience_max_years: 3,
            is_salary_visible: 3,
            response_sla_hours: 4,
            closes_at: 4,
        };

        return stepByField[field] ?? 1;
    };

    const firstMissingPublishField = (): string | null => {
        const missingField = publishMandatoryFields.find(
            (field) => readFieldValue(field) === '',
        );

        return missingField ?? null;
    };

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

                <Form
                    {...(isEdit
                        ? EmployerJobListingController.update.form(job.id)
                        : EmployerJobListingController.store.form())}
                    onError={(errors) => {
                        const firstErrorField = Object.keys(errors)[0];

                        if (firstErrorField) {
                            setCurrentStep(resolveStepByField(firstErrorField));
                        }

                        toast.error(
                            resolveErrorMessage(
                                errors,
                                t('employer.job_form.form_error_review'),
                            ),
                        );
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <button
                                ref={submitRef}
                                type="submit"
                                className="hidden"
                                aria-hidden="true"
                            />
                            <input
                                type="hidden"
                                name="publish"
                                value={publishMode ? '1' : '0'}
                            />
                            <div className="rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm text-secondary-900">
                                <p className="font-medium">{t('employer.job_form.guide_title')}</p>
                                <p className="mt-1 text-xs text-secondary-800">
                                    {t('employer.job_form.guide_required')}
                                </p>
                                <p className="mt-2 text-xs text-secondary-800">
                                    {t('employer.job_form.guide_publish')}
                                </p>
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    <div className="rounded-md border border-secondary-200 bg-white/60 p-2.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-900">
                                            {t('employer.job_form.guide_draft_title')}
                                        </p>
                                        <p className="mt-1 text-xs text-secondary-800">
                                            {t('employer.job_form.guide_draft_desc')}
                                        </p>
                                    </div>
                                    <div className="rounded-md border border-secondary-200 bg-white/60 p-2.5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-900">
                                            {t('employer.job_form.guide_publish_title')}
                                        </p>
                                        <p className="mt-1 text-xs text-secondary-800">
                                            {t('employer.job_form.guide_publish_desc')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-4">
                                <div className="grid gap-3 md:grid-cols-4">
                                    {stepItems.map((step) => {
                                        const isActive =
                                            currentStep === step.id;
                                        const isPassed = currentStep > step.id;

                                        return (
                                            <button
                                                key={step.id}
                                                type="button"
                                                onClick={() =>
                                                    goToStep(step.id)
                                                }
                                                className={cn(
                                                    'rounded-lg border p-3 text-left transition',
                                                    isActive
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border hover:bg-muted/40',
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                                                            isActive
                                                                ? 'bg-primary text-primary-foreground'
                                                                : isPassed
                                                                  ? 'bg-emerald-600 text-white'
                                                                  : 'bg-muted text-muted-foreground',
                                                        )}
                                                    >
                                                        {isPassed ? '✓' : step.id}
                                                    </span>
                                                    <p className="text-sm font-semibold">
                                                        {step.title}
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {step.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Informasi Dasar */}
                            <Card className={currentStep === 1 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Briefcase className="size-4 text-primary" />
                                        {t('employer.job_form.card_basic_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_basic_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <Field
                                        label={t('employer.job_form.field_title')}
                                        name="title"
                                        error={errors.title}
                                        required
                                    >
                                        <Input
                                            name="title"
                                            defaultValue={job?.title ?? ''}
                                            placeholder={t('employer.job_form.field_title_placeholder')}
                                        />
                                    </Field>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <Field
                                            label={t('employer.job_form.field_industry')}
                                            name="industry_id"
                                            error={errors.industry_id}
                                        >
                                            <SelectField
                                                name="industry_id"
                                                defaultValue={
                                                    job?.industry_id?.toString() ??
                                                    ''
                                                }
                                                options={[
                                                    {
                                                        value: '',
                                                        label: t('employer.job_form.field_industry_placeholder'),
                                                    },
                                                    ...industries,
                                                ]}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_work_mode')}
                                            name="work_mode"
                                            error={errors.work_mode}
                                            required
                                        >
                                            <SelectField
                                                name="work_mode"
                                                defaultValue={
                                                    job?.work_mode ?? 'onsite'
                                                }
                                                options={[
                                                    {
                                                        value: 'remote',
                                                        label: t('employer.job_form.work_mode_remote'),
                                                    },
                                                    {
                                                        value: 'hybrid',
                                                        label: t('employer.job_form.work_mode_hybrid'),
                                                    },
                                                    {
                                                        value: 'onsite',
                                                        label: t('employer.job_form.work_mode_onsite'),
                                                    },
                                                ]}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_job_type')}
                                            name="job_type"
                                            error={errors.job_type}
                                            required
                                        >
                                            <SelectField
                                                name="job_type"
                                                defaultValue={
                                                    job?.job_type ?? 'full_time'
                                                }
                                                options={[
                                                    {
                                                        value: 'full_time',
                                                        label: t('employer.job_form.job_type_full_time'),
                                                    },
                                                    {
                                                        value: 'part_time',
                                                        label: t('employer.job_form.job_type_part_time'),
                                                    },
                                                    {
                                                        value: 'contract',
                                                        label: t('employer.job_form.job_type_contract'),
                                                    },
                                                    {
                                                        value: 'internship',
                                                        label: t('employer.job_form.job_type_internship'),
                                                    },
                                                    {
                                                        value: 'freelance',
                                                        label: t('employer.job_form.job_type_freelance'),
                                                    },
                                                ]}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_experience_level')}
                                            name="experience_level"
                                            error={errors.experience_level}
                                            required
                                        >
                                            <SelectField
                                                name="experience_level"
                                                defaultValue={
                                                    job?.experience_level ??
                                                    'mid'
                                                }
                                                options={[
                                                    {
                                                        value: 'entry',
                                                        label: t('employer.job_form.experience_entry'),
                                                    },
                                                    {
                                                        value: 'mid',
                                                        label: t('employer.job_form.experience_mid'),
                                                    },
                                                    {
                                                        value: 'senior',
                                                        label: t('employer.job_form.experience_senior'),
                                                    },
                                                    {
                                                        value: 'lead',
                                                        label: t('employer.job_form.experience_lead'),
                                                    },
                                                    {
                                                        value: 'manager',
                                                        label: t('employer.job_form.experience_manager'),
                                                    },
                                                ]}
                                            />
                                        </Field>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deskripsi */}
                            <Card className={currentStep === 2 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="size-4 text-primary" />
                                        {t('employer.job_form.card_description_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_description_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <Field
                                        label={t('employer.job_form.field_description')}
                                        name="description"
                                        error={errors.description}
                                        required
                                    >
                                        <RichTextEditor
                                            name="description"
                                            defaultValue={
                                                job?.description ?? ''
                                            }
                                            placeholder={t('employer.job_form.field_description_placeholder')}
                                            minHeightClass="min-h-36"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t('employer.job_form.draft_optional')}
                                        </p>
                                    </Field>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <Field
                                            label={t('employer.job_form.field_responsibilities')}
                                            name="responsibilities"
                                            error={errors.responsibilities}
                                        >
                                            <RichTextEditor
                                                name="responsibilities"
                                                defaultValue={
                                                    job?.responsibilities ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_responsibilities_placeholder')}
                                                minHeightClass="min-h-40"
                                            />
                                        </Field>
                                    <Field
                                        label={t('employer.job_form.field_required_qualifications')}
                                        name="required_qualifications"
                                        error={
                                            errors.required_qualifications
                                        }
                                        required
                                    >
                                            <RichTextEditor
                                                name="required_qualifications"
                                                defaultValue={
                                                    job?.required_qualifications ??
                                                    ''
                                                }
                                                placeholder={t('employer.job_form.field_required_qualifications_placeholder')}
                                                minHeightClass="min-h-40"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t('employer.job_form.draft_optional')}
                                            </p>
                                        </Field>
                                    </div>

                                    <Field
                                        label={t('employer.job_form.field_preferred_qualifications')}
                                        name="preferred_qualifications"
                                        error={errors.preferred_qualifications}
                                    >
                                        <RichTextEditor
                                            name="preferred_qualifications"
                                            defaultValue={
                                                job?.preferred_qualifications ??
                                                ''
                                            }
                                            placeholder={t('employer.job_form.field_preferred_qualifications_placeholder')}
                                            minHeightClass="min-h-32"
                                        />
                                    </Field>

                                </CardContent>
                            </Card>

                            {/* Benefit & Tunjangan */}
                            <Card className={currentStep === 2 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Sparkles className="size-4 text-primary" />
                                        {t('employer.job_form.card_benefits_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_benefits_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Field
                                        label={t('employer.job_form.field_benefits')}
                                        name="benefits"
                                        error={errors.benefits}
                                        hint={t('employer.job_form.field_benefits_hint')}
                                    >
                                        <RichTextEditor
                                            name="benefits"
                                            defaultValue={job?.benefits ?? ''}
                                            placeholder={t('employer.job_form.field_benefits_placeholder')}
                                            minHeightClass="min-h-40"
                                        />
                                    </Field>
                                </CardContent>
                            </Card>

                            {/* Lokasi */}
                            <Card className={currentStep === 3 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="size-4 text-primary" />
                                        {t('employer.job_form.card_location_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_location_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field
                                            label={t('employer.job_form.field_province')}
                                            name="location_province"
                                            error={errors.location_province}
                                        >
                                            <LocationCombobox
                                                name="location_province"
                                                fetchUrl="/regions/provinces"
                                                defaultValue={
                                                    job?.location_province ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_province_placeholder')}
                                                onChange={(val) =>
                                                    setSelectedProvince(val)
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_city')}
                                            name="location_city"
                                            error={errors.location_city}
                                        >
                                            <LocationCombobox
                                                name="location_city"
                                                fetchUrl={`/regions/cities?province=${encodeURIComponent(selectedProvince)}`}
                                                defaultValue={
                                                    job?.location_city ?? ''
                                                }
                                                placeholder={t('employer.job_form.field_city_placeholder')}
                                                resetKey={selectedProvince}
                                            />
                                        </Field>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gaji */}
                            <Card className={currentStep === 3 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Banknote className="size-4 text-primary" />
                                        {t('employer.job_form.card_salary_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_salary_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Field
                                            label={t('employer.job_form.field_qualification')}
                                            name="qualification"
                                            error={errors.qualification}
                                        >
                                            <SelectField
                                                name="qualification"
                                                defaultValue={
                                                    job?.qualification ?? ''
                                                }
                                                options={[
                                                    {
                                                        value: '',
                                                        label: t('employer.job_form.qualification_placeholder'),
                                                    },
                                                    {
                                                        value: 'sma',
                                                        label: t('employer.job_form.qualification_sma'),
                                                    },
                                                    {
                                                        value: 'd3',
                                                        label: t('employer.job_form.qualification_d3'),
                                                    },
                                                    {
                                                        value: 's1',
                                                        label: t('employer.job_form.qualification_s1'),
                                                    },
                                                    {
                                                        value: 's2',
                                                        label: t('employer.job_form.qualification_s2'),
                                                    },
                                                    {
                                                        value: 's3',
                                                        label: t('employer.job_form.qualification_s3'),
                                                    },
                                                ]}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_experience_min_years')}
                                            name="experience_min_years"
                                            error={errors.experience_min_years}
                                        >
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                max={50}
                                                name="experience_min_years"
                                                defaultValue={
                                                    job?.experience_min_years ??
                                                    ''
                                                }
                                                placeholder="0"
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_experience_max_years')}
                                            name="experience_max_years"
                                            error={errors.experience_max_years}
                                        >
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                max={50}
                                                name="experience_max_years"
                                                defaultValue={
                                                    job?.experience_max_years ??
                                                    ''
                                                }
                                                placeholder="5"
                                            />
                                        </Field>
                                    </div>

                                    <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="size-4 text-primary" />
                                            <h4 className="text-sm font-semibold text-foreground">
                                                {t('employer.job_form.salary_range_title')}
                                            </h4>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <Field
                                                label={t('employer.job_form.field_currency')}
                                                name="salary_currency"
                                                error={errors.salary_currency}
                                                required
                                            >
                                                <SelectField
                                                    name="salary_currency"
                                                    defaultValue={
                                                        job?.salary_currency ??
                                                        'IDR'
                                                    }
                                                    options={[
                                                        {
                                                            value: 'IDR',
                                                            label: t('employer.job_form.currency_idr'),
                                                        },
                                                        {
                                                            value: 'USD',
                                                            label: t('employer.job_form.currency_usd'),
                                                        },
                                                        {
                                                            value: 'SGD',
                                                            label: t('employer.job_form.currency_sgd'),
                                                        },
                                                    ]}
                                                />
                                            </Field>
                                            <Field
                                                label={t('employer.job_form.field_salary_min')}
                                                name="salary_min"
                                                error={errors.salary_min}
                                            >
                                                <RupiahInput
                                                    name="salary_min"
                                                    defaultValue={
                                                        job?.salary_min ?? null
                                                    }
                                                    placeholder={t('employer.job_form.field_salary_min_placeholder')}
                                                />
                                            </Field>
                                            <Field
                                                label={t('employer.job_form.field_salary_max')}
                                                name="salary_max"
                                                error={errors.salary_max}
                                            >
                                                <RupiahInput
                                                    name="salary_max"
                                                    defaultValue={
                                                        job?.salary_max ?? null
                                                    }
                                                    placeholder={t('employer.job_form.field_salary_max_placeholder')}
                                                />
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                                        <input
                                            type="hidden"
                                            name="is_salary_visible"
                                            value="0"
                                        />
                                        <input
                                            type="checkbox"
                                            id="is_salary_visible"
                                            name="is_salary_visible"
                                            value="1"
                                            defaultChecked={
                                                job?.is_salary_visible ?? true
                                            }
                                            className="mt-0.5 size-4 rounded border-input accent-primary"
                                        />
                                        <div>
                                            <label
                                                htmlFor="is_salary_visible"
                                                className="cursor-pointer text-sm font-medium text-foreground"
                                            >
                                                {t('employer.job_form.salary_visible_label')}
                                                <span className="ml-1 text-destructive">
                                                    *
                                                </span>
                                            </label>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('employer.job_form.salary_visible_desc')}
                                            </p>
                                        </div>
                                        <InputError
                                            message={errors.is_salary_visible}
                                        />
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <input
                                            type="hidden"
                                            name="is_anonymous"
                                            value="0"
                                        />
                                        <input
                                            type="checkbox"
                                            id="is_anonymous"
                                            name="is_anonymous"
                                            value="1"
                                            defaultChecked={
                                                job?.is_anonymous ?? false
                                            }
                                            className="mt-0.5 size-4 rounded border-input accent-primary"
                                        />
                                        <div className="flex-1">
                                            <label
                                                htmlFor="is_anonymous"
                                                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                {t('employer.job_form.anonymous_label')}
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                    {t('employer.job_form.anonymous_badge')}
                                                </span>
                                            </label>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('employer.job_form.anonymous_desc')}
                                            </p>
                                        </div>
                                        <InputError
                                            message={errors.is_anonymous}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pengaturan */}
                            <Card className={currentStep === 4 ? '' : 'hidden'}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Settings2 className="size-4 text-primary" />
                                        {t('employer.job_form.card_settings_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('employer.job_form.card_settings_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field
                                            label={t('employer.job_form.field_sla')}
                                            name="response_sla_hours"
                                            error={errors.response_sla_hours}
                                            hint={t('employer.job_form.field_sla_hint')}
                                        >
                                            <Input
                                                type="number"
                                                name="response_sla_hours"
                                                defaultValue={
                                                    job?.response_sla_hours ??
                                                    ''
                                                }
                                                placeholder={t('employer.job_form.field_sla_placeholder')}
                                                min={1}
                                            />
                                        </Field>
                                        <Field
                                            label={t('employer.job_form.field_closes_at')}
                                            name="closes_at"
                                            error={errors.closes_at}
                                            hint={t('employer.job_form.field_closes_at_hint')}
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

                                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                                        <input
                                            type="hidden"
                                            name="is_urgent"
                                            value="0"
                                        />
                                        <input
                                            type="checkbox"
                                            id="is_urgent"
                                            name="is_urgent"
                                            value="1"
                                            defaultChecked={
                                                job?.is_urgent ?? false
                                            }
                                            className="mt-0.5 size-4 rounded border-input accent-orange-500"
                                        />
                                        <div className="flex-1">
                                            <label
                                                htmlFor="is_urgent"
                                                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                                            >
                                                {t('employer.job_form.urgent_label')}
                                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                                                    🔥 {t('employer.job_form.urgent_badge')}
                                                </span>
                                            </label>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('employer.job_form.urgent_desc')}
                                            </p>
                                        </div>
                                        <InputError
                                            message={errors.is_urgent}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={currentStep === 4 ? '' : 'hidden'}>
                                <CardContent className="pt-6">
                                    <div className="rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm text-secondary-900">
                                        {t('employer.job_form.confirm_data_note')}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit bar */}
                            <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-5 py-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        {t('employer.job_form.step_progress', { current: currentStep, total: totalSteps })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {currentStep < totalSteps
                                            ? t('employer.job_form.step_hint_continue')
                                            : isEdit
                                              ? t('employer.job_form.step_hint_edit_status', { status: job?.status.replaceAll('_', ' ') ?? '' })
                                              : t('employer.job_form.step_hint_create')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={currentStep === 1}
                                        onClick={() =>
                                            goToStep(currentStep - 1)
                                        }
                                    >
                                        {t('employer.job_form.btn_previous')}
                                    </Button>
                                    {currentStep < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                goToStep(currentStep + 1)
                                            }
                                        >
                                            {t('employer.job_form.btn_next')}
                                        </Button>
                                    ) : isEdit ? (
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            size="lg"
                                            onClick={() => {
                                                setDialogOpen(true);
                                            }}
                                        >
                                            {processing
                                                ? t('employer.job_form.btn_saving')
                                                : t('employer.job_form.btn_save_changes')}
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={processing}
                                                onClick={() => {
                                                    setPublishMode(false);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                {processing
                                                    ? t('employer.job_form.btn_saving')
                                                    : t('employer.job_form.btn_save_draft')}
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={processing}
                                                size="lg"
                                                onClick={() => {
                                                    const missingField =
                                                        firstMissingPublishField();

                                                    if (missingField) {
                                                        setCurrentStep(
                                                            resolveStepByField(
                                                                missingField,
                                                            ),
                                                        );
                                                        toast.warning(
                                                            t('employer.job_form.publish_mandatory_warning'),
                                                        );

                                                        return;
                                                    }

                                                    setPublishMode(true);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                {processing
                                                    ? t('employer.job_form.btn_saving')
                                                    : t('employer.job_form.btn_publish')}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEdit
                                ? t('employer.job_form.dialog_edit_title')
                                : publishMode
                                  ? t('employer.job_form.dialog_publish_title')
                                  : t('employer.job_form.dialog_draft_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEdit
                                ? t('employer.job_form.dialog_edit_desc')
                                : publishMode
                                  ? t('employer.job_form.dialog_publish_desc')
                                  : t('employer.job_form.dialog_draft_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('employer.job_form.dialog_cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => submitRef.current?.click()}
                        >
                            {isEdit
                                ? t('employer.job_form.dialog_confirm_edit')
                                : publishMode
                                  ? t('employer.job_form.dialog_confirm_publish')
                                  : t('employer.job_form.dialog_confirm_draft')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function Field({
    label,
    name,
    error,
    hint,
    required,
    children,
}: {
    label: string;
    name: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={name}>
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {children}
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    name,
    defaultValue,
    options,
}: {
    name: string;
    defaultValue: string;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <select
            name={name}
            defaultValue={defaultValue}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

function RupiahInput({
    name,
    defaultValue,
    placeholder,
}: {
    name: string;
    defaultValue: number | null;
    placeholder?: string;
}) {
    const fmt = (val: number) => val.toLocaleString('id-ID');

    const [display, setDisplay] = useState(
        defaultValue !== null ? fmt(defaultValue) : '',
    );
    const [raw, setRaw] = useState<string>(
        defaultValue !== null ? String(defaultValue) : '',
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        setRaw(digits);
        setDisplay(digits ? fmt(Number(digits)) : '');
    };

    return (
        <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
            </span>
            <input type="hidden" name={name} value={raw} />
            <Input
                value={display}
                onChange={handleChange}
                placeholder={placeholder}
                className="pl-9"
            />
        </div>
    );
}

function RichTextEditor({
    name,
    defaultValue,
    placeholder,
    minHeightClass = 'min-h-32',
}: {
    name: string;
    defaultValue: string;
    placeholder?: string;
    minHeightClass?: string;
}) {
    const { t } = useTranslate();
    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(defaultValue || '');
    const [focused, setFocused] = useState(false);

    const syncValue = () => {
        const nextValue = editorRef.current?.innerHTML ?? '';

        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = nextValue;
        }

        setValue(nextValue);
    };

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        const initialValue = defaultValue || '';
        editorRef.current.innerHTML = initialValue;

        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = initialValue;
        }

        setValue(initialValue);
    }, [defaultValue]);

    const applyFormat = (command: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        syncValue();
    };

    const onInput = () => {
        syncValue();
    };

    return (
        <div className="rounded-md border border-input bg-white shadow-xs">
            <input
                ref={hiddenInputRef}
                type="hidden"
                name={name}
                defaultValue={defaultValue || ''}
            />
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
                <ToolbarButton label="B" onClick={() => applyFormat('bold')} />
                <ToolbarButton
                    label="I"
                    onClick={() => applyFormat('italic')}
                />
                <ToolbarButton
                    label="U"
                    onClick={() => applyFormat('underline')}
                />
                <ToolbarButton
                    label="• List"
                    onClick={() => applyFormat('insertUnorderedList')}
                />
                <ToolbarButton
                    label="1. List"
                    onClick={() => applyFormat('insertOrderedList')}
                />
                <ToolbarButton
                    label="H3"
                    onClick={() => applyFormat('formatBlock', 'h3')}
                />
                <ToolbarButton
                    label={t('employer.job_form.toolbar_paragraph')}
                    onClick={() => applyFormat('formatBlock', 'p')}
                />
                <ToolbarButton
                    label={t('employer.job_form.toolbar_clear')}
                    onClick={() => applyFormat('removeFormat')}
                />
            </div>
            <div
                ref={editorRef}
                id={name}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder ?? ''}
                onInput={onInput}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    syncValue();
                }}
                className={cn(
                    'rich-editor max-w-none px-3 py-2 text-sm leading-relaxed outline-none',
                    '[&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-1',
                    '[&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc',
                    '[&_a]:text-primary [&_a]:underline [&_li]:my-0.5',
                    minHeightClass,
                    focused && 'ring-[3px] ring-ring/50',
                )}
            />
            {!(typeof value === 'string' ? value.trim() : '') &&
                !focused &&
                placeholder && (
                    <p className="pointer-events-none -mt-10 px-3 pb-2 text-sm text-muted-foreground">
                        {placeholder}
                    </p>
                )}
        </div>
    );
}

function ToolbarButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className="h-7 rounded border border-input bg-white px-2 text-xs font-medium hover:bg-accent"
        >
            {label}
        </button>
    );
}

function resolveErrorMessage(
    errors: Record<string, string | string[]>,
    fallback: string,
): string {
    const first = Object.values(errors)[0];

    if (Array.isArray(first) && first.length > 0) {
        return first[0] ?? fallback;
    }

    if (typeof first === 'string' && first.length > 0) {
        return first;
    }

    return fallback;
}

EmployerJobForm.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Lowongan',
            href: index(),
        },
    ],
};
