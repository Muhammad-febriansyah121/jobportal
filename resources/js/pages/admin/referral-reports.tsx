import { Head, router } from '@inertiajs/react';
import { Search, Users, Ticket, UserRoundCheck, Clock3, type LucideIcon } from 'lucide-react';
import { FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { referralReports } from '@/routes/admin';

type CodeReport = {
    id: number;
    code: string;
    campaign: string;
    owner: { name: string; email: string } | null;
    successful_redemptions: number;
    last_redeemed_at: string | null;
    status: string;
};

type RecentRedemption = {
    id: number;
    code: string;
    candidate: { name: string; email: string } | null;
    redeemed_at: string | null;
    expires_at: string | null;
};

type TopReferrer = {
    owner: { name: string; email: string };
    successful_redemptions: number;
    codes_count: number;
};

type Props = {
    filters: { search: string };
    summary: {
        total_redemptions: number;
        unique_candidates: number;
        active_codes: number;
        top_code: CodeReport | null;
    };
    codes: CodeReport[];
    topReferrers: TopReferrer[];
    recentRedemptions: RecentRedemption[];
};

export default function ReferralReports({ filters, summary, codes, topReferrers, recentRedemptions }: Props) {
    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(referralReports({ query: { search: String(data.get('search') ?? '').trim() || undefined } }).url, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Referral report" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold">Referral report</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Lihat kode referral yang paling banyak dipakai dan siapa saja yang menggunakannya.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard icon={Users} label="Total penggunaan" value={summary.total_redemptions} />
                    <SummaryCard icon={UserRoundCheck} label="Jobseeker unik" value={summary.unique_candidates} />
                    <SummaryCard icon={Ticket} label="Kode aktif" value={summary.active_codes} />
                    <SummaryCard icon={Clock3} label="Kode teratas" value={summary.top_code?.code ?? '-'} />
                </div>

                <Card className="border-border shadow-none">
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div><CardTitle className="text-base">Ranking penggunaan kode</CardTitle><p className="mt-1 text-sm text-muted-foreground">Owner kosong berarti kode campaign generik.</p></div>
                        <form onSubmit={submitSearch} className="relative w-full md:w-72">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input name="search" defaultValue={filters.search} placeholder="Cari kode atau referrer" className="pl-9" />
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/30 text-left text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Kode</th><th className="px-5 py-3 font-medium">Referrer</th><th className="px-5 py-3 font-medium">Campaign</th><th className="px-5 py-3 text-right font-medium">Dipakai</th><th className="px-5 py-3 font-medium">Terakhir dipakai</th></tr></thead><tbody>{codes.map((code) => <tr key={code.id} className="border-b last:border-0"><td className="px-5 py-4 font-mono text-xs font-semibold tracking-wide">{code.code}<span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 font-sans text-[11px] font-medium text-emerald-700">{code.status}</span></td><td className="px-5 py-4">{code.owner ? <><p className="font-medium">{code.owner.name}</p><p className="text-xs text-muted-foreground">{code.owner.email}</p></> : <span className="text-muted-foreground">Kode generik</span>}</td><td className="px-5 py-4 text-muted-foreground">{code.campaign}</td><td className="px-5 py-4 text-right font-semibold">{code.successful_redemptions}</td><td className="px-5 py-4 text-muted-foreground">{code.last_redeemed_at ?? '-'}</td></tr>)}</tbody></table></div>
                        {codes.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Belum ada data referral.</p> : null}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-none">
                    <CardHeader><CardTitle className="text-base">Top referrer</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/30 text-left text-muted-foreground"><tr><th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 text-right font-medium">Kode</th><th className="px-5 py-3 text-right font-medium">Berhasil dipakai</th></tr></thead><tbody>{topReferrers.map((referrer) => <tr key={referrer.owner.email} className="border-b last:border-0"><td className="px-5 py-4"><p className="font-medium">{referrer.owner.name}</p><p className="text-xs text-muted-foreground">{referrer.owner.email}</p></td><td className="px-5 py-4 text-right text-muted-foreground">{referrer.codes_count}</td><td className="px-5 py-4 text-right font-semibold">{referrer.successful_redemptions}</td></tr>)}</tbody></table></div>
                        {topReferrers.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Belum ada kode yang memiliki pemilik referrer.</p> : null}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-none">
                    <CardHeader><CardTitle className="text-base">Penggunaan terbaru</CardTitle></CardHeader>
                    <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/30 text-left text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Jobseeker</th><th className="px-5 py-3 font-medium">Kode</th><th className="px-5 py-3 font-medium">Digunakan</th><th className="px-5 py-3 font-medium">Benefit berakhir</th></tr></thead><tbody>{recentRedemptions.map((redemption) => <tr key={redemption.id} className="border-b last:border-0"><td className="px-5 py-4">{redemption.candidate ? <><p className="font-medium">{redemption.candidate.name}</p><p className="text-xs text-muted-foreground">{redemption.candidate.email}</p></> : '-'}</td><td className="px-5 py-4 font-mono text-xs">{redemption.code}</td><td className="px-5 py-4 text-muted-foreground">{redemption.redeemed_at ?? '-'}</td><td className="px-5 py-4 text-muted-foreground">{redemption.expires_at ?? 'Tidak kedaluwarsa'}</td></tr>)}</tbody></table></div>{recentRedemptions.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Belum ada penggunaan referral.</p> : null}</CardContent>
                </Card>
            </div>
        </>
    );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) {
    return <Card className="border-border shadow-none"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-primary"><Icon className="size-4" /></div><div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-lg font-semibold">{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</p></div></CardContent></Card>;
}
