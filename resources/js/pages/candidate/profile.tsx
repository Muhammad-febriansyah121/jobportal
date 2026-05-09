import { Head, Link, useForm } from '@inertiajs/react';
import {
    Briefcase,
    CheckCircle2,
    Globe,
    MapPin,
    Pencil,
    Search,
    Sparkles,
    Tags,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Field,
    RupiahInput,
    Select,
    Textarea,
} from '@/components/candidate/candidate-form';
import { ProgressBar } from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as cvsIndex } from '@/routes/candidate/cvs';
import { index as educationsIndex } from '@/routes/candidate/educations';
import { index as experiencesIndex } from '@/routes/candidate/experiences';
import {
    edit as profileEdit,
    update as updateProfile,
} from '@/routes/candidate/profile';
import { index as skillsIndex } from '@/routes/candidate/skills';
import { edit as settingsProfileEdit } from '@/routes/profile';

type Option = {
    value: string;
    label: string;
};

type ProfileData = {
    full_name: string;
    headline?: string | null;
    bio?: string | null;
    location_city?: string | null;
    location_province?: string | null;
    expected_salary_min?: number | null;
    expected_salary_max?: number | null;
    work_mode_pref: string;
    availability?: string | null;
    preferred_industry_id?: number | null;
    preferred_role?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    profile_completion: number;
    profile_completion_missing: Array<{
        key: string;
        label: string;
    }>;
    ai_cv_summary?: string | null;
    skill_ids: number[];
};

type ProfileProps = {
    profile: ProfileData;
    industries: Option[];
    skills: Option[];
};

type SectionKey = 'identity' | 'work_pref' | 'links' | 'skills';

const WORK_MODE_LABELS: Record<string, string> = {
    any: 'Apa saja',
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'Onsite',
};

const AVAILABILITY_LABELS: Record<string, string> = {
    none: 'Siap mulai sekarang',
    lt_1_month: '< 1 bulan',
    '1_month': '1 bulan',
    '2_months': '2 bulan',
    gt_2_months: '> 2 bulan',
};

function formatRupiah(value: number | null | undefined): string {
    if (!value) return '-';

    return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
}

