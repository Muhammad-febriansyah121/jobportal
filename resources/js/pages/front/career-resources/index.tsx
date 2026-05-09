import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ChevronRight,
    FileText,
    LayoutTemplate,
    Lightbulb,
    PlayCircle,
    Search,
    Tag,
    X,
} from 'lucide-react';
import { useState } from 'react';
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
    }
> = {
    article: {
        Icon: FileText,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
    },
    guide: {
        Icon: BookOpen,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    video: {
        Icon: PlayCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
    },
    template: {
        Icon: LayoutTemplate,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
    },
};

const CATEGORY_COLORS: Record<string, string> = {
    Resume: 'bg-primary/5 text-primary ring-primary/20',
    Interview: 'bg-sky-50 text-sky-700 ring-sky-200',
    'Career Growth': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'Job Search': 'bg-violet-50 text-violet-700 ring-violet-200',
    Networking: 'bg-rose-50 text-rose-700 ring-rose-200',
};

type Resource = {
    id: number;
    title: string;
    slug: string;
    type: string;
    category?: string | null;
    thumbnail_path?: string | null;
    published_at?: string | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type IndexProps = {
    resources: {
        data: Resource[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
        last_page: number;
    };
    featured: Resource[];
    filters: { type: string; category: string; search: string };
    types: string[];
    categories: string[];
};

function TypeBadge({ type }: { type: string }) {
    const { t } = useTranslate();
    const meta = TYPE_META[type] ?? {
        Icon: BookOpen,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    };
    const { Icon, color, bg } = meta;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                bg,
                color,
            )}
        >
            <Icon className="size-3" />
            {t(`career_resources.index.type_${type}`)}
        </span>
    );
}

function CategoryBadge({ category }: { category: string }) {
    const colorClass =
        CATEGORY_COLORS[category] ??
        'bg-muted text-muted-foreground ring-border';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1',
                colorClass,
            )}
        >
            <Tag className="size-2.5" />
            {category}
        </span>
    );
}

