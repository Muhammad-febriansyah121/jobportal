import type {FormComponentRef} from '@inertiajs/core';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import {  useEffect, useRef } from 'react';
import type {MouseEvent} from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Marquee } from '@/components/ui/marquee';
import { Spinner } from '@/components/ui/spinner';
import { home, login, register } from '@/routes';
import { store } from '@/routes/register';

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

type Props = {
    recaptchaSiteKey?: string;
    recaptchaEnabled?: boolean;
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

export default function RegisterEmployer({
    recaptchaSiteKey = '',
    recaptchaEnabled = false,
}: Props) {
    const { name, branding } = usePage().props as {
        name: string;
        branding?: {
            name?: string;
            logo_url?: string | null;
            login_banner_url?: string | null;
        };
    };

    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;
    const loginBannerUrl = branding?.login_banner_url ?? null;

    const recaptchaInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<FormComponentRef>(null);

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
                action: 'register',
            });
            recaptchaInputRef.current.value = token;
        } catch {
            recaptchaInputRef.current.value = '';
        }

        formRef.current?.submit();
    };

    return (
        <>
            <Head title="Daftar Perusahaan" />

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
                            <div className="flex h-28 w-auto items-center">
                                {siteLogoUrl ? (
                                    <img
                                        src={siteLogoUrl}
                                        alt={siteName}
                                        className="h-full w-auto max-w-[360px] object-contain"
                                    />
                                ) : (
                                    <AppLogoIcon className="size-24 fill-current text-primary" />
                                )}
                            </div>
                        </Link>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase ring-1 ring-primary/20 backdrop-blur-sm">
                                    Platform Rekrutmen #1 Indonesia
                                </span>
                                <h2 className="text-4xl leading-tight font-bold text-foreground xl:text-5xl">
                                    Temukan Talenta
                                    <br />
                                    <span className="text-primary">
                                        Terbaik Kamu
                                    </span>
                                </h2>
                                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    Bergabunglah dengan ribuan perusahaan yang
                                    telah menemukan kandidat berkualitas melalui{' '}
                                    {siteName}.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: '50K+', label: 'Lowongan' },
                                    { value: '10K+', label: 'Perusahaan' },
                                    { value: '500K+', label: 'Kandidat' },
                                ].map((stat) => (
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
                                Dipercaya Perusahaan Ternama
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
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
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
                <div className="relative z-10 overflow-y-auto bg-white">
                <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 md:px-12 lg:px-16">
                    {/* Mobile logo */}
                    <div className="mb-8 flex w-full max-w-md flex-col items-center lg:hidden">
                        <Link href={home()}>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                {siteLogoUrl ? (
                                    <img
                                        src={siteLogoUrl}
                                        alt={siteName}
                                        className="h-10 w-10 object-contain"
                                    />
                                ) : (
                                    <AppLogoIcon className="size-9 fill-current text-primary" />
                                )}
                            </div>
                        </Link>
                    </div>

                    <div className="w-full max-w-md space-y-6 rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-xl shadow-primary/10 backdrop-blur-md md:p-8">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Daftar Perusahaan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Buat akun recruiter untuk mengelola proses
                                rekrutmen.
                            </p>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                            Akun ini dipakai tim perusahaan untuk memasang
                            lowongan, mengelola kandidat, dan mengatur verifikasi
                            perusahaan.
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            ref={formRef}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="role"
                                        value="employer"
                                    />

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-sm font-medium"
                                        >
                                            Nama PIC / Recruiter
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            name="name"
                                            placeholder="Nama penanggung jawab"
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium"
                                        >
                                            Email Kerja
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            name="email"
                                            placeholder="recruitment@perusahaan.com"
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-sm font-medium"
                                        >
                                            Password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder="Buat password"
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="text-sm font-medium"
                                        >
                                            Konfirmasi Password
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder="Ulangi password"
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError
                                            message={errors.password_confirmation}
                                        />
                                    </div>

                                    {recaptchaEnabled && (
                                        <input
                                            type="hidden"
                                            ref={recaptchaInputRef}
                                            name="recaptcha_token"
                                        />
                                    )}

                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-lg bg-primary text-sm font-semibold shadow-md shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 active:scale-[0.98]"
                                        tabIndex={5}
                                        onClick={handleSubmitClick}
                                        data-test="register-employer-button"
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner className="mr-2" />
                                                Memproses...
                                            </>
                                        ) : (
                                            'Buat Akun Perusahaan'
                                        )}
                                    </Button>

                                    {recaptchaEnabled && (
                                        <p className="text-center text-xs text-muted-foreground">
                                            Dilindungi oleh reCAPTCHA.{' '}
                                            <a
                                                href="https://policies.google.com/privacy"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline underline-offset-2 hover:text-foreground"
                                            >
                                                Privasi
                                            </a>{' '}
                                            &{' '}
                                            <a
                                                href="https://policies.google.com/terms"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline underline-offset-2 hover:text-foreground"
                                            >
                                                Syarat
                                            </a>{' '}
                                            berlaku.
                                        </p>
                                    )}
                                </>
                            )}
                        </Form>

                        <p className="text-center text-sm text-muted-foreground">
                            Daftar sebagai kandidat?{' '}
                            <TextLink
                                href={register({ query: { type: 'candidate' } })}
                                tabIndex={6}
                                className="font-semibold text-primary hover:underline"
                            >
                                Ganti ke Kandidat
                            </TextLink>
                        </p>

                        <p className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={7}
                                className="font-semibold text-primary hover:underline"
                            >
                                Masuk
                            </TextLink>
                        </p>

                        <p className="text-center text-xs text-muted-foreground/60">
                            © {new Date().getFullYear()} {siteName}. Hak cipta
                            dilindungi.
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}
