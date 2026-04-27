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

const STATUS_LABELS: Record<string, string> = {
    queued: 'Antri',
    processing: 'Sedang dikirim',
    completed: 'Selesai',
    completed_with_errors: 'Selesai (sebagian gagal)',
    failed: 'Gagal',
};

function statusBadge(status: string) {
    if (status === 'completed') {
        return (
            <Badge className="border-green-200 bg-green-50 text-green-700">
                <CheckCircle2 className="mr-1 size-3.5" />
                Selesai
            </Badge>
        );
    }
    if (status === 'failed') {
        return (
            <Badge className="border-red-200 bg-red-50 text-red-700">
                <AlertCircle className="mr-1 size-3.5" />
                Gagal
            </Badge>
        );
    }
    if (status === 'completed_with_errors') {
        return (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                Sebagian gagal
            </Badge>
        );
    }
    if (status === 'processing') {
        return (
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                Sedang dikirim
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-muted-foreground">
            {STATUS_LABELS[status] ?? status}
        </Badge>
    );
}

export default function EmployerWhatsAppBulkIndex({
    campaigns,
    gateway,
}: WhatsAppBulkIndexProps) {
    const isConnected = ['CONNECTED', 'READY'].includes(
        (gateway.session_state ?? '').toUpperCase(),
    );

    return (
        <>
            <Head title="Broadcast" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title="Broadcast"
                        description="Kirim pesan massal via WhatsApp atau Email ke pelamar suatu lowongan dengan delay otomatis."
                    />
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Kampanye baru
                        </Link>
                    </Button>
                </div>

                {!gateway.configured ? (
                    <Card className="border-amber-200 bg-amber-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                Gateway WhatsApp belum dikonfigurasi. Untuk
                                broadcast WhatsApp, hubungkan dulu di halaman
                                Koneksi WhatsApp. Channel Email tetap bisa
                                dipakai.
                            </p>
                        </CardContent>
                    </Card>
                ) : !isConnected ? (
                    <Card className="border-amber-200 bg-amber-50/60">
                        <CardContent className="flex items-start gap-3 py-4">
                            <AlertCircle className="mt-0.5 size-5 text-amber-600" />
                            <p className="text-sm text-amber-800">
                                Sesi WhatsApp belum terhubung. Untuk broadcast
                                WhatsApp, pastikan status CONNECTED dulu.
                                Channel Email tetap bisa dipakai.
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat kampanye</CardTitle>
                        <CardDescription>
                            Semua kampanye broadcast (WhatsApp & Email) yang
                            pernah dijalankan akun ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {campaigns.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                                <Send className="size-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Belum ada kampanye. Klik &ldquo;Kampanye
                                    baru&rdquo; untuk mulai kirim massal.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lowongan</TableHead>
                                            <TableHead>Channel</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">
                                                Total
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Terkirim
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Gagal
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Lewati
                                            </TableHead>
                                            <TableHead>Dibuat</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
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
                                                            Detail
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
