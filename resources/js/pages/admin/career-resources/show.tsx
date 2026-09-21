import { Head } from '@inertiajs/react';
import { CalendarDays, Tag } from 'lucide-react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';
import type { AdminAction } from '@/types';

type CareerResourceDetail = {
    id: number;
    title: string;
    slug: string;
    type: string;
    type_label: string;
    category: string | null;
    thumbnail_url: string | null;
    content: string;
    status: string;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type CareerResourceShowProps = {
    title: string;
    description?: string;
    backHref: string;
    resource: CareerResourceDetail;
    actions?: AdminAction[];
};

export default function CareerResourceShow({
    title,
    description,
    backHref,
    resource,
    actions = [],
}: CareerResourceShowProps) {
    const { t } = useTranslate();
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#0F4C94] text-white">
                            {resource.type_label}
                        </Badge>
                        <Badge variant="outline">
                            {resource.status}
                        </Badge>
                        {resource.category ? (
                            <Badge variant="outline">
                                <Tag className="mr-1 size-3" />
                                {resource.category}
                            </Badge>
                        ) : null}
                    </div>
                    <AdminActionList actions={actions} />
                </div>

                <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    {resource.thumbnail_url ? (
                        <img
                            src={resource.thumbnail_url}
                            alt={resource.title}
                            className="aspect-[16/6] w-full object-cover"
                        />
                    ) : (
                        <div className="flex aspect-[16/6] w-full items-center justify-center bg-[#eff4ff] text-sm font-bold text-[#0F4C94]">
                            {t('admin.career_resources_show.no_thumbnail')}
                        </div>
                    )}

                    <div className="space-y-6 p-6">
                        <header className="space-y-3">
                            <p className="text-sm font-semibold text-[#0F4C94]">
                                /{resource.slug}
                            </p>
                            <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-[#0F2747]">
                                {resource.title}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                    <CalendarDays className="size-4" />
                                    {t('admin.career_resources_show.published')}:{' '}
                                    {resource.published_at ?? t('admin.career_resources_show.draft')}
                                </span>
                                <span>
                                    {t('admin.career_resources_show.updated')}: {resource.updated_at ?? '-'}
                                </span>
                            </div>
                        </header>

                        <div
                            className="max-w-4xl text-base leading-8 text-[#313947] [&_blockquote]:border-l-4 [&_blockquote]:border-[#0F4C94] [&_blockquote]:bg-[#eff4ff] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-6"
                            dangerouslySetInnerHTML={{
                                __html: resource.content,
                            }}
                        />
                    </div>
                </article>
            </div>
        </>
    );
}
