import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    KeyRound,
    Loader2,
    PlayCircle,
    Sparkles,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { run as runAiHealth } from '@/routes/admin/ai-health';

type Snapshot = {
    configured: boolean;
    model: string;
};

type RunResult = {
    ok: boolean;
    configured: boolean;
    model: string;
    latency_ms: number | null;
    reply_preview?: string | null;
    token_usage?: {
        prompt_tokens: number | null;
        completion_tokens: number | null;
        reasoning_tokens: number | null;
        total_tokens: number | null;
    };
    message: string;
};

export default function AdminAiHealth({ snapshot }: { snapshot: Snapshot }) {
    const [result, setResult] = useState<RunResult | null>(null);
    const [running, setRunning] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const runCheck = async () => {
        setRunning(true);
        setErrorMessage(null);

        try {
            const csrf = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;
            const response = await fetch(runAiHealth().url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = (await response.json()) as RunResult;
            setResult(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Tidak dapat menghubungi endpoint health-check.',
            );
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <Head title="AI Health Check" />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title="AI Health Check"
                    description="Pastikan OPENAI_API_KEY valid dan model menjawab. Jalankan sebelum/sesudah ganti key di .env, atau saat user mengeluh fitur AI mati."
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <KeyRound className="size-4 text-muted-foreground" />
                                Konfigurasi
                            </CardTitle>
                            <CardDescription>
                                Status terbaca dari config &amp; setting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    API Key
                                </span>
                                {snapshot.configured ? (
                                    <Badge className="border-green-200 bg-green-50 text-green-700">
                                        <CheckCircle2 className="mr-1 size-3.5" />
                                        Terpasang
                                    </Badge>
                                ) : (
                                    <Badge className="border-red-200 bg-red-50 text-red-700">
                                        <AlertCircle className="mr-1 size-3.5" />
                                        Belum diatur
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Model aktif
                                </span>
                                <span className="font-mono text-xs">
                                    {snapshot.model}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="size-4 text-muted-foreground" />
                                Jalankan probe
                            </CardTitle>
                            <CardDescription>
                                Mengirim 1 prompt singkat ke OpenAI. Token usage
                                ditampilkan untuk audit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                type="button"
                                onClick={runCheck}
                                disabled={running}
                                className="w-full"
                            >
                                {running ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Mengecek...
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="size-4" />
                                        Jalankan Health Check
                                    </>
                                )}
                            </Button>
                            {errorMessage ? (
                                <p className="mt-3 text-xs text-red-600">
                                    {errorMessage}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {result ? (
                    <Card
                        className={
                            result.ok ? 'border-green-200' : 'border-red-200'
                        }
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                {result.ok ? (
                                    <CheckCircle2 className="size-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="size-4 text-red-600" />
                                )}
                                Hasil pengecekan
                            </CardTitle>
                            <CardDescription>{result.message}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Status
                                    </span>
                                    {result.ok ? (
                                        <Badge className="border-green-200 bg-green-50 text-green-700">
                                            OK
                                        </Badge>
                                    ) : (
                                        <Badge className="border-red-200 bg-red-50 text-red-700">
                                            Gagal
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Model
                                    </span>
                                    <span className="font-mono text-xs">
                                        {result.model}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Timer className="size-3.5" />
                                        Latency
                                    </span>
                                    <span className="font-mono text-xs">
                                        {result.latency_ms !== null
                                            ? `${result.latency_ms} ms`
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Token usage
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-md bg-muted/40 p-2">
                                        <div className="text-muted-foreground">
                                            Prompt
                                        </div>
                                        <div className="font-mono">
                                            {result.token_usage
                                                ?.prompt_tokens ?? '—'}
                                        </div>
                                    </div>
                                    <div className="rounded-md bg-muted/40 p-2">
                                        <div className="text-muted-foreground">
                                            Completion
                                        </div>
                                        <div className="font-mono">
                                            {result.token_usage
                                                ?.completion_tokens ?? '—'}
                                        </div>
                                    </div>
                                    <div className="rounded-md bg-muted/40 p-2">
                                        <div className="text-muted-foreground">
                                            Reasoning
                                        </div>
                                        <div className="font-mono">
                                            {result.token_usage
                                                ?.reasoning_tokens ?? '—'}
                                        </div>
                                    </div>
                                    <div className="rounded-md bg-muted/40 p-2">
                                        <div className="text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="font-mono">
                                            {result.token_usage?.total_tokens ??
                                                '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {result.reply_preview ? (
                                <div className="md:col-span-2">
                                    <div className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Preview balasan
                                    </div>
                                    <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                                        {result.reply_preview}
                                    </pre>
                                </div>
                            ) : null}
                            {!result.ok ? (
                                <p className="text-xs text-muted-foreground md:col-span-2">
                                    Tip: cek{' '}
                                    <code className="rounded bg-muted px-1">
                                        storage/logs/laravel.log
                                    </code>{' '}
                                    baris terakhir — biasanya muncul status code
                                    (401 = key invalid, 429 = rate-limit/saldo,
                                    5xx = OpenAI down).
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

AdminAiHealth.layout = {
    title: 'AI Health Check',
};
