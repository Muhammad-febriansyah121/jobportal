import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Clock,
    MessageSquare,
    PenSquare,
    Send,
    Star,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
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
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { destroy, index, store } from '@/routes/candidate/company-reviews';

type Review = {
    id: number;
    company_id: number;
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

type EligibleCompany = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
};

type Props = {
    reviews: Review[];
    eligible_companies: EligibleCompany[];
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

function ReviewForm({
    eligibleCompanies,
    onClose,
}: {
    eligibleCompanies: EligibleCompany[];
    onClose: () => void;
}) {
    const { t } = useTranslate();
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const form = useForm({
        company_id: eligibleCompanies[0]?.id ?? 0,
        rating: 5,
        title: '',
        review: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const currentRating = hoverRating ?? form.data.rating;

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
                <label htmlFor="company_id" className="text-sm font-semibold">
                    {t('candidate.company_reviews.form_company_label')}
                </label>
                <select
                    id="company_id"
                    value={form.data.company_id}
                    onChange={(e) =>
                        form.setData('company_id', Number(e.target.value))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    {eligibleCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
                {form.errors.company_id && (
                    <p className="text-xs text-destructive">{form.errors.company_id}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold">
                    {t('candidate.company_reviews.form_rating_label')}
                </label>
                <div
                    className="flex items-center gap-1"
                    onMouseLeave={() => setHoverRating(null)}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => form.setData('rating', star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className="transition-transform hover:scale-110"
                            aria-label={`${star} stars`}
                        >
                            <Star
                                className={cn(
                                    'size-7',
                                    star <= currentRating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-muted-foreground/30',
                                )}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-muted-foreground">
                        {form.data.rating}/5
                    </span>
                </div>
                {form.errors.rating && (
                    <p className="text-xs text-destructive">{form.errors.rating}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-semibold">
                    {t('candidate.company_reviews.form_title_label')}
                </label>
                <input
                    id="title"
                    type="text"
                    maxLength={120}
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    placeholder={t('candidate.company_reviews.form_title_placeholder')}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                {form.errors.title && (
                    <p className="text-xs text-destructive">{form.errors.title}</p>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="review" className="text-sm font-semibold">
                    {t('candidate.company_reviews.form_review_label')}
                </label>
                <textarea
                    id="review"
                    rows={5}
                    maxLength={1000}
                    value={form.data.review}
                    onChange={(e) => form.setData('review', e.target.value)}
                    placeholder={t('candidate.company_reviews.form_review_placeholder')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-destructive">{form.errors.review}</span>
                    <span>{form.data.review.length}/1000</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button type="submit" disabled={form.processing}>
                    <Send className="size-4" />
                    {form.processing
                        ? t('candidate.company_reviews.btn_saving')
                        : t('candidate.company_reviews.btn_submit_review')}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                    {t('candidate.company_reviews.btn_cancel')}
                </Button>
            </div>
        </form>
    );
}

export default function CandidateCompanyReviewsIndex({
    reviews,
    eligible_companies,
}: Props) {
    const { t } = useTranslate();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const STATUS_CONFIG = {
        pending: {
            label: t('candidate.company_reviews.status_pending_label'),
            icon: Clock,
            badgeClass: 'border-amber-300 bg-amber-50 text-amber-700',
            description: t('candidate.company_reviews.status_pending_desc'),
        },
        approved: {
            label: t('candidate.company_reviews.status_approved_label'),
            icon: CheckCircle2,
            badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700',
            description: t('candidate.company_reviews.status_approved_desc'),
        },
        rejected: {
            label: t('candidate.company_reviews.status_rejected_label'),
            icon: XCircle,
            badgeClass: 'border-red-300 bg-red-50 text-red-700',
            description: t('candidate.company_reviews.status_rejected_desc'),
        },
    };

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
    const canCreate = eligible_companies.length > 0;

    return (
        <>
            <Head title={t('candidate.company_reviews.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('candidate.company_reviews.heading_title')}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('candidate.company_reviews.heading_desc')}
                        </p>
                    </div>
                    {canCreate && !showForm && (
                        <Button onClick={() => setShowForm(true)}>
                            <PenSquare className="size-4" />
                            {t('candidate.company_reviews.btn_new_review')}
                        </Button>
                    )}
                </div>

                {/* Stats strip */}
                {reviews.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                            <MessageSquare className="size-4 text-muted-foreground" />
                            <span className="font-semibold">{reviews.length}</span>
                            <span className="text-muted-foreground">{t('candidate.company_reviews.stat_written')}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span className="font-semibold">{approvedCount}</span>
                            <span className="text-muted-foreground">{t('candidate.company_reviews.stat_approved')}</span>
                        </div>
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                                <Clock className="size-4 text-amber-500" />
                                <span className="font-semibold">{pendingCount}</span>
                                <span className="text-muted-foreground">{t('candidate.company_reviews.stat_pending')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Inline form */}
                {showForm && canCreate && (
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="mb-4 text-base font-semibold">
                                {t('candidate.company_reviews.form_section_title')}
                            </h2>
                            <ReviewForm
                                eligibleCompanies={eligible_companies}
                                onClose={() => setShowForm(false)}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Notice */}
                <div className="rounded-xl border border-[#01296a]/20 bg-[#01296a]/5 px-4 py-3 text-sm text-[#01296a]">
                    <p className="font-semibold">{t('candidate.company_reviews.notice_title')}</p>
                    <p className="mt-1 text-[#01296a]/80">
                        {t('candidate.company_reviews.notice_description')}
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
                                <p className="font-semibold">{t('candidate.company_reviews.empty_title')}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {canCreate
                                        ? t('candidate.company_reviews.empty_desc_can_create')
                                        : t('candidate.company_reviews.empty_desc')}
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
                                                        {t('candidate.company_reviews.btn_hapus')}
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
                                                <p className="font-medium text-red-700">{t('candidate.company_reviews.rejection_reason_label')}</p>
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
                        <DialogTitle>{t('candidate.company_reviews.delete_title')}</DialogTitle>
                        <DialogDescription>
                            {t('candidate.company_reviews.delete_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>
                            {t('candidate.company_reviews.btn_cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t('candidate.company_reviews.btn_deleting') : t('candidate.company_reviews.btn_delete')}
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
