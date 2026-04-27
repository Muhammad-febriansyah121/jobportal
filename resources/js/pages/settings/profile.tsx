import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, UploadCloud, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { edit, update } from '@/routes/profile';
import { send } from '@/routes/verification';

type ProfilePageProps = {
    mustVerifyEmail: boolean;
    status?: string;
    profile: {
        name: string;
        email: string;
        phone?: string | null;
        address?: string | null;
        avatar_url?: string | null;
    };
};

export default function Profile({
    mustVerifyEmail,
    status,
    profile,
}: ProfilePageProps) {
    const { auth } = usePage().props;
    const { t } = useTranslate();
    const getInitials = useInitials();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<{
        name: string;
        email: string;
        phone: string;
        address: string;
        avatar: File | null;
        remove_avatar: boolean;
    }>({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        avatar: null,
        remove_avatar: false,
    });

    useEffect(() => {
        return () => {
            if (previewUrl !== null) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const avatarUrl =
        previewUrl ?? profile.avatar_url ?? auth.user.avatar ?? undefined;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'patch',
        }));
        form.post(update().url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.setData('avatar', null);
                setPreviewUrl(null);
            },
        });
    };

    const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('avatar', file);
        form.setData('remove_avatar', false);

        if (previewUrl !== null) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        if (file !== null) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeAvatar = () => {
        form.setData('avatar', null);
        form.setData('remove_avatar', true);

        if (previewUrl !== null) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    return (
        <>
            <Head title={t('settings.profile.head_title')} />

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title={t('settings.profile.title')}
                    description={t('settings.profile.description')}
                />

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-xl border bg-card p-4 md:p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                    {t('settings.profile.photo_title')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('settings.profile.photo_help')}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar className="size-20 rounded-xl border">
                                    <AvatarImage
                                        src={avatarUrl}
                                        alt={form.data.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-xl bg-primary-100 text-xl font-semibold text-primary-700">
                                        {getInitials(form.data.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-wrap gap-2">
                                    <Label
                                        htmlFor="avatar"
                                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                                    >
                                        <UploadCloud className="size-4" />
                                        {t('settings.profile.choose_photo')}
                                    </Label>
                                    <Input
                                        id="avatar"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={onAvatarChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={removeAvatar}
                                    >
                                        <X className="size-4" />
                                        {t('settings.profile.remove_photo')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <InputError
                            className="mt-3"
                            message={form.errors.avatar}
                        />
                    </section>

                    <section className="grid gap-5 rounded-xl border bg-card p-4 md:grid-cols-2 md:p-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('settings.profile.name_label')}</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                autoComplete="name"
                                required
                                placeholder={t('settings.profile.name_placeholder')}
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">{t('settings.profile.phone_label')}</Label>
                            <Input
                                id="phone"
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                                autoComplete="tel"
                                placeholder="08xxxxxxxxxx"
                            />
                            <InputError message={form.errors.phone} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="email">{t('settings.profile.email_label')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                autoComplete="email"
                                required
                                placeholder={t('settings.profile.email_placeholder')}
                            />
                            <InputError message={form.errors.email} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="address">{t('settings.profile.address_label')}</Label>
                            <Input
                                id="address"
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                autoComplete="street-address"
                                placeholder={t('settings.profile.address_placeholder')}
                            />
                            <InputError message={form.errors.address} />
                        </div>
                    </section>

                    {mustVerifyEmail && auth.user.email_verified_at === null ? (
                        <section className="rounded-xl border border-secondary-300 bg-secondary-50 p-4 text-sm">
                            <p className="font-medium text-secondary-900">
                                {t('settings.profile.email_unverified')}
                            </p>
                            <p className="mt-1 text-secondary-800">
                                <Link
                                    href={send()}
                                    as="button"
                                    className="font-semibold underline underline-offset-4"
                                >
                                    {t('settings.profile.resend_verification')}
                                </Link>
                            </p>
                            {status === 'verification-link-sent' ? (
                                <p className="mt-2 text-emerald-700">
                                    {t('settings.profile.verification_sent')}
                                </p>
                            ) : null}
                        </section>
                    ) : null}

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={form.processing}>
                            <Camera className="size-4" />
                            {form.processing ? t('settings.profile.saving') : t('settings.profile.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Ubah Profil',
            href: edit(),
        },
    ],
};
