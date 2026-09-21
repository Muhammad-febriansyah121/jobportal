import { Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { edit as profileEdit } from '@/routes/candidate/profile';
import { builderPage as cvBuilderPage } from '@/routes/candidate/cvs';

export type CvReview = {
    ats_score: number;
    profile_completion: number;
    has_primary_cv: boolean;
    stats: {
        skills_total: number;
        skills_verified: number;
        experiences_count: number;
        years_total_experience: number;
        educations_count: number;
        certifications_count: number;
    };
    top_skills: Array<{
        name: string;
        years_exp: number | null;
        verified: boolean;
    }>;
    strengths: string[];
    gaps: string[];
    preferred_role: string | null;
    preferred_industry: string | null;
};

function scoreTone(score: number): { ring: string; text: string; label: string } {
    if (score >= 80) {
        return { ring: 'stroke-emerald-500', text: 'text-emerald-600', label: 'Sangat Baik' };
    }
    if (score >= 60) {
        return { ring: 'stroke-primary-500', text: 'text-primary-600', label: 'Cukup Baik' };
    }
    if (score >= 40) {
        return { ring: 'stroke-amber-500', text: 'text-amber-600', label: 'Perlu Ditingkatkan' };
    }
    return { ring: 'stroke-rose-500', text: 'text-rose-600', label: 'Belum Optimal' };
}

export function CvReviewCard({ review }: { review: CvReview }) {
    const tone = scoreTone(review.ats_score);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (review.ats_score / 100) * circumference;

    return (
        <Card className="overflow-hidden border-[#E5EDF7] shadow-sm">
            <CardContent className="space-y-5 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <Badge className="bg-primary-50 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-primary-700 uppercase hover:bg-primary-50">
                            <Sparkles className="mr-1 size-3.5" />
                            Review CV
                        </Badge>
                        <h3 className="text-lg font-bold text-slate-900">
                            Ringkasan profil & CV Anda
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Dipakai sebagai dasar rekomendasi karier dan jalur belajar.
                        </p>
                    </div>

                    <div className="relative size-24 shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                strokeWidth="8"
                                className="fill-none stroke-slate-100"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                strokeWidth="8"
                                strokeLinecap="round"
                                className={cn('fill-none transition-all duration-500', tone.ring)}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn('text-2xl font-extrabold leading-none', tone.text)}>
                                {review.ats_score}
                            </span>
                            <span className="mt-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                ATS
                            </span>
                        </div>
                    </div>
                </div>

                <p className={cn('text-xs font-semibold', tone.text)}>{tone.label}</p>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                    <Stat label="Skill" value={review.stats.skills_total} sub={`${review.stats.skills_verified} verified`} />
                    <Stat
                        label="Pengalaman"
                        value={`${review.stats.years_total_experience}th`}
                        sub={`${review.stats.experiences_count} pos`}
                    />
                    <Stat
                        label="Pendidikan"
                        value={review.stats.educations_count}
                        sub={`${review.stats.certifications_count} sert`}
                    />
                </div>

                {/* Top skills */}
                {review.top_skills.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            Top Skill
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {review.top_skills.map((skill) => (
                                <span
                                    key={skill.name}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                        skill.verified
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-200 bg-white text-slate-700',
                                    )}
                                >
                                    {skill.name}
                                    {skill.verified ? <CheckCircle2 className="size-3" /> : null}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Strengths */}
                {review.strengths.length > 0 ? (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                            <CheckCircle2 className="size-3.5" />
                            Kekuatan
                        </p>
                        <ul className="space-y-1.5 text-xs leading-5 text-slate-700">
                            {review.strengths.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {/* Gaps */}
                {review.gaps.length > 0 ? (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                            <AlertCircle className="size-3.5" />
                            Yang Perlu Dilengkapi
                        </p>
                        <ul className="space-y-1.5 text-xs leading-5 text-slate-700">
                            {review.gaps.map((g, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
                                    <span>{g}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {/* CTAs */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link
                        href={profileEdit()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                    >
                        <FileText className="size-3.5" />
                        Lengkapi profil
                    </Link>
                    <Link
                        href={cvBuilderPage()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary-50 px-3 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                    >
                        <Sparkles className="size-3.5" />
                        {review.has_primary_cv ? 'Buka CV Builder' : 'Buat CV ATS'}
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function Stat({
    label,
    value,
    sub,
}: {
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <div className="text-center">
            <p className="text-lg font-extrabold leading-none text-slate-900">{value}</p>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {label}
            </p>
            {sub ? <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p> : null}
        </div>
    );
}
