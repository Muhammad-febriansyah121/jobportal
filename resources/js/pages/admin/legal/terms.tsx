import { Head, useForm } from '@inertiajs/react';
import { FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import InputError from '@/components/input-error';
import { RichEditor } from '@/components/rich-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { update as termsUpdate } from '@/routes/admin/legal/terms';
import { edit as adminSettings } from '@/routes/admin/settings';

type TermsProps = {
    terms_title: string;
    terms_content: string;
};

export default function AdminLegalTerms({ terms_title, terms_content }: TermsProps) {
    const { t } = useTranslate();
    const form = useForm({
        terms_title,
        terms_content,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        form.post(termsUpdate().url, {
            preserveScroll: true,
            onError: () => toast.error(t('admin.legal_terms.error_toast')),
        });
    }

    return (
        <>
            <Head title={t('admin.legal_terms.page_title')} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={t('admin.legal_terms.page_title')}
                    description={t('admin.legal_terms.description')}
                    backHref={adminSettings().url}
                />

                <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_280px]">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Title */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <FileText className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">{t('admin.legal_terms.section_info')}</h2>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="terms_title">{t('admin.legal_terms.label_title')}</Label>
                                <Input
                                    id="terms_title"
                                    value={form.data.terms_title}
                                    onChange={(e) => form.setData('terms_title', e.target.value)}
                                    placeholder={t('admin.legal_terms.placeholder_title')}
                                />
                                <InputError message={form.errors.terms_title} />
                            </div>
                        </section>

                        {/* Content */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <FileText className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">{t('admin.legal_terms.section_content')}</h2>
                            </div>
                            <RichEditor
                                value={form.data.terms_content}
                                onChange={(val) => form.setData('terms_content', val)}
                                error={form.errors.terms_content}
                                placeholder={t('admin.legal_terms.placeholder_content')}
                                minHeight="520px"
                            />
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-4">
                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('admin.legal_terms.section_publish')}</h3>

                            <div className="mb-4 rounded-lg bg-secondary-50 p-3 text-xs text-secondary-700">
                                {t('admin.legal_terms.publish_hint', { page: '/terms' })}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.processing}
                            >
                                <Save className="size-4" />
                                {form.processing ? t('admin.legal_terms.saving') : t('admin.legal_terms.save')}
                            </Button>
                        </section>

                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('admin.legal_terms.tips_title')}</h3>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_terms.tip_1')}
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_terms.tip_2')}
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    {t('admin.legal_terms.tip_3')}
                                </li>
                            </ul>
                        </section>
                    </aside>
                </form>
            </div>
        </>
    );
}
