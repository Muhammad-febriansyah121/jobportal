import type { FormComponentRef } from '@inertiajs/core';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Marquee } from '@/components/ui/marquee';
import { Spinner } from '@/components/ui/spinner';
import { useTranslate } from '@/hooks/use-translate';
import { home, register } from '@/routes';
import { redirect as googleRedirect } from '@/routes/auth/google';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    recaptchaSiteKey?: string;
    recaptchaEnabled?: boolean;
    googleLoginClientId?: string;
};

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

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (
                siteKey: string,
                options: { action: string },
            ) => Promise<string>;
        };
    }
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    recaptchaSiteKey = '',
    recaptchaEnabled = false,
    googleLoginClientId = '',
}: Props) {
    const {
        name,
        branding,
        errors: pageErrors,
    } = usePage().props as {
        name: string;
        branding?: {
            name?: string;
            logo_url?: string | null;
            login_banner_url?: string | null;
        };
        errors?: Record<string, string>;
    };

    const { t } = useTranslate();

    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;
    const loginBannerUrl = branding?.login_banner_url ?? null;
    const recaptchaInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<FormComponentRef>(null);

    const stats = useMemo(
        () => [
            { value: '50K+', label: t('auth.login.stat_jobs') },
            { value: '10K+', label: t('auth.login.stat_companies') },
            { value: '500K+', label: t('auth.login.stat_candidates') },
        ],
        [t],
    );

    useEffect(() => {
        if (!recaptchaEnabled || !recaptchaSiteKey) {
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
        script.async = true;
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [recaptchaEnabled, recaptchaSiteKey]);

    const handleSubmitClick = async (e: MouseEvent<HTMLButtonElement>) => {
        if (
            !recaptchaEnabled ||
            !recaptchaSiteKey ||
            !recaptchaInputRef.current
        ) {
            return;
        }

        e.preventDefault();

        try {
            await new Promise<void>((resolve) =>
                window.grecaptcha.ready(resolve),
            );
            const token = await window.grecaptcha.execute(recaptchaSiteKey, {
                action: 'login',
            });
            recaptchaInputRef.current.value = token;
        } catch {
            recaptchaInputRef.current.value = '';
        }

        formRef.current?.submit();
    };

    return (
        <>
            <Head title={t('auth.login.head_title')} />

            {/* Full-screen split layout */}
            <div className="relative grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
                <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
                {/* Left panel — brand/illustration */}
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

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between p-10">
                        {/* Logo */}
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

                        {/* Hero text */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase ring-1 ring-primary/20 backdrop-blur-sm">
                                    {t('auth.login.platform_badge')}
                                </span>
                                <h2 className="text-4xl leading-tight font-bold text-foreground xl:text-5xl">
                                    {t('auth.login.hero_title_1')}
                                    <br />
                                    <span className="text-primary">
                                        {t('auth.login.hero_title_2')}
                                    </span>
                                </h2>
                                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {t('auth.login.hero_description', { siteName })}
                                </p>
                            </div>

                            {/* Stats */}
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

                        {/* Partner companies */}
                        <div className="rounded-2xl border border-primary/15 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                {t('auth.login.trusted_by')}
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

                {/* Right panel — login form */}
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
                        {/* Header */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {t('auth.login.welcome_back')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t('auth.login.subtitle', { siteName })}
                            </p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800">
                                {status}
                            </div>
                        )}

                        <Form
                            action={store.url()}
                            method="post"
                            resetOnSuccess={['password']}
                            className="space-y-5"
                            ref={formRef}
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        ref={recaptchaInputRef}
                                        type="hidden"
                                        name="recaptcha_token"
                                        defaultValue=""
                                    />

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium"
                                        >
                                            {t('auth.login.email_label')}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder={t('auth.login.email_placeholder')}
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="password"
                                                className="text-sm font-medium"
                                            >
                                                {t('auth.login.password_label')}
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-xs text-primary hover:underline"
                                                    tabIndex={5}
                                                >
                                                    {t('auth.login.forgot_password')}
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder={t('auth.login.password_placeholder')}
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember me */}
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer text-sm text-muted-foreground"
                                        >
                                            {t('auth.login.remember_me')}
                                        </Label>
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-lg bg-primary text-sm font-semibold shadow-md shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 active:scale-[0.98]"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                        onClick={handleSubmitClick}
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner className="mr-2" />
                                                {t('auth.login.submitting')}
                                            </>
                                        ) : (
                                            t('auth.login.submit')
                                        )}
                                    </Button>

                                    {googleLoginClientId !== '' && (
                                        <div className="space-y-3">
                                            <div className="relative text-center text-xs text-muted-foreground">
                                                <span className="relative z-10 bg-white px-2">
                                                    {t('auth.login.divider_or')}
                                                </span>
                                                <span className="absolute top-1/2 left-0 w-full -translate-y-1/2 border-t" />
                                            </div>
                                            <Button
                                                asChild
                                                type="button"
                                                variant="outline"
                                                className="h-11 w-full rounded-lg border border-primary/25 font-semibold"
                                            >
                                                <a href={googleRedirect().url}>
                                                    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    {t('auth.login.continue_with_google')}
                                                </a>
                                            </Button>
                                            <InputError
                                                message={
                                                    errors.google ??
                                                    pageErrors?.google
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* reCAPTCHA badge notice */}
                                    {recaptchaEnabled && (
                                        <p className="text-center text-xs text-muted-foreground">
                                            {t('auth.login.recaptcha_protected')}{' '}
                                            <a
                                                href="https://policies.google.com/privacy"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline underline-offset-2 hover:text-foreground"
                                            >
                                                {t('auth.login.recaptcha_privacy')}
                                            </a>{' '}
                                            &{' '}
                                            <a
                                                href="https://policies.google.com/terms"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline underline-offset-2 hover:text-foreground"
                                            >
                                                {t('auth.login.recaptcha_terms')}
                                            </a>{' '}
                                            {t('auth.login.recaptcha_apply')}
                                        </p>
                                    )}
                                </>
                            )}
                        </Form>

                        {/* Register link */}
                        {canRegister && (
                            <div className="space-y-1.5 text-center">
                                <p className="text-sm text-muted-foreground">
                                    {t('auth.login.no_account')}{' '}
                                    <TextLink
                                        href={register({
                                            query: { type: 'candidate' },
                                        })}
                                        tabIndex={6}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        {t('auth.login.register_candidate')}
                                    </TextLink>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.login.want_company_register')}{' '}
                                    <TextLink
                                        href={register({
                                            query: { type: 'employer' },
                                        })}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        {t('auth.login.click_here')}
                                    </TextLink>
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <p className="text-center text-xs text-muted-foreground/60">
                            © {new Date().getFullYear()} {siteName}. {t('auth.login.copyright')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
