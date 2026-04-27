import { Head, useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { edit } from '@/routes/security';
import { update as updatePassword } from '@/routes/user-password';

export default function Security() {
    const { t } = useTranslate();
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'put',
        }));
        form.post(updatePassword().url, {
            preserveScroll: true,
            onSuccess: () =>
                form.reset(
                    'current_password',
                    'password',
                    'password_confirmation',
                ),
        });
    };

    return (
        <>
            <Head title={t('settings.security.head_title')} />

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title={t('settings.security.title')}
                    description={t('settings.security.description')}
                />

                <form onSubmit={submit} className="space-y-6">
                    <section className="grid gap-5 rounded-xl border bg-card p-4 md:p-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">
                                {t('settings.security.current_password_label')}
                            </Label>
                            <PasswordInput
                                id="current_password"
                                name="current_password"
                                value={form.data.current_password}
                                onChange={(event) =>
                                    form.setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                                autoComplete="current-password"
                                placeholder={t('settings.security.current_password_placeholder')}
                            />
                            <InputError
                                message={form.errors.current_password}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('settings.security.new_password_label')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                autoComplete="new-password"
                                placeholder={t('settings.security.new_password_placeholder')}
                            />
                            <InputError message={form.errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('settings.security.confirm_password_label')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                placeholder={t('settings.security.confirm_password_placeholder')}
                            />
                            <InputError
                                message={form.errors.password_confirmation}
                            />
                        </div>
                    </section>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={form.processing}>
                            <KeyRound className="size-4" />
                            {form.processing
                                ? t('settings.security.saving')
                                : t('settings.security.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Ganti Password',
            href: edit(),
        },
    ],
};
