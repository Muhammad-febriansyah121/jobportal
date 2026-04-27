import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Bot,
    Briefcase,
    Building2,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Clock,
    DollarSign,
    Download,
    ExternalLink,
    FileText,
    Github,
    GraduationCap,
    History,
    Linkedin,
    Lock,
    Mail,
    MapPin,
    MessageCircle,
    Monitor,
    Phone,
    PieChart,
    Sparkles,
    Star,
    Target,
    UserRound,
    Users,
    Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/employer/candidates';
import { show as showJob } from '@/routes/employer/jobs';
import { review as showAiReview } from '@/routes/employer/ai-interviews';

type Skill = {
    id: number;
    name: string;
    years_exp?: number | null;
    proficiency?: string | null;
    verified_at?: string | null;
};

type Experience = {
    id: number;
    company_name?: string | null;
    job_title?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_current: boolean;
    description?: string | null;
};

type Education = {
    id: number;
    institution?: string | null;
    degree?: string | null;
    field_of_study?: string | null;
    start_year?: string | null;
    end_year?: string | null;
    gpa?: string | null;
};

type Certification = {
    id: number;
    name?: string | null;
    issuing_org?: string | null;
    issue_date?: string | null;
    credential_url?: string | null;
};

type ApplicationItem = {
    id: number;
    status: string;
    job_title?: string | null;
    job_id?: number | null;
    applied_at?: string | null;
    is_current?: boolean;
};

type ApplicationContext = {
    id: number;
    status: string;
    applied_at?: string | null;
    first_responded_at?: string | null;
    cover_letter?: string | null;
    screening_answers: Array<{ question: string; answer: string }>;
    ai_fit_score?: number | null;
    ai_skill_match: { matched: string[]; missing: string[] };
    job: {
        id?: number | null;
        title?: string | null;
        location_city?: string | null;
        location_province?: string | null;
        work_mode?: string | null;
        job_type?: string | null;
        experience_level?: string | null;
    };
    cv?: {
        file_url: string;
        uploaded_at?: string | null;
    } | null;
    latest_history?: {
        to_status?: string | null;
        note?: string | null;
        created_at?: string | null;
    } | null;
    history_timeline: Array<{
        id: number;
        from_status?: string | null;
        to_status: string;
        note?: string | null;
        changed_by?: string | null;
        created_at?: string | null;
    }>;
    interviews: Array<{
        id: number;
        mode?: string | null;
        status: string;
        scheduled_at?: string | null;
        duration_minutes?: number | null;
        location_url?: string | null;
    }>;
    ai_sessions: Array<{
        id: number;
        status: string;
        interview_mode?: string | null;
        completed_at?: string | null;
        fit_score?: number | null;
        recommendation?: string | null;
    }>;
};

type CandidateDetail = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp_phone?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
    preferred_role?: string | null;
    location?: string | null;
    expected_salary?: string | null;
    work_mode_pref?: string | null;
    availability?: string | null;
    profile_completion: number;
    bio?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    skills: Skill[];
    experiences: Experience[];
    educations: Education[];
    certifications: Certification[];
};

type ShowProps = {
    company: { id: number; name: string };
    application: ApplicationContext;
    candidate: CandidateDetail | null;
    company_applications: ApplicationItem[];
};

const STATUS_LABEL: Record<string, string> = {
    submitted: 'Baru masuk',
    screening: 'Screening',
    shortlisted: 'Shortlist',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Diterima',
    rejected: 'Ditolak',
    withdrawn: 'Dibatalkan',
};

