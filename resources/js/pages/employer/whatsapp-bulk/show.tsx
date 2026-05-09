import { Head, Link, usePoll } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { index } from '@/routes/employer/whatsapp-bulk';

type Recipient = {
    id: number;
    candidate_name: string;
    phone_number: string | null;
    email_address: string | null;
    status: string;
    error_message: string | null;
    sent_at: string | null;
};

type WhatsAppBulkShowProps = {
    campaign: {
        id: number;
        job_title: string;
        channel: 'whatsapp' | 'email';
        subject: string | null;
        reply_to_email: string | null;
        status: string;
        message_template: string;
        recipients_count: number;
        sent_count: number;
        failed_count: number;
        skipped_count: number;
        started_at: string | null;
        completed_at: string | null;
        created_at: string | null;
    };
    recipients: {
        data: Recipient[];
    };
};

export default function EmployerWhatsAppBulkShow({
    campaign,
    recipients,
}: WhatsAppBulkShowProps) {
    const { t } = useTranslate();
    const stillProcessing = ['queued', 'processing'].includes(campaign.status);

    usePoll(
        4000,
        {
            only: ['campaign', 'recipients'],
        },
        {
            autoStart: stillProcessing,
            keepAlive: true,
        },
    );

    function recipientBadge(status: string) {
        if (status === 'sent') {
            return (
                <Badge className="border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="mr-1 size-3.5" />
                    {t('employer.whatsapp_bulk_show.status_sent')}
                </Badge>
            );
        }
        if (status === 'failed') {
            return (
                <Badge className="border-red-200 bg-red-50 text-red-700">
                    <XCircle className="mr-1 size-3.5" />
                    {t('employer.whatsapp_bulk_show.status_failed')}
                </Badge>
            );
        }
        if (status === 'skipped') {
            return (
                <Badge variant="outline" className="text-amber-700">
                    {t('employer.whatsapp_bulk_show.status_skipped')}
                </Badge>
            );
        }
        return (
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                <Clock className="mr-1 size-3.5" />
                {t('employer.whatsapp_bulk_show.status_queued')}
            </Badge>
        );
    }

    return (
        <>
            <Head title={`Broadcast #${campaign.id}`} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href={index().url}>
                            <ArrowLeft className="size-4" />
                            {t('employer.whatsapp_bulk_show.btn_back')}
                        </Link>
                    </Button>
                </div>

                <Heading
                    title={`Kampanye Broadcast — ${campaign.job_title}`}
                    description={`Dibuat ${campaign.created_at ?? '-'}. Channel: ${campaign.channel === 'email' ? 'Email' : 'WhatsApp'}.`}
                />

                {campaign.channel === 'email' && campaign.subject ? (
                    <Card>
                        <CardContent className="py-3 text-sm">
                            <span className="font-medium">{t('employer.whatsapp_bulk.subject')}:</span>{' '}
                            {campaign.subject}
                            {campaign.reply_to_email ? (
                                <span className="ml-3 text-muted-foreground">
                                    Reply-to: {campaign.reply_to_email}
                                </span>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase">
                                {t('employer.whatsapp_bulk_show.card_total')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {campaign.recipients_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase">
                                {t('employer.whatsapp_bulk_show.card_sent')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-green-700">
                                {campaign.sent_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase">
                                {t('employer.whatsapp_bulk_show.card_failed')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-red-700">
                                {campaign.failed_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase">
                                {t('employer.whatsapp_bulk_show.card_skipped')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-amber-700">
                                {campaign.skipped_count}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.whatsapp_bulk_show.template_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm">
                            {campaign.message_template}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.whatsapp_bulk_show.recipients_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="min-w-160">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('employer.whatsapp_bulk_show.col_candidate')}</TableHead>
                                        <TableHead>
                                            {campaign.channel === 'email'
                                                ? 'Email'
                                                : t('employer.whatsapp_bulk_show.col_contact')}
                                        </TableHead>
                                        <TableHead>{t('employer.whatsapp_bulk_show.col_status')}</TableHead>
                                        <TableHead>{t('employer.whatsapp_bulk_show.col_sent_at')}</TableHead>
                                        <TableHead>{t('employer.whatsapp_bulk_show.col_notes')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipients.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="py-8 text-center text-sm text-muted-foreground"
                                            >
                                                {t('employer.whatsapp_bulk_show.empty_recipients')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recipients.data.map((recipient) => (
                                            <TableRow key={recipient.id}>
                                                <TableCell className="font-medium">
                                                    {recipient.candidate_name}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {(campaign.channel ===
                                                    'email'
                                                        ? recipient.email_address
                                                        : recipient.phone_number) ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {recipientBadge(
                                                        recipient.status,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {recipient.sent_at ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {recipient.error_message ??
                                                        '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
