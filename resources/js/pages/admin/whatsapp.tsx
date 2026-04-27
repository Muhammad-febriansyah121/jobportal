import { Head, router, useForm, usePoll } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Link2,
    QrCode,
    RefreshCcw,
    Send,
    Unlink2,
} from 'lucide-react';
import { useEffect } from 'react';
import AdminWhatsAppController from '@/actions/App/Http/Controllers/Admin/AdminWhatsAppController';
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

type AdminWhatsAppPageProps = {
    gatewayConfigured: boolean;
    sessionId: string;
    session: {
        id?: string | null;
        label?: string | null;
        state?: string | null;
        phone_number?: string | null;
        qr_code?: string | null;
        last_seen_at?: string | null;
        last_connected_at?: string | null;
        error_message?: string | null;
    } | null;
};

function stateBadge(state?: string | null) {
    const value = (state ?? '').toUpperCase();

    if (value === 'CONNECTED' || value === 'READY') {
        return (
            <Badge className="border-green-200 bg-green-50 text-green-700">
                <CheckCircle2 className="mr-1 size-3.5" />
                Terhubung
            </Badge>
        );
    }

    if (value === 'WAITING_QR' || value === 'CONNECTING') {
        return (
            <Badge className="border-secondary-200 bg-secondary-50 text-secondary-700">
                <RefreshCcw className="mr-1 size-3.5" />
                Menunggu Scan
            </Badge>
        );
    }

    if (value === '') {
        return (
            <Badge
                variant="outline"
                className="border-border text-muted-foreground"
            >
                Belum ada sesi
            </Badge>
        );
    }

    return (
        <Badge className="border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="mr-1 size-3.5" />
            {value}
        </Badge>
    );
}

function qrSource(qrCode?: string | null): string | null {
    if (!qrCode || qrCode.trim() === '') {
        return null;
    }

    return qrCode.startsWith('data:image')
        ? qrCode
        : `data:image/png;base64,${qrCode}`;
}

