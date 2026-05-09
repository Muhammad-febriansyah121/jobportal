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
import { useTranslate } from '@/hooks/use-translate';

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

function qrSource(qrCode?: string | null): string | null {
    if (!qrCode || qrCode.trim() === '') {
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
    const { t } = useTranslate();

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

    function stateBadge(state?: string | null) {
        const value = (state ?? '').toUpperCase();

        if (value === 'CONNECTED' || value === 'READY') {
            return (
                <Badge className="border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="mr-1 size-3.5" />
                    {t('employer.whatsapp.state_connected')}
                </Badge>
            );
        }

        if (value === 'WAITING_QR' || value === 'CONNECTING') {
            return (
                <Badge className="border-secondary-200 bg-secondary-50 text-secondary-700">
                    <RefreshCcw className="mr-1 size-3.5" />
                    {t('employer.whatsapp.state_waiting')}
                </Badge>
            );
        }

        if (value === '') {
            return (
                <Badge variant="outline" className="border-border text-muted-foreground">
                    {t('employer.whatsapp.state_no_session')}
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
            <Head title={t('employer.whatsapp.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.whatsapp.heading_title')}
                    description={t('employer.whatsapp.heading_desc')}
                />

                {!gatewayConfigured ? (
                    <Card className="border-red-200 bg-red-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-red-600" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    {t('employer.whatsapp.gateway_not_configured_title')}
                                </p>
                                <p className="mt-1 text-sm text-red-700">
                                    {t('employer.whatsapp.gateway_not_configured_desc')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('employer.whatsapp.settings_title')}</CardTitle>
                            <CardDescription>
                                {t('employer.whatsapp.settings_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={saveSettings} className="space-y-5">
                                <div className="flex items-center justify-between rounded-lg border border-border bg-white/60 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {t('employer.whatsapp.enable_whatsapp')}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {t('employer.whatsapp.enable_whatsapp_desc')}
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
                                    <Label htmlFor="phone">{t('employer.whatsapp.label_phone')}</Label>
                                    <Input
                                        id="phone"
                                        value={connectedPhoneNumber}
                                        readOnly
                                        placeholder={t('employer.whatsapp.no_number_connected')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="test-phone">
                                        {t('employer.whatsapp.label_test_phone')}
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
                                        placeholder={t('employer.whatsapp.test_number_placeholder')}
                                    />
                                    <InputError
                                        message={testForm.errors.phone_number}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="session-id">{t('employer.whatsapp.label_session_id')}</Label>
                                    <Input
                                        id="session-id"
                                        value={settingsForm.data.session_id}
                                        readOnly
                                        placeholder={t('employer.whatsapp.session_id_placeholder')}
                                    />
                                    <InputError
                                        message={settingsForm.errors.session_id}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={settingsForm.processing || !sessionId}
                                >
                                    {t('employer.whatsapp.btn_save')}
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
                                    {t('employer.whatsapp.btn_test')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('employer.whatsapp.session_title')}</CardTitle>
                            <CardDescription>
                                {t('employer.whatsapp.session_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {qrCodeUrl ? (
                                <div className="rounded-lg border border-border p-4">
                                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <QrCode className="size-4" />
                                        {t('employer.whatsapp.scan_qr')}
                                    </p>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        {t('employer.whatsapp.scan_qr_hint')}
                                    </p>
                                    <img
                                        src={qrCodeUrl}
                                        alt={t('employer.whatsapp.qr_alt')}
                                        className="mx-auto w-full max-w-[240px] rounded-md border border-border bg-white p-2"
                                    />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between rounded-lg border border-border bg-white/60 p-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                        {t('employer.whatsapp.current_status')}
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
                                    <Label htmlFor="session-label">{t('employer.whatsapp.label_session_label')}</Label>
                                    <Input
                                        id="session-label"
                                        value={connectForm.data.label}
                                        onChange={(e) =>
                                            connectForm.setData(
                                                'label',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={t('employer.whatsapp.session_label_placeholder')}
                                    />
                                    <InputError message={connectForm.errors.label} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('employer.whatsapp.connect_hint')}
                                </p>

                                <Button
                                    type="submit"
                                    disabled={connectForm.processing || !gatewayConfigured}
                                    className="w-full"
                                >
                                    <Link2 className="size-4" />
                                    {t('employer.whatsapp.btn_connect')}
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
                                    {t('employer.whatsapp.btn_reconnect')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={disconnectSession}
                                    disabled={!sessionId}
                                    className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                >
                                    <Unlink2 className="size-4" />
                                    {t('employer.whatsapp.btn_disconnect')}
                                </Button>
                            </div>

                            {isConnected && session?.phone_number ? (
                                <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {t('employer.whatsapp.session_active', { number: session.phone_number })}
                                </p>
                            ) : null}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