const STATUS_TONE: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    screening: 'bg-amber-100 text-amber-800 border-amber-200',
    shortlisted: 'bg-violet-100 text-violet-800 border-violet-200',
    interview: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    offer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    hired: 'bg-emerald-200 text-emerald-900 border-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    withdrawn: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function EmployerCandidateShow({
    application,
    candidate,
    company_applications: companyApplications,
}: ShowProps) {
    const [activeTab, setActiveTab] = useState('profile');

    const fitScore = application.ai_fit_score ?? null;
    const initials = candidate?.name
        ? candidate.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('')
        : '?';

    return (
        <>
            <Head title={`Profil · ${candidate?.name ?? 'Kandidat'}`} />

            <div className="min-h-screen bg-white p-4 md:p-6">
                <div className="mx-auto max-w-6xl space-y-5">
                    <Link
                        href={index().url}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke daftar kandidat
                    </Link>

                    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#01296A] via-[#0a3a8a] to-[#0a4ba5] text-white shadow-lg">
                        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-start md:p-8">
                            <CandidateAvatar
                                name={candidate?.name ?? '?'}
                                avatarUrl={candidate?.avatar_url ?? null}
                                initials={initials}
                            />
                            <div className="space-y-2">
                                <Badge className="border-0 bg-white/15 text-white">
                                    Profil Kandidat
                                </Badge>
                                <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                                    {candidate?.name ?? 'Kandidat'}
                                </h1>
                                {candidate?.headline ? (
                                    <p className="text-sm text-white/85">
                                        {candidate.headline}
                                    </p>
                                ) : null}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {candidate?.location ? (
                                        <HeroPill
                                            icon={MapPin}
                                            label={candidate.location}
                                        />
                                    ) : null}
                                    {candidate?.work_mode_pref ? (
                                        <HeroPill
                                            icon={Monitor}
                                            label={candidate.work_mode_pref}
                                        />
                                    ) : null}
                                    {candidate?.availability ? (
                                        <HeroPill
                                            icon={Clock}
                                            label={`Available: ${candidate.availability}`}
                                        />
                                    ) : null}
                                    {candidate?.expected_salary ? (
                                        <HeroPill
                                            icon={DollarSign}
                                            label={candidate.expected_salary}
                                        />
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-3">
                                    {candidate?.email ? (
                                        <a
                                            href={`mailto:${candidate.email}`}
                                            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
                                        >
                                            <Mail className="size-3.5" />
                                            Email
                                        </a>
                                    ) : null}
                                    {candidate?.whatsapp_phone ? (
                                        <a
                                            href={`https://wa.me/${candidate.whatsapp_phone}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
                                        >
                                            <MessageCircle className="size-3.5" />
                                            WhatsApp
                                        </a>
                                    ) : null}
                                    {candidate?.linkedin_url ? (
                                        <a
                                            href={candidate.linkedin_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
                                        >
                                            <Linkedin className="size-3.5" />
                                            LinkedIn
                                        </a>
                                    ) : null}
                                    {candidate?.github_url ? (
                                        <a
                                            href={candidate.github_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
                                        >
                                            <Github className="size-3.5" />
                                            GitHub
                                        </a>
                                    ) : null}
                                    {candidate?.portfolio_url ? (
                                        <a
                                            href={candidate.portfolio_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
                                        >
                                            <ExternalLink className="size-3.5" />
                                            Portfolio
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <div className="space-y-2 md:text-right">
                                <Badge
                                    className={cn(
                                        'border text-xs font-semibold',
                                        STATUS_TONE[application.status] ??
                                            'bg-white/15 text-white border-white/20',
                                    )}
                                >
                                    {STATUS_LABEL[application.status] ??
                                        application.status}
                                </Badge>
                                {fitScore !== null ? (
                                    <FitScoreBadge score={fitScore} />
                                ) : null}
                                {candidate?.profile_completion !==
                                undefined ? (
                                    <div className="rounded-md bg-white/10 px-3 py-2 text-xs">
                                        <div className="mb-1 flex items-center justify-between text-[10px] tracking-wider uppercase">
                                            <span className="text-white/70">
                                                Kelengkapan Profil
                                            </span>
                                            <span className="font-semibold">
                                                {candidate.profile_completion}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                                            <div
                                                className="h-full rounded-full bg-white transition-all"
                                                style={{
                                                    width: `${candidate.profile_completion}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-5">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Lamaran ke
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Briefcase className="size-4 text-[#01296A]" />
                                    <p className="font-semibold">
                                        {application.job.title ?? '—'}
                                    </p>
                                    {application.job.id ? (
                                        <Link
                                            href={
                                                showJob(application.job.id).url
                                            }
                                            className="text-xs text-[#01296A] hover:underline"
                                        >
                                            Lihat lowongan
                                        </Link>
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Dikirim {application.applied_at ?? '—'}
                                    {application.first_responded_at
                                        ? ` · Pertama direspon ${application.first_responded_at}`
                                        : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end">
                                {application.cv ? (
                                    <Button asChild variant="outline" size="sm">
                                        <a
                                            href={application.cv.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Download className="size-4" />
                                            Unduh CV
                                        </a>
                                    </Button>
                                ) : null}
                                {application.ai_sessions[0] ? (
                                    <Button asChild size="sm">
                                        <Link
                                            href={
                                                showAiReview(
                                                    application
                                                        .ai_sessions[0].id,
                                                ).url
                                            }
                                        >
                                            <Sparkles className="size-4" />
                                            Lihat AI Review
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="sticky top-0 z-10 -mx-4 border-b bg-white/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
                            <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
                                <TabPill
                                    value="profile"
                                    icon={UserRound}
                                    label="Ringkasan"
                                />
                                <TabPill
                                    value="cv"
                                    icon={Briefcase}
                                    label="CV Lengkap"
                                    count={
                                        (candidate?.experiences.length ?? 0) +
                                        (candidate?.educations.length ?? 0) +
                                        (candidate?.certifications.length ?? 0)
                                    }
                                />
                                <TabPill
                                    value="application"
                                    icon={ClipboardList}
                                    label="Lamaran Ini"
                                />
                                <TabPill
                                    value="history"
                                    icon={History}
                                    label="Histori"
                                    count={companyApplications.length}
                                />
                            </TabsList>
                        </div>

                        <TabsContent
                            value="profile"
                            className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_1fr]"
                        >
                            <div className="space-y-5">
                                {candidate?.bio ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Sparkles className="size-4 text-[#01296A]" />
                                                Tentang Kandidat
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-7 whitespace-pre-line text-foreground/85">
                                                {candidate.bio}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {candidate && candidate.skills.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Award className="size-4 text-[#01296A]" />
                                                Keahlian
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-1.5">
                                                {candidate.skills.map(
                                                    (skill) => (
                                                        <SkillChip
                                                            key={skill.id}
                                                            skill={skill}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : null}

                                <Card className="border-dashed bg-muted/20">
                                    <CardContent className="flex items-start gap-3 py-4">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                            <Briefcase className="size-4 text-muted-foreground" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                Pengalaman, pendidikan,
                                                sertifikasi
                                            </p>
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                Pindah ke tab{' '}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveTab('cv')
                                                    }
                                                    className="font-semibold text-[#01296A] underline-offset-2 hover:underline"
                                                >
                                                    CV Lengkap
                                                </button>{' '}
                                                untuk lihat detail karier
                                                kandidat.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Phone className="size-4 text-[#01296A]" />
                                            Kontak
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <ContactRow
                                            icon={Mail}
                                            label="Email"
                                            value={
                                                candidate?.email ?? '—'
                                            }
                                            href={
                                                candidate?.email
                                                    ? `mailto:${candidate.email}`
                                                    : null
                                            }
                                        />
                                        <ContactRow
                                            icon={Phone}
                                            label="Telepon"
                                            value={candidate?.phone ?? '—'}
                                        />
                                        <ContactRow
                                            icon={Briefcase}
                                            label="Role target"
                                            value={
                                                candidate?.preferred_role ??
                                                '—'
                                            }
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <PieChart className="size-4 text-[#01296A]" />
                                            AI Skill Match
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {application.ai_skill_match.matched
                                            .length > 0 ? (
                                            <div>
                                                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                                                    Matched
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {application.ai_skill_match.matched.map(
                                                        (skill) => (
                                                            <span
                                                                key={skill}
                                                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
                                                            >
                                                                <CheckCircle2 className="size-3" />
                                                                {skill}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                        {application.ai_skill_match.missing
                                            .length > 0 ? (
                                            <div>
                                                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-rose-700 uppercase">
                                                    Belum match
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {application.ai_skill_match.missing.map(
                                                        (skill) => (
                                                            <span
                                                                key={skill}
                                                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-800"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                        {application.ai_skill_match.matched
                                            .length === 0 &&
                                        application.ai_skill_match.missing
                                            .length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                Skill match belum dianalisis.
                                            </p>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </aside>
                        </TabsContent>

                        <TabsContent
                            value="application"
                            className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_1fr]"
                        >
                            <div className="space-y-5">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Briefcase className="size-4 text-[#01296A]" />
                                            Detail Lamaran
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 sm:grid-cols-2">
                                        <DetailItem
                                            icon={Briefcase}
                                            label="Posisi"
                                            value={
                                                application.job.title ?? '—'
                                            }
                                        />
                                        <DetailItem
                                            icon={MapPin}
                                            label="Lokasi"
                                            value={
                                                [
                                                    application.job
                                                        .location_city,
                                                    application.job
                                                        .location_province,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ') || '—'
                                            }
                                        />
                                        {application.job.work_mode ? (
                                            <DetailItem
                                                icon={Monitor}
                                                label="Mode kerja"
                                                value={application.job.work_mode}
                                                capitalize
                                            />
                                        ) : null}
                                        {application.job.job_type ? (
                                            <DetailItem
                                                icon={Building2}
                                                label="Tipe"
                                                value={application.job.job_type}
                                                capitalize
                                            />
                                        ) : null}
                                        {application.job.experience_level ? (
                                            <DetailItem
                                                icon={Target}
                                                label="Level"
                                                value={
                                                    application.job
                                                        .experience_level
                                                }
                                                capitalize
                                            />
                                        ) : null}
                                        <DetailItem
                                            icon={CalendarDays}
                                            label="Diajukan"
                                            value={
                                                application.applied_at ?? '—'
                                            }
                                        />
                                    </CardContent>
                                </Card>

                                {application.cover_letter ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <FileText className="size-4 text-[#01296A]" />
                                                Cover Letter
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-7 whitespace-pre-line text-foreground/85">
                                                {application.cover_letter}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {application.screening_answers.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <ClipboardList className="size-4 text-[#01296A]" />
                                                Jawaban Screening
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {application.screening_answers.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className="rounded-lg border bg-muted/30 p-3"
                                                    >
                                                        <p className="text-xs font-semibold text-muted-foreground">
                                                            {item.question}
                                                        </p>
                                                        <p className="mt-1 text-sm leading-6 whitespace-pre-line">
                                                            {item.answer ||
                                                                '—'}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {application.history_timeline.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <History className="size-4 text-[#01296A]" />
                                                Timeline Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ol className="space-y-3 border-l border-muted pl-4">
                                                {application.history_timeline.map(
                                                    (entry) => (
                                                        <li
                                                            key={entry.id}
                                                            className="relative"
                                                        >
                                                            <span
                                                                className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-[#01296A]"
                                                                aria-hidden
                                                            />
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge
                                                                    className={cn(
                                                                        'text-[10px]',
                                                                        STATUS_TONE[
                                                                            entry
                                                                                .to_status
                                                                        ] ??
                                                                            'bg-muted text-muted-foreground',
                                                                    )}
                                                                >
                                                                    {STATUS_LABEL[
                                                                        entry
                                                                            .to_status
                                                                    ] ??
                                                                        entry.to_status}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {entry.created_at ??
                                                                        ''}
                                                                </span>
                                                            </div>
                                                            {entry.note ? (
                                                                <p className="mt-1 text-sm leading-6 text-foreground/80">
                                                                    {entry.note}
                                                                </p>
                                                            ) : null}
                                                            {entry.changed_by ? (
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    oleh{' '}
                                                                    {
                                                                        entry.changed_by
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </li>
                                                    ),
                                                )}
                                            </ol>
                                        </CardContent>
                                    </Card>
                                ) : null}
                            </div>

                            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                                {fitScore !== null ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Sparkles className="size-4 text-[#01296A]" />
                                                AI Fit Score
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <FitScoreCard score={fitScore} />
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {application.ai_sessions.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Bot className="size-4 text-[#01296A]" />
                                                AI Interview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {application.ai_sessions.map(
                                                (session) => (
                                                    <div
                                                        key={session.id}
                                                        className="rounded-lg border p-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-medium capitalize">
                                                                {session.interview_mode ===
                                                                'voice'
                                                                    ? 'Voice AI'
                                                                    : 'Text AI'}
                                                            </p>
                                                            {session.fit_score !==
                                                                null &&
                                                            session.fit_score !==
                                                                undefined ? (
                                                                <Badge
                                                                    className={cn(
                                                                        'text-xs font-semibold',
                                                                        toneFromScore(
                                                                            session.fit_score,
                                                                        ),
                                                                    )}
                                                                >
                                                                    {
                                                                        session.fit_score
                                                                    }
                                                                    /100
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted-foreground capitalize">
                                                            {session.status.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                            {session.completed_at
                                                                ? ` · ${session.completed_at}`
                                                                : ''}
                                                        </p>
                                                        {session.recommendation ? (
                                                            <p className="mt-2 text-xs leading-5 italic text-muted-foreground">
                                                                "
                                                                {
                                                                    session.recommendation
                                                                }
                                                                "
                                                            </p>
                                                        ) : null}
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="mt-2 w-full"
                                                        >
                                                            <Link
                                                                href={
                                                                    showAiReview(
                                                                        session.id,
                                                                    ).url
                                                                }
                                                            >
                                                                Detail review
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {application.interviews.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <CalendarCheck className="size-4 text-[#01296A]" />
                                                Interview Terjadwal
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {application.interviews.map(
                                                (iv) => (
                                                    <div
                                                        key={iv.id}
                                                        className="rounded-lg border p-3"
                                                    >
                                                        <p className="text-sm font-medium capitalize">
                                                            {iv.mode ?? '—'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {iv.status.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                            {iv.scheduled_at
                                                                ? ` · ${iv.scheduled_at}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : null}

                                <Card className="border-[#01296A]/15 bg-[#eff4ff]/60">
                                    <CardContent className="flex items-start gap-3 p-4">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#01296A]/15 text-[#01296A]">
                                            <Wand2 className="size-4" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                Aksi recruiter
                                            </p>
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                Update status, kirim WhatsApp,
                                                atau jadwalkan interview lewat
                                                halaman daftar kandidat.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </aside>
                        </TabsContent>

                        <TabsContent
                            value="cv"
                            className="mt-4 space-y-5"
                        >
                            {application.cv ? (
                                <Card className="border-emerald-200 bg-emerald-50/40">
                                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                                                <FileText className="size-5" />
                                            </span>
                                            <div>
                                                <p className="font-semibold">
                                                    CV Original
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Diupload{' '}
                                                    {application.cv
                                                        .uploaded_at ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline">
                                            <a
                                                href={
                                                    application.cv.file_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download className="size-4" />
                                                Unduh / lihat
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : null}

                            <CvSection
                                title="Pengalaman Kerja"
                                icon={Briefcase}
                                count={candidate?.experiences.length ?? 0}
                                emptyText="Kandidat belum mengisi pengalaman kerja."
                            >
                                {candidate?.experiences.map((exp) => (
                                    <ExperienceCard
                                        key={exp.id}
                                        experience={exp}
                                    />
                                ))}
                            </CvSection>

                            <CvSection
                                title="Pendidikan"
                                icon={GraduationCap}
                                count={candidate?.educations.length ?? 0}
                                emptyText="Belum ada riwayat pendidikan."
                            >
                                {candidate?.educations.map((edu) => (
                                    <EducationItem
                                        key={edu.id}
                                        education={edu}
                                    />
                                ))}
                            </CvSection>

                            <CvSection
                                title="Sertifikasi"
                                icon={Star}
                                count={candidate?.certifications.length ?? 0}
                                emptyText="Belum ada sertifikasi."
                            >
                                {candidate?.certifications.map((cert) => (
                                    <CertificationItem
                                        key={cert.id}
                                        cert={cert}
                                    />
                                ))}
                            </CvSection>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4 space-y-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <History className="size-4 text-[#01296A]" />
                                        Histori Lamaran ke Perusahaan Ini
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {companyApplications.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={show(item.id).url}
                                            className={cn(
                                                'flex items-start justify-between gap-3 rounded-lg border p-3 transition hover:border-[#01296A]/40',
                                                item.is_current &&
                                                    'border-[#01296A] bg-[#eff4ff]/40',
                                            )}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    {item.job_title ?? '—'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <CalendarDays className="size-3" />
                                                    <span>
                                                        {item.applied_at ?? '—'}
                                                    </span>
                                                    {item.is_current ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] text-[#01296A]"
                                                        >
                                                            Saat ini
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    'text-[10px]',
                                                    STATUS_TONE[item.status] ??
                                                        '',
                                                )}
                                            >
                                                {STATUS_LABEL[item.status] ??
                                                    item.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

function TabPill({
    value,
    icon: Icon,
    label,
    count,
}: {
    value: string;
    icon: LucideIcon;
    label: string;
    count?: number;
}) {
    return (
        <TabsTrigger
            value={value}
            className="gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:border-[#01296A]/15 data-[state=active]:bg-[#eff4ff] data-[state=active]:text-[#01296A] data-[state=active]:shadow-sm"
        >
            <Icon className="size-4" />
            <span>{label}</span>
            {count !== undefined && count > 0 ? (
                <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                >
                    {count}
                </Badge>
            ) : null}
        </TabsTrigger>
    );
}

function CvSection({
    title,
    icon: Icon,
    count,
    emptyText,
    children,
}: {
    title: string;
    icon: LucideIcon;
    count: number;
    emptyText: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4 text-[#01296A]" />
                    {title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                    {count}
                </Badge>
            </CardHeader>
            <CardContent
                className={cn(
                    count === 0 ? 'py-8 text-center' : 'space-y-2',
                )}
            >
                {count === 0 ? (
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    );
}

function CandidateAvatar({
    name,
    avatarUrl,
    initials,
}: {
    name: string;
    avatarUrl: string | null;
    initials: string;
}) {
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className="size-20 shrink-0 rounded-2xl bg-white object-cover md:size-24"
            />
        );
    }
    return (
        <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold text-white md:size-24">
            {initials}
        </span>
    );
}

function HeroPill({
    icon: Icon,
    label,
}: {
    icon: LucideIcon;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs">
            <Icon className="size-3" />
            {label}
        </span>
    );
}

function FitScoreBadge({ score }: { score: number }) {
    const tone = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="rounded-md bg-white/10 px-3 py-2 text-center">
            <p className="text-[10px] tracking-wider text-white/70 uppercase">
                AI Fit Score
            </p>
            <div className="mt-0.5 flex items-center justify-center gap-1.5">
                <span
                    className={cn('inline-block size-2 rounded-full', tone)}
                />
                <span className="text-lg font-bold">{score}</span>
                <span className="text-xs text-white/70">/100</span>
            </div>
        </div>
    );
}

function FitScoreCard({ score }: { score: number }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const tone =
        score >= 80
            ? '#10b981'
            : score >= 60
              ? '#f59e0b'
              : '#ef4444';
    return (
        <div className="flex items-center gap-4">
            <div className="relative size-24">
                <svg viewBox="0 0 96 96" className="-rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke={tone}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{score}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
            </div>
            <div className="space-y-1 text-sm">
                <p className="font-semibold">
                    {score >= 80
                        ? 'Strong fit'
                        : score >= 60
                          ? 'Potensial'
                          : 'Perlu validasi'}
                </p>
                <p className="text-xs text-muted-foreground">
                    Skor dihitung dari kecocokan skill, pengalaman, dan
                    requirements lowongan.
                </p>
            </div>
        </div>
    );
}

function SkillChip({ skill }: { skill: Skill }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium">
            {skill.name}
            {skill.years_exp ? (
                <span className="rounded-sm bg-muted px-1 text-[10px] text-muted-foreground">
                    {skill.years_exp}y
                </span>
            ) : null}
            {skill.proficiency ? (
                <span className="text-[10px] text-muted-foreground capitalize">
                    {skill.proficiency}
                </span>
            ) : null}
            {skill.verified_at ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
            ) : null}
        </span>
    );
}

function ExperienceCard({ experience }: { experience: Experience }) {
    const [open, setOpen] = useState(false);
    const period = [experience.start_date, experience.end_date]
        .filter(Boolean)
        .join(' — ');
    return (
        <div className="overflow-hidden rounded-xl border bg-background">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/30"
            >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#01296A]/10 text-[#01296A]">
                    <Briefcase className="size-4" />
                </span>
                <div className="flex-1 space-y-1">
                    <p className="font-semibold leading-tight">
                        {experience.job_title ?? 'Posisi'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {experience.company_name ?? '—'}
                        {experience.location
                            ? ` · ${experience.location}`
                            : ''}
                    </p>
                    {period ? (
                        <p className="text-xs text-muted-foreground">
                            {period}
                            {experience.is_current ? (
                                <Badge
                                    variant="outline"
                                    className="ml-2 text-[10px] text-emerald-700"
                                >
                                    Sekarang
                                </Badge>
                            ) : null}
                        </p>
                    ) : null}
                </div>
                {experience.description ? (
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-muted-foreground transition',
                            open && 'rotate-180',
                        )}
                    />
                ) : null}
            </button>
            {open && experience.description ? (
                <div className="border-t bg-muted/10 p-4">
                    <p className="text-sm leading-7 whitespace-pre-line text-foreground/85">
                        {experience.description}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

function EducationItem({ education }: { education: Education }) {
    const period = [education.start_year, education.end_year]
        .filter(Boolean)
        .join(' — ');
    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#01296A]/10 text-[#01296A]">
                <GraduationCap className="size-4" />
            </span>
            <div className="flex-1 space-y-0.5">
                <p className="font-medium leading-tight">
                    {education.institution ?? '—'}
                </p>
                {education.degree || education.field_of_study ? (
                    <p className="text-sm text-muted-foreground">
                        {[education.degree, education.field_of_study]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                    {period ? <span>{period}</span> : null}
                    {education.gpa ? (
                        <Badge variant="outline" className="text-[10px]">
                            IPK {education.gpa}
                        </Badge>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function CertificationItem({ cert }: { cert: Certification }) {
    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#01296A]/10 text-[#01296A]">
                <Star className="size-4" />
            </span>
            <div className="flex-1 space-y-0.5">
                <p className="font-medium leading-tight">{cert.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                    {cert.issuing_org ?? '—'}
                    {cert.issue_date ? ` · ${cert.issue_date}` : ''}
                </p>
            </div>
            {cert.credential_url ? (
                <Button asChild size="sm" variant="outline">
                    <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLink className="size-3.5" />
                    </a>
                </Button>
            ) : null}
        </div>
    );
}

function ContactRow({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    href?: string | null;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                {href ? (
                    <a
                        href={href}
                        className="truncate text-sm hover:underline"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="truncate text-sm">{value}</p>
                )}
            </div>
        </div>
    );
}

function DetailItem({
    icon: Icon,
    label,
    value,
    capitalize: cap,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    capitalize?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-0.5 text-sm font-medium',
                        cap && 'capitalize',
                    )}
                >
                    {value.replace(/_/g, ' ')}
                </p>
            </div>
        </div>
    );
}

function toneFromScore(score: number): string {
    if (score >= 80) {
        return 'bg-emerald-100 text-emerald-800';
    }
    if (score >= 60) {
        return 'bg-amber-100 text-amber-800';
    }
    return 'bg-rose-100 text-rose-800';
}

EmployerCandidateShow.layout = ({ candidate }: ShowProps) => ({
    breadcrumbs: [
        {
            title: 'Kandidat',
            href: index(),
        },
        {
            title: candidate?.name ?? 'Detail',
            href: '#',
        },
    ],
});
