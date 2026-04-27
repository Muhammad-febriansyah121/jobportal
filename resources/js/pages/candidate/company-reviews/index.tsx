import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Clock,
    MessageSquare,
    PlusCircle,
    Star,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { destroy, index } from '@/routes/candidate/company-reviews';

type Review = {
    id: number;
    company_name: string;
    company_slug: string;
    company_logo: string | null;
    rating: number;
    title: string | null;
    review: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
};

type Props = {
    reviews: Review[];
};

const STATUS_CONFIG = {
    pending: {
        label: 'Menunggu Pratinjau',
        icon: Clock,
        badgeClass: 'border-amber-300 bg-amber-50 text-amber-700',
        description: 'Menunggu konfirmasi dari perusahaan.',
    },
    approved: {
        label: 'Disetujui',
        icon: CheckCircle2,
        badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        description: 'Ulasan kamu sudah tampil publik.',
    },
    rejected: {
        label: 'Ditolak',
        icon: XCircle,
        badgeClass: 'border-red-300 bg-red-50 text-red-700',
        description: 'Ulasan tidak disetujui oleh perusahaan.',
    },
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`size-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                />
            ))}
            <span className="ml-1 text-xs font-medium text-muted-foreground">{rating}/5</span>
        </div>
    );
}

export default function CandidateCompanyReviewsIndex({ reviews }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deletingId) {
            return;
        }

        setIsDeleting(true);
        router.delete(destroy(deletingId).url, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletingId(null);
            },
        });
    }

    const pendingCount = reviews.filter((r) => r.status === 'pending').length;
    const approvedCount = reviews.filter((r) => r.status === 'approved').length;

    return (
        <>
            <Head title="Ulasan Perusahaan Saya" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ulasan Perusahaan</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ulasan yang kamu tulis untuk perusahaan tempat kamu pernah bekerja.
                        </p>
                    </div>
                </div>

                {/* Stats strip */}
                {reviews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                            <MessageSquare className="size-4 text-muted-foreground" />
                            <span className="font-semibold">{reviews.length}</span>
                            <span className="text-muted-foreground">ulasan ditulis</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span className="font-semibold">{approvedCount}</span>
                            <span className="text-muted-foreground">disetujui</span>
                        </div>
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                                <Clock className="size-4 text-amber-500" />
                                <span className="font-semibold">{pendingCount}</span>
                                <span className="text-muted-foreground">menunggu pratinjau</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Notice */}
                <div className="rounded-xl border border-[#01296a]/20 bg-[#01296a]/5 px-4 py-3 text-sm text-[#01296a]">
                    <p className="font-semibold">Cara kerja ulasan:</p>
                    <p className="mt-1 text-[#01296a]/80">
                        Ulasan yang kamu kirim akan ditinjau terlebih dahulu oleh perusahaan. Setelah
                        disetujui, ulasan akan tampil publik di halaman profil perusahaan.
                    </p>
                </div>

                {/* Reviews list */}
                {reviews.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                <Star className="size-7 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold">Belum ada ulasan</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kamu belum pernah menulis ulasan untuk perusahaan manapun.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => {
                            const cfg = STATUS_CONFIG[review.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                            const StatusIcon = cfg.icon;
                            const canDelete = review.status === 'pending';

                            return (
                                <Card key={review.id} className="overflow-hidden">
                                    {/* Status bar */}
                                    <div
                                        className={`flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold ${cfg.badgeClass}`}
                                    >
                                        <StatusIcon className="size-3.5" />
                                        {cfg.label}
                                        <span className="ml-auto font-normal opacity-70">
                                            {cfg.description}
                                        </span>
                                    </div>

                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            {/* Company info */}
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                                    {review.company_logo ? (
                                                        <img
                                                            src={review.company_logo}
                                                            alt={review.company_name}
                                                            className="size-full object-contain"
                                                        />
                                                    ) : (
                                                        <Building2 className="size-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold leading-tight">
                                                        {review.company_name}
                                                    </p>
                                                    <StarRating rating={review.rating} />
                                                </div>
                                            </div>

                                            {/* Date & delete */}
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {review.reviewed_at ?? review.created_at}
                                                </span>
                                                {canDelete && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 gap-1.5 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => setDeletingId(review.id)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Hapus
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Review content */}
                                        <div className="mt-3 space-y-1">
                                            {review.title && (
                                                <p className="text-sm font-semibold">{review.title}</p>
                                            )}
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {review.review}
                                            </p>
                                        </div>

                                        {/* Rejection reason */}
                                        {review.status === 'rejected' && review.rejection_reason && (
                                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                                                <p className="font-medium text-red-700">Alasan penolakan:</p>
                                                <p className="mt-0.5 text-red-600">
                                                    {review.rejection_reason}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete confirm dialog */}
            <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus ulasan?</DialogTitle>
                        <DialogDescription>
                            Ulasan ini akan dihapus permanen dan tidak dapat dikembalikan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Menghapus…' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CandidateCompanyReviewsIndex.layout = {
    breadcrumbs: [{ title: 'Ulasan Perusahaan', href: index() }],
};
