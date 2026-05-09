import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import HomeLayout from '@/layouts/front/home-layout';

type TermsProps = {
    terms_title: string;
    terms_content: string;
};

export default function TermsPage({ terms_title, terms_content }: TermsProps) {
    const { t } = useTranslate();
    const title = terms_title || t('front.terms.default_title');

    return (
        <HomeLayout>
            <Head title={title} />

            {/* Page Header */}
            <div className="relative overflow-hidden bg-white">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
                <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-primary-50 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
                    >
                        <ArrowLeft className="size-4" />
                        {t('front.terms.back_home')}
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <ScrollText className="size-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t('front.terms.kicker')}</p>
                            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <section className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    {terms_content ? (
                        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-10">
                            <div
                                className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:mt-8 prose-h2:text-xl prose-h3:text-base prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: terms_content }}
                            />
                        </article>
                    ) : (
                        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                            <ScrollText className="mx-auto size-12 text-neutral-300" />
                            <p className="mt-3 text-sm text-muted-foreground">{t('front.terms.empty_state')}</p>
                        </div>
                    )}
                </div>
            </section>
        </HomeLayout>
    );
}
