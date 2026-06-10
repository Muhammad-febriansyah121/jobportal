import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ChevronRight,
    Clock,
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

const FALLBACK_META = {
    Icon: BookOpen,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
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
    excerpt?: string | null;
    reading_time?: number | null;
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

function TypeBadge({ type, solid = false }: { type: string; solid?: boolean }) {
    const { t } = useTranslate();
    const { Icon, color, bg } = TYPE_META[type] ?? FALLBACK_META;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                solid ? 'bg-white/90 text-foreground backdrop-blur' : cn(bg, color),
            )}
        >
            <Icon className={cn('size-3', solid && color)} />
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

function ReadingTime({ minutes }: { minutes?: number | null }) {
    const { t } = useTranslate();

    if (!minutes) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {t('career_resources.index.reading_time', { count: minutes })}
        </span>
    );
}

/** Large editorial lead card used as the first featured item. */
function FeaturedLead({ resource }: { resource: Resource }) {
    const { t } = useTranslate();

    return (
        <Link
            className="group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-2xl bg-foreground shadow-md transition hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:row-span-2 lg:min-h-full"
            href={show(resource.slug).url}
        >
            {resource.thumbnail_path ? (
                <img
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    src={resource.thumbnail_path}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 space-y-3 p-6">
                <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={resource.type} solid />
                    {resource.category && (
                        <CategoryBadge category={resource.category} />
                    )}
                </div>
                <h3 className="text-xl leading-snug font-bold text-white lg:text-2xl">
                    {resource.title}
                </h3>
                {resource.excerpt && (
                    <p className="line-clamp-2 max-w-xl text-sm text-white/70">
                        {resource.excerpt}
                    </p>
                )}
                <div className="flex items-center gap-3 pt-1 text-white/60">
                    <span className="text-xs">{resource.published_at}</span>
                    {resource.reading_time && (
                        <span className="inline-flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            {t('career_resources.index.reading_time', {
                                count: resource.reading_time,
                            })}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

/** Compact horizontal featured card (secondary featured items). */
function FeaturedRow({ resource }: { resource: Resource }) {
    const { Icon, color, bg } = TYPE_META[resource.type] ?? FALLBACK_META;

    return (
        <Link
            className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            href={show(resource.slug).url}
        >
            <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {resource.thumbnail_path ? (
                    <img
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        src={resource.thumbnail_path}
                    />
                ) : (
                    <div className={cn('flex h-full items-center justify-center', bg)}>
                        <Icon className={cn('size-8 opacity-30', color)} />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 py-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={resource.type} />
                    {resource.category && (
                        <CategoryBadge category={resource.category} />
                    )}
                </div>
                <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground transition group-hover:text-primary">
                    {resource.title}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                        {resource.published_at}
                    </span>
                    <ReadingTime minutes={resource.reading_time} />
                </div>
            </div>
        </Link>
    );
}

function ResourceCard({ resource }: { resource: Resource }) {
    const { t } = useTranslate();
    const { Icon, color, bg } = TYPE_META[resource.type] ?? FALLBACK_META;

    return (
        <Link
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            href={show(resource.slug).url}
        >
            <div className="relative aspect-video overflow-hidden bg-muted">
                {resource.thumbnail_path ? (
                    <img
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        src={resource.thumbnail_path}
                    />
                ) : (
                    <div className={cn('flex h-full items-center justify-center', bg)}>
                        <Icon className={cn('size-10 opacity-30', color)} />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <TypeBadge type={resource.type} solid />
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                {resource.category && (
                    <CategoryBadge category={resource.category} />
                )}
                <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground transition group-hover:text-primary">
                    {resource.title}
                </h3>
                {resource.excerpt && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {resource.excerpt}
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-muted-foreground">
                            {resource.published_at}
                        </span>
                        <ReadingTime minutes={resource.reading_time} />
                    </div>
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-primary transition group-hover:gap-1.5">
                        {t('career_resources.index.read_more')}
                        <ChevronRight className="size-3" />
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
    // First/last entries from Laravel's paginator are always prev/next.
    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from && to
                    ? t('career_resources.index.showing_range', { from, to, total })
                    : t('career_resources.index.showing_total', { total })}
            </p>
            <div className="flex items-center gap-1">
                <button
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!prevLink?.url}
                    onClick={() => prevLink?.url && router.get(prevLink.url)}
                >
                    ‹
                </button>
                {pageLinks.map((link) => (
                    <button
                        className={cn(
                            'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition',
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
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
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

    const isFiltered = !!(filters.type || filters.category || filters.search);
    const [lead, ...restFeatured] = featured;

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

    return (
        <HomeLayout>
            <Head title={t('career_resources.index.page_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-6 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <Lightbulb className="size-3.5" />
                        {t('career_resources.index.hero_badge')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                        {t('career_resources.index.hero_title')}{' '}
                        <span className="text-primary">
                            {t('career_resources.index.hero_title_highlight')}
                        </span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-muted-foreground">
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
                                className="h-12 w-full rounded-xl border border-border bg-white pr-10 pl-10 text-sm text-foreground placeholder-muted-foreground shadow-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('career_resources.index.search_placeholder')}
                                type="text"
                                value={search}
                            />
                            {search && (
                                <button
                                    aria-label={t('career_resources.index.empty_reset')}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter({ search: '' });
                                    }}
                                    type="button"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <button
                            className="h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-95"
                            type="submit"
                        >
                            {t('career_resources.index.search_button')}
                        </button>
                    </form>
                </div>
            </section>

            <section className="bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-6xl space-y-10">
                    {/* Featured — bento (lead + secondary), only when no active filter */}
                    {!isFiltered && lead && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-foreground">
                                {t('career_resources.index.featured_title')}
                            </h2>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <FeaturedLead resource={lead} />
                                <div className="flex flex-col gap-4">
                                    {restFeatured.map((r) => (
                                        <FeaturedRow key={r.id} resource={r} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sticky filter bar */}
                    <div className="sticky top-16 z-20 -mx-4 space-y-3 border-y border-border/60 bg-gray-50/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            <span className="mr-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                                {t('career_resources.index.filter_type_label')}
                            </span>
                            {types.map((type) => {
                                const { Icon } = TYPE_META[type] ?? FALLBACK_META;
                                const active = filters.type === type;

                                return (
                                    <button
                                        aria-pressed={active}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                            active
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary',
                                        )}
                                        key={type}
                                        onClick={() => toggleFilter('type', type)}
                                        type="button"
                                    >
                                        <Icon className="size-3.5" />
                                        {t(`career_resources.index.type_${type}`)}
                                    </button>
                                );
                            })}

                            <span className="ml-auto text-sm font-medium text-muted-foreground">
                                {t('career_resources.index.content_count', {
                                    count: resources.total,
                                })}
                            </span>
                        </div>

                        {categories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border/60 pt-3">
                                <span className="mr-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                                    {t('career_resources.index.filter_category_label')}
                                </span>
                                {categories.map((cat) => {
                                    const active = filters.category === cat;

                                    return (
                                        <button
                                            aria-pressed={active}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                                active
                                                    ? 'border-foreground bg-foreground text-white'
                                                    : 'border-border bg-white text-muted-foreground hover:border-foreground/30 hover:text-foreground',
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

                                {isFiltered && (
                                    <button
                                        className="flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                        onClick={clearAll}
                                        type="button"
                                    >
                                        <X className="size-3" />{' '}
                                        {t('career_resources.index.empty_reset')}
                                    </button>
                                )}
                            </div>
                        )}
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
