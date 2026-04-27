import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Bot,
    Check,
    CheckCircle2,
    LayoutGrid,
    Search,
    Sparkles,
    Table as TableIcon,
    Trophy,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import EmployerAiInterviewController from '@/actions/App/Http/Controllers/Employer/EmployerAiInterviewController';
import { ProgressBar } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { show as showAiInterview } from '@/routes/employer/ai-interviews';
import { show as showJob } from '@/routes/employer/jobs';

type Candidate = {
    id: number;
    session_id: number | null;
    candidate_name: string;
    headline?: string | null;
    email?: string | null;
    status: string;
    status_label: string;
    fit_score?: number | null;
    recommendation?: string | null;
    summary?: string | null;
    interview_mode?: string | null;
    interview_status?: string | null;
    completed_at?: string | null;
    completed_at_iso?: string | null;
    applied_at?: string | null;
    scorecard: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
};

type CompareProps = {
    job: { id: number; title: string };
    candidates: Candidate[];
};

type SortKey = 'fit_desc' | 'fit_asc' | 'completed_desc' | 'name_asc';
type FilterKey = 'all' | 'completed' | 'pending';
type ViewMode = 'cards' | 'table';

const FINAL_DECISION_STATUSES = ['offer', 'hired', 'rejected', 'withdrawn'];

const AI_STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu',
    scheduled: 'Terjadwal',
    in_progress: 'Berlangsung',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

function formatAiStatus(status?: string | null): string {
    if (!status) {
        return 'Belum mulai';
    }
    return AI_STATUS_LABELS[status] ?? status;
}

function formatMode(mode?: string | null): string {
    if (!mode) {
        return '-';
    }
    return mode === 'text' ? 'Teks' : 'Voice AI';
}

function scoreToneClass(score: number): {
    track: string;
    text: string;
    bg: string;
} {
    if (score >= 75) {
        return {
            track: 'from-emerald-500 to-emerald-400',
            text: 'text-emerald-700',
            bg: 'bg-emerald-50',
        };
    }
    if (score >= 55) {
        return {
            track: 'from-primary-500 to-primary-400',
            text: 'text-primary-700',
            bg: 'bg-primary-50',
        };
    }
    if (score >= 30) {
        return {
            track: 'from-amber-500 to-amber-400',
            text: 'text-amber-700',
            bg: 'bg-amber-50',
        };
    }
    return {
        track: 'from-rose-500 to-rose-400',
        text: 'text-rose-700',
        bg: 'bg-rose-50',
    };
}

