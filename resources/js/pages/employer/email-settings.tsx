import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Mail, Send, ShieldCheck } from 'lucide-react';
import EmployerEmailSettingsController from '@/actions/App/Http/Controllers/Employer/EmployerEmailSettingsController';
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

type SmtpSettings = {
    enabled: boolean;
    host: string;
    port: number | null;
    username: string;
    password: string;
    encryption: string;
    from_address: string;
    from_name: string;
    password_set: boolean;
    last_tested_at: string | null;
};

type EmailSettingsPageProps = {
    user_email: string | null;
    smtp: SmtpSettings;
};

export default function EmployerEmailSettings({ user_email, smtp }: EmailSettingsPageProps) {
    const { t } = useTranslate();

    const form = useForm({
        enabled: smtp.enabled,
        host: smtp.host,
        port: smtp.port ?? '',
        username: smtp.username,
        password: '',
        encryption: smtp.encryption || 'tls',
        from_address: smtp.from_address,
        from_name: smtp.from_name,
    });

    const testForm = useForm({
        to: user_email ?? '',
    });

    function save(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            port: data.port === '' ? null : Number(data.port),
        }));
        form.patch(EmployerEmailSettingsController.update.url(), {
            preserveScroll: true,
            onSuccess: () => form.setData('password', ''),
        });
    }

    function sendTest() {
        testForm.post(EmployerEmailSettingsController.test.url(), {
            preserveScroll: true,
        });
    }

    const isReadyToTest = smtp.host !== '' && smtp.port !== null && smtp.username !== '' && smtp.password_set && smtp.from_address !== '';

    return (
        <>
            <Head title={t('employer.email_settings.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.email_settings.heading_title')}
                    description={t('employer.email_settings.heading_desc')}
                />

                <Card className="border-primary-200 bg-primary-50/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck className="size-4 text-primary" />
                            {t('employer.email_settings.info_title')}
                        </CardTitle>
                        <CardDescription>
                            {t('employer.email_settings.info_desc')}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <form onSubmit={save} className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('employer.email_settings.smtp_title')}</CardTitle>
                                <CardDescription>{t('employer.email_settings.smtp_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white/60 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {t('employer.email_settings.enable_label')}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {t('employer.email_settings.enable_desc')}
                                        </p>
                                    </div>
                                    <Checkbox
                                        checked={form.data.enabled}
                                        onCheckedChange={(checked) => form.setData('enabled', checked === true)}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-[1.5fr_0.5fr]">
                                    <div className="space-y-2">
                                        <Label htmlFor="host">{t('employer.email_settings.host_label')}</Label>
                                        <Input
                                            id="host"
                                            value={form.data.host}
                                            onChange={(e) => form.setData('host', e.target.value)}
                                            placeholder="smtp.example.com"
                                        />
                                        <InputError message={form.errors.host} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="port">{t('employer.email_settings.port_label')}</Label>
                                        <Input
                                            id="port"
                                            type="number"
                                            inputMode="numeric"
                                            value={form.data.port}
                                            onChange={(e) => form.setData('port', e.target.value)}
                                            placeholder="587"
                                        />
                                        <InputError message={form.errors.port} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="encryption">{t('employer.email_settings.encryption_label')}</Label>
                                    <select
                                        id="encryption"
                                        value={form.data.encryption}
                                        onChange={(e) => form.setData('encryption', e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="tls">TLS / STARTTLS (587)</option>
                                        <option value="ssl">SSL (465)</option>
                                        <option value="none">{t('employer.email_settings.encryption_none')}</option>
                                    </select>
                                    <InputError message={form.errors.encryption} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">{t('employer.email_settings.username_label')}</Label>
                                    <Input
                                        id="username"
                                        value={form.data.username}
                                        onChange={(e) => form.setData('username', e.target.value)}
                                        placeholder="hr@perusahaanmu.com"
                                    />
                                    <InputError message={form.errors.username} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center justify-between">
                                        <span>{t('employer.email_settings.password_label')}</span>
                                        {smtp.password_set ? (
                                            <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                                <CheckCircle2 className="size-3" />
                                                {t('employer.email_settings.password_set_badge')}
                                            </Badge>
                                        ) : null}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder={smtp.password_set ? t('employer.email_settings.password_placeholder_filled') : t('employer.email_settings.password_placeholder_empty')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('employer.email_settings.password_hint')}
                                    </p>
                                    <InputError message={form.errors.password} />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="from_address">{t('employer.email_settings.from_address_label')}</Label>
                                        <Input
                                            id="from_address"
                                            type="email"
                                            value={form.data.from_address}
                                            onChange={(e) => form.setData('from_address', e.target.value)}
                                            placeholder="hr@perusahaanmu.com"
                                        />
                                        <InputError message={form.errors.from_address} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="from_name">{t('employer.email_settings.from_name_label')}</Label>
                                        <Input
                                            id="from_name"
                                            value={form.data.from_name}
                                            onChange={(e) => form.setData('from_name', e.target.value)}
                                            placeholder="Tim HR Perusahaanmu"
                                        />
                                        <InputError message={form.errors.from_name} />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={form.processing}>
                                        {t('employer.email_settings.btn_save')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Send className="size-4 text-primary" />
                                    {t('employer.email_settings.test_title')}
                                </CardTitle>
                                <CardDescription>{t('employer.email_settings.test_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="test-to">{t('employer.email_settings.test_to_label')}</Label>
                                    <Input
                                        id="test-to"
                                        type="email"
                                        value={testForm.data.to}
                                        onChange={(e) => testForm.setData('to', e.target.value)}
                                    />
                                    <InputError message={testForm.errors.to} />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={sendTest}
                                    disabled={testForm.processing || !isReadyToTest}
                                    className="w-full gap-2"
                                >
                                    <Send className="size-4" />
                                    {t('employer.email_settings.btn_test')}
                                </Button>
                                {!isReadyToTest ? (
                                    <p className="text-xs leading-relaxed text-amber-600">
                                        {t('employer.email_settings.test_unready')}
                                    </p>
                                ) : null}
                                {smtp.last_tested_at ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('employer.email_settings.last_tested', { time: smtp.last_tested_at })}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Mail className="size-4 text-primary" />
                                    {t('employer.email_settings.account_title')}
                                </CardTitle>
                                <CardDescription>{t('employer.email_settings.account_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p className="text-muted-foreground">{t('employer.email_settings.account_label')}</p>
                                <p className="font-semibold text-foreground">{user_email ?? '-'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
