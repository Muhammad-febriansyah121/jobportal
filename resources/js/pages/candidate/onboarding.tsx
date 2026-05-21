import { Form, Head } from '@inertiajs/react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    Field,
    RupiahInput,
    Select,
    Textarea,
} from '@/components/candidate/candidate-form';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { store as storeCv } from '@/routes/candidate/cvs';
import {
    edit,
    parseCvStream,
    store as storeOnboarding,
} from '@/routes/candidate/onboarding';

type Option = { value: string; label: string };

type OnboardingProps = {
    profile: {
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
        skill_ids: number[];
        primary_cv?: { file_url: string } | null;
    };
    industries: Option[];
    skills: Option[];
};

type CvExperience = {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
};

type CvEducation = {
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
    gpa: string;
};

type CvPrefill = {
    full_name: string;
    headline: string;
    bio: string;
    location_city: string;
    location_province: string;
    matched_skill_ids: number[];
    experiences: CvExperience[];
    educations: CvEducation[];
};

type Step = 'choice' | 'form';

export default function CandidateOnboarding({
    profile,
    industries,
    skills,
}: OnboardingProps) {
    const { t } = useTranslate();
    const [step, setStep] = useState<Step>('choice');
    const [cvPrefill, setCvPrefill] = useState<CvPrefill | null>(null);
    const [cvFormKey, setCvFormKey] = useState(0);

    const handleManual = () => setStep('form');

    const handleCvParsed = (data: CvPrefill) => {
        setCvPrefill(data);
        setCvFormKey((k) => k + 1);
        setStep('form');
    };

    if (step === 'choice') {
        return (
            <>
                <Head title={t('candidate.onboarding.page_title')} />
                <div className="space-y-8 p-4 md:p-6">
                    <Heading
                        title={t('candidate.onboarding.welcome_title')}
                        description={t(
                            'candidate.onboarding.welcome_description',
                        )}
                    />
                    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
                        <CvUploadCard
                            onParsed={handleCvParsed}
                            onSkipToManual={handleManual}
                            skills={skills}
                            t={t}
                        />
                        <ManualCard onClick={handleManual} t={t} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <OnboardingForm
            key={cvFormKey}
            profile={profile}
            cvPrefill={cvPrefill}
            industries={industries}
            skills={skills}
            t={t}
        />
    );
}

function CvUploadCard({
    onParsed,
    onSkipToManual,
    skills,
    t,
}: {
    onParsed: (data: CvPrefill) => void;
    onSkipToManual: () => void;
    skills: Option[];
    t: (key: string) => string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [fileName, setFileName] = useState('');
    const [streamChars, setStreamChars] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    const matchSkillIds = (raw: unknown): number[] => {
        if (!Array.isArray(raw)) {
            return [];
        }

        const lookup = new Map<string, number>();
        skills.forEach((s) => {
            const id = Number.parseInt(s.value, 10);
            if (Number.isFinite(id)) {
                lookup.set(s.label.toLowerCase().trim(), id);
            }
        });

        const matched: number[] = [];
        for (const item of raw) {
            if (typeof item !== 'string') {
                continue;
            }
            const id = lookup.get(item.toLowerCase().trim());
            if (id !== undefined && !matched.includes(id)) {
                matched.push(id);
            }
            if (matched.length >= 15) {
                break;
            }
        }
        return matched;
    };

    const normalizeDate = (value: unknown): string => {
        if (typeof value !== 'string' || value.trim() === '') {
            return '';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const normalize = (raw: Record<string, unknown>): CvPrefill => {
        const experiences: CvExperience[] = Array.isArray(raw.experiences)
            ? raw.experiences
                  .filter((item): item is Record<string, unknown> =>
                      typeof item === 'object' && item !== null,
                  )
                  .map((exp) => ({
                      company_name: String(exp.company_name ?? '').trim(),
                      job_title: String(exp.job_title ?? '').trim(),
                      start_date: normalizeDate(exp.start_date),
                      end_date: normalizeDate(exp.end_date),
                      is_current: Boolean(exp.is_current),
                  }))
                  .filter((exp) => exp.company_name !== '')
            : [];

        const educations: CvEducation[] = Array.isArray(raw.educations)
            ? raw.educations
                  .filter((item): item is Record<string, unknown> =>
                      typeof item === 'object' && item !== null,
                  )
                  .map((edu) => ({
                      institution: String(edu.institution ?? '').trim(),
                      degree: String(edu.degree ?? '').trim(),
                      field_of_study: String(edu.field_of_study ?? '').trim(),
                      start_year: String(edu.start_year ?? ''),
                      end_year: String(edu.end_year ?? ''),
                      gpa: String(edu.gpa ?? ''),
                  }))
                  .filter((edu) => edu.institution !== '')
            : [];

        return {
            full_name: String(raw.full_name ?? '').trim(),
            headline: String(raw.headline ?? '').trim(),
            bio: String(raw.summary ?? '').trim(),
            location_city: String(raw.location_city ?? '').trim(),
            location_province: String(raw.location_province ?? '').trim(),
            matched_skill_ids: matchSkillIds(raw.skills),
            experiences,
            educations,
        };
    };

    const handleFile = async (file: File) => {
        setFileName(file.name);
        setState('loading');
        setErrorMsg('');
        setStreamChars(0);

        const formData = new FormData();
        formData.append('cv_file', file);

        const xsrf = decodeURIComponent(
            document.cookie
                .split('; ')
                .find((r) => r.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? '',
        );

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = window.setTimeout(() => controller.abort(), 110_000);

        try {
            const res = await fetch(parseCvStream().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-XSRF-TOKEN': xsrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'text/event-stream',
                },
                body: formData,
                signal: controller.signal,
            });

            if (!res.ok) {
                let errorJson: { error?: string } = {};
                try {
                    errorJson = await res.json();
                } catch {
                    // ignore
                }
                setState('error');
                setErrorMsg(
                    errorJson.error ?? t('candidate.onboarding.upload_error'),
                );

                return;
            }

            if (!res.body) {
                throw new Error('no-stream-body');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) {
                        continue;
                    }
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]' || payload === '') {
                        continue;
                    }
                    try {
                        const event = JSON.parse(payload);
                        if (event.type === 'text_delta' && event.delta) {
                            fullText += event.delta;
                            setStreamChars(fullText.length);
                        }
                    } catch {
                        // ignore
                    }
                }
            }

            const jsonStart = fullText.indexOf('{');
            const jsonEnd = fullText.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('no-json');
            }

            const parsed = JSON.parse(
                fullText.slice(jsonStart, jsonEnd + 1),
            );

            onParsed(normalize(parsed));
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }
            setState('error');
            setErrorMsg(t('candidate.onboarding.server_error'));
        } finally {
            window.clearTimeout(timeoutId);
            abortRef.current = null;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            handleFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];

        if (file) {
            handleFile(file);
        }
    };

    const reset = () => {
        setState('idle');
        setErrorMsg('');
        setFileName('');

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    };

    return (
        <Card
            className={cn(
                'relative flex flex-col gap-0 overflow-hidden border-2 transition-colors',
                state === 'error'
                    ? 'border-destructive/40'
                    : 'border-primary/30 hover:border-primary/60',
            )}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardHeader className="pt-6 pb-3">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Upload className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">
                    {t('candidate.onboarding.upload_cv')}
                </CardTitle>
                <CardDescription>
                    {t('candidate.onboarding.upload_description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                {state === 'loading' ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 py-8">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <div className="w-full px-6 text-center">
                            <p className="text-sm font-medium text-foreground">
                                {streamChars > 0
                                    ? 'AI sedang membaca CV...'
                                    : t('candidate.onboarding.analyzing_cv')}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {fileName}
                            </p>
                            {streamChars > 0 && (
                                <>
                                    <p className="mt-2 font-mono text-[11px] text-primary/70 tabular-nums">
                                        {streamChars.toLocaleString('id-ID')}{' '}
                                        karakter diterima
                                    </p>
                                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/10">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${Math.min(100, Math.round((streamChars / 1500) * 100))}%`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : state === 'error' ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 py-6">
                        <p className="text-center text-sm text-destructive">
                            {errorMsg}
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={reset}>
                                <X className="size-3.5" />
                                {t('candidate.onboarding.try_again')}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onSkipToManual}
                            >
                                {t('candidate.onboarding.fill_manually')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 py-8 transition-colors hover:bg-primary/10"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                fileRef.current?.click();
                            }
                        }}
                    >
                        <FileText className="size-8 text-primary/60" />
                        <p className="text-sm font-medium text-foreground">
                            {t('candidate.onboarding.click_or_drag')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('candidate.onboarding.file_format_hint')}
                        </p>
                    </div>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleChange}
                />
            </CardContent>
        </Card>
    );
}

