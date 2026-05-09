import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    BadgeCheck,
    Banknote,
    BookmarkCheck,
    Bookmark,
    BriefcaseBusiness,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Download,
    ExternalLink,
    FileText,
    GraduationCap,
    Lock,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Sparkles,
    Star,
    Unlock,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { formatAvailability } from '@/lib/availability';
import { cn } from '@/lib/utils';
import {
    contact as talentSearchContact,
    index as talentSearchIndex,
    match as talentSearchMatch,
    save as talentSearchSave,
    shortlist as talentSearchShortlist,
    unlock as talentSearchUnlock,
    unsave as talentSearchUnsave,
    unshortlist as talentSearchUnshortlist,
} from '@/routes/employer/talent-search';

type Skill = {
    name: string;
    years_exp: number | null;
    proficiency: string | null;
    verified: boolean;
};

type Experience = {
    job_title: string | null;
    company_name: string | null;
    location: string | null;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
};

type Education = {
    institution: string | null;
    degree: string | null;
    field_of_study: string | null;
    start_year: number | null;
    end_year: number | null;
    gpa: string | number | null;
};

type Certification = {
    name: string | null;
    issuing_org: string | null;
    issue_date: string | null;
    credential_url: string | null;
};

type TalentDetail = {
    id: number;
    name: string;
    avatar_url: string | null;
    headline: string;
    bio: string | null;
    location: string;
    preferred_role: string | null;
    preferred_industry: string | null;
    salary_range: string;
    availability: string;
    work_mode_pref: string;
    profile_completion: number;
    years_total_experience: number;
    match_score: number | null;
    match_reason: string | null;
    skills: Skill[];
    experiences: Experience[];
    educations: Education[];
    certifications: Certification[];
    is_saved: boolean;
    is_shortlisted: boolean;
    is_unlocked: boolean;
    unlocked_at: string | null;
    email: string | null;
    phone: string | null;
    cv: { id: number; file_url: string; uploaded_at: string | null } | null;
    conversation_id: number | null;
};

type Props = {
    company: { id: number; name: string } | null;
    candidate: TalentDetail;
    invitationQuota: { limit: number; used: number; remaining: number };
};

