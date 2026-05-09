// Components
import { Form, Head, setLayoutProps } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslate } from '@/hooks/use-translate';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslate();

    setLayoutProps({
        title: t('auth.verify_email.layout_title'),
        description: t('auth.verify_email.layout_description'),
    });

    return (
        <>
            <Head title={t('auth.verify_email.head_title')} />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {t('auth.verify_email.link_sent_notice')}
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            {t('auth.verify_email.resend_button')}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            {t('auth.verify_email.logout')}
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

