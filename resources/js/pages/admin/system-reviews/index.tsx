import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { cleanPaginationLabel, shouldRenderPagination } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import { Check, Clock, History, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
    approve,
    index as adminSystemReviewsIndex,
    reject,
} from '@/routes/admin/system-reviews';

type Review = {
    id: number;
    rating: number;
    review: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string | null;
    reviewed_at: string | null;
    reviewer_name: string | null;
    user: {
        id: number | null;
        name: string | null;
        email: string | null;
        role: string | null;
        avatar_url: string | null;
    };
};

type IndexProps = {
    tab: 'pending' | 'history';
    search: string;
    reviews: {
        data: Review[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    counts: { pending: number; history: number };
};

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        'size-3.5',
                        i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25',
                    )}
                />
            ))}
            <span className="ml-1 text-xs font-semibold text-muted-foreground">{rating}/5</span>
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'approved') {
        return (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Disetujui
            </Badge>
        );
    }
    if (status === 'rejected') {
        return <Badge className="border-red-200 bg-red-50 text-red-700">Ditolak</Badge>;
    }
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Menunggu</Badge>;
}

function ApproveButton({ review }: { review: Review }) {
    return (
        <Button
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
            onClick={() =>
                router.patch(approve(review.id).url, {}, { preserveScroll: true })
            }
        >
            <Check className="size-3" />
            Setujui
        </Button>
    );
}

function RejectButton({ review }: { review: Review }) {
    const [open, setOpen] = useState(false);
    const form = useForm<{ rejection_reason: string }>({ rejection_reason: '' });

    const submit = () => {
        form.patch(reject(review.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset('rejection_reason');
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50"
                >
                    <X className="size-3" />
                    Tolak
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tolak ulasan?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Berikan alasan agar pengguna mengerti kenapa ulasan ditolak (opsional).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    rows={3}
                    value={form.data.rejection_reason}
                    onChange={(e) => form.setData('rejection_reason', e.target.value)}
                    placeholder="Alasan penolakan…"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={form.processing}>
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={submit}
                        disabled={form.processing}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {form.processing ? 'Menolak…' : 'Tolak'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ReviewCard({ review, showActions }: { review: Review; showActions: boolean }) {
    const getInitials = useInitials();

    return (
        <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0">
                        <AvatarImage
                            src={review.user.avatar_url ?? undefined}
                            alt={review.user.name ?? ''}
                            className="object-cover"
                        />
                        <AvatarFallback>
                            {getInitials(review.user.name ?? '?')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                                {review.user.name ?? 'Pengguna'}
                            </p>
                            <Badge variant="outline" className="text-[10px] uppercase">
                                {review.user.role ?? '-'}
                            </Badge>
                            <StatusBadge status={review.status} />
                        </div>
                        {review.user.email && (
                            <p className="text-xs text-muted-foreground">{review.user.email}</p>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <StarRating rating={review.rating} />
                        <span className="text-[11px] text-muted-foreground">
                            {review.created_at}
                        </span>
                    </div>
                </div>

                <p className="whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                    {review.review}
                </p>

                {review.status !== 'pending' && (
                    <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        <p>
                            <span className="font-semibold">{review.reviewer_name ?? '-'}</span>{' '}
                            ·{' '}
                            {review.status === 'approved' ? 'menyetujui' : 'menolak'} pada{' '}
                            {review.reviewed_at ?? '-'}
                        </p>
                        {review.rejection_reason && (
                            <p className="mt-1 italic">Alasan: {review.rejection_reason}</p>
                        )}
                    </div>
                )}

                {showActions && (
                    <div className="flex justify-end gap-2 border-t pt-3">
                        <RejectButton review={review} />
                        <ApproveButton review={review} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminSystemReviewsIndex({
    tab,
    search,
    reviews,
    counts,
}: IndexProps) {
    const { t } = useTranslate();
    const [searchValue, setSearchValue] = useState(search);

    const setTab = (next: string) => {
        router.get(
            adminSystemReviewsIndex({ query: { tab: next } }).url,
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            adminSystemReviewsIndex({ query: { tab, search: searchValue } }).url,
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const TAB_CONFIG = [
        {
            value: 'pending',
            label: 'Menunggu Moderasi',
            count: counts.pending,
            icon: Clock,
            activeColor: 'border-amber-500 text-amber-700 bg-amber-50',
        },
        {
            value: 'history',
            label: 'Riwayat',
            count: counts.history,
            icon: History,
            activeColor: 'border-primary text-primary bg-primary/5',
        },
    ] as const;

    return (
        <>
            <Head title={t('admin.system_reviews_index.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Sparkles className="size-6 text-primary" />
                        {t('admin.system_reviews_index.page_title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('admin.system_reviews_index.description')}
                    </p>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-3">
                    {TAB_CONFIG.map((cfg) => {
                        const Icon = cfg.icon;
                        const isActive = tab === cfg.value;
                        return (
                            <button
                                key={cfg.value}
                                type="button"
                                onClick={() => setTab(cfg.value)}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:shadow-sm',
                                    isActive
                                        ? cfg.activeColor + ' shadow-sm'
                                        : 'border-border bg-white hover:border-border/80',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                        isActive ? 'bg-white/60' : 'bg-muted',
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                                    <p className="text-xl font-bold tabular-nums">{cfg.count}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <Card className="overflow-hidden p-0">
                    <CardHeader className="border-b bg-slate-50/80 px-4 py-3">
                        <form
                            key={`${tab}-${search}`}
                            onSubmit={submitSearch}
                            className="flex flex-wrap items-center gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    {TAB_CONFIG.find((c) => c.value === tab)?.label}
                                </span>
                                <Badge variant="secondary" className="tabular-nums">
                                    {reviews.data.length} ditampilkan
                                </Badge>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="Cari ulasan / nama / email…"
                                        className="h-8 w-64 pl-8 text-sm"
                                    />
                                </div>
                                <Button type="submit" size="sm" className="h-8 gap-1.5 px-3 text-xs">
                                    <Search className="size-3" />
                                    Cari
                                </Button>
                                {search && (
                                    <Button
                                        asChild
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 px-3 text-xs"
                                    >
                                        <Link href={adminSystemReviewsIndex({ query: { tab } }).url}>
                                            <RotateCcw className="size-3" />
                                            Reset
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>

                    <CardContent className="space-y-3 p-4">
                        {reviews.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                                <Sparkles className="size-8 opacity-20" />
                                <p className="text-sm">Tidak ada ulasan di tab ini.</p>
                            </div>
                        ) : (
                            reviews.data.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    showActions={tab === 'pending'}
                                />
                            ))
                        )}

                        {shouldRenderPagination(reviews.links) && (
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                                {reviews.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        asChild={Boolean(link.url)}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 min-w-8 px-2.5 text-xs"
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url}>{cleanPaginationLabel(link.label)}</Link>
                                        ) : (
                                            <span>{cleanPaginationLabel(link.label)}</span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminSystemReviewsIndex.layout = {
    breadcrumbs: [{ title: 'Ulasan Karivia', href: adminSystemReviewsIndex() }],
};
