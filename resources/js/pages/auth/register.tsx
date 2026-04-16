import { Form, Head } from '@inertiajs/react';
import { type FormComponentRef } from '@inertiajs/core';
import { type MouseEvent, useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

type Props = {
    recaptchaSiteKey?: string;
    recaptchaEnabled?: boolean;
};

export default function Register({ recaptchaSiteKey = '', recaptchaEnabled = false }: Props) {
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
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                ref={formRef}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
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
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                                onClick={handleSubmitClick}
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
