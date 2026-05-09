import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    FileText,
    LayoutTemplate,
    PlayCircle,
    Tag,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import HomeLayout from '@/layouts/front/home-layout';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/career-resources';

const TYPE_META: Record<
    string,
    {
        Icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
        accent: string;
    }
> = {
    article: {
        Icon: FileText,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        accent: 'from-sky-500 to-sky-700',
    },
    guide: {
        Icon: BookOpen,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        accent: 'from-emerald-500 to-emerald-700',
    },
    video: {
        Icon: PlayCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        accent: 'from-rose-500 to-rose-700',
    },
    template: {
        Icon: LayoutTemplate,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        accent: 'from-violet-500 to-violet-700',
    },
};

type Related = {
    id: number;
    title: string;
    slug: string;
    type: string;
    category?: string | null;
    thumbnail_path?: string | null;
    published_at?: string | null;
};

type ShowProps = {
    resource: {
        id: number;
        title: string;
        slug: string;
        type: string;
        category?: string | null;
        thumbnail_path?: string | null;
        content?: string | null;
        published_at?: string | null;
    };
    related: Related[];
};

function RelatedCard({ resource }: { resource: Related }) {
    const meta = TYPE_META[resource.type] ?? {
        Icon: BookOpen,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
        accent: 'from-slate-400 to-slate-600',
    };
    const { Icon, bg, color } = meta;

    return (
        <Link
            className="group flex gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            href={show(resource.slug).url}
        >
            <div
                className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-lg',
                    bg,
                )}
            >
                {resource.thumbnail_path ? (
                    <img
                        alt=""
                        className="size-12 rounded-lg object-cover"
                        src={resource.thumbnail_path}
                    />
                ) : (
                    <Icon className={cn('size-5', color)} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm leading-snug font-semibold text-foreground transition group-hover:text-primary">
                    {resource.title}
                </p>
                {resource.category && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Tag className="size-2.5" />
                        {resource.category}
                    </span>
                )}
            </div>
        </Link>
    );
}

export default function CareerResourceShow({ resource, related }: ShowProps) {
    const { t } = useTranslate();
    const meta = TYPE_META[resource.type] ?? {
        Icon: BookOpen,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
        accent: 'from-slate-500 to-slate-700',
    };
    const { Icon, bg, color } = meta;
    const label = t(`career_resources.index.type_${resource.type}`);

    return (
        <HomeLayout>
            <Head title={resource.title} />

            {/* Hero banner */}
            <div className="relative overflow-hidden bg-white pt-16 pb-0">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-10">
                    <Link
                        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
                        href={index.url()}
                    >
                        <ArrowLeft className="size-4" /> {t('career_resources.show.back')}
                    </Link>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                                bg,
                                color,
                            )}
                        >
                            <Icon className="size-3.5" />
                            {label}
                        </span>
                        {resource.category && (
                            <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                                {resource.category}
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl leading-tight font-extrabold text-foreground md:text-4xl">
                        {resource.title}
                    </h1>

                    {resource.published_at && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="size-4" />
                            {resource.published_at}
                        </p>
                    )}

                    {resource.thumbnail_path && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-border shadow-sm">
                            <img
                                alt={resource.title}
                                className="h-64 w-full object-cover md:h-80"
                                src={resource.thumbnail_path}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <section className="bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-4xl">
                    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                        {/* Main article */}
                        <article className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
                            {resource.content ? (
                                <div
                                    className="prose prose-slate prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-li:text-muted-foreground max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: resource.content,
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <Icon className="size-12 opacity-30" />
                                    <p className="mt-3 text-sm">
                                        {t('career_resources.show.content_empty')}
                                    </p>
                                </div>
                            )}
                        </article>

                        {/* Sidebar */}
                        <aside className="space-y-6">
                            {/* Meta card */}
                            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                                <h3 className="mb-3 text-sm font-bold text-foreground">
                                    {t('career_resources.show.meta_title')}
                                </h3>
                                <dl className="space-y-2.5 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">{t('career_resources.show.meta_type')}</dt>
                                        <dd className="font-medium text-foreground">
                                            {label}
                                        </dd>
                                    </div>
                                    {resource.category && (
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                {t('career_resources.show.meta_category')}
                                            </dt>
                                            <dd className="font-medium text-foreground">
                                                {resource.category}
                                            </dd>
                                        </div>
                                    )}
                                    {resource.published_at && (
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                {t('career_resources.show.meta_published')}
                                            </dt>
                                            <dd className="font-medium text-foreground">
                                                {resource.published_at}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Related */}
                            {related.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-foreground">
                                        {t('career_resources.show.related_title')}
                                    </h3>
                                    {related.map((r) => (
                                        <RelatedCard key={r.id} resource={r} />
                                    ))}
                                </div>
                            )}

                            {/* CTA */}
                            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-white shadow-sm">
                                <h3 className="text-sm font-bold">
                                    {t('career_resources.show.cta_title')}
                                </h3>
                                <p className="mt-1 text-xs text-white/70">
                                    {t('career_resources.show.cta_subtitle')}
                                </p>
                                <Link
                                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:bg-white/90"
                                    href="/jobs"
                                >
                                    {t('career_resources.show.cta_find_jobs')}
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}
