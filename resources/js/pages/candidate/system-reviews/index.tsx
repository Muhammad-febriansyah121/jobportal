import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Send, Sparkles, Star, Trash2, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { destroy, index, store } from '@/routes/candidate/system-reviews';

type Review = {
    id: number;
    rating: number;
    review: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
    created_at?: string | null;
    reviewed_at?: string | null;
};

type Props = {
    review: Review | null;
};

export default function CandidateSystemReviewsIndex({ review }: Props) {
    const { t } = useTranslate();
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const form = useForm({
        rating: review?.rating ?? 0,
        review: review?.review ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (!review) {
            return;
        }
        router.delete(destroy(review.id).url, { preserveScroll: true });
    };

    const STATUS_CONFIG = {
        pending: {
            label: t('candidate.system_reviews.status_pending_label'),
            desc: t('candidate.system_reviews.status_pending_desc'),
            icon: Clock,
            class: 'border-amber-300 bg-amber-50 text-amber-700',
        },
        approved: {
            label: t('candidate.system_reviews.status_approved_label'),
            desc: t('candidate.system_reviews.status_approved_desc'),
            icon: CheckCircle2,
            class: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        },
        rejected: {
            label: t('candidate.system_reviews.status_rejected_label'),
            desc: t('candidate.system_reviews.status_rejected_desc'),
            icon: XCircle,
            class: 'border-red-300 bg-red-50 text-red-700',
        },
    } as const;

    const currentRating = hoverRating ?? form.data.rating;

    return (
        <>
            <Head title={t('candidate.system_reviews.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Sparkles className="size-6 text-primary" />
                        {t('candidate.system_reviews.heading_title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('candidate.system_reviews.heading_desc')}
                    </p>
                </div>

                {review && (
                    <div
                        className={cn(
                            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
                            STATUS_CONFIG[review.status].class,
                        )}
                    >
                        {(() => {
                            const Icon = STATUS_CONFIG[review.status].icon;
                            return <Icon className="mt-0.5 size-4 shrink-0" />;
                        })()}
                        <div className="flex-1">
                            <p className="font-semibold">
                                {STATUS_CONFIG[review.status].label}
                            </p>
                            <p className="mt-0.5 opacity-80">
                                {STATUS_CONFIG[review.status].desc}
                            </p>
                            {review.status === 'rejected' && review.rejection_reason && (
                                <p className="mt-2 rounded-md bg-white/60 px-3 py-2 text-xs">
                                    <span className="font-semibold">
                                        {t('candidate.system_reviews.rejection_reason_label')}:
                                    </span>{' '}
                                    {review.rejection_reason}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {review
                                ? t('candidate.system_reviews.form_title_update')
                                : t('candidate.system_reviews.form_title_new')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-5" onSubmit={submit}>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    {t('candidate.system_reviews.rating_label')}
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
                                                    'size-8',
                                                    star <= currentRating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-muted-foreground/30',
                                                )}
                                            />
                                        </button>
                                    ))}
                                    {form.data.rating > 0 && (
                                        <span className="ml-2 text-sm font-semibold text-muted-foreground">
                                            {form.data.rating}/5
                                        </span>
                                    )}
                                </div>
                                {form.errors.rating && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.rating}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="review"
                                    className="text-sm font-semibold"
                                >
                                    {t('candidate.system_reviews.review_label')}
                                </label>
                                <textarea
                                    id="review"
                                    name="review"
                                    rows={5}
                                    maxLength={1000}
                                    value={form.data.review}
                                    onChange={(e) =>
                                        form.setData('review', e.target.value)
                                    }
                                    placeholder={t(
                                        'candidate.system_reviews.review_placeholder',
                                    )}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {form.errors.review || (
                                            <span className="text-muted-foreground/70">
                                                {t(
                                                    'candidate.system_reviews.review_hint',
                                                )}
                                            </span>
                                        )}
                                    </span>
                                    <span>{form.data.review.length}/1000</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    <Send className="size-4" />
                                    {form.processing
                                        ? t('candidate.system_reviews.btn_saving')
                                        : review
                                          ? t('candidate.system_reviews.btn_update')
                                          : t('candidate.system_reviews.btn_submit')}
                                </Button>

                                {review && review.status === 'pending' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="size-4" />
                                        {t('candidate.system_reviews.btn_delete')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CandidateSystemReviewsIndex.layout = {
    breadcrumbs: [{ title: 'Ulasan Karivia', href: index() }],
};