function FeaturedCard({ resource }: { resource: Resource }) {
    const meta = TYPE_META[resource.type] ?? {
        Icon: BookOpen,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    };

    return (
        <Link
            className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-2xl bg-foreground shadow-md transition hover:shadow-xl"
            href={show(resource.slug).url}
        >
            {resource.thumbnail_path ? (
                <img
                    alt={resource.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105"
                    src={resource.thumbnail_path}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70 opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="relative z-10 space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={resource.type} />
                    {resource.category && (
                        <CategoryBadge category={resource.category} />
                    )}
                </div>
                <h3 className="text-base leading-snug font-bold text-white transition group-hover:text-primary/80">
                    {resource.title}
                </h3>
                <p className="text-xs text-white/60">{resource.published_at}</p>
            </div>
            <div className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/20 opacity-0 transition group-hover:opacity-100">
                <meta.Icon className={cn('size-4', meta.color)} />
            </div>
        </Link>
    );
}

function ResourceCard({ resource }: { resource: Resource }) {
    const { t } = useTranslate();
    const meta = TYPE_META[resource.type] ?? {
        Icon: BookOpen,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    };
    const { Icon, color, bg } = meta;

    return (
        <Link
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-primary/30 hover:shadow-md"
            href={show(resource.slug).url}
        >
            <div className="relative h-40 overflow-hidden bg-muted">
                {resource.thumbnail_path ? (
                    <img
                        alt={resource.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        src={resource.thumbnail_path}
                    />
                ) : (
                    <div
                        className={cn(
                            'flex h-full items-center justify-center',
                            bg,
                        )}
                    >
                        <Icon className={cn('size-10 opacity-30', color)} />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <TypeBadge type={resource.type} />
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                {resource.category && (
                    <CategoryBadge category={resource.category} />
                )}
                <h3 className="line-clamp-2 flex-1 text-sm leading-snug font-semibold text-foreground transition group-hover:text-primary">
                    {resource.title}
                </h3>
                <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-muted-foreground">
                        {resource.published_at}
                    </p>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                        {t('career_resources.index.read_more')} <ChevronRight className="size-3" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

function Pagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}) {
    const { t } = useTranslate();
    const prevLink = links.find(
        (l) =>
            l.label.includes('Sebelumnya') ||
            l.label.includes('Previous') ||
            l.label.includes('pagination.previous'),
    );
    const nextLink = links.find(
        (l) =>
            l.label.includes('Berikutnya') ||
            l.label.includes('Next') ||
            l.label.includes('pagination.next'),
    );
    const pageLinks = links.filter((l) => l !== prevLink && l !== nextLink);

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from && to
                    ? t('career_resources.index.showing_range', { from, to, total })
                    : t('career_resources.index.showing_total', { total })}
            </p>
            <div className="flex items-center gap-1">
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!prevLink?.url}
                    onClick={() => prevLink?.url && router.get(prevLink.url)}
                >
                    ‹
                </button>
                {pageLinks.map((link) => (
                    <button
                        className={cn(
                            'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition',
                            link.active
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary',
                        )}
                        key={link.label}
                        onClick={() =>
                            !link.active && link.url && router.get(link.url)
                        }
                    >
                        {link.label}
                    </button>
                ))}
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!nextLink?.url}
                    onClick={() => nextLink?.url && router.get(nextLink.url)}
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default function CareerResourceIndex({
    resources,
    featured,
    filters,
    types,
    categories,
}: IndexProps) {
    const { t } = useTranslate();
    const [search, setSearch] = useState(filters.search);

    const hasActive = filters.type || filters.category || filters.search;

    function applyFilter(overrides: Partial<typeof filters>) {
        router.get(
            index.url(),
            { ...filters, ...overrides },
            { preserveScroll: true, replace: true },
        );
    }

    function toggleFilter(key: 'type' | 'category', value: string) {
        applyFilter({ [key]: filters[key] === value ? '' : value });
    }

    function clearAll() {
        setSearch('');
        router.get(index.url());
    }

    const isFiltered = !!(filters.type || filters.category || filters.search);

    return (
        <HomeLayout>
            <Head title={t('career_resources.index.page_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-4 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <Lightbulb className="size-3.5" />
                        {t('career_resources.index.hero_badge')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {t('career_resources.index.hero_title')}{' '}
                        <span className="text-primary">{t('career_resources.index.hero_title_highlight')}</span>
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        {t('career_resources.index.hero_subtitle')}
                    </p>

                    {/* Hero search */}
                    <form
                        className="mt-8 flex flex-col gap-3 sm:flex-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({ search });
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className="h-11 w-full rounded-xl border border-border bg-white pr-4 pl-10 text-sm text-foreground placeholder-muted-foreground shadow-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('career_resources.index.search_placeholder')}
                                type="text"
                                value={search}
                            />
                        </div>
                        <button
                            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-95"
                            type="submit"
                        >
                            {t('career_resources.index.search_button')}
                        </button>
                    </form>
                </div>
            </section>

            <section className="bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-6xl space-y-10">
                    {/* Featured — only show when no active filter */}
                    {!isFiltered && featured.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-foreground">
                                {t('career_resources.index.featured_title')}
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {featured.map((r) => (
                                    <FeaturedCard key={r.id} resource={r} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter bar */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {types.map((type) => {
                                const meta = TYPE_META[type] ?? {
                                    Icon: BookOpen,
                                    color: 'text-muted-foreground',
                                    bg: 'bg-muted',
                                };
                                const active = filters.type === type;

                                return (
                                    <button
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                            active
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary',
                                        )}
                                        key={type}
                                        onClick={() =>
                                            toggleFilter('type', type)
                                        }
                                        type="button"
                                    >
                                        <meta.Icon className="size-3.5" />
                                        {t(`career_resources.index.type_${type}`)}
                                    </button>
                                );
                            })}

                            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

                            {categories.map((cat) => {
                                const active = filters.category === cat;

                                return (
                                    <button
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                            active
                                                ? 'border-foreground bg-foreground text-white'
                                                : 'border-border bg-white text-muted-foreground hover:border-border hover:text-foreground',
                                        )}
                                        key={cat}
                                        onClick={() =>
                                            toggleFilter('category', cat)
                                        }
                                        type="button"
                                    >
                                        {cat}
                                    </button>
                                );
                            })}

                            {hasActive && (
                                <button
                                    className="flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                    onClick={clearAll}
                                    type="button"
                                >
                                    <X className="size-3" /> {t('career_resources.index.empty_reset')}
                                </button>
                            )}

                            <span className="ml-auto text-sm text-muted-foreground">
                                {t('career_resources.index.content_count', { count: resources.total })}
                            </span>
                        </div>
                    </div>

                    {/* Cards */}
                    {resources.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20 text-center">
                            <BookOpen className="size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-base font-semibold text-foreground">
                                {t('career_resources.index.empty_title')}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('career_resources.index.empty_subtitle')}
                            </p>
                            <button
                                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                                onClick={clearAll}
                            >
                                {t('career_resources.index.empty_reset')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {resources.data.map((r) => (
                                <ResourceCard key={r.id} resource={r} />
                            ))}
                        </div>
                    )}

                    {resources.last_page > 1 && (
                        <Pagination
                            from={resources.from}
                            links={resources.links}
                            to={resources.to}
                            total={resources.total}
                        />
                    )}
                </div>
            </section>
        </HomeLayout>
    );
}
