import { Form, Head, Link } from '@inertiajs/react';
import { type FormComponentRef } from '@inertiajs/core';
import { type MouseEvent, useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    recaptchaSiteKey?: string;
    recaptchaEnabled?: boolean;
};

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    recaptchaSiteKey = '',
    recaptchaEnabled = false,
}: Props) {
    const recaptchaInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<FormComponentRef>(null);

    useEffect(() => {
        if (!recaptchaEnabled || !recaptchaSiteKey) return;

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
        if (!recaptchaEnabled || !recaptchaSiteKey || !recaptchaInputRef.current) return;

        e.preventDefault();

        try {
            await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));
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
            <Head title="Masuk" />

            {/* Full-screen split layout */}
            <div className="relative grid min-h-dvh lg:grid-cols-2">
                {/* Left panel — brand/illustration */}
                <div className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-[oklch(0.20_0.05_255)] via-[oklch(0.15_0.03_265)] to-[oklch(0.10_0.02_275)] lg:flex">
                    {/* Decorative blobs */}
                    <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                    <div className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />

                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between p-10">
                        {/* Logo */}
                        <Link href={home()} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
                                <AppLogoIcon className="size-6 fill-current text-primary" />
                            </div>
                            <span className="text-lg font-semibold tracking-wide text-white">Karivia</span>
                        </Link>

                        {/* Hero text */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <span className="inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary ring-1 ring-primary/30">
                                    Platform Karir #1 Indonesia
                                </span>
                                <h2 className="text-4xl leading-tight font-bold text-white xl:text-5xl">
                                    Temukan Karir
                                    <br />
                                    <span className="bg-gradient-to-r from-primary to-orange-300 bg-clip-text text-transparent">
                                        Impian Kamu
                                    </span>
                                </h2>
                                <p className="max-w-sm text-sm leading-relaxed text-white/60">
                                    Bergabunglah dengan ribuan profesional yang telah menemukan peluang karir terbaik melalui Karivia.
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: '50K+', label: 'Lowongan' },
                                    { value: '10K+', label: 'Perusahaan' },
                                    { value: '500K+', label: 'Kandidat' },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm"
                                    >
                                        <p className="text-xl font-bold text-white">{stat.value}</p>
                                        <p className="mt-0.5 text-xs text-white/50">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                            <p className="text-sm italic leading-relaxed text-white/70">
                                "Karivia membantu saya menemukan pekerjaan impian dalam waktu kurang dari 2 minggu. Platform terbaik!"
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-sm font-bold text-white">
                                    A
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Andi Saputra</p>
                                    <p className="text-xs text-white/50">Software Engineer · Jakarta</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel — login form */}
                <div className="flex flex-col items-center justify-center bg-background px-6 py-12 md:px-12 lg:px-16">
                    {/* Mobile logo */}
                    <div className="mb-8 flex w-full max-w-sm flex-col items-center lg:hidden">
                        <Link href={home()} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <AppLogoIcon className="size-6 fill-current text-primary" />
                            </div>
                            <span className="text-lg font-semibold">Karivia</span>
                        </Link>
                    </div>

                    <div className="w-full max-w-sm space-y-8">
                        {/* Header */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Selamat datang kembali
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Masuk ke akun Karivia kamu untuk melanjutkan
                            </p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800">
                                {status}
                            </div>
                        )}

                        <Form
                            {...store.form()}
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
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Alamat Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="kamu@example.com"
                                            className="h-11 rounded-lg bg-muted/50 transition-shadow focus:ring-2 focus:ring-primary/20"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-sm font-medium">
                                                Password
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-xs text-primary hover:underline"
                                                    tabIndex={5}
                                                >
                                                    Lupa password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Masukkan password"
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
                                            Ingat saya selama 30 hari
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
                                                Masuk...
                                            </>
                                        ) : (
                                            'Masuk'
                                        )}
                                    </Button>

                                    {/* reCAPTCHA badge notice */}
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

                        {/* Register link */}
                        {canRegister && (
                            <p className="text-center text-sm text-muted-foreground">
                                Belum punya akun?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={6}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Daftar sekarang
                                </TextLink>
                            </p>
                        )}

                        {/* Footer */}
                        <p className="text-center text-xs text-muted-foreground/60">
                            © {new Date().getFullYear()} Karivia. Hak cipta dilindungi.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}