export default function EmployerAiInterviewCompare({
    job,
    candidates,
}: CompareProps) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('fit_desc');
    const [filterBy, setFilterBy] = useState<FilterKey>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
    const [bulkBusy, setBulkBusy] = useState<'advance' | 'reject' | null>(null);
    const [confirmAction, setConfirmAction] = useState<
        | { kind: 'single'; action: 'advance' | 'reject'; candidate: Candidate }
        | { kind: 'bulk'; action: 'advance' | 'reject' }
        | null
    >(null);

    const visibleCandidates = useMemo(() => {
        const term = search.trim().toLowerCase();

        const filtered = candidates.filter((candidate) => {
            const isCompleted = candidate.interview_status === 'completed';

            if (filterBy === 'completed' && !isCompleted) {
                return false;
            }
            if (filterBy === 'pending' && isCompleted) {
                return false;
            }
            if (term !== '') {
                const hay = [
                    candidate.candidate_name,
                    candidate.headline ?? '',
                    candidate.email ?? '',
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(term)) {
                    return false;
                }
            }
            return true;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'fit_desc':
                    return (b.fit_score ?? -1) - (a.fit_score ?? -1);
                case 'fit_asc':
                    return (a.fit_score ?? 999) - (b.fit_score ?? 999);
                case 'completed_desc':
                    return (
                        (b.completed_at_iso ?? '').localeCompare(
                            a.completed_at_iso ?? '',
                        )
                    );
                case 'name_asc':
                    return a.candidate_name.localeCompare(b.candidate_name);
            }
        });
    }, [candidates, search, sortBy, filterBy]);

    const topCandidate = useMemo(() => {
        return [...candidates].sort(
            (a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0),
        )[0];
    }, [candidates]);

    const selectableCandidates = useMemo(
        () =>
            visibleCandidates.filter(
                (c) =>
                    c.session_id !== null &&
                    !FINAL_DECISION_STATUSES.includes(c.status),
            ),
        [visibleCandidates],
    );

    const allSelectableSelected =
        selectableCandidates.length > 0 &&
        selectableCandidates.every((c) =>
            selectedSessionIds.includes(c.session_id as number),
        );

    const toggleSelectAll = () => {
        if (allSelectableSelected) {
            setSelectedSessionIds([]);
            return;
        }
        setSelectedSessionIds(
            selectableCandidates.map((c) => c.session_id as number),
        );
    };

    const toggleSelected = (sessionId: number) => {
        setSelectedSessionIds((current) =>
            current.includes(sessionId)
                ? current.filter((id) => id !== sessionId)
                : [...current, sessionId],
        );
    };

    const requestBulk = (action: 'advance' | 'reject') => {
        if (selectedSessionIds.length === 0) {
            toast.error('Pilih minimal satu kandidat.');
            return;
        }
        setConfirmAction({ kind: 'bulk', action });
    };

    const requestSingle = (
        candidate: Candidate,
        action: 'advance' | 'reject',
    ) => {
        if (candidate.session_id === null) {
            toast.error('Sesi AI interview tidak ditemukan untuk kandidat ini.');
            return;
        }
        setConfirmAction({ kind: 'single', action, candidate });
    };

    const executeBulk = (action: 'advance' | 'reject') => {
        const url =
            action === 'advance'
                ? EmployerAiInterviewController.bulkAdvance.url()
                : EmployerAiInterviewController.bulkReject.url();

        setBulkBusy(action);
        const count = selectedSessionIds.length;

        router.post(
            url,
            { session_ids: selectedSessionIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        action === 'advance'
                            ? `${count} kandidat diloloskan ke tahap user.`
                            : `${count} kandidat ditolak.`,
                    );
                    setSelectedSessionIds([]);
                },
                onError: () => {
                    toast.error('Gagal memproses keputusan bulk.');
                },
                onFinish: () => {
                    setBulkBusy(null);
                    setConfirmAction(null);
                },
            },
        );
    };

    const executeSingle = (
        candidate: Candidate,
        action: 'advance' | 'reject',
    ) => {
        if (candidate.session_id === null) {
            return;
        }
        const url =
            action === 'advance'
                ? EmployerAiInterviewController.advanceToUser.url(
                      candidate.session_id,
                  )
                : EmployerAiInterviewController.reject.url(
                      candidate.session_id,
                  );

        router.patch(
            url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        action === 'advance'
                            ? `${candidate.candidate_name} diloloskan ke tahap user.`
                            : `${candidate.candidate_name} ditolak.`,
                    );
                },
                onError: () => {
                    toast.error('Gagal memproses keputusan.');
                },
                onFinish: () => setConfirmAction(null),
            },
        );
    };

    const handleConfirm = () => {
        if (!confirmAction) {
            return;
        }
        if (confirmAction.kind === 'bulk') {
            executeBulk(confirmAction.action);
        } else {
            executeSingle(confirmAction.candidate, confirmAction.action);
        }
    };

    const stats = useMemo(() => {
        const totals = {
            total: candidates.length,
            completed: 0,
            pending: 0,
            advanced: 0,
            rejected: 0,
            avgFit: 0,
        };
        let scoreSum = 0;
        let scoreCount = 0;
        for (const c of candidates) {
            if (c.interview_status === 'completed') totals.completed++;
            else totals.pending++;
            if (c.status === 'offer' || c.status === 'hired') totals.advanced++;
            if (c.status === 'rejected') totals.rejected++;
            if (typeof c.fit_score === 'number') {
                scoreSum += c.fit_score;
                scoreCount++;
            }
        }
        totals.avgFit = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
        return totals;
    }, [candidates]);

    const allScorecardKeys = useMemo(() => {
        const set = new Set<string>();
        for (const c of candidates) {
            for (const k of Object.keys(c.scorecard ?? {})) {
                set.add(k);
            }
        }
        return Array.from(set).sort();
    }, [candidates]);

    return (
        <>
            <Head title={`Perbandingan Kandidat AI - ${job.title}`} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Perbandingan Kandidat AI"
                        description={`Bandingkan hasil wawancara AI untuk lowongan ${job.title}, lalu pilih kandidat untuk dilanjutkan atau ditolak.`}
                    />
                    <Button variant="outline" asChild>
                        <Link href={showJob(job.id)}>
                            <ArrowLeft className="size-4" />
                            Kembali ke Lowongan
                        </Link>
                    </Button>
                </div>

                {/* Top insight */}
                <Card className="overflow-hidden border-primary-200 bg-linear-to-br from-primary-50 via-white to-slate-50">
                    <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_320px]">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
                                    <Bot className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-[0.3em] text-primary-600 uppercase">
                                        AI Ranking Insight
                                    </p>
                                    <h2 className="text-2xl font-bold">
                                        {topCandidate
                                            ? `${topCandidate.candidate_name} kandidat terkuat`
                                            : 'Belum ada kandidat untuk dibandingkan'}
                                    </h2>
                                </div>
                            </div>
                            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                                Ranking memakai fit score dan scorecard hasil
                                interview AI. Anda tetap perlu review akhir
                                sebelum mengambil keputusan hiring.
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <StatPill
                                    label="Total"
                                    value={stats.total}
                                    tone="slate"
                                />
                                <StatPill
                                    label="Selesai"
                                    value={stats.completed}
                                    tone="green"
                                />
                                <StatPill
                                    label="Diloloskan"
                                    value={stats.advanced}
                                    tone="primary"
                                />
                                <StatPill
                                    label="Ditolak"
                                    value={stats.rejected}
                                    tone="red"
                                />
                            </div>
                        </div>
                        <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Rata-rata Fit Score
                            </p>
                            <p className="mt-2 text-3xl font-bold text-primary-600">
                                {stats.avgFit}/100
                            </p>
                            <ProgressBar value={stats.avgFit} />
                            {topCandidate ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Kandidat tertinggi:{' '}
                                    <span className="font-semibold text-foreground">
                                        {topCandidate.candidate_name}
                                    </span>{' '}
                                    ({topCandidate.fit_score ?? 0}%)
                                </p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                {/* Filter / sort / view toggle bar */}
                <Card>
                    <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, email, atau headline"
                                    className="pl-9"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(e.target.value as SortKey)
                                }
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="fit_desc">
                                    Fit Score (tertinggi)
                                </option>
                                <option value="fit_asc">
                                    Fit Score (terendah)
                                </option>
                                <option value="completed_desc">
                                    Selesai terbaru
                                </option>
                                <option value="name_asc">Nama (A-Z)</option>
                            </select>
                            <select
                                value={filterBy}
                                onChange={(e) =>
                                    setFilterBy(e.target.value as FilterKey)
                                }
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="all">Semua kandidat</option>
                                <option value="completed">
                                    Hanya yang sudah selesai
                                </option>
                                <option value="pending">
                                    Belum/sedang interview
                                </option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={
                                    viewMode === 'cards' ? 'default' : 'outline'
                                }
                                onClick={() => setViewMode('cards')}
                            >
                                <LayoutGrid className="size-4" />
                                Kartu
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    viewMode === 'table' ? 'default' : 'outline'
                                }
                                onClick={() => setViewMode('table')}
                            >
                                <TableIcon className="size-4" />
                                Tabel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk action bar */}
                {visibleCandidates.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={allSelectableSelected}
                                disabled={selectableCandidates.length === 0}
                                onCheckedChange={toggleSelectAll}
                            />
                            <span>
                                Pilih semua{' '}
                                {selectedSessionIds.length > 0
                                    ? `(${selectedSessionIds.length} terpilih)`
                                    : ''}
                            </span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={selectedSessionIds.length === 0}
                                onClick={() => setSelectedSessionIds([])}
                            >
                                Batal pilih
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                disabled={
                                    selectedSessionIds.length === 0 ||
                                    bulkBusy !== null
                                }
                                onClick={() => requestBulk('reject')}
                            >
                                <XCircle className="size-4" />
                                {bulkBusy === 'reject'
                                    ? 'Menolak...'
                                    : `Tolak (${selectedSessionIds.length})`}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={
                                    selectedSessionIds.length === 0 ||
                                    bulkBusy !== null
                                }
                                onClick={() => requestBulk('advance')}
                            >
                                <CheckCircle2 className="size-4" />
                                {bulkBusy === 'advance'
                                    ? 'Memproses...'
                                    : `Loloskan ke User (${selectedSessionIds.length})`}
                            </Button>
                        </div>
                    </div>
                ) : null}

                {/* Content */}
                {visibleCandidates.length === 0 ? (
                    <Card>
                        <CardContent className="p-10 text-center text-muted-foreground">
                            Tidak ada kandidat sesuai filter.
                        </CardContent>
                    </Card>
                ) : viewMode === 'cards' ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleCandidates.map((candidate, idx) => (
                            <CandidateCompareCard
                                key={candidate.id}
                                candidate={candidate}
                                rank={idx + 1}
                                selected={
                                    candidate.session_id !== null &&
                                    selectedSessionIds.includes(
                                        candidate.session_id,
                                    )
                                }
                                onToggleSelect={() =>
                                    candidate.session_id !== null &&
                                    toggleSelected(candidate.session_id)
                                }
                                onAdvance={() =>
                                    requestSingle(candidate, 'advance')
                                }
                                onReject={() =>
                                    requestSingle(candidate, 'reject')
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <ComparisonTable
                        candidates={visibleCandidates}
                        scorecardKeys={allScorecardKeys}
                        selectedSessionIds={selectedSessionIds}
                        onToggleSelect={toggleSelected}
                        onAdvance={(c) => requestSingle(c, 'advance')}
                        onReject={(c) => requestSingle(c, 'reject')}
                    />
                )}
            </div>

            <AlertDialog
                open={confirmAction !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction?.action === 'advance'
                                ? confirmAction.kind === 'bulk'
                                    ? `Loloskan ${selectedSessionIds.length} kandidat ke tahap user?`
                                    : `Loloskan ${confirmAction.candidate.candidate_name}?`
                                : confirmAction?.kind === 'bulk'
                                  ? `Tolak ${selectedSessionIds.length} kandidat?`
                                  : confirmAction?.kind === 'single'
                                    ? `Tolak ${confirmAction.candidate.candidate_name}?`
                                    : ''}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.action === 'advance'
                                ? 'Status kandidat akan dipindah ke tahap "Penawaran" dan kandidat akan menerima notifikasi bahwa lamarannya dilanjutkan.'
                                : 'Kandidat akan ditolak dan menerima notifikasi penolakan. Aksi ini tidak otomatis bisa dibatalkan dari halaman ini.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={bulkBusy !== null}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={bulkBusy !== null}
                            className={
                                confirmAction?.action === 'advance'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            }
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirm();
                            }}
                        >
                            {bulkBusy !== null
                                ? 'Memproses...'
                                : confirmAction?.action === 'advance'
                                  ? 'Ya, loloskan'
                                  : 'Ya, tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function CandidateCompareCard({
    candidate,
    rank,
    selected,
    onToggleSelect,
    onAdvance,
    onReject,
}: {
    candidate: Candidate;
    rank: number;
    selected: boolean;
    onToggleSelect: () => void;
    onAdvance: () => void;
    onReject: () => void;
}) {
    const score = candidate.fit_score ?? 0;
    const scoreEntries = Object.entries(candidate.scorecard ?? {});
    const finalDecision = FINAL_DECISION_STATUSES.includes(candidate.status);
    const decisionLabel =
        candidate.status === 'offer' || candidate.status === 'hired'
            ? 'Diloloskan'
            : candidate.status === 'rejected'
              ? 'Ditolak'
              : null;

    return (
        <Card
            className={cn(
                'overflow-hidden shadow-sm transition-all duration-150',
                selected ? 'border-primary-400 ring-2 ring-primary-100' : 'hover:shadow-md',
            )}
        >
            <CardHeader className="border-b bg-slate-50 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                            <Checkbox
                                checked={selected}
                                disabled={
                                    candidate.session_id === null ||
                                    finalDecision
                                }
                                onCheckedChange={onToggleSelect}
                            />
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                                {rank}
                            </span>
                            {rank === 1 ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    <Trophy className="size-3" />
                                    Terbaik
                                </Badge>
                            ) : null}
                            {decisionLabel ? (
                                <Badge
                                    className={
                                        decisionLabel === 'Diloloskan'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                                    }
                                >
                                    {decisionLabel}
                                </Badge>
                            ) : null}
                        </div>
                        <CardTitle className="truncate text-base">
                            {candidate.candidate_name}
                        </CardTitle>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {candidate.headline ?? candidate.email ?? '-'}
                        </p>
                    </div>
                    <div className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        rank === 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500',
                    )}>
                        {rank === 1 ? (
                            <Trophy className="size-5" />
                        ) : (
                            <Users className="size-5" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
                {(() => {
                    const tone = scoreToneClass(score);
                    const hasFitScore = candidate.fit_score != null;
                    return (
                        <div className={cn('rounded-xl px-4 py-3', tone.bg)}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Match Score
                                </p>
                                <span
                                    className={cn(
                                        'text-3xl font-extrabold tabular-nums',
                                        tone.text,
                                    )}
                                >
                                    {hasFitScore ? score : '–'}
                                </span>
                            </div>
                            {hasFitScore ? (
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                                    <div
                                        className={cn(
                                            'h-full rounded-full bg-gradient-to-r transition-all',
                                            tone.track,
                                        )}
                                        style={{
                                            width: `${Math.min(Math.max(score, 0), 100)}%`,
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                    Belum ada skor karena AI interview belum
                                    selesai.
                                </p>
                            )}
                        </div>
                    );
                })()}

                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                        Tahap: {candidate.status_label}
                    </Badge>
                    {candidate.session_id !== null ? (
                        <>
                            <Badge variant="outline" className="text-xs">
                                {formatMode(candidate.interview_mode)}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    candidate.interview_status === 'completed'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : candidate.interview_status ===
                                            'in_progress'
                                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                                          : 'border-slate-200 bg-slate-50 text-slate-600',
                                )}
                            >
                                AI: {formatAiStatus(candidate.interview_status)}
                            </Badge>
                        </>
                    ) : (
                        <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-xs text-slate-500"
                        >
                            Belum AI Interview
                        </Badge>
                    )}
                </div>

                {candidate.summary ? (
                    <p className="line-clamp-3 rounded-lg border-l-2 border-primary-200 bg-slate-50/50 px-3 py-2 text-sm leading-6 text-slate-700">
                        {candidate.summary}
                    </p>
                ) : null}

                {scoreEntries.length > 0 ? (
                    <div className="space-y-2.5 rounded-xl border bg-slate-50/50 p-3">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Scorecard
                        </p>
                        {scoreEntries.slice(0, 4).map(([label, value]) => (
                            <div key={label}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                    <span className="capitalize text-slate-600">
                                        {label.replaceAll('_', ' ')}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {value}%
                                    </span>
                                </div>
                                <ProgressBar value={value} />
                            </div>
                        ))}
                    </div>
                ) : null}

                {candidate.strengths.length > 0 ||
                candidate.weaknesses.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                <Sparkles className="size-3.5" />
                                Kekuatan
                            </p>
                            <ul className="space-y-1.5">
                                {candidate.strengths.length > 0 ? (
                                    candidate.strengths
                                        .slice(0, 2)
                                        .map((s) => (
                                            <li
                                                key={s}
                                                className="flex gap-1.5 text-xs text-slate-700"
                                            >
                                                <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                                                <span className="line-clamp-2">
                                                    {s}
                                                </span>
                                            </li>
                                        ))
                                ) : (
                                    <li className="text-xs text-slate-400 italic">
                                        Belum tersedia
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                <BarChart3 className="size-3.5" />
                                Perbaikan
                            </p>
                            <ul className="space-y-1.5">
                                {candidate.weaknesses.length > 0 ? (
                                    candidate.weaknesses
                                        .slice(0, 2)
                                        .map((s) => (
                                            <li
                                                key={s}
                                                className="flex gap-1.5 text-xs text-slate-700"
                                            >
                                                <X className="mt-0.5 size-3 shrink-0 text-amber-500" />
                                                <span className="line-clamp-2">
                                                    {s}
                                                </span>
                                            </li>
                                        ))
                                ) : (
                                    <li className="text-xs text-slate-400 italic">
                                        Belum tersedia
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                ) : null}

                {candidate.session_id === null && !candidate.summary ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                        <Bot className="mx-auto size-5 text-slate-400" />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Kandidat belum dijadwalkan AI Interview.
                        </p>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    {candidate.session_id !== null ? (
                        <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={showAiInterview(candidate.session_id)}>
                                Detail
                            </Link>
                        </Button>
                    ) : null}
                    {!finalDecision && candidate.session_id !== null ? (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={onReject}
                            >
                                <XCircle className="size-3.5" />
                                Tolak
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={onAdvance}
                            >
                                <CheckCircle2 className="size-3.5" />
                                Loloskan
                            </Button>
                        </>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

function ComparisonTable({
    candidates,
    scorecardKeys,
    selectedSessionIds,
    onToggleSelect,
    onAdvance,
    onReject,
}: {
    candidates: Candidate[];
    scorecardKeys: string[];
    selectedSessionIds: number[];
    onToggleSelect: (sessionId: number) => void;
    onAdvance: (c: Candidate) => void;
    onReject: (c: Candidate) => void;
}) {
    return (
        <Card>
            <CardContent className="overflow-x-auto p-0">
                <Table className="min-w-225">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-48 align-bottom">
                                Kriteria
                            </TableHead>
                            {candidates.map((c, idx) => {
                                const finalDecision =
                                    FINAL_DECISION_STATUSES.includes(c.status);
                                return (
                                    <TableHead
                                        key={c.id}
                                        className="min-w-56 align-top"
                                    >
                                        <div className="space-y-2 py-2">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={
                                                        c.session_id !== null &&
                                                        selectedSessionIds.includes(
                                                            c.session_id,
                                                        )
                                                    }
                                                    disabled={
                                                        c.session_id === null ||
                                                        finalDecision
                                                    }
                                                    onCheckedChange={() =>
                                                        c.session_id !== null &&
                                                        onToggleSelect(
                                                            c.session_id,
                                                        )
                                                    }
                                                />
                                                <Badge variant="outline">
                                                    #{idx + 1}
                                                </Badge>
                                            </div>
                                            <p className="font-semibold text-foreground">
                                                {c.candidate_name}
                                            </p>
                                            <p className="text-xs font-normal text-muted-foreground">
                                                {c.headline ?? c.email ?? '-'}
                                            </p>
                                            {c.session_id !== null &&
                                            !finalDecision ? (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 border-red-200 text-red-700 hover:bg-red-50"
                                                        onClick={() =>
                                                            onReject(c)
                                                        }
                                                    >
                                                        Tolak
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                                                        onClick={() =>
                                                            onAdvance(c)
                                                        }
                                                    >
                                                        Loloskan
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">
                                Fit Score
                            </TableCell>
                            {candidates.map((c) => {
                                const hasScore = c.fit_score != null;
                                const tone = scoreToneClass(c.fit_score ?? 0);
                                return (
                                    <TableCell key={c.id}>
                                        <p
                                            className={cn(
                                                'text-2xl font-bold',
                                                hasScore
                                                    ? tone.text
                                                    : 'text-slate-400',
                                            )}
                                        >
                                            {hasScore ? c.fit_score : '–'}
                                        </p>
                                        {hasScore ? (
                                            <ProgressBar
                                                value={c.fit_score ?? 0}
                                            />
                                        ) : (
                                            <p className="text-xs text-slate-400">
                                                Belum diskor
                                            </p>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">
                                Status Seleksi
                            </TableCell>
                            {candidates.map((c) => (
                                <TableCell key={c.id}>
                                    <Badge variant="outline">
                                        {c.status_label}
                                    </Badge>
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">
                                Status AI
                            </TableCell>
                            {candidates.map((c) => (
                                <TableCell key={c.id} className="text-sm">
                                    {c.session_id !== null ? (
                                        <Badge
                                            variant="outline"
                                            className={
                                                c.interview_status ===
                                                'completed'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : c.interview_status ===
                                                        'in_progress'
                                                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                                            }
                                        >
                                            {formatAiStatus(c.interview_status)}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Belum AI
                                        </span>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">
                                Selesai
                            </TableCell>
                            {candidates.map((c) => (
                                <TableCell
                                    key={c.id}
                                    className="text-xs text-muted-foreground"
                                >
                                    {c.completed_at ?? '-'}
                                </TableCell>
                            ))}
                        </TableRow>
                        {scorecardKeys.map((key) => (
                            <TableRow key={key}>
                                <TableCell className="font-medium capitalize">
                                    {key.replaceAll('_', ' ')}
                                </TableCell>
                                {candidates.map((c) => {
                                    const value = c.scorecard?.[key];
                                    return (
                                        <TableCell key={c.id}>
                                            {typeof value === 'number' ? (
                                                <>
                                                    <span className="text-sm font-semibold">
                                                        {value}%
                                                    </span>
                                                    <ProgressBar value={value} />
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell className="font-medium">
                                Kekuatan
                            </TableCell>
                            {candidates.map((c) => (
                                <TableCell key={c.id}>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        {(c.strengths.length
                                            ? c.strengths
                                            : ['-']
                                        )
                                            .slice(0, 3)
                                            .map((s) => (
                                                <li
                                                    key={s}
                                                    className="flex gap-1"
                                                >
                                                    <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">
                                Perbaikan
                            </TableCell>
                            {candidates.map((c) => (
                                <TableCell key={c.id}>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        {(c.weaknesses.length
                                            ? c.weaknesses
                                            : ['-']
                                        )
                                            .slice(0, 3)
                                            .map((s) => (
                                                <li
                                                    key={s}
                                                    className="flex gap-1"
                                                >
                                                    <X className="mt-0.5 size-3 shrink-0 text-amber-600" />
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatPill({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'slate' | 'green' | 'red' | 'primary';
}) {
    const tones: Record<typeof tone, string> = {
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        primary: 'bg-primary-50 text-primary-700 border-primary-200',
    };
    return (
        <div
            className={cn(
                'rounded-xl border px-3 py-2 text-center',
                tones[tone],
            )}
        >
            <p className="text-xs font-medium opacity-80">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    );
}