export default function EmployerTalentSearchShow({ candidate, invitationQuota }: Props) {
    const { t } = useTranslate();
    const getInitials = useInitials();
    const availabilityLabel = formatAvailability(candidate.availability, t);
    const [unlockOpen, setUnlockOpen] = useState(false);

    return (
        <>
            <Head title={`${candidate.name} · Detail Kandidat`} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Back link */}
                <Link
                    href={talentSearchIndex()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke Cari Talenta
                </Link>

                {/* Header card */}
                <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                    {/* Cover gradient strip */}
                    <div className="h-24 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 sm:h-28" />

                    <CardContent className="px-5 pt-0 pb-5 sm:px-6 sm:pb-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            {/* Avatar + identity */}
                            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="relative -mt-12 sm:-mt-14">
                                    <Avatar className="size-24 rounded-2xl border-4 border-white shadow-md sm:size-28">
                                        <AvatarImage
                                            src={candidate.avatar_url ?? undefined}
                                            alt={candidate.name}
                                            className="rounded-xl object-cover"
                                        />
                                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-bold text-white">
                                            {getInitials(candidate.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {candidate.profile_completion >= 80 ? (
                                        <span
                                            title="Profil lengkap & terverifikasi"
                                            className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white shadow-sm"
                                        >
                                            <BadgeCheck className="size-4" />
                                        </span>
                                    ) : null}
                                </div>

                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-[28px]">
                                            {candidate.name}
                                        </h1>
                                        {candidate.match_score !== null && candidate.match_score >= 80 ? (
                                            <Badge className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase hover:bg-emerald-500">
                                                Top Match
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <p className="text-base font-medium text-slate-600">
                                        {candidate.headline}
                                    </p>
                                </div>
                            </div>

                            {/* Action group */}
                            <div className="flex flex-wrap items-center gap-2">
                                {candidate.is_unlocked ? (
                                    <Button
                                        asChild
                                        className="h-10 gap-2 rounded-xl bg-emerald-600 px-4 shadow-sm shadow-emerald-200/50 hover:bg-emerald-700"
                                    >
                                        <Link href={talentSearchMatch(candidate.id)}>
                                            <Sparkles className="size-4" />
                                            Buka Job Matching
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => setUnlockOpen(true)}
                                        className="h-10 gap-2 rounded-xl bg-primary-600 px-4 shadow-sm shadow-primary-200/50 hover:bg-primary-700"
                                    >
                                        <Sparkles className="size-4" />
                                        Gunakan Job Invitation
                                    </Button>
                                )}
                                <IconAction
                                    href={
                                        candidate.is_shortlisted
                                            ? talentSearchUnshortlist(candidate.id).url
                                            : talentSearchShortlist(candidate.id).url
                                    }
                                    method={candidate.is_shortlisted ? 'delete' : 'post'}
                                    icon={Star}
                                    label={candidate.is_shortlisted ? 'Hapus shortlist' : 'Shortlist'}
                                    active={candidate.is_shortlisted}
                                />
                                <IconAction
                                    href={talentSearchContact(candidate.id).url}
                                    method="post"
                                    icon={MessageSquare}
                                    label="Hubungi"
                                />
                                <IconAction
                                    href={
                                        candidate.is_saved
                                            ? talentSearchUnsave(candidate.id).url
                                            : talentSearchSave(candidate.id).url
                                    }
                                    method={candidate.is_saved ? 'delete' : 'post'}
                                    icon={candidate.is_saved ? BookmarkCheck : Bookmark}
                                    label={candidate.is_saved ? 'Tersimpan' : 'Simpan'}
                                    active={candidate.is_saved}
                                />
                            </div>
                        </div>

                        {/* Quick stats row */}
                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
                            <Stat
                                icon={MapPin}
                                label="Lokasi"
                                value={candidate.location || '-'}
                            />
                            <Stat
                                icon={BriefcaseBusiness}
                                label="Pengalaman"
                                value={`${candidate.years_total_experience} Tahun`}
                            />
                            <Stat
                                icon={Banknote}
                                label="Ekspektasi gaji"
                                value={candidate.salary_range}
                            />
                            <Stat
                                icon={
                                    availabilityLabel.toLowerCase().includes('siap')
                                        ? CalendarCheck
                                        : Clock3
                                }
                                label="Ketersediaan"
                                value={availabilityLabel}
                                tone={
                                    availabilityLabel.toLowerCase().includes('siap')
                                        ? 'green'
                                        : 'default'
                                }
                            />
                        </div>

                        {candidate.match_score !== null ? (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3">
                                <span className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                    <Sparkles className="size-4" />
                                </span>
                                <div className="flex-1 space-y-0.5">
                                    <p className="text-[10px] font-bold tracking-widest text-primary-700 uppercase">
                                        AI Match Score
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Berdasarkan skill, lokasi & ekspektasi gaji.
                                    </p>
                                </div>
                                <span className="text-3xl font-extrabold leading-none text-primary-700">
                                    {candidate.match_score}
                                    <span className="text-base">%</span>
                                </span>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* AI insight */}
                {candidate.match_reason ? (
                    <Card className="border-primary-100 bg-gradient-to-br from-primary-50/40 to-white">
                        <CardContent className="flex gap-3 p-5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                <Sparkles className="size-4" />
                            </span>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold tracking-widest text-primary-700 uppercase">
                                    Alasan AI
                                </p>
                                <p className="text-sm leading-6 text-slate-700">
                                    {candidate.match_reason}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Privacy lock notice / contact unlocked */}
                {candidate.is_unlocked ? (
                    <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                        <CardContent className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50">
                                    <Unlock className="size-4" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">
                                        Kontak &amp; CV terbuka
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Job Invitation digunakan {candidate.unlocked_at ? `pada ${candidate.unlocked_at}` : ''}.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {candidate.email ? (
                                    <ContactRow icon={Mail} label="Email" value={candidate.email} href={`mailto:${candidate.email}`} />
                                ) : null}
                                {candidate.phone ? (
                                    <ContactRow icon={Phone} label="No HP" value={candidate.phone} href={`tel:${candidate.phone}`} />
                                ) : null}
                                {candidate.cv ? (
                                    <ContactRow
                                        icon={FileText}
                                        label="CV Utama"
                                        value={candidate.cv.uploaded_at ? `Upload ${candidate.cv.uploaded_at}` : 'Tersedia'}
                                        href={candidate.cv.file_url}
                                        actionIcon={Download}
                                        actionLabel="Download"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-500">
                                        <FileText className="size-4 text-slate-400" />
                                        Kandidat belum upload CV utama.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-4 ring-amber-50">
                                    <Lock className="size-5" />
                                </span>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-bold text-slate-900">
                                            Informasi kontak &amp; CV terkunci
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-amber-300 bg-amber-100 text-[10px] font-bold tracking-wider text-amber-700 uppercase"
                                        >
                                            1 Job Invitation
                                        </Badge>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-600">
                                        Email, no HP, dan CV kandidat akan terbuka segera setelah
                                        Anda menggunakan <strong>1 Job Invitation</strong>.
                                        {invitationQuota.limit > 0 ? (
                                            <>
                                                {' '}
                                                Sisa kuota:{' '}
                                                <strong>
                                                    {invitationQuota.remaining}/{invitationQuota.limit}
                                                </strong>
                                                .
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="lg"
                                onClick={() => setUnlockOpen(true)}
                                className="h-11 shrink-0 gap-2 rounded-xl shadow-sm shadow-primary-200/50"
                            >
                                <Sparkles className="size-4" />
                                Gunakan Job Invitation
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Unlock confirmation modal */}
                <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="size-5 text-primary-600" />
                                Gunakan 1 Job Invitation?
                            </DialogTitle>
                            <DialogDescription>
                                Aksi ini akan membuka kontak (email, no HP) & CV kandidat secara permanen untuk perusahaan Anda.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Kandidat</span>
                                <span className="font-semibold">{candidate.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Sisa kuota saat ini</span>
                                <span className="font-semibold">
                                    {invitationQuota.remaining}/{invitationQuota.limit}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                <span className="text-slate-600">Sisa setelah unlock</span>
                                <span className="font-bold text-primary-700">
                                    {Math.max(0, invitationQuota.remaining - 1)}/{invitationQuota.limit}
                                </span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUnlockOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button asChild>
                                <Link
                                    as="button"
                                    href={talentSearchUnlock(candidate.id)}
                                    method="post"
                                    onSuccess={() => setUnlockOpen(false)}
                                >
                                    <Sparkles className="size-4" />
                                    Konfirmasi & Unlock
                                </Link>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="w-full overflow-x-auto sm:w-auto">
                        <TabsTrigger value="overview">
                            <User className="size-4" />
                            Tentang
                        </TabsTrigger>
                        <TabsTrigger value="experiences">
                            <BriefcaseBusiness className="size-4" />
                            Pengalaman
                            {candidate.experiences.length > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {candidate.experiences.length}
                                </Badge>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="educations">
                            <GraduationCap className="size-4" />
                            Pendidikan
                            {candidate.educations.length > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {candidate.educations.length}
                                </Badge>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="certifications">
                            <Award className="size-4" />
                            Sertifikasi
                            {candidate.certifications.length > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {candidate.certifications.length}
                                </Badge>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="skills">
                            <Sparkles className="size-4" />
                            Skills
                            {candidate.skills.length > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {candidate.skills.length}
                                </Badge>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="cv">
                            <FileText className="size-4" />
                            CV
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tentang</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-7 whitespace-pre-line text-slate-700">
                                    {candidate.bio || (
                                        <span className="text-muted-foreground">
                                            Bio belum diisi.
                                        </span>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Profil Singkat</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <Row label="Preferred role" value={candidate.preferred_role ?? '-'} />
                                    <Row label="Preferred industri" value={candidate.preferred_industry ?? '-'} />
                                    <Row label="Mode kerja" value={candidate.work_mode_pref} />
                                    <Row label="Ketersediaan" value={availabilityLabel} />
                                    <Row label="Profil lengkap" value={`${candidate.profile_completion}%`} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="experiences" className="mt-0">
                        <Card>
                            <CardContent className="p-6">
                                {candidate.experiences.length === 0 ? (
                                    <Empty
                                        icon={BriefcaseBusiness}
                                        text="Belum ada pengalaman tercatat."
                                    />
                                ) : (
                                    <ol className="space-y-5">
                                        {candidate.experiences.map((exp, i) => (
                                            <li
                                                key={i}
                                                className="border-l-2 border-primary-100 pl-4"
                                            >
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {exp.job_title || '-'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {exp.company_name || '-'}
                                                    {exp.location ? ` · ${exp.location}` : ''}
                                                </p>
                                                {exp.start_date ? (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {exp.start_date} -{' '}
                                                        {exp.is_current
                                                            ? 'Sekarang'
                                                            : exp.end_date || '-'}
                                                    </p>
                                                ) : null}
                                                {exp.description ? (
                                                    <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-600">
                                                        {exp.description}
                                                    </p>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="educations" className="mt-0">
                        <Card>
                            <CardContent className="p-6">
                                {candidate.educations.length === 0 ? (
                                    <Empty
                                        icon={GraduationCap}
                                        text="Belum ada riwayat pendidikan."
                                    />
                                ) : (
                                    <ul className="space-y-4">
                                        {candidate.educations.map((edu, i) => (
                                            <li
                                                key={i}
                                                className="border-l-2 border-emerald-100 pl-4"
                                            >
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {edu.degree || '-'}
                                                    {edu.field_of_study ? ` · ${edu.field_of_study}` : ''}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {edu.institution || '-'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {edu.start_year ?? '-'} - {edu.end_year ?? '-'}
                                                    {edu.gpa ? ` · IPK ${edu.gpa}` : ''}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="certifications" className="mt-0">
                        <Card>
                            <CardContent className="p-6">
                                {candidate.certifications.length === 0 ? (
                                    <Empty icon={Award} text="Belum ada sertifikasi tercatat." />
                                ) : (
                                    <ul className="space-y-3">
                                        {candidate.certifications.map((cert, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {cert.name || '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cert.issuing_org || '-'}
                                                        {cert.issue_date ? ` · ${cert.issue_date}` : ''}
                                                    </p>
                                                </div>
                                                {cert.credential_url ? (
                                                    <a
                                                        href={cert.credential_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                        Verifikasi
                                                    </a>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="skills" className="mt-0">
                        <Card>
                            <CardContent className="p-6">
                                {candidate.skills.length === 0 ? (
                                    <Empty icon={Sparkles} text="Belum ada skill tercatat." />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.skills.map((skill) => (
                                            <Badge
                                                key={skill.name}
                                                variant="outline"
                                                className={cn(
                                                    'gap-1.5 rounded-lg border-slate-200 bg-slate-50 text-slate-700',
                                                    skill.verified &&
                                                        'border-emerald-200 bg-emerald-50 text-emerald-700',
                                                )}
                                            >
                                                {skill.name}
                                                {skill.verified ? (
                                                    <CheckCircle2 className="size-3" />
                                                ) : null}
                                                {skill.years_exp ? (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {skill.years_exp}th
                                                    </span>
                                                ) : null}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cv" className="mt-0">
                        <Card>
                            {candidate.is_unlocked ? (
                                candidate.cv ? (
                                    <CardContent className="space-y-4 p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                                    <FileText className="size-5" />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold">CV Utama</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Upload {candidate.cv.uploaded_at ?? '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button asChild size="sm">
                                                <a
                                                    href={candidate.cv.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Download className="size-4" />
                                                    Download CV
                                                </a>
                                            </Button>
                                        </div>
                                        <div className="overflow-hidden rounded-md border bg-muted/20">
                                            <iframe
                                                src={candidate.cv.file_url}
                                                title="Preview CV"
                                                className="h-[70vh] w-full"
                                            />
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                                        <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                            <FileText className="size-6" />
                                        </span>
                                        <p className="text-base font-semibold text-slate-900">
                                            Kandidat belum upload CV utama
                                        </p>
                                        <p className="max-w-md text-sm text-muted-foreground">
                                            Akun kandidat ini belum menyimpan file CV. Anda bisa hubungi langsung untuk meminta CV.
                                        </p>
                                    </CardContent>
                                )
                            ) : (
                                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                                    <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                        <Lock className="size-6" />
                                    </span>
                                    <p className="text-base font-semibold text-slate-900">
                                        CV terkunci
                                    </p>
                                    <p className="max-w-md text-sm text-muted-foreground">
                                        File CV kandidat hanya dapat diakses setelah Anda
                                        menggunakan 1 Job Invitation. Klik tombol di bawah untuk
                                        melanjutkan.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => setUnlockOpen(true)}
                                        className="mt-2"
                                    >
                                        <Sparkles className="size-4" />
                                        Gunakan Job Invitation
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function Meta({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            {text}
        </span>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    tone?: 'default' | 'green';
}) {
    return (
        <div className="flex items-start gap-2.5">
            <span
                className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                    tone === 'green'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600',
                )}
            >
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {label}
                </p>
                <p
                    className={cn(
                        'truncate text-sm font-semibold',
                        tone === 'green' ? 'text-emerald-700' : 'text-slate-800',
                    )}
                    title={value}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function ContactRow({
    icon: Icon,
    label,
    value,
    href,
    actionIcon: ActionIcon,
    actionLabel,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href: string;
    actionIcon?: React.ComponentType<{ className?: string }>;
    actionLabel?: string;
}) {
    const Action = ActionIcon ?? ExternalLink;

    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className="group flex items-center gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/50"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {label}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600 opacity-0 transition group-hover:opacity-100">
                {actionLabel ?? 'Buka'}
                <Action className="size-3.5" />
            </span>
        </a>
    );
}

function IconAction({
    href,
    method,
    icon: Icon,
    label,
    active,
}: {
    href: string;
    method: 'post' | 'delete';
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            as="button"
            href={href}
            method={method}
            preserveScroll
            title={label}
            aria-label={label}
            className={cn(
                'inline-flex size-10 items-center justify-center rounded-xl border transition',
                active
                    ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600',
            )}
        >
            <Icon className="size-4" />
        </Link>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-slate-900">{value}</span>
        </div>
    );
}

function Empty({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
}) {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Icon className="size-8 text-slate-300" />
            <p>{text}</p>
        </div>
    );
}
