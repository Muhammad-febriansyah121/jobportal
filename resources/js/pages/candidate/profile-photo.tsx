import { Form, Head } from '@inertiajs/react';
import { Camera, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import {
    edit as editPhoto,
    update as updatePhoto,
} from '@/routes/candidate/profile/photo';

type ProfilePhotoProps = {
    profile: {
        full_name: string;
        avatar_url?: string | null;
        profile_completion: number;
    };
};

export default function CandidateProfilePhoto({ profile }: ProfilePhotoProps) {
    const { t } = useTranslate();
    const getInitials = useInitials();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [removeRequested, setRemoveRequested] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl !== null) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setRemoveRequested(false);

        if (previewUrl !== null) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        if (file !== null) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const onRequestRemove = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (previewUrl !== null) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        setRemoveRequested(true);
    };

    const displayedAvatar =
        previewUrl ??
        (removeRequested ? undefined : (profile.avatar_url ?? undefined));

    return (
        <>
            <Head title={t('candidate.profile_photo.head_title')} />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('candidate.profile_photo.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('candidate.profile_photo.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...updatePhoto.form()}
                            onSuccess={() => {
                                if (previewUrl !== null) {
                                    URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                }
                                setRemoveRequested(false);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                                        <Avatar className="size-28 rounded-2xl border">
                                            <AvatarImage
                                                src={displayedAvatar}
                                                alt={profile.full_name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="rounded-2xl bg-primary-100 text-2xl font-semibold text-primary-700">
                                                {getInitials(profile.full_name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    'candidate.profile_photo.help',
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Label
                                                    htmlFor="avatar"
                                                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                                                >
                                                    <UploadCloud className="size-4" />
                                                    {t(
                                                        'candidate.profile_photo.btn_choose',
                                                    )}
                                                </Label>
                                                <Input
                                                    ref={fileInputRef}
                                                    id="avatar"
                                                    name="avatar"
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                    onChange={onFileChange}
                                                />
                                                {(profile.avatar_url ||
                                                    previewUrl) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={onRequestRemove}
                                                    >
                                                        <X className="size-4" />
                                                        {t(
                                                            'candidate.profile_photo.btn_remove',
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                            {errors.avatar && (
                                                <p className="text-sm text-destructive">
                                                    {errors.avatar}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <input
                                        type="hidden"
                                        name="remove_avatar"
                                        value={removeRequested ? '1' : '0'}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                    >
                                        <Camera className="size-4" />
                                        {processing
                                            ? t(
                                                  'candidate.profile_photo.saving',
                                              )
                                            : t(
                                                  'candidate.profile_photo.save',
                                              )}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CandidateProfilePhoto.layout = {
    breadcrumbs: [
        {
            title: 'Foto Profil',
            href: editPhoto(),
        },
    ],
};
