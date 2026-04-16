import { Form, Head, Link } from '@inertiajs/react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import EmployerCompanyController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyController';
import EmployerCompanyVerificationController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyVerificationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
    const isOnboarding = company === null;

    return (
        <>
            <Head
                title={
                    isOnboarding ? 'Onboarding Perusahaan' : 'Profil Perusahaan'
                }
            />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={
                        isOnboarding
                            ? 'Onboarding Perusahaan'
                            : 'Profil Perusahaan'
                    }
                    description="Lengkapi data dasar perusahaan agar trust signal dan operasional hiring siap dipakai."
                />

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi perusahaan</CardTitle>
                                <CardDescription>
                                    Data ini akan tampil di area internal
                                    employer dan siap dipakai untuk profil
                                    public berikutnya.
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
                                                    label="Nama perusahaan"
                                                    name="name"
                                                    error={errors.name}
                                                >
                                                    <Input
                                                        name="name"
                                                        defaultValue={
                                                            company?.name ?? ''
                                                        }
                                                        placeholder="PT Karivia Indonesia"
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label="Industri"
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
                                                                    {
                                                                        industry.label
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Field>
                                                <Field
                                                    label="Ukuran perusahaan"
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
                                                            Pilih ukuran
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
                                                    label="Website"
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
                                                label="Logo perusahaan"
                                                hint="Disarankan ukuran 400×400 px, format PNG/JPG, maks 3 MB"
                                                currentUrl={company?.logo_url}
                                                shape="square"
                                                error={errors.logo}
                                            />

                                            <ImageUploadField
                                                name="cover"
                                                label="Cover / banner"
                                                hint="Disarankan ukuran 1200×400 px, format PNG/JPG, maks 4 MB"
                                                currentUrl={company?.cover_url}
                                                shape="wide"
                                                error={errors.cover}
                                            />

                                            <Field
                                                label="Deskripsi"
                                                name="description"
                                                error={errors.description}
                                            >
                                                <textarea
                                                    name="description"
                                                    defaultValue={
                                                        company?.description ??
                                                        ''
                                                    }
                                                    rows={5}
                                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    placeholder="Jelaskan nilai utama, fokus bisnis, dan budaya kerja perusahaan."
                                                />
                                            </Field>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label="Kota kantor pusat"
                                                    name="hq_city"
                                                    error={errors.hq_city}
                                                >
                                                    <Input
                                                        name="hq_city"
                                                        defaultValue={
                                                            company?.hq_city ??
                                                            ''
                                                        }
                                                        placeholder="Jakarta Selatan"
                                                    />
                                                </Field>
                                                <Field
                                                    label="Provinsi"
                                                    name="hq_province"
                                                    error={errors.hq_province}
                                                >
                                                    <Input
                                                        name="hq_province"
                                                        defaultValue={
                                                            company?.hq_province ??
                                                            ''
                                                        }
                                                        placeholder="DKI Jakarta"
                                                    />
                                                </Field>
                                            </div>

                                            <Field
                                                label="Alamat lengkap"
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
                                                    placeholder="Alamat kantor pusat perusahaan."
                                                />
                                            </Field>

                                            <Button disabled={processing}>
                                                {isOnboarding
                                                    ? 'Simpan Profil Perusahaan'
                                                    : 'Perbarui Profil Perusahaan'}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Dokumen Legalitas */}
                        {company !== null && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dokumen legalitas</CardTitle>
                                    <CardDescription>
                                        NIB, NPWP, dan akta/dokumen pendukung
                                        untuk verifikasi perusahaan oleh admin
                                        Karivia.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!canSubmitVerification &&
                                    verification !== null ? (
                                        <div className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <Tile label="Nama legal">
                                                    <p className="text-sm font-medium">
                                                        {
                                                            verification.legal_name
                                                        }
                                                    </p>
                                                </Tile>
                                                <Tile label="NIB">
                                                    <p className="text-sm font-medium">
                                                        {verification.nib ??
                                                            '—'}
                                                    </p>
                                                </Tile>
                                                <Tile label="NPWP">
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
                                                    Lihat dokumen akta /
                                                    legalitas
                                                </a>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Status:{' '}
                                                <span className="font-medium capitalize">
                                                    {verification.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                                . Edit hanya tersedia setelah
                                                ditolak atau diminta revisi.
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
                                                        label="Nama legal perusahaan"
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
                                                            placeholder="PT Karivia Indonesia"
                                                        />
                                                    </Field>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <Field
                                                            label="NIB (Nomor Induk Berusaha)"
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
                                                            label="NPWP"
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
                                                        label="Akta / dokumen legalitas"
                                                        hint="Upload akta pendirian, SK Kemenkumham, atau dokumen legal lainnya. Format PDF/JPG/PNG, maks 5 MB."
                                                        currentUrl={
                                                            verification?.document_url
                                                        }
                                                        error={errors.document}
                                                    />

                                                    <Button
                                                        disabled={processing}
                                                    >
                                                        Kirim untuk Diverifikasi
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada dokumen legalitas yang
                                            dikirim.{' '}
                                            <Link
                                                href={verificationIndex()}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                Submit verifikasi sekarang
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
                                <CardTitle>Status trust</CardTitle>
                                <CardDescription>
                                    Ringkasan verifikasi dan paket aktif
                                    perusahaan saat ini.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tile label="Status verifikasi">
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
                                <Tile label="Paket aktif">
                                    <span className="text-sm font-medium text-foreground">
                                        {company?.subscription_name ??
                                            'Belum ada paket aktif'}
                                    </span>
                                </Tile>
                                {company ? (
                                    <Button variant="outline" asChild>
                                        <Link href={verificationIndex()}>
                                            Kelola verifikasi
                                        </Link>
                                    </Button>
                                ) : null}
                                {company?.verification_rejection_reason ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <p className="text-sm font-medium text-amber-800">
                                            Catatan verifikasi
                                        </p>
                                        <p className="mt-2 text-sm text-amber-700">
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
                                <CardTitle>Checklist onboarding</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    1. Isi identitas, industri, dan deskripsi
                                    perusahaan.
                                </p>
                                <p>
                                    2. Lengkapi website dan lokasi kantor pusat.
                                </p>
                                <p>
                                    3. Simpan profil, lalu lanjut ke lowongan
                                    pertama.
                                </p>
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
                } ${isSquare ? 'aspect-square w-32' : 'aspect-4/1 w-full'}`}
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
                            <Upload className="size-5 text-white" />
                            <span className="text-xs font-medium text-white">
                                Ganti gambar
                            </span>
                        </div>
                        {/* Clear button */}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute top-1.5 right-1.5 z-10 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            title="Hapus gambar"
                        >
                            <X className="size-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                        <ImageIcon className={isSquare ? 'size-7' : 'size-8'} />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                Klik untuk upload
                            </p>
                            {!isSquare && (
                                <p className="mt-0.5 text-xs">
                                    atau drag &amp; drop file ke sini
                                </p>
                            )}
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
                            File sudah ada — klik untuk ganti
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Klik untuk upload dokumen
                        </p>
                    )}
                </div>
                {(fileName || currentUrl) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
                        title="Hapus"
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
                    Lihat dokumen saat ini
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
            title: 'Profil Perusahaan',
            href: edit(),
        },
    ],
};
