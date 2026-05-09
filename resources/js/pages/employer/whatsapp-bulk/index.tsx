import { Head, Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Eye, Plus, Send } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
import { create, show } from '@/routes/employer/whatsapp-bulk';

type Campaign = {
    id: number;
    job_title: string;
    channel: 'whatsapp' | 'email';
    subject: string | null;
    status: string;
    recipients_count: number;
    sent_count: number;
    failed_count: number;
    skipped_count: number;
    created_at: string | null;
    completed_at: string | null;
};

type WhatsAppBulkIndexProps = {
    campaigns: {
        data: Campaign[];
    };
    gateway: {
        configured: boolean;
        session_id: string;
        session_state: string | null;
    };
};

export default function EmployerWhatsAppBulkIndex({
    campaigns,
    gateway,
}: WhatsAppBulkIndexProps) {
    const { t } = useTranslate();

    const isConnected = ['CONNECTED', 'READY'].includes(
        (gateway.session_state ?? '').toUpperCase(),
    );

    function statusBadge(status: string) {
        if (status === 'completed') {
            return (
                <Badge className="border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="mr-1 size-3.5" />
                    {t('employer.whatsapp_bulk.status_completed')}
                </Badge>
            );
        }
        if (status === 'failed') {
            return (
                <Badge className="border-red-200 bg-red-50 text-red-700">
                    <AlertCircle className="mr-1 size-3.5" />
                    {t('employer.whatsapp_bulk.status_failed')}
                </Badge>
            );
        }
        if (status === 'completed_with_errors') {
            return (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                    {t('employer.whatsapp_bulk.status_partial')}
                </Badge>
            );
        }
        if (status === 'processing') {
            return (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                    {t('employer.whatsapp_bulk.status_processing')}
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-muted-foreground">
                {t('employer.whatsapp_bulk.status_queued')}
            </Badge>
        );
    }

    return (
        <>
            <Head title={t('employer.whatsapp_bulk.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title={t('employer.whatsapp_bulk.heading_title')}
                        description={t('employer.whatsapp_bulk.heading_desc')}
                    />
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            {t('employer.whatsapp_bulk.btn_new')}
                        </Link>
                    </Button>
                </div>

                {!gateway.configured ? (
                    <Card className="border-amber-200 bg-amber-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                {t('employer.whatsapp_bulk.warning_not_configured')}
                            </p>
                        </CardContent>
                    </Card>
                ) : !isConnected ? (
                    <Card className="border-amber-200 bg-amber-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                {t('employer.whatsapp_bulk.warning_not_connected')}
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.whatsapp_bulk.card_title')}</CardTitle>
                        <CardDescription>
                            {t('employer.whatsapp_bulk.card_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {campaigns.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                                <Send className="size-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {t('employer.whatsapp_bulk.empty_text')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('employer.whatsapp_bulk.col_job')}</TableHead>
                                            <TableHead>{t('employer.whatsapp_bulk.col_channel')}</TableHead>
                                            <TableHead>{t('employer.whatsapp_bulk.col_status')}</TableHead>
                                            <TableHead className="text-right">
                                                {t('employer.whatsapp_bulk.col_total')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('employer.whatsapp_bulk.col_sent')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('employer.whatsapp_bulk.col_failed')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('employer.whatsapp_bulk.col_skip')}
                                            </TableHead>
                                            <TableHead>{t('employer.whatsapp_bulk.col_created')}</TableHead>
                                            <TableHead className="text-right">
                                                {t('employer.whatsapp_bulk.col_actions')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaigns.data.map((campaign) => (
                                            <TableRow key={campaign.id}>
                                                <TableCell className="font-medium">
                                                    {campaign.job_title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            campaign.channel ===
                                                            'email'
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        }
                                                    >
                                                        {campaign.channel ===
                                                        'email'
                                                            ? 'Email'
                                                            : 'WhatsApp'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {statusBadge(
                                                        campaign.status,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {campaign.recipients_count}
                                                </TableCell>
                                                <TableCell className="text-right text-green-700">
                                                    {campaign.sent_count}
                                                </TableCell>
                                                <TableCell className="text-right text-red-700">
                                                    {campaign.failed_count}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {campaign.skipped_count}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {campaign.created_at}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link
                                                            href={
                                                                show(
                                                                    campaign.id,
                                                                ).url
                                                            }
                                                        >
                                                            <Eye className="size-4" />
                                                            {t('employer.whatsapp_bulk.btn_detail')}
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
