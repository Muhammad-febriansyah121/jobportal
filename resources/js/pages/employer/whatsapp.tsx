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
import { useEffect, useMemo } from 'react';
import EmployerWhatsAppController from '@/actions/App/Http/Controllers/Employer/EmployerWhatsAppController';
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

type WhatsAppPageProps = {
    phone: string | null;
    gatewayConfigured: boolean;
    settings: {
        enabled: boolean;
        session_id: string;
    };
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
            <Badge variant="outline" className="border-border text-muted-foreground">
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
    if (! qrCode || qrCode.trim() === '') {
        return null;
    }

    return qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`;
}

export default function EmployerWhatsApp({
    phone,
    gatewayConfigured,
    settings,
    session,
}: WhatsAppPageProps) {
    const settingsForm = useForm({
        enabled: settings.enabled,
        session_id: settings.session_id ?? '',
    });

    const connectForm = useForm({
        label: session?.label ?? '',
        is_new_number: true,
    });
    const testForm = useForm({
        phone_number: phone ?? '',
    });
    const currentSessionId = settingsForm.data.session_id;
    const setSettingsData = settingsForm.setData;

    const sessionId =
        settingsForm.data.session_id?.trim() ||
        session?.id?.trim() ||
        '';
    const sessionState = (session?.state ?? '').toUpperCase();
    const isConnected = ['CONNECTED', 'READY'].includes(sessionState);
    const shouldPollSession = useMemo(
        () =>
            Boolean(
                sessionId &&
                    ['WAITING_QR', 'CONNECTING', 'QR_READY'].includes(
                        sessionState,
                    ),
            ),
        [sessionId, sessionState],
    );
    const qrCodeUrl = qrSource(session?.qr_code);
    const connectedPhoneNumber = session?.phone_number?.trim() || phone || '';

    usePoll(
        2500,
        {
            only: ['settings', 'session', 'gatewayConfigured'],
            preserveScroll: true,
            preserveState: true,
        },
        {
            autoStart: shouldPollSession,
            keepAlive: true,
        },
    );

    useEffect(() => {
        const nextSessionId =
            settings.session_id?.trim() || session?.id?.trim() || '';

        if (currentSessionId !== nextSessionId) {
            setSettingsData('session_id', nextSessionId);
        }
    }, [
        session?.id,
        settings.session_id,
        currentSessionId,
        setSettingsData,
    ]);

    function saveSettings(e: React.FormEvent) {
        e.preventDefault();
        settingsForm.patch(EmployerWhatsAppController.update.url(), {
            preserveScroll: true,
        });
    }

    function connectSession(e: React.FormEvent) {
        e.preventDefault();
        connectForm.post(EmployerWhatsAppController.connect.url(), {
            preserveScroll: true,
        });
    }

    function reconnectSession() {
        router.post(
            EmployerWhatsAppController.reconnect.url(),
            {},
            { preserveScroll: true },
        );
    }

    function disconnectSession() {
        router.delete(EmployerWhatsAppController.disconnect.url(), {
            preserveScroll: true,
        });
    }

    function sendTestMessage() {
        testForm.post(EmployerWhatsAppController.sendTest.url(), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Koneksi WhatsApp" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Koneksi WhatsApp"
                    description="Hubungkan WhatsApp gateway untuk kirim notifikasi otomatis ke kandidat dan tim hiring."
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
                                    Isi konfigurasi gateway di Admin Setting Web
                                    (tab AI) untuk `whatsapp_gateway_url` dan
                                    `whatsapp_gateway_api_key`.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan notifikasi</CardTitle>
                            <CardDescription>
                                Aktifkan kanal WhatsApp setelah sesi berhasil
                                terhubung. Session ID terisi otomatis dari
                                proses QR connect.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={saveSettings} className="space-y-5">
                                <div className="flex items-center justify-between rounded-lg border border-border bg-white/60 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Aktifkan notifikasi WhatsApp
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Jika dimatikan, notifikasi tetap
                                            masuk inbox platform.
                                        </p>
                                    </div>
                                    <Checkbox
                                        checked={settingsForm.data.enabled}
                                        disabled={!sessionId}
                                        onCheckedChange={(checked) =>
                                            settingsForm.setData(
                                                'enabled',
                                                checked === true,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Nomor WhatsApp akun</Label>
                                    <Input
                                        id="phone"
                                        value={connectedPhoneNumber}
                                        readOnly
                                        placeholder="Belum ada nomor WhatsApp yang terhubung"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Nomor ini mengikuti nomor WhatsApp yang
                                        sedang terhubung di session gateway.
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
                                        Isi nomor WhatsApp yang ingin menerima
                                        pesan test dari session ini.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="session-id">Session ID</Label>
                                    <Input
                                        id="session-id"
                                        value={settingsForm.data.session_id}
                                        readOnly
                                        placeholder="Akan terisi otomatis setelah sesi terhubung"
                                    />
                                    <InputError
                                        message={settingsForm.errors.session_id}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tidak perlu diisi manual. Klik
                                        <span className="font-semibold">
                                            {' '}
                                            Buat / Hubungkan Sesi Baru
                                        </span>{' '}
                                        untuk generate QR dan session ID
                                        otomatis.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={settingsForm.processing || !sessionId}
                                >
                                    Simpan Pengaturan
                                </Button>

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
                                    Test Koneksi
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status sesi gateway</CardTitle>
                            <CardDescription>
                                Buat sesi baru, reconnect, atau putuskan sesi
                                agar tidak dipakai lagi.
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
                                        tunggu QR diperbarui lalu scan ulang
                                        tanpa menutup halaman ini.
                                    </p>
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR WhatsApp Session"
                                        className="mx-auto w-full max-w-[240px] rounded-md border border-border bg-white p-2"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between rounded-lg border border-border bg-white/60 p-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                        Status saat ini
                                    </p>
                                    <div className="mt-2">{stateBadge(session?.state)}</div>
                                </div>
                                {session?.id ? (
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {session.id}
                                    </Badge>
                                ) : null}
                            </div>

                            {session?.error_message ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {session.error_message}
                                </div>
                            ) : null}

                            <form onSubmit={connectSession} className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="session-label">Label sesi</Label>
                                    <Input
                                        id="session-label"
                                        value={connectForm.data.label}
                                        onChange={(e) =>
                                            connectForm.setData(
                                                'label',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: HR Karivia"
                                    />
                                    <InputError message={connectForm.errors.label} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Setelah klik tombol di bawah, scan QR dari
                                    WhatsApp di ponsel. QR akan diperbarui
                                    otomatis bila gateway mengirim QR baru.
                                </p>

                                <Button
                                    type="submit"
                                    disabled={connectForm.processing || !gatewayConfigured}
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
                                    Session aktif di nomor {session.phone_number}.
                                </p>
                            ) : null}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
