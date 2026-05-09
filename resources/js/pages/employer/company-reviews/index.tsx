import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Star,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AdminActionList } from '@/components/admin/admin-action';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { EmptyState } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { approve, deleteReply, flag, index, reject, reply } from '@/routes/employer/reviews';
import type { AdminPaginatedRows } from '@/types';

type PendingReview = {
    id: number;
    rating: number;
    title: string | null;
    review: string | null;
    candidate_name: string;
    created_at: string;
};

type ApprovedReview = {
    id: number;
    rating: number;
    title: string | null;
    review: string | null;
    reviewed_at: string | null;
    candidate_name: string;
    employer_reply: string | null;
    employer_replied_at: string | null;
    flag_reason: string | null;
    flagged_at: string | null;
    flag_resolved_at: string | null;
};

type EmployerReviewsProps = {
    company: { id: number; name: string };
    pending: PendingReview[];
    reviews: { data: ApprovedReview[]; links?: { url: string | null; label: string; active: boolean }[] };
    stats: { total: number; avg: number; pending_count: number };
};

type ActiveTab = 'pending' | 'approved';

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`size-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>
        </div>
    );
}

function toApprovedRows(reviews: ApprovedReview[], t: (key: string) => string): AdminPaginatedRows['data'] {
    return reviews.map((review) => {
        const isFlagPending = Boolean(review.flagged_at) && !review.flag_resolved_at;
        const hasReply = Boolean(review.employer_reply);

        return {
            id: review.id,
            candidate_name: review.candidate_name,
            rating: `${review.rating}/5`,
            title: review.title ?? '-',
            review: review.review
                ? review.review.length > 80
                    ? review.review.slice(0, 80) + '…'
                    : review.review
                : '-',
            status_balasan: hasReply
                ? { label: t('employer.company_reviews.replied'), tone: 'success' as const }
                : { label: t('employer.company_reviews.not_replied'), tone: 'neutral' as const },
            status_laporan: isFlagPending
                ? { label: t('employer.company_reviews.reported'), tone: 'warning' as const }
                : { label: '-', tone: 'neutral' as const },
            reviewed_at: review.reviewed_at ?? '-',
            actions: [
                {
                    label: hasReply ? t('employer.company_reviews.edit_reply') : t('employer.company_reviews.reply_action'),
                    href: reply(review.id).url,
                    icon: 'Pencil',
                    method: 'post' as const,
                    fields: [
                        {
                            name: 'employer_reply',
                            label: t('employer.company_reviews.reply'),
                            type: 'textarea' as const,
                            value: review.employer_reply ?? '',
                            placeholder: t('employer.company_reviews.reply_placeholder'),
                            required: true,
                        },
                    ],
                },
                ...(hasReply
                    ? [
                          {
                              label: t('employer.company_reviews.delete_reply'),
                              href: deleteReply(review.id).url,
                              icon: 'Trash',
                              method: 'delete' as const,
                              variant: 'destructive' as const,
                              confirmTitle: t('employer.company_reviews.delete_reply_title'),
                              confirmDescription: t('employer.company_reviews.delete_reply_description'),
                          },
                      ]
                    : []),
                ...(!isFlagPending
                    ? [
                          {
                              label: t('employer.company_reviews.report_action'),
                              href: flag(review.id).url,
                              icon: 'Ban',
                              method: 'post' as const,
                              variant: 'outline' as const,
                              confirmTitle: t('employer.company_reviews.report_title'),
                              confirmDescription: t('employer.company_reviews.report_description'),
                              fields: [
                                  {
                                      name: 'flag_reason',
                                      label: t('employer.company_reviews.report_reason'),
                                      type: 'textarea' as const,
                                      placeholder: t('employer.company_reviews.report_reason_placeholder'),
                                      required: true,
                                  },
                              ],
                          },
                      ]
                    : []),
            ],
        };
    });
}

export default function EmployerCompanyReviewsIndex({
    company,
    pending,
    reviews,
    stats,
}: EmployerReviewsProps) {
    const { t } = useTranslate();
    const [activeTab, setActiveTab] = useState<ActiveTab>(
        pending.length > 0 ? 'pending' : 'approved',
    );
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const approvedColumns = [
        { key: 'candidate_name', label: t('employer.company_reviews.col_candidate') },
        { key: 'rating', label: t('employer.company_reviews.col_rating') },
        { key: 'title', label: t('employer.company_reviews.col_title') },
        { key: 'review', label: t('employer.company_reviews.col_review') },
        { key: 'status_balasan', label: t('employer.company_reviews.col_reply') },
        { key: 'status_laporan', label: t('employer.company_reviews.col_report') },
        { key: 'reviewed_at', label: t('employer.company_reviews.col_date') },
    ];

    const approvedRows: AdminPaginatedRows = {
        data: toApprovedRows(reviews.data, t),
        links: reviews.links,
    };

    function handleApprove(id: number) {
        router.patch(approve(id).url, {}, {
            preserveScroll: true,
        });
    }

    function handleReject() {
        if (!rejectingId) {
            return;
        }

        setIsSubmitting(true);
        router.patch(
            reject(rejectingId).url,
            { rejection_reason: rejectReason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmitting(false);
                    setRejectingId(null);
                    setRejectReason('');
                },
            },
        );
    }

    return (
        <>
            <Head title={t('employer.company_reviews.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.company_reviews.page_heading', { company: company.name })}
                    description={t('employer.company_reviews.page_description')}
                />

                {/* Stats strip */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{stats.avg > 0 ? stats.avg : '-'}</span>
                        <span className="text-muted-foreground">{t('employer.company_reviews.rating_avg')}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="font-bold">{stats.total}</span>
                        <span className="text-muted-foreground">{t('employer.company_reviews.public_count')}</span>
                    </div>
                    {stats.pending_count > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm shadow-xs">
                            <Clock className="size-4 text-amber-600" />
                            <span className="font-bold text-amber-700">{stats.pending_count}</span>
                            <span className="text-amber-600">{t('employer.company_reviews.pending_label')}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                            activeTab === 'pending'
                                ? 'bg-white shadow-xs text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Clock className="size-4" />
                        {t('employer.company_reviews.tab_pending')}
                        {pending.length > 0 && (
                            <Badge className="ml-1 bg-amber-500 px-1.5 py-0 text-[10px] text-white">
                                {pending.length}
                            </Badge>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('approved')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                            activeTab === 'approved'
                                ? 'bg-white shadow-xs text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <CheckCircle2 className="size-4" />
                        {t('employer.company_reviews.tab_approved')}
                        {stats.total > 0 && (
                            <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
                                {stats.total}
                            </Badge>
                        )}
                    </button>
                </div>

                {/* Pending tab */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pending.length === 0 ? (
                            <EmptyState
                                title={t('employer.company_reviews.empty_pending_title')}
                                description={t('employer.company_reviews.empty_pending_desc')}
                            />
                        ) : (
                            <>
                                <div className="rounded-xl border border-[#01296a]/20 bg-[#01296a]/5 px-4 py-3 text-sm text-[#01296a]">
                                    <p>
                                        {t('employer.company_reviews.pending_notice_prefix')}{' '}
                                        <strong>{t('employer.company_reviews.approve_lower')}</strong>{' '}
                                        {t('employer.company_reviews.pending_notice_middle')}{' '}
                                        <strong>{t('employer.company_reviews.reject_lower')}</strong>{' '}
                                        {t('employer.company_reviews.pending_notice_suffix')}
                                    </p>
                                </div>

                                {pending.map((review) => (
                                    <Card key={review.id} className="overflow-hidden">
                                        <CardHeader className="border-b bg-slate-50 pb-3 dark:bg-muted/20">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <CardTitle className="text-sm font-semibold">
                                                        {review.candidate_name}
                                                    </CardTitle>
                                                    <StarRating rating={review.rating} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {review.created_at}
                                                    </span>
                                                    <Badge className="border-amber-300 bg-amber-50 text-amber-700">
                                                        <Clock className="mr-1 size-3" />
                                                        {t('employer.company_reviews.status_waiting')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            {review.title && (
                                                <p className="mb-1 text-sm font-semibold">
                                                    {review.title}
                                                </p>
                                            )}
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {review.review}
                                            </p>

                                            <div className="mt-4 flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => {
                                                        setRejectingId(review.id);
                                                        setRejectReason('');
                                                    }}
                                                >
                                                    <XCircle className="size-4" />
                                                    {t('employer.company_reviews.btn_reject')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => handleApprove(review.id)}
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                    {t('employer.company_reviews.btn_approve')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Approved tab */}
                {activeTab === 'approved' && (
                    <div>
                        {reviews.data.length === 0 ? (
                            <EmptyState
                                title={t('employer.company_reviews.empty_approved_title')}
                                description={t('employer.company_reviews.empty_approved_desc')}
                            />
                        ) : (
                            <AdminDataTable
                                columns={approvedColumns}
                                rows={approvedRows}
                                emptyState={t('employer.company_reviews.empty_approved_table')}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Reject dialog */}
            <Dialog
                open={rejectingId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectingId(null);
                        setRejectReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-red-500" />
                            {t('employer.company_reviews.reject_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('employer.company_reviews.reject_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('employer.company_reviews.reject_reason_label')} <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t('employer.company_reviews.reject_reason_placeholder')}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">{t('employer.company_reviews.reject_reason_counter', { length: rejectReason.length })}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>
                            {t('employer.company_reviews.btn_cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={rejectReason.trim().length < 10 || isSubmitting}
                            onClick={handleReject}
                        >
                            {isSubmitting ? t('employer.company_reviews.btn_rejecting') : t('employer.company_reviews.btn_reject_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

EmployerCompanyReviewsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Ulasan',
            href: index(),
        },
    ],
};