export default function CandidateProfile({
    profile,
    industries,
    skills,
}: ProfileProps) {
    const { t } = useTranslate();
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    const form = useForm({
        full_name: profile.full_name,
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        location_city: profile.location_city ?? '',
        location_province: profile.location_province ?? '',
        expected_salary_min: profile.expected_salary_min ?? '',
        expected_salary_max: profile.expected_salary_max ?? '',
        work_mode_pref: profile.work_mode_pref,
        availability: profile.availability ?? '',
        preferred_industry_id: profile.preferred_industry_id?.toString() ?? '',
        preferred_role: profile.preferred_role ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
        skill_ids: profile.skill_ids.map(String),
    });

    // Sync form when profile prop refreshes (after successful save)
    useEffect(() => {
        form.setDefaults({
            full_name: profile.full_name,
            headline: profile.headline ?? '',
            bio: profile.bio ?? '',
            location_city: profile.location_city ?? '',
            location_province: profile.location_province ?? '',
            expected_salary_min: profile.expected_salary_min ?? '',
            expected_salary_max: profile.expected_salary_max ?? '',
            work_mode_pref: profile.work_mode_pref,
            availability: profile.availability ?? '',
            preferred_industry_id: profile.preferred_industry_id?.toString() ?? '',
            preferred_role: profile.preferred_role ?? '',
            linkedin_url: profile.linkedin_url ?? '',
            github_url: profile.github_url ?? '',
            portfolio_url: profile.portfolio_url ?? '',
            skill_ids: profile.skill_ids.map(String),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    const closeModal = () => setOpenSection(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(updateProfile().url, {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const completionActionByKey = (key: string): { cta: string; href: string } => {
        switch (key) {
            case 'profile_photo':
                return {
                    cta: t('candidate.profile.completion_upload_photo'),
                    href: settingsProfileEdit().url,
                };
            case 'cv':
                return { cta: t('candidate.profile.completion_upload_cv'), href: cvsIndex().url };
            case 'skills':
                return { cta: t('candidate.profile.completion_add_skill'), href: skillsIndex().url };
            case 'experiences':
                return { cta: t('candidate.profile.completion_add_experience'), href: experiencesIndex().url };
            case 'educations':
                return { cta: t('candidate.profile.completion_add_education'), href: educationsIndex().url };
            default:
                return { cta: t('candidate.profile.completion_complete_profile'), href: profileEdit().url };
        }
    };

    // ---- Section status computations ----
    const identityComplete =
        Boolean(profile.full_name) &&
        Boolean(profile.headline) &&
        Boolean(profile.location_city) &&
        Boolean(profile.bio);

    const workPrefComplete =
        Boolean(profile.expected_salary_min) &&
        Boolean(profile.expected_salary_max) &&
        Boolean(profile.work_mode_pref) &&
        Boolean(profile.availability) &&
        Boolean(profile.preferred_industry_id) &&
        Boolean(profile.preferred_role);

    const linksFilled =
        [profile.linkedin_url, profile.github_url, profile.portfolio_url].filter(Boolean).length;

    const skillsComplete = profile.skill_ids.length >= 3;

    const industryName =
        industries.find((i) => i.value === profile.preferred_industry_id?.toString())?.label ?? '-';

    return (
        <>
            <Head title={t('candidate.profile.title')} />

            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    {/* Sections list */}
                    <div className="space-y-4">
                        <SectionRow
                            icon={User}
                            title="Identitas"
                            description="Nama, headline, lokasi, dan bio singkat."
                            status={identityComplete ? 'complete' : profile.full_name ? 'partial' : 'empty'}
                            onEdit={() => setOpenSection('identity')}
                            preview={
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold text-slate-900">
                                        {profile.full_name}
                                        {profile.headline ? (
                                            <span className="font-normal text-muted-foreground"> · {profile.headline}</span>
                                        ) : null}
                                    </p>
                                    {profile.location_city || profile.location_province ? (
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="size-3.5" />
                                            {[profile.location_city, profile.location_province].filter(Boolean).join(', ')}
                                        </p>
                                    ) : null}
                                    {profile.bio ? (
                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                            {profile.bio}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">Bio belum diisi.</p>
                                    )}
                                </div>
                            }
                        />

                        <SectionRow
                            icon={Briefcase}
                            title="Preferensi Kerja"
                            description="Ekspektasi gaji, mode kerja, ketersediaan, industri & target peran."
                            status={
                                workPrefComplete
                                    ? 'complete'
                                    : profile.expected_salary_min || profile.preferred_role
                                      ? 'partial'
                                      : 'empty'
                            }
                            onEdit={() => setOpenSection('work_pref')}
                            preview={
                                <div className="grid gap-2 text-xs sm:grid-cols-2">
                                    <Cell label="Ekspektasi gaji" value={
                                        profile.expected_salary_min || profile.expected_salary_max
                                            ? `${formatRupiah(profile.expected_salary_min ?? null)} - ${formatRupiah(profile.expected_salary_max ?? null)}`
                                            : '-'
                                    } />
                                    <Cell label="Mode kerja" value={WORK_MODE_LABELS[profile.work_mode_pref] ?? profile.work_mode_pref} />
                                    <Cell label="Ketersediaan" value={profile.availability ? AVAILABILITY_LABELS[profile.availability] ?? profile.availability : '-'} />
                                    <Cell label="Target role" value={profile.preferred_role ?? '-'} />
                                    <Cell label="Industri" value={industryName} />
                                </div>
                            }
                        />

                        <SectionRow
                            icon={Globe}
                            title="Sosial & Portfolio"
                            description="LinkedIn, GitHub, portfolio website."
                            status={
                                linksFilled === 3 ? 'complete' : linksFilled > 0 ? 'partial' : 'empty'
                            }
                            onEdit={() => setOpenSection('links')}
                            preview={
                                <div className="space-y-1 text-xs">
                                    <Link2Row label="LinkedIn" value={profile.linkedin_url} />
                                    <Link2Row label="GitHub" value={profile.github_url} />
                                    <Link2Row label="Portfolio" value={profile.portfolio_url} />
                                </div>
                            }
                        />

                        <SectionRow
                            icon={Tags}
                            title="Skills"
                            description="Skill yang relevan dengan target karier."
                            status={
                                skillsComplete ? 'complete' : profile.skill_ids.length > 0 ? 'partial' : 'empty'
                            }
                            onEdit={() => setOpenSection('skills')}
                            preview={
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.skill_ids.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">Belum ada skill terpilih.</p>
                                    ) : (
                                        profile.skill_ids.slice(0, 8).map((id) => {
                                            const skill = skills.find((s) => s.value === String(id));
                                            return skill ? (
                                                <Badge key={id} variant="outline" className="rounded-full text-[11px]">
                                                    {skill.label}
                                                </Badge>
                                            ) : null;
                                        })
                                    )}
                                    {profile.skill_ids.length > 8 ? (
                                        <Badge variant="secondary" className="rounded-full text-[11px]">
                                            +{profile.skill_ids.length - 8} lainnya
                                        </Badge>
                                    ) : null}
                                </div>
                            }
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {t('candidate.profile.progress_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('candidate.profile.progress_description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-4xl font-bold">
                                    {profile.profile_completion}%
                                </p>
                                <ProgressBar value={profile.profile_completion} />
                                {profile.profile_completion_missing.length > 0 ? (
                                    <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3">
                                        <p className="text-[10px] font-bold tracking-widest text-primary-700 uppercase">
                                            {t('candidate.profile.missing_label')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            {t('candidate.profile.missing_count', {
                                                count: profile.profile_completion_missing.length,
                                            })}
                                        </p>
                                        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                            {profile.profile_completion_missing.map((item) => {
                                                const action = completionActionByKey(item.key);

                                                return (
                                                    <li key={item.key} className="flex items-start gap-2">
                                                        <span className="mt-1 size-1.5 rounded-full bg-primary-500" />
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs">{item.label}</span>
                                                            <Link
                                                                href={action.href}
                                                                className="text-[11px] font-semibold text-primary-700 underline underline-offset-2"
                                                            >
                                                                {action.cta}
                                                            </Link>
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                                        {t('candidate.profile.profile_complete_message')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Sparkles className="size-4 text-primary-600" />
                                    {t('candidate.profile.ai_cv_summary_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {profile.ai_cv_summary ??
                                        t('candidate.profile.ai_cv_summary_empty')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Modals */}
            <EditDialog
                open={openSection === 'identity'}
                onClose={closeModal}
                title="Identitas"
                description="Informasi dasar yang terlihat oleh perekrut."
                onSubmit={handleSubmit}
                processing={form.processing}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama lengkap" name="full_name" error={form.errors.full_name} required>
                        <Input
                            value={form.data.full_name}
                            onChange={(e) => form.setData('full_name', e.target.value)}
                        />
                    </Field>
                    <Field label="Headline" name="headline" error={form.errors.headline}>
                        <Input
                            value={form.data.headline}
                            onChange={(e) => form.setData('headline', e.target.value)}
                            placeholder="Frontend Engineer dengan 4+ tahun pengalaman"
                        />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Kota" name="location_city" error={form.errors.location_city}>
                        <Input
                            value={form.data.location_city}
                            onChange={(e) => form.setData('location_city', e.target.value)}
                        />
                    </Field>
                    <Field label="Provinsi" name="location_province" error={form.errors.location_province}>
                        <Input
                            value={form.data.location_province}
                            onChange={(e) => form.setData('location_province', e.target.value)}
                        />
                    </Field>
                </div>
                <Field label="Bio singkat" name="bio" error={form.errors.bio}>
                    <Textarea
                        value={form.data.bio}
                        onChange={(e) => form.setData('bio', e.target.value)}
                        rows={4}
                    />
                </Field>
            </EditDialog>

            <EditDialog
                open={openSection === 'work_pref'}
                onClose={closeModal}
                title="Preferensi Kerja"
                description="Bantu kami mencocokkan Anda dengan lowongan yang tepat."
                onSubmit={handleSubmit}
                processing={form.processing}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ekspektasi gaji minimal" name="expected_salary_min" error={form.errors.expected_salary_min}>
                        <RupiahInput
                            value={form.data.expected_salary_min}
                            onChange={(value) => form.setData('expected_salary_min', value)}
                        />
                    </Field>
                    <Field label="Ekspektasi gaji maksimal" name="expected_salary_max" error={form.errors.expected_salary_max}>
                        <RupiahInput
                            value={form.data.expected_salary_max}
                            onChange={(value) => form.setData('expected_salary_max', value)}
                        />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Mode kerja" name="work_mode_pref" error={form.errors.work_mode_pref} required>
                        <Select
                            value={form.data.work_mode_pref}
                            onChange={(e) => form.setData('work_mode_pref', e.target.value)}
                        >
                            <option value="any">Apa saja</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="onsite">Onsite</option>
                        </Select>
                    </Field>
                    <Field label="Ketersediaan" name="availability" error={form.errors.availability}>
                        <Select
                            value={form.data.availability}
                            onChange={(e) => form.setData('availability', e.target.value)}
                        >
                            <option value="">Pilih ketersediaan</option>
                            <option value="none">Siap mulai sekarang</option>
                            <option value="lt_1_month">Kurang dari 1 bulan</option>
                            <option value="1_month">1 Bulan</option>
                            <option value="2_months">2 Bulan</option>
                            <option value="gt_2_months">Lebih dari 2 bulan</option>
                        </Select>
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Industri" name="preferred_industry_id" error={form.errors.preferred_industry_id}>
                        <SearchableSelect
                            options={industries}
                            value={form.data.preferred_industry_id}
                            onChange={(v) => form.setData('preferred_industry_id', v)}
                            placeholder="Pilih industri"
                        />
                    </Field>
                    <Field label="Target peran" name="preferred_role" error={form.errors.preferred_role}>
                        <Input
                            value={form.data.preferred_role}
                            onChange={(e) => form.setData('preferred_role', e.target.value)}
                            placeholder="Contoh: Senior Backend Engineer"
                        />
                    </Field>
                </div>
            </EditDialog>

            <EditDialog
                open={openSection === 'links'}
                onClose={closeModal}
                title="Sosial & Portfolio"
                description="Tambahkan link untuk memperkuat profil Anda."
                onSubmit={handleSubmit}
                processing={form.processing}
            >
                <Field label="LinkedIn URL" name="linkedin_url" error={form.errors.linkedin_url}>
                    <Input
                        value={form.data.linkedin_url}
                        onChange={(e) => form.setData('linkedin_url', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                    />
                </Field>
                <Field label="GitHub URL" name="github_url" error={form.errors.github_url}>
                    <Input
                        value={form.data.github_url}
                        onChange={(e) => form.setData('github_url', e.target.value)}
                        placeholder="https://github.com/..."
                    />
                </Field>
                <Field label="Portfolio URL" name="portfolio_url" error={form.errors.portfolio_url}>
                    <Input
                        value={form.data.portfolio_url}
                        onChange={(e) => form.setData('portfolio_url', e.target.value)}
                        placeholder="https://yourportfolio.com"
                    />
                </Field>
            </EditDialog>

            <EditDialog
                open={openSection === 'skills'}
                onClose={closeModal}
                title="Skills"
                description="Pilih skill yang relevan dengan target karier Anda."
                onSubmit={handleSubmit}
                processing={form.processing}
                size="2xl"
            >
                <SkillsPicker
                    skills={skills}
                    selectedIds={form.data.skill_ids}
                    onChange={(ids) => form.setData('skill_ids', ids)}
                    error={form.errors.skill_ids ?? form.errors['skill_ids.0']}
                />
            </EditDialog>
        </>
    );
}

function SectionRow({
    icon: Icon,
    title,
    description,
    status,
    preview,
    onEdit,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    status: 'complete' | 'partial' | 'empty';
    preview: React.ReactNode;
    onEdit: () => void;
}) {
    const statusStyle = {
        complete: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Lengkap', icon: '✓' },
        partial: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Sebagian', icon: '!' },
        empty: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Kosong', icon: '○' },
    }[status];

    return (
        <Card className="overflow-hidden transition hover:shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                                <Badge
                                    className={cn(
                                        'gap-1 rounded-full border-transparent px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase',
                                        statusStyle.bg,
                                        statusStyle.text,
                                    )}
                                >
                                    {status === 'complete' ? <CheckCircle2 className="size-3" /> : null}
                                    {statusStyle.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="shrink-0"
                    >
                        <Pencil className="size-3.5" />
                        Edit
                    </Button>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">{preview}</div>
            </CardContent>
        </Card>
    );
}

function Cell({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50/70 px-2.5 py-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {label}
            </span>
            <span className="truncate text-right font-medium text-slate-700">{value}</span>
        </div>
    );
}

function Link2Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50/70 px-2.5 py-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {label}
            </span>
            {value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-primary-700 hover:underline"
                >
                    {value}
                </a>
            ) : (
                <span className="text-slate-400 italic">belum diisi</span>
            )}
        </div>
    );
}

function EditDialog({
    open,
    onClose,
    title,
    description,
    onSubmit,
    processing,
    children,
    size = 'lg',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    children: React.ReactNode;
    size?: 'lg' | '2xl';
}) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className={cn(size === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    {children}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SkillsPicker({
    skills,
    selectedIds,
    onChange,
    error,
}: {
    skills: Option[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    error?: string;
}) {
    const [query, setQuery] = useState('');

    const filteredSkills = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return skills;

        return skills.filter((s) => s.label.toLowerCase().includes(q));
    }, [query, skills]);

    const toggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((x) => x !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari skill..."
                    className="pl-9"
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {selectedIds.length} skill terpilih
            </p>
            <div className="max-h-72 overflow-y-auto rounded-md border">
                {filteredSkills.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Skill tidak ditemukan.</p>
                ) : (
                    <div className="grid gap-1 p-2 sm:grid-cols-2">
                        {filteredSkills.map((skill) => {
                            const checked = selectedIds.includes(skill.value);

                            return (
                                <label
                                    key={skill.value}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-accent',
                                        checked && 'bg-primary-50 text-primary-800',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(skill.value)}
                                        className="size-4 rounded border-input text-primary focus:ring-ring/50"
                                    />
                                    <span className="truncate">{skill.label}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}

CandidateProfile.layout = {
    breadcrumbs: [
        {
            title: 'Profil Kandidat',
            href: profileEdit(),
        },
    ],
};