function ManualCard({
    onClick,
    t,
}: {
    onClick: () => void;
    t: (key: string) => string;
}) {
    return (
        <Card
            className="relative flex cursor-pointer flex-col gap-0 overflow-hidden border-2 border-border transition-colors hover:border-primary/40"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onClick();
                }
            }}
        >
            <CardHeader className="pt-6 pb-3">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">
                    {t('candidate.onboarding.fill_manual')}
                </CardTitle>
                <CardDescription>
                    {t('candidate.onboarding.manual_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full" tabIndex={-1}>
                    {t('candidate.onboarding.start_form')}
                </Button>
            </CardContent>
        </Card>
    );
}

function OnboardingForm({
    profile,
    cvPrefill,
    industries,
    skills,
    t,
}: {
    profile: OnboardingProps['profile'];
    cvPrefill: CvPrefill | null;
    industries: Option[];
    skills: Option[];
    t: (key: string) => string;
}) {
    const merged = {
        full_name: cvPrefill?.full_name || profile.full_name || '',
        headline: cvPrefill?.headline || profile.headline || '',
        bio: cvPrefill?.bio || profile.bio || '',
        location_city: cvPrefill?.location_city || profile.location_city || '',
        location_province:
            cvPrefill?.location_province || profile.location_province || '',
        skill_ids: cvPrefill?.matched_skill_ids.length
            ? cvPrefill.matched_skill_ids
            : profile.skill_ids,
        preferred_industry_id: profile.preferred_industry_id,
        preferred_role: profile.preferred_role || '',
        expected_salary_min: profile.expected_salary_min,
        expected_salary_max: profile.expected_salary_max,
        work_mode_pref: profile.work_mode_pref,
        availability: profile.availability || '',
        primary_cv: profile.primary_cv,
    };

    const firstExp = cvPrefill?.experiences[0] ?? null;
    const firstEdu = cvPrefill?.educations[0] ?? null;
    const additionalExperiences = (cvPrefill?.experiences ?? []).slice(1);
    const additionalEducations = (cvPrefill?.educations ?? []).slice(1);

    const skillLabels = skills.slice(0, 12).map((s) => s.label);
    const interestChecklist =
        skillLabels.length > 0
            ? skillLabels
            : [
                  'Backend Developer',
                  'Frontend Developer',
                  'UI/UX Designer',
                  'Product Manager',
                  'Data Analyst',
                  'DevOps Engineer',
                  'QA Engineer',
                  'Mobile Developer',
              ];

    const [selectedInterests, setSelectedInterests] = useState<string[]>(
        merged.preferred_role ? [merged.preferred_role] : [],
    );
    const [selectedIndustryId, setSelectedIndustryId] = useState(
        merged.preferred_industry_id?.toString() ?? '',
    );
    const [preferredRole, setPreferredRole] = useState(merged.preferred_role);
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
        merged.skill_ids.map(String),
    );
    const [skillSearch, setSkillSearch] = useState('');

    const normalizedSkillSearch = skillSearch.trim().toLowerCase();
    const filteredSkills = normalizedSkillSearch === ''
        ? skills
        : skills.filter((skill) =>
              skill.label.toLowerCase().includes(normalizedSkillSearch),
          );

    const toggleSkill = (skillId: string): void => {
        setSelectedSkillIds((previous) =>
            previous.includes(skillId)
                ? previous.filter((id) => id !== skillId)
                : [...previous, skillId],
        );
    };

    const toggleInterest = (interest: string): void => {
        setSelectedInterests((previous) => {
            if (previous.includes(interest)) {
                const next = previous.filter((item) => item !== interest);
                setPreferredRole((current) =>
                    current === interest ? (next[0] ?? '') : current,
                );

                return next;
            }

            const next = [...previous, interest];
            setPreferredRole((current) =>
                current.length > 0 ? current : interest,
            );

            return next;
        });
    };

    return (
        <>
            <Head title={t('candidate.onboarding.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title={t('candidate.onboarding.page_title')}
                        description={t('candidate.onboarding.form_description')}
                    />
                    {cvPrefill && (
                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                            <Upload className="size-3.5" />
                            {t('candidate.onboarding.prefilled_from_cv')}
                        </div>
                    )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.onboarding.initial_profile')}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'candidate.onboarding.initial_profile_description',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={storeOnboarding.url()}
                                method="post"
                                className="space-y-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.full_name',
                                                )}
                                                name="full_name"
                                                error={errors.full_name}
                                            >
                                                <Input
                                                    name="full_name"
                                                    defaultValue={
                                                        merged.full_name
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.full_name_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.headline',
                                                )}
                                                name="headline"
                                                error={errors.headline}
                                            >
                                                <Input
                                                    name="headline"
                                                    defaultValue={
                                                        merged.headline
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.headline_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label={t(
                                                'candidate.onboarding.short_bio',
                                            )}
                                            name="bio"
                                            error={errors.bio}
                                        >
                                            <Textarea
                                                name="bio"
                                                defaultValue={merged.bio}
                                                placeholder={t(
                                                    'candidate.onboarding.short_bio_placeholder',
                                                )}
                                            />
                                        </Field>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.city',
                                                )}
                                                name="location_city"
                                                error={errors.location_city}
                                            >
                                                <Input
                                                    name="location_city"
                                                    defaultValue={
                                                        merged.location_city
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.city_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.province',
                                                )}
                                                name="location_province"
                                                error={errors.location_province}
                                            >
                                                <Input
                                                    name="location_province"
                                                    defaultValue={
                                                        merged.location_province
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.province_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.expected_salary_min',
                                                )}
                                                name="expected_salary_min"
                                                error={
                                                    errors.expected_salary_min
                                                }
                                            >
                                                <RupiahInput
                                                    name="expected_salary_min"
                                                    defaultValue={
                                                        merged.expected_salary_min
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.expected_salary_min_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.expected_salary_max',
                                                )}
                                                name="expected_salary_max"
                                                error={
                                                    errors.expected_salary_max
                                                }
                                            >
                                                <RupiahInput
                                                    name="expected_salary_max"
                                                    defaultValue={
                                                        merged.expected_salary_max
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.expected_salary_max_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.work_mode',
                                                )}
                                                name="work_mode_pref"
                                                error={errors.work_mode_pref}
                                            >
                                                <Select
                                                    name="work_mode_pref"
                                                    defaultValue={
                                                        merged.work_mode_pref
                                                    }
                                                >
                                                    <option value="any">
                                                        {t(
                                                            'candidate.onboarding.work_mode_flexible',
                                                        )}
                                                    </option>
                                                    <option value="remote">
                                                        {t(
                                                            'candidate.onboarding.work_mode_remote',
                                                        )}
                                                    </option>
                                                    <option value="hybrid">
                                                        {t(
                                                            'candidate.onboarding.work_mode_hybrid',
                                                        )}
                                                    </option>
                                                    <option value="onsite">
                                                        {t(
                                                            'candidate.onboarding.work_mode_onsite',
                                                        )}
                                                    </option>
                                                </Select>
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.availability',
                                                )}
                                                name="availability"
                                                error={errors.availability}
                                            >
                                                <Select
                                                    name="availability"
                                                    defaultValue={
                                                        merged.availability
                                                    }
                                                >
                                                    <option value="">
                                                        {t(
                                                            'candidate.profile.placeholder_availability',
                                                        )}
                                                    </option>
                                                    <option value="none">
                                                        {t(
                                                            'candidate.profile.availability_none',
                                                        )}
                                                    </option>
                                                    <option value="lt_1_month">
                                                        {t(
                                                            'candidate.profile.availability_lt_1_month',
                                                        )}
                                                    </option>
                                                    <option value="1_month">
                                                        {t(
                                                            'candidate.profile.availability_1_month',
                                                        )}
                                                    </option>
                                                    <option value="2_months">
                                                        {t(
                                                            'candidate.profile.availability_2_months',
                                                        )}
                                                    </option>
                                                    <option value="gt_2_months">
                                                        {t(
                                                            'candidate.profile.availability_gt_2_months',
                                                        )}
                                                    </option>
                                                </Select>
                                            </Field>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.preferred_industry',
                                                )}
                                                name="preferred_industry_id"
                                                error={
                                                    errors.preferred_industry_id
                                                }
                                            >
                                                <SearchableSelect
                                                    name="preferred_industry_id"
                                                    options={industries}
                                                    value={selectedIndustryId}
                                                    onChange={
                                                        setSelectedIndustryId
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.select_industry',
                                                    )}
                                                    searchPlaceholder={t(
                                                        'candidate.onboarding.search_industry',
                                                    )}
                                                    emptyText={t(
                                                        'candidate.onboarding.industry_not_found',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.onboarding.preferred_role',
                                                )}
                                                name="preferred_role"
                                                error={errors.preferred_role}
                                            >
                                                <Input
                                                    name="preferred_role"
                                                    value={preferredRole}
                                                    onChange={(e) =>
                                                        setPreferredRole(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.onboarding.preferred_role_placeholder',
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label={t(
                                                'candidate.onboarding.job_interest_checklist',
                                            )}
                                            name="preferred_role"
                                            error={undefined}
                                        >
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                                {interestChecklist.map(
                                                    (interest) => {
                                                        const isSelected =
                                                            selectedInterests.includes(
                                                                interest,
                                                            );
                                                        const inputId = `interest-${interest.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                                                        return (
                                                            <label
                                                                key={interest}
                                                                htmlFor={
                                                                    inputId
                                                                }
                                                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-primary/10"
                                                            >
                                                                <input
                                                                    id={inputId}
                                                                    type="checkbox"
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onChange={() =>
                                                                        toggleInterest(
                                                                            interest,
                                                                        )
                                                                    }
                                                                    className="size-4 rounded border-primary/30 text-primary focus:ring-primary/30"
                                                                />
                                                                <span>
                                                                    {interest}
                                                                </span>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'candidate.onboarding.job_interest_hint',
                                                )}
                                            </p>
                                        </Field>

                                        <Field
                                            label={t(
                                                'candidate.onboarding.main_skill',
                                            )}
                                            name="skill_ids"
                                            error={errors.skill_ids}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Input
                                                        type="search"
                                                        value={skillSearch}
                                                        onChange={(e) =>
                                                            setSkillSearch(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.search_skill_placeholder',
                                                        )}
                                                        className="flex-1"
                                                    />
                                                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                                        {selectedSkillIds.length}{' '}
                                                        {t(
                                                            'candidate.onboarding.skill_selected',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto rounded-lg border border-primary/15 bg-primary/5 p-3">
                                                    {filteredSkills.length ===
                                                    0 ? (
                                                        <p className="py-6 text-center text-xs text-muted-foreground">
                                                            {t(
                                                                'candidate.onboarding.skill_not_found',
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                                            {filteredSkills.map(
                                                                (skill) => {
                                                                    const isSelected =
                                                                        selectedSkillIds.includes(
                                                                            skill.value,
                                                                        );
                                                                    const inputId = `skill-${skill.value}`;

                                                                    return (
                                                                        <label
                                                                            key={
                                                                                skill.value
                                                                            }
                                                                            htmlFor={
                                                                                inputId
                                                                            }
                                                                            className={cn(
                                                                                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
                                                                                isSelected
                                                                                    ? 'border-primary/40 bg-primary/15 text-foreground'
                                                                                    : 'border-primary/15 bg-background text-foreground hover:bg-primary/10',
                                                                            )}
                                                                        >
                                                                            <input
                                                                                id={
                                                                                    inputId
                                                                                }
                                                                                type="checkbox"
                                                                                checked={
                                                                                    isSelected
                                                                                }
                                                                                onChange={() =>
                                                                                    toggleSkill(
                                                                                        skill.value,
                                                                                    )
                                                                                }
                                                                                className="size-4 rounded border-primary/30 text-primary focus:ring-primary/30"
                                                                            />
                                                                            <span className="truncate">
                                                                                {
                                                                                    skill.label
                                                                                }
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedSkillIds.map((id) => (
                                                    <input
                                                        key={id}
                                                        type="hidden"
                                                        name="skill_ids[]"
                                                        value={id}
                                                    />
                                                ))}
                                            </div>
                                        </Field>

                                        <section className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.onboarding.first_work_experience',
                                                    )}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'candidate.onboarding.first_work_experience_description',
                                                    )}
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.company_name',
                                                    )}
                                                    name="first_experience_company_name"
                                                    error={
                                                        errors.first_experience_company_name
                                                    }
                                                >
                                                    <Input
                                                        name="first_experience_company_name"
                                                        defaultValue={
                                                            firstExp?.company_name ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.company_name_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.job_title',
                                                    )}
                                                    name="first_experience_job_title"
                                                    error={
                                                        errors.first_experience_job_title
                                                    }
                                                >
                                                    <Input
                                                        name="first_experience_job_title"
                                                        defaultValue={
                                                            firstExp?.job_title ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.job_title_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.start',
                                                    )}
                                                    name="first_experience_start_date"
                                                    error={
                                                        errors.first_experience_start_date
                                                    }
                                                >
                                                    <Input
                                                        type="date"
                                                        name="first_experience_start_date"
                                                        defaultValue={
                                                            firstExp?.start_date ??
                                                            ''
                                                        }
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.end',
                                                    )}
                                                    name="first_experience_end_date"
                                                    error={
                                                        errors.first_experience_end_date
                                                    }
                                                >
                                                    <Input
                                                        type="date"
                                                        name="first_experience_end_date"
                                                        defaultValue={
                                                            firstExp?.is_current
                                                                ? ''
                                                                : (firstExp?.end_date ??
                                                                  '')
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                                                <input
                                                    type="checkbox"
                                                    name="first_experience_is_current"
                                                    value="1"
                                                    defaultChecked={
                                                        firstExp?.is_current ??
                                                        false
                                                    }
                                                    className="size-4 rounded border-primary/30 text-primary focus:ring-primary/30"
                                                />
                                                {t(
                                                    'candidate.onboarding.currently_working_here',
                                                )}
                                            </label>
                                        </section>

                                        <section className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.onboarding.first_education',
                                                    )}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'candidate.onboarding.first_education_description',
                                                    )}
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.institution',
                                                    )}
                                                    name="first_education_institution"
                                                    error={
                                                        errors.first_education_institution
                                                    }
                                                >
                                                    <Input
                                                        name="first_education_institution"
                                                        defaultValue={
                                                            firstEdu?.institution ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.institution_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.degree',
                                                    )}
                                                    name="first_education_degree"
                                                    error={
                                                        errors.first_education_degree
                                                    }
                                                >
                                                    <Input
                                                        name="first_education_degree"
                                                        defaultValue={
                                                            firstEdu?.degree ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.degree_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.field_of_study',
                                                    )}
                                                    name="first_education_field_of_study"
                                                    error={
                                                        errors.first_education_field_of_study
                                                    }
                                                >
                                                    <Input
                                                        name="first_education_field_of_study"
                                                        defaultValue={
                                                            firstEdu?.field_of_study ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.field_of_study_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.gpa',
                                                    )}
                                                    name="first_education_gpa"
                                                    error={
                                                        errors.first_education_gpa
                                                    }
                                                >
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        name="first_education_gpa"
                                                        defaultValue={
                                                            firstEdu?.gpa ?? ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.gpa_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.start_year',
                                                    )}
                                                    name="first_education_start_year"
                                                    error={
                                                        errors.first_education_start_year
                                                    }
                                                >
                                                    <Input
                                                        type="number"
                                                        name="first_education_start_year"
                                                        defaultValue={
                                                            firstEdu?.start_year ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.start_year_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.end_year',
                                                    )}
                                                    name="first_education_end_year"
                                                    error={
                                                        errors.first_education_end_year
                                                    }
                                                >
                                                    <Input
                                                        type="number"
                                                        name="first_education_end_year"
                                                        defaultValue={
                                                            firstEdu?.end_year ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.onboarding.end_year_placeholder',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                        </section>

                                        {additionalExperiences.length > 0 && (
                                            <input
                                                type="hidden"
                                                name="additional_experiences"
                                                value={JSON.stringify(
                                                    additionalExperiences,
                                                )}
                                            />
                                        )}
                                        {additionalEducations.length > 0 && (
                                            <input
                                                type="hidden"
                                                name="additional_educations"
                                                value={JSON.stringify(
                                                    additionalEducations,
                                                )}
                                            />
                                        )}
                                        {(additionalExperiences.length > 0 ||
                                            additionalEducations.length > 0) && (
                                            <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                                                {t(
                                                    'candidate.onboarding.additional_records_hint',
                                                )
                                                    .replace(
                                                        ':exp',
                                                        String(
                                                            additionalExperiences.length,
                                                        ),
                                                    )
                                                    .replace(
                                                        ':edu',
                                                        String(
                                                            additionalEducations.length,
                                                        ),
                                                    )}
                                            </p>
                                        )}

                                        <Button disabled={processing}>
                                            {processing
                                                ? t(
                                                      'candidate.onboarding.saving',
                                                  )
                                                : t(
                                                      'candidate.onboarding.complete_onboarding',
                                                  )}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('candidate.onboarding.primary_cv')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'candidate.onboarding.primary_cv_description',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {merged.primary_cv ? (
                                    <div className="space-y-3">
                                        <a
                                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                            href={merged.primary_cv.file_url}
                                            target="_blank"
                                        >
                                            {t(
                                                'candidate.onboarding.view_primary_cv',
                                            )}
                                        </a>
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'candidate.onboarding.change_primary_cv_hint',
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <Form
                                        action={storeCv.url()}
                                        method="post"
                                        encType="multipart/form-data"
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <Field
                                                    label={t(
                                                        'candidate.onboarding.cv_file',
                                                    )}
                                                    name="cv_file"
                                                    error={errors.cv_file}
                                                >
                                                    <Input
                                                        type="file"
                                                        name="cv_file"
                                                        accept=".pdf,.doc,.docx"
                                                    />
                                                </Field>
                                                <input
                                                    type="hidden"
                                                    name="is_primary"
                                                    value="1"
                                                />
                                                <Button
                                                    disabled={processing}
                                                    variant="outline"
                                                >
                                                    {t(
                                                        'candidate.onboarding.upload_cv',
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('candidate.onboarding.after_onboarding')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p>{t('candidate.onboarding.after_step_1')}</p>
                                <p>{t('candidate.onboarding.after_step_2')}</p>
                                <p>{t('candidate.onboarding.after_step_3')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateOnboarding.layout = {
    breadcrumbs: [
        {
            title: 'Onboarding Kandidat',
            href: edit(),
        },
    ],
};
