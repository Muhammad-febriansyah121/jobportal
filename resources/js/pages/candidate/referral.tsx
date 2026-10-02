import { Head } from '@inertiajs/react';
import { Check, Copy, Gift, MessageCircle, Share2, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';

type Referral = {
    code: string;
    share_url: string;
    campaign: string;
    successful_redemptions: number;
    max_redemptions: number | null;
    benefits: {
        cv_builder_quota: number;
        ai_interview_quota: number;
        ai_token_amount: number;
        validity_days: number;
    };
};

export default function CandidateReferral({ referral }: { referral: Referral | null }) {
    const { t } = useTranslate();
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        if (!referral) {
            return;
        }

        await navigator.clipboard.writeText(referral.share_url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    const shareWhatsApp = () => {
        if (!referral) {
            return;
        }

        const message = `Daftar di Karivia lewat link ini dan dapatkan benefit tools gratis: ${referral.share_url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    };

    const CopyIcon = copied ? Check : Copy;

    return (
        <>
            <Head title={t('candidate.referral.page_title')} />
            <div className="max-w-3xl space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t('candidate.referral.title')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{t('candidate.referral.description')}</p>
                </div>

                {!referral ? (
                    <Card className="border-border shadow-none">
                        <CardContent className="p-6 text-sm text-muted-foreground">{t('candidate.referral.not_available')}</CardContent>
                    </Card>
                ) : (
                    <>
                        <Card className="border-border shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Share2 className="size-4 text-primary" />{t('candidate.referral.share_title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('candidate.referral.code_label')}</p>
                                    <p className="mt-2 font-mono text-xl font-semibold tracking-wider text-foreground">{referral.code}</p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button type="button" onClick={copyLink} className="bg-[#0F4C94] hover:bg-[#093579]"><CopyIcon className="mr-2 size-4" />{copied ? t('candidate.referral.copied') : t('candidate.referral.copy_link')}</Button>
                                    <Button type="button" variant="outline" onClick={shareWhatsApp}><MessageCircle className="mr-2 size-4 text-emerald-600" />{t('candidate.referral.share_whatsapp')}</Button>
                                </div>
                                <p className="break-all text-xs text-muted-foreground">{referral.share_url}</p>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card className="border-border shadow-none"><CardContent className="flex items-center gap-3 p-4"><Users className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t('candidate.referral.successful_label')}</p><p className="text-xl font-semibold">{referral.successful_redemptions}{referral.max_redemptions ? ` / ${referral.max_redemptions}` : ''}</p></div></CardContent></Card>
                            <Card className="border-border shadow-none"><CardContent className="flex items-center gap-3 p-4"><Gift className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t('candidate.referral.campaign_label')}</p><p className="text-sm font-semibold">{referral.campaign}</p></div></CardContent></Card>
                        </div>

                        <Card className="border-border shadow-none">
                            <CardHeader><CardTitle className="text-base">{t('candidate.referral.benefit_title')}</CardTitle></CardHeader>
                            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                                <Benefit label="CV Builder" value={`${referral.benefits.cv_builder_quota}x`} />
                                <Benefit label="AI Interview" value={`${referral.benefits.ai_interview_quota}x`} />
                                <Benefit label="AI Token" value={referral.benefits.ai_token_amount.toLocaleString('id-ID')} />
                                <Benefit label={t('candidate.referral.validity_label')} value={`${referral.benefits.validity_days} hari`} />
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

function Benefit({ label, value }: { label: string; value: string }) {
    return <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
