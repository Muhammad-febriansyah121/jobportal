import { Head } from '@inertiajs/react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { AdminAction, AdminAiSummary, AdminRelatedTable, AdminSection } from '@/types';

type AdminResourceShowProps = {
    title: string;
    description?: string;
    backHref: string;
    actions?: AdminAction[];
    aiSummary?: AdminAiSummary | null;
    sections?: AdminSection[];
    tables?: AdminRelatedTable[];
};

export default function AdminResourceShow({
    title,
    description,
    backHref,
    actions,
    aiSummary,
    sections = [],
    tables = [],
}: AdminResourceShowProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader title={title} description={description} backHref={backHref} />

                {actions && actions.length > 0 && (
                    <div className="flex justify-end border-b pb-4">
                        <AdminActionList actions={actions} />
                    </div>
                )}

                {aiSummary !== undefined && (
                    <section className="rounded-lg border bg-orange-50 p-5">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm font-semibold text-orange-700">✦ Ringkasan AI</span>
                            {aiSummary?.generated_at && (
                                <span className="text-xs text-muted-foreground">— diperbarui {aiSummary.generated_at}</span>
                            )}
                        </div>
                        {aiSummary?.summary ? (
                            <p className="text-sm leading-relaxed text-orange-900">{aiSummary.summary}</p>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                Belum ada ringkasan. Klik <strong>Generate AI Summary</strong> untuk membuat ringkasan aktivitas user ini.
                            </p>
                        )}
                    </section>
                )}

                <div className="grid gap-6">
                    {sections.map((section) => (
                        <section className="border-b pb-6" key={section.title}>
                            <h2 className="mb-4 text-lg font-semibold">{section.title}</h2>
                            <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {section.items.map((item) => (
                                    <div className="grid gap-1" key={`${section.title}-${item.label}`}>
                                        <dt className="text-xs font-medium uppercase text-muted-foreground">{item.label}</dt>
                                        <dd className="whitespace-pre-wrap break-words text-sm">{String(item.value ?? '-')}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ))}
                </div>

                {tables.map((table) => (
                    <section className="space-y-4" key={table.title}>
                        <h2 className="text-lg font-semibold">{table.title}</h2>
                        <AdminDataTable columns={table.columns} rows={table.rows} />
                    </section>
                ))}
            </div>
        </>
    );
}
