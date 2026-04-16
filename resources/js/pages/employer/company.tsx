import { Form, Head, Link } from '@inertiajs/react';
import EmployerCompanyController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyController';
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
        slug: string;
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
};

export default function EmployerCompany({
    company,
    industries,
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi perusahaan</CardTitle>
                            <CardDescription>
                                Data ini akan tampil di area internal employer
                                dan siap dipakai untuk profil public berikutnya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...EmployerCompanyController.update.form()}
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
                                            <Field
                                                label="Slug public"
                                                name="slug"
                                                error={errors.slug}
                                            >
                                                <Input
                                                    name="slug"
                                                    defaultValue={
                                                        company?.slug ?? ''
                                                    }
                                                    placeholder="karivia-indonesia"
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
                                                                {industry.label}
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
                                                <Input
                                                    name="company_size"
                                                    defaultValue={
                                                        company?.company_size ??
                                                        ''
                                                    }
                                                    placeholder="51-200 karyawan"
                                                />
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
                                                        company?.website ?? ''
                                                    }
                                                    placeholder="https://karivia.id"
                                                />
                                            </Field>
                                            <Field
                                                label="Logo URL"
                                                name="logo_url"
                                                error={errors.logo_url}
                                            >
                                                <Input
                                                    name="logo_url"
                                                    defaultValue={
                                                        company?.logo_url ?? ''
                                                    }
                                                    placeholder="https://.../logo.png"
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label="Cover URL"
                                            name="cover_url"
                                            error={errors.cover_url}
                                        >
                                            <Input
                                                name="cover_url"
                                                defaultValue={
                                                    company?.cover_url ?? ''
                                                }
                                                placeholder="https://.../cover.jpg"
                                            />
                                        </Field>

                                        <Field
                                            label="Deskripsi"
                                            name="description"
                                            error={errors.description}
                                        >
                                            <textarea
                                                name="description"
                                                defaultValue={
                                                    company?.description ?? ''
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
                                                        company?.hq_city ?? ''
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

EmployerCompany.layout = {
    breadcrumbs: [
        {
            title: 'Profil Perusahaan',
            href: edit(),
        },
    ],
};
