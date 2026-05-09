import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CheckCircle2,
    Clock,
    MapPin,
    Sparkles,
    XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { show as talentSearchShow } from '@/routes/employer/talent-search';
import { edit as employerJobsEdit } from '@/routes/employer/jobs';

type CandidateLite = {
    id: number;
    name: string;
    avatar_url: string | null;
    headline: string;
    skills: string[];
};

type MatchRow = {
    job_id: number;
    slug: string;
    title: string;
    job_type: string;
    work_mode: string;
    experience_level: string;
    location: string;
    min_years: number;
    matched_skills: string[];
    missing_skills: string[];
    required_skill_count: number;
    matched_count: number;
    match_score: number;
    match_source: 'ai' | 'computed';
    reason: string | null;
    published_at: string | null;
};

type Props = {
    company: { id: number; name: string };
    candidate: CandidateLite;
    matches: MatchRow[];
};

function scoreTone(score: number): { ring: string; text: string; bg: string; label: string } {
    if (score >= 80) {
        return { ring: 'border-emerald-200', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Sangat Cocok' };
    }
    if (score >= 60) {
        return { ring: 'border-primary-200', text: 'text-primary-600', bg: 'bg-primary-50', label: 'Cocok' };
    }
    if (score >= 40) {
        return { ring: 'border-amber-200', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Cukup' };
    }
    return { ring: 'border-rose-200', text: 'text-rose-600', bg: 'bg-rose-50', label: 'Kurang Cocok' };
}

export default function EmployerTalentSearchMatch({ candidate, matches }: Props) {
    const getInitials = useInitials();

    return (
        <>
            <Head title={`Job Matching · ${candidate.name}`} />

            <div className="space-y-6 p-4 md:p-6">
                <Link
                    href={talentSearchShow(candidate.id)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke Detail Kandidat
                </Link>

                {/* Header */}
                <Card>
                    <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                        <Avatar className="size-16 rounded-xl">
                            <AvatarImage
                                src={candidate.avatar_url ?? undefined}
                                alt={candidate.name}
                                className="rounded-xl object-cover"
                            />
                            <AvatarFallback className="rounded-xl bg-slate-900 text-base font-bold text-white">
                                {getInitials(candidate.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <h1 className="flex items-center gap-2 text-xl font-bold leading-tight">
                                <Sparkles className="size-5 text-primary-600" />
                                Job Matching: {candidate.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {candidate.headline} — kecocokan terhadap lowongan aktif Anda.
                            </p>
                            {candidate.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                    {candidate.skills.slice(0, 8).map((s) => (
                                        <Badge key={s} variant="outline" className="text-[11px]">
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                {/* Matches list */}
                {matches.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <BriefcaseBusiness className="size-12 text-slate-300" />
                            <p className="text-base font-semibold">
                                Belum ada lowongan aktif untuk dicocokkan.
                            </p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Buat atau publikasikan lowongan terlebih dahulu, lalu kembali ke
                                halaman ini untuk melihat ranking kecocokan.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {matches.map((match) => (
                            <MatchCard key={match.job_id} match={match} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function MatchCard({ match }: { match: MatchRow }) {
    const tone = scoreTone(match.match_score);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {match.title}
                        <Badge
                            className={cn(
                                'h-5 border-transparent px-2 text-[10px] font-bold tracking-widest uppercase',
                                tone.bg,
                                tone.text,
                            )}
                        >
                            {tone.label}
                        </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {match.location ? (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5" />
                                {match.location}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                            <BriefcaseBusiness className="size-3.5" />
                            {match.job_type} · {match.work_mode}
                            {match.experience_level ? ` · ${match.experience_level}` : ''}
                        </span>
                        {match.published_at ? (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="size-3.5" />
                                {match.published_at}
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className={cn('flex items-center gap-3 rounded-2xl border-2 px-4 py-2', tone.ring, tone.bg)}>
                    <div className="text-right">
                        <p className={cn('text-2xl font-extrabold leading-none', tone.text)}>
                            {match.match_score}%
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            {match.match_source === 'ai' ? 'AI Score' : 'Computed'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                {match.required_skill_count > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                                <CheckCircle2 className="size-3.5" />
                                Skill cocok ({match.matched_count}/{match.required_skill_count})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {match.matched_skills.length > 0 ? (
                                    match.matched_skills.map((s) => (
                                        <Badge
                                            key={s}
                                            variant="outline"
                                            className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                        >
                                            {s}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        Belum ada skill yang cocok.
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-rose-600 uppercase">
                                <XCircle className="size-3.5" />
                                Gap skill
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {match.missing_skills.length > 0 ? (
                                    match.missing_skills.map((s) => (
                                        <Badge
                                            key={s}
                                            variant="outline"
                                            className="border-rose-200 bg-rose-50 text-rose-700"
                                        >
                                            {s}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        Tidak ada gap.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Lowongan ini tidak mendaftarkan skill spesifik.
                    </p>
                )}

                {match.reason ? (
                    <div className="flex gap-2 rounded-lg border border-primary-100 bg-primary-50/50 p-3">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary-700" />
                        <p className="text-xs leading-5 text-slate-700">
                            <span className="font-semibold text-primary-700">AI: </span>
                            {match.reason}
                        </p>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/jobs/${match.slug}`} target="_blank">
                            Lihat Lowongan
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={employerJobsEdit(match.job_id)}>
                            Kelola Lowongan
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
