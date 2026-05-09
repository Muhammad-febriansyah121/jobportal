import { Form, Head, Link, usePage } from '@inertiajs/react';
import { KeyRound, LoaderCircle, Mail, Phone } from 'lucide-react';
import { useMemo } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Marquee } from '@/components/ui/marquee';
import { useTranslate } from '@/hooks/use-translate';
import { home, login } from '@/routes';
import { email } from '@/routes/password';

const partnerCompanies = [
    { name: 'Gojek', domain: 'gojek.com' },
    { name: 'Tokopedia', domain: 'tokopedia.com' },
    { name: 'Traveloka', domain: 'traveloka.com' },
    { name: 'Bukalapak', domain: 'bukalapak.com' },
    { name: 'Shopee', domain: 'shopee.co.id' },
    { name: 'Grab', domain: 'grab.com' },
    { name: 'Blibli', domain: 'blibli.com' },
    { name: 'Ruangguru', domain: 'ruangguru.com' },
];

export default function ForgotPassword({ status }: { status?: string }) {
    const { name, branding } = usePage().props as {
        name: string;
        branding?: {
            name?: string;
            logo_url?: string | null;
            login_banner_url?: string | null;
        };
    };
    const { t } = useTranslate();

    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;
    const loginBannerUrl = branding?.login_banner_url ?? null;

    const stats = useMemo(
        () => [
            { value: '50K+', label: t('auth.forgot_password.stat_jobs') },
            { value: '10K+', label: t('auth.forgot_password.stat_companies') },
            { value: '500K+', label: t('auth.forgot_password.stat_candidates') },
        ],
        [t],
    );

    return (
        <>
            <Head title={t('auth.forgot_password.head_title')} />

            <div className="relative grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
                <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

                {/* Left panel */}
                <div className="relative hidden flex-col overflow-hidden border-r border-primary/10 bg-white lg:flex">
                    {loginBannerUrl ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${loginBannerUrl})`,
                            }}
                        />
                    ) : null}
                    <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" />
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(237,106,47,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(237,106,47,0.5) 1px, transparent 1px)',
                            backgroundSize: '42px 42px',
                        }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between p-10">
                        <Link href={home()}>
                            <div className="flex h-20 max-w-[260px] items-center">
                                {siteLogoUrl ? (
                                    <img
                                        src={siteLogoUrl}
                                        alt={siteName}
                                        className="h-full w-auto max-w-full object-contain"
                                    />
                                ) : (
                                    <AppLogoIcon className="size-20 fill-current text-primary" />
                                )}
                            </div>
                        </Link>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase ring-1 ring-primary/20 backdrop-blur-sm">
                                    {t('auth.forgot_password.platform_badge')}
                                </span>
                                <h2 className="text-4xl leading-tight font-bold text-foreground xl:text-5xl">
                                    {t('auth.forgot_password.hero_title_1')}
                                    <br />
                                    <span className="text-primary">
                                        {t('auth.forgot_password.hero_title_2')}
                                    </span>
                                </h2>
                                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {t('auth.forgot_password.hero_description', { siteName })}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border border-primary/15 bg-white/70 p-4 shadow-xs backdrop-blur-md"
                                    >
                                        <p className="text-xl font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-primary/15 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                {t('auth.forgot_password.trusted_by')}
                            </p>
                            <Marquee
                                pauseOnHover
                                className="p-0 [--duration:24s] [--gap:0.75rem]"
                            >
                                {partnerCompanies.map((company) => (
                                    <div
                                        key={company.name}
                                        className="flex h-11 items-center gap-2.5 rounded-xl border border-primary/15 bg-white/90 px-4 backdrop-blur-sm"
                                    >
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`}
                                            alt={company.name}
                                            className="h-5 w-5 rounded object-contain"
                                            onError={(e) => {
                                                (
                                                    e.currentTarget as HTMLImageElement
                                                ).style.display = 'none';
                                            }}
                                        />
                                        <span className="text-sm font-semibold tracking-wide text-foreground">
                                            {company.name}
                                        </span>
                                    </div>
                                ))}
                            </Marquee>
                        </div>
                    </div>
                </div>

                {/* Right panel — form */}
                <div className="relative z-10 flex flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12 md:px-12 lg:px-16">
                    {/* Mobile logo */}
                    <div className="mb-8 flex w-full max-w-sm flex-col items-center lg:hidden">
                        <Link href={home()}>
                            <div className="flex h-14 max-w-[220px] items-center justify-center">
                                {siteLogoUrl ? (
                                    <img
                                        src={siteLogoUrl}
                                        alt={siteName}
                                        className="h-full w-auto max-w-full object-contain"
                                    />
                                ) : (
                                    <AppLogoIcon className="size-14 fill-current text-primary" />
                                )}
                            </div>
                        </Link>
                    </div>

                    <div className="w-full max-w-sm space-y-8 rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-xl shadow-primary/10 backdrop-blur-md md:p-8">
                        {/* Icon + header */}
                        <div className="space-y-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <KeyRound className="size-6" />
                            </div>
                            <div className="space-y-1.5">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {t('auth.forgot_password.title')}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {t('auth.forgot_password.subtitle')}
                                </p>
                            </div>
                        </div>

                        {status && (
                            <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
                                <Mail className="mt-0.5 size-4 shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        <Form {...email.form()} className="space-y-5">
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium"
                                        >
                                            {t('auth.forgot_password.email_label')}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            autoFocus
                                            placeholder={t('auth.forgot_password.email_placeholder')}
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="phone"
                                            className="text-sm font-medium"
                                        >
                                            {t('auth.forgot_password.phone_label')}{' '}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {t('auth.forgot_password.phone_optional')}
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                name="phone"
                                                autoComplete="tel"
                                                placeholder="628123456789"
                                                className="h-11 rounded-lg bg-muted/50 pl-9 transition-shadow focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('auth.forgot_password.phone_help')}
                                        </p>
                                        <InputError message={errors.phone} />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-lg bg-primary text-sm font-semibold shadow-md shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 active:scale-[0.98]"
                                        disabled={processing}
                                        data-test="email-password-reset-link-button"
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                {t('auth.forgot_password.submitting')}
                                            </>
                                        ) : (
                                            t('auth.forgot_password.submit')
                                        )}
                                    </Button>
                                </>
                            )}
                        </Form>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.forgot_password.remember_password')}{' '}
                            <TextLink
                                href={login()}
                                className="font-medium text-primary hover:underline"
                            >
                                {t('auth.forgot_password.sign_in_here')}
                            </TextLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
