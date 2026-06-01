import { Head } from '@inertiajs/react';
import { AlertTriangle, Database, Download, HardDrive, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { download as downloadRoute, index } from '@/routes/admin/database-backup';

type Props = {
    database: {
        name: string;
        host: string;
        port: number;
    };
};

export default function AdminDatabaseBackup({ database }: Props) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('admin.database_backup.title')} />
            <div className="flex flex-col gap-6 p-4 sm:p-6">
                <div className="flex items-center gap-3 border-b pb-5">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                        <HardDrive className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {t('admin.database_backup.title')}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('admin.database_backup.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Database className="size-4" />
                                {t('admin.database_backup.info.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.database_backup.info.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
                                <span className="text-sm text-muted-foreground">
                                    {t('admin.database_backup.info.database')}
                                </span>
                                <span className="font-mono text-sm font-medium">
                                    {database.name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
                                <span className="text-sm text-muted-foreground">
                                    {t('admin.database_backup.info.host')}
                                </span>
                                <span className="font-mono text-sm font-medium">
                                    {database.host}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
                                <span className="text-sm text-muted-foreground">
                                    {t('admin.database_backup.info.port')}
                                </span>
                                <span className="font-mono text-sm font-medium">
                                    {database.port}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Server className="size-4" />
                                {t('admin.database_backup.download.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.database_backup.download.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                <p>{t('admin.database_backup.download.warning')}</p>
                            </div>
                            <a href={downloadRoute.url()} download>
                                <Button className="w-full gap-2 bg-primary text-white hover:bg-primary/90">
                                    <Download className="size-4" />
                                    {t('admin.database_backup.download.btn')}
                                </Button>
                            </a>
                            <p className="text-center text-xs text-muted-foreground">
                                {t('admin.database_backup.download.format')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