export default function AdminWhatsApp({
    gatewayConfigured,
    sessionId: initialSessionId,
    session,
}: AdminWhatsAppPageProps) {
    const connectForm = useForm({
        label: session?.label ?? 'Admin Karivia',
    });
    const testForm = useForm({
        phone_number: '',
    });

    const sessionId = initialSessionId?.trim() || session?.id?.trim() || '';
    const sessionState = (session?.state ?? '').toUpperCase();
    const isConnected = ['CONNECTED', 'READY'].includes(sessionState);

    const qrCodeUrl = qrSource(session?.qr_code);

    const { start: startPoll, stop: stopPoll } = usePoll(
        2500,
        {
            only: ['session', 'gatewayConfigured', 'sessionId'],
            preserveScroll: true,
            preserveState: true,
        },
        {
            autoStart: Boolean(sessionId && !isConnected),
            keepAlive: true,
        },
    );

    useEffect(() => {
        if (isConnected) {
            stopPoll();
        } else if (sessionId) {
            startPoll();
        }
    }, [isConnected, sessionId, startPoll, stopPoll]);

    function connectSession(e: React.FormEvent) {
        e.preventDefault();
        connectForm.post(AdminWhatsAppController.connect.url(), {
            preserveScroll: true,
        });
    }

    function reconnectSession() {
        router.post(
            AdminWhatsAppController.reconnect.url(),
            {},
            { preserveScroll: true },
        );
    }

    function disconnectSession() {
        router.delete(AdminWhatsAppController.disconnect.url(), {
            preserveScroll: true,
        });
    }

    function sendTestMessage() {
        testForm.post(AdminWhatsAppController.sendTest.url(), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="WhatsApp Admin" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="WhatsApp Admin"
                    description="Kelola sesi WhatsApp default untuk notifikasi sistem — termasuk notifikasi lupa password."
                />

                {!gatewayConfigured ? (
                    <Card className="border-red-200 bg-red-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-red-600" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    Gateway WhatsApp belum dikonfigurasi.
                                </p>
                                <p className="mt-1 text-sm text-red-700">
                                    Isi konfigurasi gateway di Pengaturan Web
                                    (tab AI) untuk{' '}
                                    <code className="rounded bg-red-100 px-1 text-xs">
                                        whatsapp_gateway_url
                                    </code>{' '}
                                    dan{' '}
                                    <code className="rounded bg-red-100 px-1 text-xs">
                                        whatsapp_gateway_api_key
                                    </code>
                                    .
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="border-primary/10 bg-primary/5">
                    <CardContent className="flex items-start gap-3 py-4">
                        <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                        <div>
                            <p className="text-sm font-semibold text-primary">
                                Notifikasi Lupa Password via WhatsApp
                            </p>
                            <p className="mt-1 text-sm text-primary/80">
                                Sesi ini digunakan sebagai gateway default untuk
                                mengirimkan link reset password ke nomor
                                WhatsApp yang diisi pengguna di halaman lupa
                                password.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test & Info Sesi</CardTitle>
                            <CardDescription>
                                Kirim pesan test ke nomor tertentu menggunakan
                                sesi default ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="session-id-display">
                                    Session ID Default
                                </Label>
                                <Input
                                    id="session-id-display"
                                    value={sessionId}
                                    readOnly
                                    placeholder="Belum ada sesi terhubung"
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Session ID ini diambil dari pengaturan{' '}
                                    <code className="rounded bg-muted px-1 text-xs">
                                        whatsapp_gateway_default_session_id
                                    </code>
                                    . Membuat sesi baru di bawah akan
                                    memperbarui nilai ini secara otomatis.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="test-phone">
                                    Nomor uji koneksi
                                </Label>
                                <Input
                                    id="test-phone"
                                    value={testForm.data.phone_number}
                                    onChange={(e) =>
                                        testForm.setData(
                                            'phone_number',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 628123456789"
                                />
                                <InputError
                                    message={testForm.errors.phone_number}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Isi nomor WhatsApp yang ingin menerima pesan
                                    test dari sesi ini.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={sendTestMessage}
                                disabled={
                                    testForm.processing ||
                                    !gatewayConfigured ||
                                    !sessionId ||
                                    !isConnected ||
                                    testForm.data.phone_number.trim() === ''
                                }
                            >
                                <Send className="size-4" />
                                Test Kirim Pesan
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status sesi gateway</CardTitle>
                            <CardDescription>
                                Buat sesi baru, reconnect, atau putuskan sesi
                                default.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {qrCodeUrl ? (
                                <div className="rounded-lg border border-border p-4">
                                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <QrCode className="size-4" />
                                        Scan QR untuk menyambungkan perangkat
                                    </p>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Jika WhatsApp menolak tautan perangkat,
                                        tunggu QR diperbarui lalu scan ulang.
                                    </p>
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR WhatsApp Session"
                                        className="mx-auto w-full max-w-60 rounded-md border border-border bg-white p-2"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between rounded-lg border border-border bg-white/60 p-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                        Status saat ini
                                    </p>
                                    <div className="mt-2">
                                        {stateBadge(session?.state)}
                                    </div>
                                </div>
                                {session?.id ? (
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-xs"
                                    >
                                        {session.id}
                                    </Badge>
                                ) : null}
                            </div>

                            {session?.error_message ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {session.error_message}
                                </div>
                            ) : null}

                            <form
                                onSubmit={connectSession}
                                className="space-y-3"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="session-label">
                                        Label sesi
                                    </Label>
                                    <Input
                                        id="session-label"
                                        value={connectForm.data.label}
                                        onChange={(e) =>
                                            connectForm.setData(
                                                'label',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Admin Karivia"
                                    />
                                    <InputError
                                        message={connectForm.errors.label}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Setelah klik tombol di bawah, scan QR dari
                                    WhatsApp di ponsel. Session ID default akan
                                    diperbarui otomatis.
                                </p>
                                <Button
                                    type="submit"
                                    disabled={
                                        connectForm.processing ||
                                        !gatewayConfigured
                                    }
                                    className="w-full"
                                >
                                    <Link2 className="size-4" />
                                    Buat / Hubungkan Sesi Baru
                                </Button>
                            </form>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={reconnectSession}
                                    disabled={!sessionId || !gatewayConfigured}
                                    className="w-full"
                                >
                                    <RefreshCcw className="size-4" />
                                    Reconnect
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={disconnectSession}
                                    disabled={!sessionId}
                                    className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                >
                                    <Unlink2 className="size-4" />
                                    Putuskan Sesi
                                </Button>
                            </div>

                            {isConnected && session?.phone_number ? (
                                <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    Session aktif di nomor{' '}
                                    {session.phone_number}.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminWhatsApp.layout = {
    title: 'WhatsApp Admin',
};
