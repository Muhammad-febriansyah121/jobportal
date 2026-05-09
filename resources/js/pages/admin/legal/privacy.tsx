import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import InputError from '@/components/input-error';
import { RichEditor } from '@/components/rich-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { update as privacyUpdate } from '@/routes/admin/legal/privacy';
import { edit as adminSettings } from '@/routes/admin/settings';

type PrivacyProps = {
    privacy_title: string;
    privacy_content: string;
};

export default function AdminLegalPrivacy({ privacy_title, privacy_content }: PrivacyProps) {
    const { t } = useTranslate();
    const form = useForm({
        privacy_title,
        privacy_content,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        form.post(privacyUpdate().url, {
            preserveScroll: true,
            onError: () => toast.error(t('admin.legal_privacy.error_toast')),
        });
    }

    return (
        <>
            <Head title={t('admin.legal_privacy.page_title')} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={t('admin.legal_privacy.page_title')}
                    description={t('admin.legal_privacy.description')}
                    backHref={adminSettings().url}
                />

                <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_280px]">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Title */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <ShieldCheck className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">{t('admin.legal_privacy.section_info')}</h2>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="privacy_title">{t('admin.legal_privacy.label_title')}</Label>
                                <Input
                                    id="privacy_title"
                                    value={form.data.privacy_title}
                                    onChange={(e) => form.setData('privacy_title', e.target.value)}
                                    placeholder={t('admin.legal_privacy.placeholder_title')}
                                />
                                <InputError message={form.errors.privacy_title} />
                            </div>
                        </section>

                        {/* Content */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <ShieldCheck className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">{t('admin.legal_privacy.section_content')}</h2>
                            </div>
                            <RichEditor
                                value={form.data.privacy_content}
                                onChange={(val) => form.setData('privacy_content', val)}
                                error={form.errors.privacy_content}
                                placeholder={t('admin.legal_privacy.placeholder_content')}
                                minHeight="520px"
                            />
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-4">
                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('admin.legal_privacy.section_publish')}</h3>

                            <div className="mb-4 rounded-lg bg-secondary-50 p-3 text-xs text-secondary-700">
                                {t('admin.legal_privacy.publish_hint', { page: '/privacy' })}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.processing}
                            >
                                <Save className="size-4" />
                                {form.processing ? t('admin.legal_privacy.saving') : t('admin.legal_privacy.save')}
                            </Button>
                        </section>

                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('admin.legal_privacy.tips_title')}</h3>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_privacy.tip_1')}
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_privacy.tip_2')}
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_privacy.tip_3')}
                                </li>
                            </ul>
                        </section>
                    </aside>
                </form>
            </div>
        </>
    );
}
