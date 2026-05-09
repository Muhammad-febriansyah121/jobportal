import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, FileText, PlayCircle, LayoutTemplate } from 'lucide-react';
import { PaginationLinks } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import { useTranslate } from '@/hooks/use-translate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/candidate/career-resources';

const TYPE_ICONS: Record<
    string,
    React.ComponentType<{ className?: string }>
> = {
    article: FileText,
    video: PlayCircle,
    template: LayoutTemplate,
    guide: BookOpen,
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

type IndexProps = {
    resources: {
        data: Resource[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        type: string;
        category: string;
    };
    types: string[];
    categories: string[];
};

export default function CandidateCareerResourceIndex({
    resources,
    filters,
    types,
    categories,
}: IndexProps) {
    const { t } = useTranslate();

    const typeLabels: Record<string, string> = {
        article: t('candidate.career_resources.type_article'),
        video: t('candidate.career_resources.type_video'),
        template: t('candidate.career_resources.type_template'),
        guide: t('candidate.career_resources.type_guide'),
    };

    function filter(key: string, value: string) {
        router.get(
            index.url(),
            {
                ...filters,
                [key]:
                    filters[key as keyof typeof filters] === value ? '' : value,
            },
            { preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title={t('candidate.career_resources.title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.career_resources.title')}
                    description={t('candidate.career_resources.description')}
                />

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {types.map((type) => (
                        <Button
                            key={type}
                            size="sm"
                            variant={
                                filters.type === type ? 'default' : 'outline'
                            }
                            onClick={() => filter('type', type)}
                        >
                            {typeLabels[type] ?? type}
                        </Button>
                    ))}
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            size="sm"
                            variant={
                                filters.category === cat
                                    ? 'secondary'
                                    : 'outline'
                            }
                            onClick={() => filter('category', cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* Grid */}
                {resources.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('candidate.career_resources.empty')}
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {resources.data.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                            />
                        ))}
                    </div>
                )}

                <PaginationLinks links={resources.links} />
            </div>
        </>
    );
}

function ResourceCard({ resource }: { resource: Resource }) {
    const { t } = useTranslate();
    const typeLabels: Record<string, string> = {
        article: t('candidate.career_resources.type_article'),
        video: t('candidate.career_resources.type_video'),
        template: t('candidate.career_resources.type_template'),
        guide: t('candidate.career_resources.type_guide'),
    };
    const Icon = TYPE_ICONS[resource.type] ?? BookOpen;

    return (
        <Link href={show(resource.slug)} className="group block">
            <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
                <div
                    className={cn(
                        'flex h-36 items-end bg-gradient-to-br from-primary-400 to-primary-600 p-4',
                        resource.thumbnail_path && 'bg-cover bg-center',
                    )}
                    style={
                        resource.thumbnail_path
                            ? {
                                  backgroundImage: `url(${resource.thumbnail_path})`,
                              }
                            : undefined
                    }
                >
                    <Badge className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                        <Icon className="size-3" />
                        {typeLabels[resource.type] ?? resource.type}
                    </Badge>
                </div>
                <CardContent className="p-4">
                    {resource.category && (
                        <p className="mb-1 text-xs font-medium text-primary-600">
                            {resource.category}
                        </p>
                    )}
                    <p className="leading-snug font-semibold group-hover:text-primary-600">
                        {resource.title}
                    </p>
                    {resource.published_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {resource.published_at}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

CandidateCareerResourceIndex.layout = {
    breadcrumbs: [
        { title: 'Tips Karir & Artikel', href: '/candidate/career-resources' },
    ],
};
