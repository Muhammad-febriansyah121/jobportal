import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import EmployerWhatsAppBulkController from '@/actions/App/Http/Controllers/Employer/EmployerWhatsAppBulkController';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { create, index } from '@/routes/employer/whatsapp-bulk';

type Channel = 'whatsapp' | 'email';

type Job = {
    id: number;
    title: string;
    status: string;
    applications_count: number;
};

type ApplicationItem = {
    id: number;
    candidate_name: string;
    candidate_headline: string | null;
    phone: string | null;
    has_phone: boolean;
    email: string | null;
    has_email: boolean;
    status: string;
    applied_at: string | null;
};

type Template = {
    id: number;
    name: string;
    channel: Channel;
    subject: string | null;
    body: string;
};

type WhatsAppBulkCreateProps = {
    jobs: Job[];
    selected_job_id: number | null;
    applications: ApplicationItem[];
    company: { id: number; name: string };
    gateway: {
        configured: boolean;
        session_id: string;
        session_state: string | null;
        is_connected: boolean;
    };
    templates: Template[];
    default_reply_to: string | null;
};

const DEFAULT_BODY =
    '<p>Halo {nama},</p><p>Terima kasih sudah melamar posisi {posisi} di {perusahaan}. Tim kami akan menghubungi Anda dalam 1-3 hari kerja.</p><p>Salam hangat.</p>';

