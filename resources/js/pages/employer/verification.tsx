import { Form, Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    ShieldCheck,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import EmployerCompanyVerificationController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyVerificationController';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { edit as companyEdit } from '@/routes/employer/company';
import { index } from '@/routes/employer/verification';

type VerificationPageProps = {
    company: {
        id: number;
        name: string;
        verification_status: string;
        is_verified: boolean;
    };
    verification: {
        id: number;
        legal_name: string;
        nib?: string | null;
        npwp?: string | null;
        document_url?: string | null;
        status: string;
        status_label: string;
        rejection_reason?: string | null;
        submitted_by?: string | null;
        submitted_at?: string | null;
        reviewed_at?: string | null;
    } | null;
    canSubmit: boolean;
};

export default function EmployerVerification({
    company,
    verification,
    canSubmit,
}: VerificationPageProps) {
    const { t } = useTranslate();
    const [docDialogOpen, setDocDialogOpen] = useState(false);

    const statusConfig = {
        approved: {
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50 border-green-200',
            title: t('employer.verification.status_approved_title'),
            desc: t('employer.verification.status_approved_desc'),
        },
        pending: {
            icon: Clock,
            color: 'text-primary-500',
            bg: 'bg-primary-50 border-primary-200',
            title: t('employer.verification.status_pending_title'),
            desc: t('employer.verification.status_pending_desc'),
        },
        need_revision: {
            icon: AlertCircle,
            color: 'text-secondary-600',
            bg: 'bg-secondary-50 border-secondary-200',
            title: t('employer.verification.status_need_revision_title'),
            desc: t('employer.verification.status_need_revision_desc'),
        },
        rejected: {
            icon: X,
            color: 'text-red-500',
            bg: 'bg-red-50 border-red-200',
            title: t('employer.verification.status_rejected_title'),
            desc: t('employer.verification.status_rejected_desc'),
        },
        unverified: {
            icon: ShieldCheck,
            color: 'text-muted-foreground',
            bg: 'bg-muted/30 border-border',
            title: t('employer.verification.status_unverified_title'),
            desc: t('employer.verification.status_unverified_desc'),
        },
    } as const;

    type StatusKey = keyof typeof statusConfig;
    const status =
        (company.verification_status as StatusKey) in statusConfig
            ? (company.verification_status as StatusKey)
            : 'unverified';
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    const docUrl = verification?.document_url ?? null;
    const isImage = docUrl
        ? /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(docUrl)
        : false;
    const isPdfDoc = docUrl ? /\.pdf(\?.*)?$/i.test(docUrl) : false;

    return (
        <>
            <Head title={t('employer.verification.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={t('employer.verification.page_title')}
                        description={t(
                            'employer.verification.page_description',
                        )}
                    />
                    <Button variant="outline" asChild>
                        <Link href={companyEdit()}>
                            {t('employer.verification.edit_company_profile')}
                        </Link>
                    </Button>
                </div>

                {/* Status Banner */}
                <div
                    className={`flex items-start gap-4 rounded-xl border p-5 ${config.bg}`}
                >
                    <div className={`mt-0.5 shrink-0 ${config.color}`}>
                        <StatusIcon className="size-6" />
                    </div>
                    <div className="flex-1">
                        <p className={`font-semibold ${config.color}`}>
                            {config.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {config.desc}
                        </p>
                    </div>
                    {verification?.status_label && (
                        <StatusBadge
                            status={company.verification_status}
                            label={verification.status_label}
                        />
                    )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    {/* Left: Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-5 text-primary" />
                                {t('employer.verification.legal_documents')}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'employer.verification.legal_documents_description',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {canSubmit ? (
                                <Form
                                    {...EmployerCompanyVerificationController.store.form()}
                                    className="space-y-5"
                                    encType="multipart/form-data"
                                >
                                    {({ processing, errors, progress }) => (
                                        <>
                                            <Field
                                                label={t(
                                                    'employer.verification.legal_company_name',
                                                )}
                                                name="legal_name"
                                                error={errors.legal_name}
                                            >
                                                <Input
                                                    name="legal_name"
                                                    defaultValue={
                                                        verification?.legal_name ??
                                                        company.name
                                                    }
                                                    placeholder={t(
                                                        'employer.verification.legal_company_name_placeholder',
                                                    )}
                                                />
                                            </Field>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'employer.verification.nib',
                                                    )}
                                                    name="nib"
                                                    error={errors.nib}
                                                >
                                                    <Input
                                                        name="nib"
                                                        defaultValue={
                                                            verification?.nib ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'employer.verification.nib_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'employer.verification.npwp',
                                                    )}
                                                    name="npwp"
                                                    error={errors.npwp}
                                                >
                                                    <Input
                                                        name="npwp"
                                                        defaultValue={
                                                            verification?.npwp ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'employer.verification.npwp_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                            </div>

                                            <DocumentUploadField
                                                name="document"
                                                currentUrl={
                                                    verification?.document_url
                                                }
                                                error={errors.document}
                                                onPreview={() =>
                                                    setDocDialogOpen(true)
                                                }
                                            />

                                            {progress ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {t(
                                                                'employer.verification.uploading_document',
                                                            )}
                                                        </span>
                                                        <span>
                                                            {
                                                                progress.percentage
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${progress.percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            <Button
                                                disabled={processing}
                                                className="w-full"
                                            >
                                                {processing
                                                    ? t(
                                                          'employer.verification.submitting',
                                                      )
                                                    : t(
                                                          'employer.verification.submit_verification',
                                                      )}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-8 text-center">
                                    <div
                                        className={`flex size-14 items-center justify-center rounded-full border-2 ${config.bg} ${config.color}`}
                                    >
                                        <StatusIcon className="size-7" />
                                    </div>
                                    <p className="max-w-xs text-sm text-muted-foreground">
                                        {company.is_verified
                                            ? t(
                                                  'employer.verification.already_verified_info',
                                              )
                                            : t(
                                                  'employer.verification.pending_review_info',
                                              )}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Status card */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="size-5 text-primary" />
                                    {t(
                                        'employer.verification.verification_status',
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'employer.verification.verification_status_description',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <InfoRow
                                    label={t('employer.verification.company')}
                                    value={company.name}
                                />
                                <InfoRow
                                    label={t('employer.verification.status')}
                                >
                                    <StatusBadge
                                        status={company.verification_status}
                                        label={
                                            verification?.status_label ??
                                            company.verification_status
                                        }
                                    />
                                </InfoRow>
                                {verification?.legal_name && (
                                    <InfoRow
                                        label={t(
                                            'employer.verification.legal_name',
                                        )}
                                        value={verification.legal_name}
                                    />
                                )}
                                {verification?.nib && (
                                    <InfoRow
                                        label={t('employer.verification.nib')}
                                        value={verification.nib}
                                    />
                                )}
                                {verification?.npwp && (
                                    <InfoRow
                                        label={t('employer.verification.npwp')}
                                        value={verification.npwp}
                                    />
                                )}
                                <InfoRow
                                    label={t(
                                        'employer.verification.last_submit',
                                    )}
                                    value={
                                        verification?.submitted_at ??
                                        t(
                                            'employer.verification.never_submitted',
                                        )
                                    }
                                />
                                {verification?.reviewed_at && (
                                    <InfoRow
                                        label={t(
                                            'employer.verification.reviewed_at',
                                        )}
                                        value={verification.reviewed_at}
                                    />
                                )}

                                {docUrl && (
                                    <div className="pt-1">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() =>
                                                setDocDialogOpen(true)
                                            }
                                        >
                                            <FileText className="size-4" />
                                            {t(
                                                'employer.verification.view_document',
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {verification?.rejection_reason && (
                            <Card className="border-secondary-200 bg-secondary-50/80">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-secondary-800">
                                        <AlertCircle className="size-4" />
                                        {t(
                                            'employer.verification.reviewer_notes',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-secondary-800">
                                    {verification.rejection_reason}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Dialog */}
            <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('employer.verification.legal_documents')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 overflow-hidden rounded-lg border bg-muted/20">
                        {isImage ? (
                            <img
                                src={docUrl!}
                                alt={t(
                                    'employer.verification.legal_document_alt',
                                )}
                                className="max-h-[70vh] w-full object-contain"
                            />
                        ) : isPdfDoc ? (
                            <iframe
                                src={docUrl!}
                                title={t(
                                    'employer.verification.legal_documents',
                                )}
                                className="h-[70vh] w-full"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                <FileText className="size-12 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'employer.verification.preview_not_available',
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={docUrl!}
                                target="_blank"
                                rel="noreferrer"
                                className="gap-2"
                            >
                                <ExternalLink className="size-4" />
                                {t('employer.verification.open_in_new_tab')}
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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

function InfoRow({
    label,
    value,
    children,
}: {
    label: string;
    value?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3">
            <span className="shrink-0 text-xs text-muted-foreground">
                {label}
            </span>
            <span className="text-right text-sm font-medium text-foreground">
                {children ?? value}
            </span>
        </div>
    );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
    const colorMap: Record<string, string> = {
        approved: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-primary-100 text-primary-700 border-primary-200',
        need_revision:
            'bg-secondary-100 text-secondary-700 border-secondary-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
        unverified: 'bg-muted text-muted-foreground border-border',
    };
    const cls = colorMap[status] ?? colorMap['unverified'];

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
        >
            {label.replaceAll('_', ' ')}
        </span>
    );
}

function DocumentUploadField({
    name,
    currentUrl,
    error,
    onPreview,
}: {
    name: string;
    currentUrl?: string | null;
    error?: string;
    onPreview?: () => void;
}) {
    const { t } = useTranslate();
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isPdf = (f: File) => f.type === 'application/pdf';
    const formatSize = (bytes: number) =>
        bytes >= 1_000_000
            ? `${(bytes / 1_000_000).toFixed(1)} MB`
            : `${Math.round(bytes / 1024)} KB`;

    const handleFiles = (files: FileList | null) => {
        if (files?.[0]) {
            setFile(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleClear = () => {
        setFile(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const hasExistingDoc = !!currentUrl && !file;

    return (
        <div className="grid gap-2">
            <Label>{t('employer.verification.legal_documents')}</Label>
            <p className="text-xs text-muted-foreground">
                {t('employer.verification.upload_hint')}
            </p>

            {hasExistingDoc && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-green-800">
                            {t('employer.verification.previous_document_saved')}
                        </p>
                        <button
                            type="button"
                            onClick={onPreview}
                            className="text-xs text-green-700 underline-offset-2 hover:underline"
                        >
                            {t('employer.verification.view_document')}
                        </button>
                    </div>
                    <span className="shrink-0 text-xs text-green-600">
                        {t('employer.verification.upload_new_to_replace')}
                    </span>
                </div>
            )}

            {file ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white">
                        <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)}
                            {isPdf(file)
                                ? ` · ${t('employer.verification.pdf')}`
                                : ` · ${t('employer.verification.image')}`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title={t('employer.verification.clear_selection')}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                        dragging
                            ? 'border-primary bg-primary/5'
                            : 'border-input bg-muted/20 hover:border-ring hover:bg-muted/40'
                    }`}
                >
                    <div className="flex size-12 items-center justify-center rounded-full border bg-white">
                        <Upload className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {t('employer.verification.click_or_drag')}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('employer.verification.file_formats_hint')}
                        </p>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                name={name}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <InputError message={error} />
        </div>
    );
}

EmployerVerification.layout = {
    breadcrumbs: [
        {
            title: 'Verifikasi Perusahaan',
            href: index(),
        },
    ],
};
