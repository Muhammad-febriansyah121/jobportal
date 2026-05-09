import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, FileText, LayoutTemplate, PlayCircle, Tag } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/candidate/career-resources';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    article: FileText,
    video: PlayCircle,
    template: LayoutTemplate,
    guide: BookOpen,
};

type Related = {
    id: number;
    title: string;
    slug: string;
    type: string;
    category?: string | null;
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

export default function CandidateCareerResourceShow({ resource, related }: ShowProps) {
    const { t } = useTranslate();
    const typeLabels: Record<string, string> = {
        article: t('candidate.career_resources.type_article'),
        video: t('candidate.career_resources.type_video'),
        template: t('candidate.career_resources.type_template'),
        guide: t('candidate.career_resources.type_guide'),
    };
    const Icon = TYPE_ICONS[resource.type] ?? BookOpen;

    return (
        <>
            <Head title={resource.title} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    {/* Main content */}
                    <div className="space-y-5">
                        {/* Hero */}
                        <div
                            className={cn(
                                'flex h-48 items-end rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 p-6',
                                resource.thumbnail_path && 'bg-cover bg-center',
                            )}
                            style={
                                resource.thumbnail_path
                                    ? { backgroundImage: `url(${resource.thumbnail_path})` }
                                    : undefined
                            }
                        >
                            <Badge className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                                <Icon className="size-3.5" />
                                {typeLabels[resource.type] ?? resource.type}
                            </Badge>
                        </div>

                        {/* Meta */}
                        <div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {resource.category && (
                                    <span className="flex items-center gap-1">
                                        <Tag className="size-3.5" />
                                        {resource.category}
                                    </span>
                                )}
                                {resource.published_at && (
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3.5" />
                                        {resource.published_at}
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-2 text-2xl font-bold leading-snug">{resource.title}</h1>
                        </div>

                        {/* Content */}
                        <Card>
                            <CardContent className="pt-6">
                                {resource.content &&
                                /<[a-z][^>]*>/i.test(resource.content) ? (
                                    <div
                                        className="prose prose-sm max-w-none leading-7 text-muted-foreground [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-4 [&_h2]:mb-2 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                                        dangerouslySetInnerHTML={{
                                            __html: resource.content,
                                        }}
                                    />
                                ) : (
                                    <div className="prose prose-sm max-w-none text-foreground">
                                        <p className="whitespace-pre-line leading-7 text-muted-foreground">
                                            {resource.content ?? ''}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {related.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">{t('candidate.career_resources.related_content')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    {related.map((item) => {
                                        const RelatedIcon = TYPE_ICONS[item.type] ?? BookOpen;

                                        return (
                                            <Link
                                                key={item.id}
                                                href={show(item.slug)}
                                                className="-mx-2 flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60"
                                            >
                                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                                    <RelatedIcon className="size-4" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium leading-snug">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.category ?? typeLabels[item.type] ?? item.type}
                                                        {item.published_at ? ` · ${item.published_at}` : ''}
                                                    </span>
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardContent className="pt-4">
                                <Link
                                    href={index.url()}
                                    className="text-sm font-medium text-primary-600 hover:underline"
                                >
                                    {t('candidate.career_resources.back_to_list')}
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateCareerResourceShow.layout = ({ resource }: ShowProps) => ({
    breadcrumbs: [
        { title: 'Tips Karir & Artikel', href: '/candidate/career-resources' },
        { title: resource.title, href: show(resource.slug) },
    ],
});
