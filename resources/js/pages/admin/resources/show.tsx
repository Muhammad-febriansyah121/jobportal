import { Head } from '@inertiajs/react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import type {
    AdminAction,
    AdminAiSummary,
    AdminRelatedTable,
    AdminSection,
} from '@/types';

type AdminResourceHero = {
    name: string;
    logo_url?: string | null;
    cover_url?: string | null;
};

type AdminResourceShowProps = {
    title: string;
    description?: string;
    backHref: string;
    actions?: AdminAction[];
    aiSummary?: AdminAiSummary | null;
    sections?: AdminSection[];
    tables?: AdminRelatedTable[];
    hero?: AdminResourceHero | null;
};

export default function AdminResourceShow({
    title,
    description,
    backHref,
    actions,
    aiSummary,
    sections = [],
    tables = [],
    hero,
}: AdminResourceShowProps) {
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

                {hero && (
                    <Card className="overflow-hidden p-0">
                        {/* Cover */}
                        <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-primary to-primary/60">
                            {hero.cover_url && (
                                <img
                                    src={hero.cover_url}
                                    alt=""
                                    className="h-full w-full object-cover object-center"
                                />
                            )}
                            {/* subtle bottom fade so logo reads cleanly */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>

                        {/* Logo + name row */}
                        <div className="flex items-end gap-5 px-6 pb-5">
                            <div className="-mt-10 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-xl">
                                {hero.logo_url ? (
                                    <img
                                        alt={hero.name}
                                        className="h-20 w-20 object-contain"
                                        src={hero.logo_url}
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                                        {hero.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="pb-1">
                                <h1 className="text-xl font-bold leading-tight">
                                    {hero.name}
                                </h1>
                            </div>
                        </div>
                    </Card>
                )}

                {actions && actions.length > 0 && (
                    <Card>
                        <CardContent className="flex justify-end py-3">
                            <AdminActionList actions={actions} />
                        </CardContent>
                    </Card>
                )}

                {aiSummary !== undefined && (
                    <Card className="border-primary-200 bg-primary-50">
                        <CardContent className="pt-5">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-sm font-semibold text-primary-700">
                                    ✦ {t('admin.resources.show.ai_summary')}
                                </span>
                                {aiSummary?.generated_at && (
                                    <span className="text-xs text-muted-foreground">
                                        — {t('admin.resources.show.updated_at')} {aiSummary.generated_at}
                                    </span>
                                )}
                            </div>
                            {aiSummary?.summary ? (
                                <p className="text-sm leading-relaxed text-primary-900">
                                    {aiSummary.summary}
                                </p>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">
                                    {t('admin.resources.show.no_summary_prefix')}{' '}
                                    <strong>{t('admin.resources.show.generate_ai_summary')}</strong> {t('admin.resources.show.no_summary_suffix')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {sections.map((section) => (
                    <Card key={section.title}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                                {section.items.map((item) => (
                                    <div
                                        className="grid gap-1"
                                        key={`${section.title}-${item.label}`}
                                    >
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {item.label}
                                        </dt>
                                        <dd className="text-sm wrap-break-word whitespace-pre-wrap">
                                            {renderDetailValue(item.value, t('admin.resources.show.open_document'))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                ))}

                {tables.map((table) => (
                    <section className="space-y-3" key={table.title}>
                        <h2 className="text-base font-semibold">{table.title}</h2>
                        <AdminDataTable columns={table.columns} rows={table.rows} />
                    </section>
                ))}
            </div>
        </>
    );
}

function renderDetailValue(value: unknown, openDocLabel: string) {
    const text = String(value ?? '-');

    if (!isUrlLike(text)) {
        return text;
    }

    return (
        <a
            href={text}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2"
        >
            {openDocLabel}
        </a>
    );
}

function isUrlLike(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
}
