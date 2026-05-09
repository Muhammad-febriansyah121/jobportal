import { Head } from '@inertiajs/react';
import { Mail, MessageSquare, Phone, User } from 'lucide-react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import type { AdminAction } from '@/types';

type ContactMessageDetail = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: string;
    read_at: string | null;
    created_at: string;
};

type Props = {
    message: ContactMessageDetail;
    backHref: string;
    actions?: AdminAction[];
};

const STATUS_STYLES: Record<string, string> = {
    unread: 'bg-yellow-100 text-yellow-700',
    read: 'bg-blue-100 text-blue-700',
    replied: 'bg-green-100 text-green-700',
};

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

export default function ContactMessageShow({ message, backHref, actions }: Props) {
    const { t } = useTranslate();
    const statusStyle = STATUS_STYLES[message.status] ?? 'bg-muted text-muted-foreground';
    const statusLabels: Record<string, string> = {
        unread: t('admin.contact_messages_show.status_unread'),
        read: t('admin.contact_messages_show.status_read'),
        replied: t('admin.contact_messages_show.status_replied'),
    };
    const statusLabel = statusLabels[message.status] ?? message.status;

    return (
        <>
            <Head title={`Pesan — ${message.subject}`} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={t('admin.contact_messages_show.page_title')}
                    description={message.subject}
                    backHref={backHref}
                />

                {actions && actions.length > 0 && (
                    <Card>
                        <CardContent className="flex justify-end py-3">
                            <AdminActionList actions={actions} />
                        </CardContent>
                    </Card>
                )}

                {/* Sender info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">{t('admin.contact_messages_show.sender_info')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            <MetaItem label={t('admin.contact_messages_show.label_name')}>
                                <span className="flex items-center gap-1.5">
                                    <User className="size-3.5 text-muted-foreground" />
                                    {message.name}
                                </span>
                            </MetaItem>
                            <MetaItem label={t('admin.contact_messages_show.label_email')}>
                                <a
                                    href={`mailto:${message.email}`}
                                    className="flex items-center gap-1.5 text-primary-600 hover:underline"
                                >
                                    <Mail className="size-3.5" />
                                    {message.email}
                                </a>
                            </MetaItem>
                            <MetaItem label={t('admin.contact_messages_show.label_phone')}>
                                {message.phone ? (
                                    <a
                                        href={`tel:${message.phone}`}
                                        className="flex items-center gap-1.5 text-primary-600 hover:underline"
                                    >
                                        <Phone className="size-3.5" />
                                        {message.phone}
                                    </a>
                                ) : (
                                    <span className="italic text-muted-foreground">
                                        {t('admin.contact_messages_show.phone_empty')}
                                    </span>
                                )}
                            </MetaItem>
                            <MetaItem label={t('admin.contact_messages_show.label_status')}>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                                >
                                    {statusLabel}
                                </span>
                            </MetaItem>
                            <MetaItem label={t('admin.contact_messages_show.label_sent')}>{message.created_at}</MetaItem>
                            {message.read_at && (
                                <MetaItem label={t('admin.contact_messages_show.label_read')}>{message.read_at}</MetaItem>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Message body */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="size-4 text-muted-foreground" />
                            {message.subject}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                            {message.message}
                        </p>
                    </CardContent>
                </Card>

                {/* Quick reply */}
                <Card className="border-dashed bg-muted/30">
                    <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">
                            {t('admin.contact_messages_show.reply_hint')}{' '}
                            <a
                                href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                                className="font-medium text-primary-600 hover:underline"
                            >
                                {t('admin.contact_messages_show.reply_via_email')}
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