export default function EmployerBroadcastCreate({
    jobs,
    selected_job_id,
    applications,
    gateway,
    templates,
    default_reply_to,
}: WhatsAppBulkCreateProps) {
    const form = useForm<{
        channel: Channel;
        job_listing_id: number | null;
        application_ids: number[];
        message_template: string;
        subject: string;
        reply_to_email: string;
    }>({
        channel: 'whatsapp',
        job_listing_id: selected_job_id ?? null,
        application_ids: [],
        message_template: DEFAULT_BODY,
        subject: '',
        reply_to_email: default_reply_to ?? '',
    });

    const isEmail = form.data.channel === 'email';

    const eligibleApplications = useMemo(
        () =>
            applications.filter((app) =>
                isEmail ? app.has_email : app.has_phone,
            ),
        [applications, isEmail],
    );

    const allEligibleSelected =
        eligibleApplications.length > 0 &&
        eligibleApplications.every((app) =>
            form.data.application_ids.includes(app.id),
        );

    const filteredTemplates = useMemo(
        () => templates.filter((tpl) => tpl.channel === form.data.channel),
        [templates, form.data.channel],
    );

    const onChangeChannel = (value: string) => {
        form.setData('channel', value as Channel);
        form.setData('application_ids', []);
    };

    const onChangeJob = (value: string) => {
        const jobId = Number(value);
        form.setData('job_listing_id', jobId);
        form.setData('application_ids', []);
        router.visit(create({ query: { job_listing_id: jobId } }).url, {
            preserveScroll: true,
            preserveState: true,
            only: ['applications', 'selected_job_id'],
        });
    };

    const applyTemplate = (templateId: string) => {
        if (templateId === '') {
            return;
        }
        const tpl = templates.find((t) => String(t.id) === templateId);
        if (!tpl) {
            return;
        }
        form.setData('message_template', tpl.body);
        if (tpl.channel === 'email' && tpl.subject) {
            form.setData('subject', tpl.subject);
        }
        toast.success(`Template "${tpl.name}" diterapkan.`);
    };

    const toggleRecipient = (id: number, checked: boolean) => {
        form.setData(
            'application_ids',
            checked
                ? [...form.data.application_ids, id]
                : form.data.application_ids.filter((value) => value !== id),
        );
    };

    const toggleAllEligible = (checked: boolean) => {
        form.setData(
            'application_ids',
            checked ? eligibleApplications.map((app) => app.id) : [],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(EmployerWhatsAppBulkController.store.url(), {
            preserveScroll: true,
            onError: () => {
                toast.error('Periksa form, ada isian yang belum sesuai.');
            },
        });
    };

    const ineligibleCount = applications.filter((app) =>
        isEmail ? !app.has_email : !app.has_phone,
    ).length;

    const canSubmit =
        form.data.application_ids.length > 0 &&
        form.data.message_template.trim().length >= 5 &&
        (!isEmail || (isEmail && form.data.subject.trim().length > 0)) &&
        (isEmail || gateway.is_connected) &&
        !form.processing;

    return (
        <>
            <Head title="Buat Broadcast" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href={index().url}>
                            <ArrowLeft className="size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Heading
                    title="Buat kampanye Broadcast"
                    description="Pilih channel (WhatsApp atau Email), pilih lowongan, centang pelamar, lalu tulis pesan dengan variabel {nama} / {posisi} / {perusahaan}."
                />

                {!isEmail && !gateway.is_connected ? (
                    <Card className="border-amber-200 bg-amber-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                Sesi WhatsApp belum terhubung. Hubungkan dulu di
                                halaman Koneksi WhatsApp sebelum mengirim, atau
                                ganti channel ke Email.
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Pilih channel</CardTitle>
                            <CardDescription>
                                Tentukan apakah broadcast dikirim via WhatsApp
                                atau Email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${form.data.channel === 'whatsapp' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                >
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="whatsapp"
                                        checked={form.data.channel === 'whatsapp'}
                                        onChange={(e) =>
                                            onChangeChannel(e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium">WhatsApp</p>
                                        <p className="text-xs text-muted-foreground">
                                            Kirim via gateway WA. Butuh sesi
                                            terhubung.
                                        </p>
                                    </div>
                                </label>
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${form.data.channel === 'email' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                >
                                    <input
                                        type="radio"
                                        name="channel"
                                        value="email"
                                        checked={form.data.channel === 'email'}
                                        onChange={(e) =>
                                            onChangeChannel(e.target.value)
                                        }
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium">Email</p>
                                        <p className="text-xs text-muted-foreground">
                                            Kirim via SMTP global. Subject wajib
                                            diisi.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Pilih lowongan</CardTitle>
                            <CardDescription>
                                Daftar pelamar akan diambil dari lowongan yang
                                kamu pilih.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="job">Lowongan</Label>
                                <Select
                                    value={
                                        form.data.job_listing_id?.toString() ??
                                        ''
                                    }
                                    onValueChange={onChangeJob}
                                >
                                    <SelectTrigger id="job">
                                        <SelectValue placeholder="Pilih lowongan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobs.map((job) => (
                                            <SelectItem
                                                key={job.id}
                                                value={job.id.toString()}
                                            >
                                                {job.title} (
                                                {job.applications_count}{' '}
                                                pelamar)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.job_listing_id}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {form.data.job_listing_id ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Pilih pelamar</CardTitle>
                                <CardDescription>
                                    Pelamar tanpa{' '}
                                    {isEmail ? 'email' : 'nomor WhatsApp'} tidak
                                    bisa dipilih dan otomatis dilewati.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {applications.length === 0 ? (
                                    <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                        Belum ada pelamar untuk lowongan ini.
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="text-sm text-muted-foreground">
                                                Total pelamar:{' '}
                                                <span className="font-semibold text-foreground">
                                                    {applications.length}
                                                </span>{' '}
                                                — Bisa dikirim:{' '}
                                                <span className="font-semibold text-foreground">
                                                    {eligibleApplications.length}
                                                </span>
                                                {ineligibleCount > 0 ? (
                                                    <>
                                                        {' '}
                                                        — Tanpa{' '}
                                                        {isEmail
                                                            ? 'email'
                                                            : 'nomor'}
                                                        :{' '}
                                                        <span className="font-semibold text-amber-700">
                                                            {ineligibleCount}
                                                        </span>
                                                    </>
                                                ) : null}
                                            </div>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={allEligibleSelected}
                                                    disabled={
                                                        eligibleApplications.length ===
                                                        0
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleAllEligible(
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                Pilih semua yang valid
                                            </label>
                                        </div>

                                        <InputError
                                            message={
                                                form.errors.application_ids
                                            }
                                        />

                                        <div className="overflow-x-auto rounded-md border border-border">
                                            <Table className="min-w-140">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12" />
                                                        <TableHead>
                                                            Kandidat
                                                        </TableHead>
                                                        <TableHead>
                                                            {isEmail
                                                                ? 'Email'
                                                                : 'Nomor WA'}
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead>
                                                            Melamar
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {applications.map((app) => {
                                                        const checked =
                                                            form.data.application_ids.includes(
                                                                app.id,
                                                            );
                                                        const eligible =
                                                            isEmail
                                                                ? app.has_email
                                                                : app.has_phone;
                                                        const contact = isEmail
                                                            ? app.email
                                                            : app.phone;

                                                        return (
                                                            <TableRow
                                                                key={app.id}
                                                                className={
                                                                    !eligible
                                                                        ? 'opacity-60'
                                                                        : ''
                                                                }
                                                            >
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        disabled={
                                                                            !eligible
                                                                        }
                                                                        onCheckedChange={(
                                                                            value,
                                                                        ) =>
                                                                            toggleRecipient(
                                                                                app.id,
                                                                                value ===
                                                                                    true,
                                                                            )
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="font-medium">
                                                                        {
                                                                            app.candidate_name
                                                                        }
                                                                    </div>
                                                                    {app.candidate_headline ? (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {
                                                                                app.candidate_headline
                                                                            }
                                                                        </div>
                                                                    ) : null}
                                                                </TableCell>
                                                                <TableCell className="font-mono text-sm">
                                                                    {contact ?? (
                                                                        <span className="text-amber-700">
                                                                            tidak
                                                                            ada
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {
                                                                            app.status
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {
                                                                        app.applied_at
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card>
                        <CardHeader>
                            <CardTitle>4. Tulis pesan</CardTitle>
                            <CardDescription>
                                Variabel didukung:{' '}
                                <code className="font-mono">{'{nama}'}</code>,{' '}
                                <code className="font-mono">{'{posisi}'}</code>,{' '}
                                <code className="font-mono">
                                    {'{perusahaan}'}
                                </code>
                                .{' '}
                                {isEmail
                                    ? 'Pengiriman email dengan jeda 5-15 detik per pesan.'
                                    : 'Pengiriman WA dengan jeda 3-8 detik per pesan.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {filteredTemplates.length > 0 ? (
                                <div className="space-y-2">
                                    <Label htmlFor="template">
                                        Gunakan template
                                    </Label>
                                    <Select
                                        value=""
                                        onValueChange={applyTemplate}
                                    >
                                        <SelectTrigger id="template">
                                            <SelectValue placeholder="Pilih template untuk mengisi pesan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredTemplates.map((tpl) => (
                                                <SelectItem
                                                    key={tpl.id}
                                                    value={String(tpl.id)}
                                                >
                                                    {tpl.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            {isEmail ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">
                                            Subject email
                                        </Label>
                                        <Input
                                            id="subject"
                                            value={form.data.subject}
                                            maxLength={191}
                                            onChange={(e) =>
                                                form.setData(
                                                    'subject',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Update lamaran Anda di {perusahaan}"
                                        />
                                        <InputError
                                            message={form.errors.subject}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reply_to">
                                            Reply-to email
                                        </Label>
                                        <Input
                                            id="reply_to"
                                            type="email"
                                            value={form.data.reply_to_email}
                                            onChange={(e) =>
                                                form.setData(
                                                    'reply_to_email',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="hr@perusahaan.com"
                                        />
                                        <InputError
                                            message={form.errors.reply_to_email}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Saat kandidat reply, balasan masuk
                                            ke alamat ini.
                                        </p>
                                    </div>
                                </>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor="body">Isi pesan</Label>
                                <RichTextEditor
                                    value={form.data.message_template}
                                    onChange={(html) =>
                                        form.setData('message_template', html)
                                    }
                                    placeholder="Halo {nama}, terima kasih sudah melamar posisi {posisi}..."
                                    minHeightClass="min-h-56"
                                />
                                <InputError
                                    message={form.errors.message_template}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format Email akan dikirim sebagai HTML;
                                    format WhatsApp dikonversi otomatis ke
                                    *tebal* / _miring_.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-2">
                        <Button type="submit" disabled={!canSubmit}>
                            <Send className="size-4" />
                            {form.processing
                                ? 'Menjadwalkan...'
                                : `Kirim ke ${form.data.application_ids.length} pelamar`}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
