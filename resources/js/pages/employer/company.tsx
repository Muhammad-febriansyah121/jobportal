import { Form, Head, Link } from '@inertiajs/react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployerCompanyController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyController';
import EmployerCompanyVerificationController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyVerificationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { LocationCombobox } from '@/components/location-combobox';
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
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useTranslate } from '@/hooks/use-translate';
import { edit } from '@/routes/employer/company';
import { index as verificationIndex } from '@/routes/employer/verification';

type CompanyPageProps = {
    company: {
        id: number;
        name: string;
        industry_id: number | null;
        logo_url?: string | null;
        cover_url?: string | null;
        description?: string | null;
        culture?: string | null;
        benefits?: string | null;
        company_size?: string | null;
        website?: string | null;
        hq_city?: string | null;
        hq_province?: string | null;
        address?: string | null;
        verification_status: string;
        verification_rejection_reason?: string | null;
        subscription_name?: string | null;
    } | null;
    industries: Array<{
        value: string;
        label: string;
    }>;
    companySizes: string[];
    verification: {
        legal_name: string;
        nib?: string | null;
        npwp?: string | null;
        document_url?: string | null;
        status: string;
    } | null;
    canSubmitVerification: boolean;
};

export default function EmployerCompany({
    company,
    industries,
    companySizes,
    verification,
    canSubmitVerification,
}: CompanyPageProps) {
    const { t } = useTranslate();
    const isOnboarding = company === null;
    const [selectedProvince, setSelectedProvince] = useState(
        company?.hq_province ?? '',
    );
    const [descriptionHtml, setDescriptionHtml] = useState(
        company?.description ?? '',
    );
    const [cultureHtml, setCultureHtml] = useState(company?.culture ?? '');
    const [benefitsHtml, setBenefitsHtml] = useState(company?.benefits ?? '');

    return (
        <>
            <Head
                title={
                    isOnboarding
                        ? t('employer.company.title_onboarding')
                        : t('employer.company.title_profile')
                }
            />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={
                        isOnboarding
                            ? t('employer.company.title_onboarding')
                            : t('employer.company.title_profile')
                    }
                    description={t('employer.company.description')}
                />

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('employer.company.info_title')}</CardTitle>
                                <CardDescription>
                                    {t('employer.company.info_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...EmployerCompanyController.update.form()}
                                    encType="multipart/form-data"
                                    className="space-y-6"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t('employer.company.company_name')}
                                                    name="name"
                                                    error={errors.name}
                                                >
                                                    <Input
                                                        name="name"
                                                        defaultValue={
                                                            company?.name ?? ''
                                                        }
                                                        placeholder={t('employer.company.company_name_placeholder')}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t('employer.company.industry')}
                                                    name="industry_id"
                                                    error={errors.industry_id}
                                                >
                                                    <select
                                                        name="industry_id"
                                                        defaultValue={
                                                            company?.industry_id?.toString() ??
                                                            ''
                                                        }
                                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                                    >
                                                        <option value="">
                                                            {t('employer.company.select_industry')}
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
                                                                    {
                                                                        industry.label
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Field>
                                                <Field
                                                    label={t('employer.company.company_size')}
                                                    name="company_size"
                                                    error={errors.company_size}
                                                >
                                                    <select
                                                        name="company_size"
                                                        defaultValue={
                                                            company?.company_size ??
                                                            ''
                                                        }
                                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                                                    >
                                                        <option value="">
                                                            {t('employer.company.select_size')}
                                                        </option>
                                                        {companySizes.map(
                                                            (size) => (
                                                                <option
                                                                    key={size}
                                                                    value={size}
                                                                >
                                                                    {size}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t('employer.company.website')}
                                                    name="website"
                                                    error={errors.website}
                                                >
                                                    <Input
                                                        name="website"
                                                        defaultValue={
                                                            company?.website ??
                                                            ''
                                                        }
                                                        placeholder="https://karivia.id"
                                                    />
                                                </Field>
                                            </div>

                                            {/* Logo & Cover image uploads */}
                                            <ImageUploadField
                                                name="logo"
                                                label={t('employer.company.logo')}
                                                hint={t('employer.company.logo_hint')}
                                                currentUrl={company?.logo_url}
                                                shape="square"
                                                error={errors.logo}
                                            />

                                            <ImageUploadField
                                                name="cover"
                                                label={t('employer.company.cover')}
                                                hint={t('employer.company.cover_hint')}
                                                currentUrl={company?.cover_url}
                                                shape="wide"
                                                error={errors.cover}
                                            />

                                            <Field
                                                label={t('employer.company.description_field')}
                                                name="description"
                                                error={errors.description}
                                            >
                                                <input
                                                    type="hidden"
                                                    name="description"
                                                    value={descriptionHtml}
                                                />
                                                <RichTextEditor
                                                    value={descriptionHtml}
                                                    onChange={setDescriptionHtml}
                                                    placeholder={t('employer.company.description_placeholder')}
                                                    minHeightClass="min-h-32"
                                                />
                                            </Field>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t('employer.company.culture')}
                                                    name="culture"
                                                    error={errors.culture}
                                                    hint={t('employer.company.culture_hint')}
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="culture"
                                                        value={cultureHtml}
                                                    />
                                                    <RichTextEditor
                                                        value={cultureHtml}
                                                        onChange={setCultureHtml}
                                                        placeholder={t('employer.company.culture_placeholder')}
                                                        minHeightClass="min-h-32"
                                                    />
                                                </Field>

                                                <Field
                                                    label={t('employer.company.benefits')}
                                                    name="benefits"
                                                    error={errors.benefits}
                                                    hint={t('employer.company.benefits_hint')}
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="benefits"
                                                        value={benefitsHtml}
                                                    />
                                                    <RichTextEditor
                                                        value={benefitsHtml}
                                                        onChange={setBenefitsHtml}
                                                        placeholder={t('employer.company.benefits_placeholder')}
                                                        minHeightClass="min-h-32"
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t('employer.company.province')}
                                                    name="hq_province"
                                                    error={errors.hq_province}
                                                >
                                                    <LocationCombobox
                                                        name="hq_province"
                                                        fetchUrl="/regions/provinces"
                                                        defaultValue={
                                                            company?.hq_province ??
                                                            ''
                                                        }
                                                        placeholder={t('employer.company.select_province')}
                                                        onChange={(val) =>
                                                            setSelectedProvince(
                                                                val,
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label={t('employer.company.city')}
                                                    name="hq_city"
                                                    error={errors.hq_city}
                                                >
                                                    <LocationCombobox
                                                        name="hq_city"
                                                        fetchUrl={`/regions/cities?province=${encodeURIComponent(selectedProvince)}`}
                                                        defaultValue={
                                                            company?.hq_city ??
                                                            ''
                                                        }
                                                        placeholder={t('employer.company.select_city')}
                                                        resetKey={
                                                            selectedProvince
                                                        }
                                                    />
                                                </Field>
                                            </div>

                                            <Field
                                                label={t('employer.company.address')}
                                                name="address"
                                                error={errors.address}
                                            >
                                                <textarea
                                                    name="address"
                                                    defaultValue={
                                                        company?.address ?? ''
                                                    }
                                                    rows={3}
                                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    placeholder={t('employer.company.address_placeholder')}
                                                />
                                            </Field>

                                            <Button disabled={processing}>
                                                {isOnboarding
                                                    ? t('employer.company.save_onboarding')
                                                    : t('employer.company.save_profile')}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Legal Documents */}
                        {company !== null && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('employer.company.legal_docs_title')}</CardTitle>
                                    <CardDescription>
                                        {t('employer.company.legal_docs_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!canSubmitVerification &&
                                    verification !== null ? (
                                        <div className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <Tile label={t('employer.company.legal_name')}>
                                                    <p className="text-sm font-medium">
                                                        {
                                                            verification.legal_name
                                                        }
                                                    </p>
                                                </Tile>
                                                <Tile label={t('employer.company.nib')}>
                                                    <p className="text-sm font-medium">
                                                        {verification.nib ??
                                                            '—'}
                                                    </p>
                                                </Tile>
                                                <Tile label={t('employer.company.npwp')}>
                                                    <p className="text-sm font-medium">
                                                        {verification.npwp ??
                                                            '—'}
                                                    </p>
                                                </Tile>
                                            </div>
                                            {verification.document_url && (
                                                <a
                                                    href={
                                                        verification.document_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                                                >
                                                    {t('employer.company.view_legal_doc')}
                                                </a>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {t('employer.company.verification_status_label')}{' '}
                                                <span className="font-medium capitalize">
                                                    {verification.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                                . {t('employer.company.edit_only_after_rejection')}
                                            </p>
                                        </div>
                                    ) : canSubmitVerification ? (
                                        <Form
                                            {...EmployerCompanyVerificationController.store.form()}
                                            encType="multipart/form-data"
                                            className="space-y-5"
                                        >
                                            {({ processing, errors }) => (
                                                <>
                                                    <Field
                                                        label={t('employer.company.legal_company_name')}
                                                        name="legal_name"
                                                        error={
                                                            errors.legal_name
                                                        }
                                                    >
                                                        <Input
                                                            name="legal_name"
                                                            defaultValue={
                                                                verification?.legal_name ??
                                                                company.name
                                                            }
                                                            placeholder={t('employer.company.company_name_placeholder')}
                                                        />
                                                    </Field>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <Field
                                                            label={t('employer.company.nib_full')}
                                                            name="nib"
                                                            error={errors.nib}
                                                        >
                                                            <Input
                                                                name="nib"
                                                                defaultValue={
                                                                    verification?.nib ??
                                                                    ''
                                                                }
                                                                placeholder="1234567890123"
                                                            />
                                                        </Field>
                                                        <Field
                                                            label={t('employer.company.npwp')}
                                                            name="npwp"
                                                            error={errors.npwp}
                                                        >
                                                            <Input
                                                                name="npwp"
                                                                defaultValue={
                                                                    verification?.npwp ??
                                                                    ''
                                                                }
                                                                placeholder="00.000.000.0-000.000"
                                                            />
                                                        </Field>
                                                    </div>

                                                    <DocumentUploadField
                                                        name="document"
                                                        label={t('employer.company.legal_document')}
                                                        hint={t('employer.company.legal_document_hint')}
                                                        currentUrl={
                                                            verification?.document_url
                                                        }
                                                        error={errors.document}
                                                    />

                                                    <Button
                                                        disabled={processing}
                                                    >
                                                        {t('employer.company.submit_verification')}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {t('employer.company.no_legal_docs')}{' '}
                                            <Link
                                                href={verificationIndex()}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                {t('employer.company.submit_verification_now')}
                                            </Link>
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    {/* end left column */}

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('employer.company.trust_status')}</CardTitle>
                                <CardDescription>
                                    {t('employer.company.trust_status_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tile label={t('employer.company.verification_status')}>
                                    <Badge
                                        variant={
                                            company?.verification_status ===
                                            'approved'
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        {company?.verification_status?.replaceAll(
                                            '_',
                                            ' ',
                                        ) ?? 'unverified'}
                                    </Badge>
                                </Tile>
                                <Tile label={t('employer.company.active_plan')}>
                                    <span className="text-sm font-medium text-foreground">
                                        {company?.subscription_name ??
                                            t('employer.company.no_active_plan')}
                                    </span>
                                </Tile>
                                {company ? (
                                    <Button variant="outline" asChild>
                                        <Link href={verificationIndex()}>
                                            {t('employer.company.manage_verification')}
                                        </Link>
                                    </Button>
                                ) : null}
                                {company?.verification_rejection_reason ? (
                                    <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4">
                                        <p className="text-sm font-medium text-secondary-800">
                                            {t('employer.company.verification_notes')}
                                        </p>
                                        <p className="mt-2 text-sm text-secondary-700">
                                            {
                                                company.verification_rejection_reason
                                            }
                                        </p>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('employer.company.onboarding_checklist')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>{t('employer.company.checklist_1')}</p>
                                <p>{t('employer.company.checklist_2')}</p>
                                <p>{t('employer.company.checklist_3')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    name,
    error,
    hint,
    children,
}: {
    label: string;
    name: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

function Tile({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function ImageUploadField({
    name,
    label,
    hint,
    currentUrl,
    shape,
    error,
}: {
    name: string;
    label: string;
    hint?: string;
    currentUrl?: string | null;
    shape: 'square' | 'wide';
    error?: string;
}) {
    const { t } = useTranslate();
    const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const isSquare = shape === 'square';

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>

            <div
                className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                    preview
                        ? 'border-transparent'
                        : 'border-input bg-muted/30 hover:border-ring hover:bg-muted/50'
                } ${isSquare ? 'aspect-square w-full max-w-xs' : 'aspect-4/1 w-full'}`}
                onClick={() => inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            className="size-full object-cover"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Upload className="size-6 text-white" />
                            <span className="text-sm font-medium text-white">
                                {t('employer.company.change_image')}
                            </span>
                        </div>
                        {/* Clear button */}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            title={t('employer.company.remove_image')}
                        >
                            <X className="size-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                        <ImageIcon className="size-8" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {t('employer.company.upload_click')}
                            </p>
                            <p className="mt-0.5 text-xs">
                                {t('employer.company.upload_drag')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

            <input
                ref={inputRef}
                type="file"
                name={name}
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />
            <InputError message={error} />
        </div>
    );
}

function DocumentUploadField({
    name,
    label,
    hint,
    currentUrl,
    error,
}: {
    name: string;
    label: string;
    hint?: string;
    currentUrl?: string | null;
    error?: string;
}) {
    const { t } = useTranslate();
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setFileName(file.name);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div
                className="group relative flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/30 px-4 py-5 transition-colors hover:border-ring hover:bg-muted/50"
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    {fileName ? (
                        <p className="truncate text-sm font-medium">
                            {fileName}
                        </p>
                    ) : currentUrl ? (
                        <p className="truncate text-sm text-muted-foreground">
                            {t('employer.company.file_exists')}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t('employer.company.upload_document')}
                        </p>
                    )}
                </div>
                {(fileName || currentUrl) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
                        title={t('employer.company.remove')}
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            {currentUrl && !fileName && (
                <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-4 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {t('employer.company.view_current_doc')}
                </a>
            )}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <input
                ref={inputRef}
                type="file"
                name={name}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleChange}
            />
            <InputError message={error} />
        </div>
    );
}

EmployerCompany.layout = {
    breadcrumbs: [
        {
            title: 'employer.company.breadcrumb',
            href: edit(),
        },
    ],
};
