import { Form, Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Field,
    RupiahInput,
    Select,
    Textarea,
} from '@/components/candidate/candidate-form';
import { ProgressBar } from '@/components/candidate/candidate-ui';

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

type ProfileProps = {
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
    industries: Option[];
    skills: Option[];
};

export default function CandidateProfile({
    profile,
    industries,
    skills,
}: ProfileProps) {
    const { t } = useTranslate();
    const completionActionByKey = (
        key: string,
    ): { cta: string; href: string } => {
        switch (key) {
            case 'profile_photo':
                return {
                    cta: t('candidate.profile.completion_upload_photo'),
                    href: settingsProfileEdit(),
                };
            case 'cv':
                return {
                    cta: t('candidate.profile.completion_upload_cv'),
                    href: cvsIndex(),
                };
            case 'skills':
                return {
                    cta: t('candidate.profile.completion_add_skill'),
                    href: skillsIndex(),
                };
            case 'experiences':
                return {
                    cta: t('candidate.profile.completion_add_experience'),
                    href: experiencesIndex(),
                };
            case 'educations':
                return {
                    cta: t('candidate.profile.completion_add_education'),
                    href: educationsIndex(),
                };
            default:
                return {
                    cta: t('candidate.profile.completion_complete_profile'),
                    href: profileEdit(),
                };
        }
    };
    const [skillQuery, setSkillQuery] = useState('');
    const [selectedIndustryId, setSelectedIndustryId] = useState(
        profile.preferred_industry_id?.toString() ?? '',
    );
    const filteredSkills = useMemo(() => {
        const query = skillQuery.trim().toLowerCase();

        if (!query) {
            return skills;
        }

        return skills.filter((skill) =>
            skill.label.toLowerCase().includes(query),
        );
    }, [skillQuery, skills]);

    return (
        <>
            <Head title={t('candidate.profile.title')} />

            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.profile.candidate_data_title')}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'candidate.profile.candidate_data_description',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...updateProfile.form()}
                                className="space-y-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <section className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.profile.section_main_info_title',
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        'candidate.profile.section_main_info_description',
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_full_name',
                                                    )}
                                                    name="full_name"
                                                    error={errors.full_name}
                                                    required
                                                >
                                                    <Input
                                                        name="full_name"
                                                        defaultValue={
                                                            profile.full_name
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_full_name',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_headline',
                                                    )}
                                                    name="headline"
                                                    error={errors.headline}
                                                >
                                                    <Input
                                                        name="headline"
                                                        defaultValue={
                                                            profile.headline ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_headline',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                        </section>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label={t(
                                                    'candidate.profile.label_city',
                                                )}
                                                name="location_city"
                                                error={errors.location_city}
                                            >
                                                <Input
                                                    name="location_city"
                                                    defaultValue={
                                                        profile.location_city ??
                                                        ''
                                                    }
                                                    placeholder={t(
                                                        'candidate.profile.placeholder_city',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'candidate.profile.label_province',
                                                )}
                                                name="location_province"
                                                error={errors.location_province}
                                            >
                                                <Input
                                                    name="location_province"
                                                    defaultValue={
                                                        profile.location_province ??
                                                        ''
                                                    }
                                                    placeholder={t(
                                                        'candidate.profile.placeholder_province',
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <Field
                                            label={t(
                                                'candidate.profile.label_bio',
                                            )}
                                            name="bio"
                                            error={errors.bio}
                                        >
                                            <Textarea
                                                name="bio"
                                                defaultValue={profile.bio ?? ''}
                                                placeholder={t(
                                                    'candidate.profile.placeholder_bio',
                                                )}
                                            />
                                        </Field>

                                        <section className="space-y-4 border-t pt-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.profile.section_work_pref_title',
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        'candidate.profile.section_work_pref_description',
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_salary_min',
                                                    )}
                                                    name="expected_salary_min"
                                                    error={
                                                        errors.expected_salary_min
                                                    }
                                                >
                                                    <RupiahInput
                                                        name="expected_salary_min"
                                                        defaultValue={
                                                            profile.expected_salary_min
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_salary_min',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_salary_max',
                                                    )}
                                                    name="expected_salary_max"
                                                    error={
                                                        errors.expected_salary_max
                                                    }
                                                >
                                                    <RupiahInput
                                                        name="expected_salary_max"
                                                        defaultValue={
                                                            profile.expected_salary_max
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_salary_max',
                                                        )}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_work_mode',
                                                    )}
                                                    name="work_mode_pref"
                                                    error={
                                                        errors.work_mode_pref
                                                    }
                                                    required
                                                >
                                                    <Select
                                                        name="work_mode_pref"
                                                        defaultValue={
                                                            profile.work_mode_pref
                                                        }
                                                    >
                                                        <option value="any">
                                                            {t(
                                                                'candidate.profile.option_work_any',
                                                            )}
                                                        </option>
                                                        <option value="remote">
                                                            {t(
                                                                'candidate.profile.option_work_remote',
                                                            )}
                                                        </option>
                                                        <option value="hybrid">
                                                            {t(
                                                                'candidate.profile.option_work_hybrid',
                                                            )}
                                                        </option>
                                                        <option value="onsite">
                                                            {t(
                                                                'candidate.profile.option_work_onsite',
                                                            )}
                                                        </option>
                                                    </Select>
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_availability',
                                                    )}
                                                    name="availability"
                                                    error={errors.availability}
                                                >
                                                    <Input
                                                        name="availability"
                                                        defaultValue={
                                                            profile.availability ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_availability',
                                                        )}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_industry',
                                                    )}
                                                    name="preferred_industry_id"
                                                    error={
                                                        errors.preferred_industry_id
                                                    }
                                                >
                                                    <SearchableSelect
                                                        name="preferred_industry_id"
                                                        options={industries}
                                                        value={
                                                            selectedIndustryId
                                                        }
                                                        onChange={
                                                            setSelectedIndustryId
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_industry',
                                                        )}
                                                        searchPlaceholder={t(
                                                            'candidate.profile.search_industry',
                                                        )}
                                                        emptyText={t(
                                                            'candidate.profile.empty_industry',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_role',
                                                    )}
                                                    name="preferred_role"
                                                    error={
                                                        errors.preferred_role
                                                    }
                                                >
                                                    <Input
                                                        name="preferred_role"
                                                        defaultValue={
                                                            profile.preferred_role ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_role',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                        </section>

                                        <section className="space-y-4 border-t pt-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.profile.section_links_title',
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        'candidate.profile.section_links_description',
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_linkedin',
                                                    )}
                                                    name="linkedin_url"
                                                    error={errors.linkedin_url}
                                                >
                                                    <Input
                                                        name="linkedin_url"
                                                        defaultValue={
                                                            profile.linkedin_url ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_linkedin',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_github',
                                                    )}
                                                    name="github_url"
                                                    error={errors.github_url}
                                                >
                                                    <Input
                                                        name="github_url"
                                                        defaultValue={
                                                            profile.github_url ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_github',
                                                        )}
                                                    />
                                                </Field>
                                                <Field
                                                    label={t(
                                                        'candidate.profile.label_portfolio',
                                                    )}
                                                    name="portfolio_url"
                                                    error={errors.portfolio_url}
                                                >
                                                    <Input
                                                        name="portfolio_url"
                                                        defaultValue={
                                                            profile.portfolio_url ??
                                                            ''
                                                        }
                                                        placeholder={t(
                                                            'candidate.profile.placeholder_portfolio_url',
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                        </section>

                                        <section className="space-y-4 border-t pt-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {t(
                                                        'candidate.profile.section_skills_title',
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        'candidate.profile.section_skills_description',
                                                    )}
                                                </p>
                                            </div>
                                            <Field
                                                label={t(
                                                    'candidate.profile.label_search_skills',
                                                )}
                                                name="skill_ids"
                                                error={
                                                    errors.skill_ids ??
                                                    errors['skill_ids.0']
                                                }
                                            >
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            value={skillQuery}
                                                            onChange={(event) =>
                                                                setSkillQuery(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder={t(
                                                                'candidate.profile.placeholder_search_skills',
                                                            )}
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto rounded-md border">
                                                        {filteredSkills.length ===
                                                        0 ? (
                                                            <p className="p-3 text-sm text-muted-foreground">
                                                                {t(
                                                                    'candidate.profile.skills_not_found',
                                                                )}
                                                            </p>
                                                        ) : (
                                                            <div className="grid gap-1 p-2 md:grid-cols-2">
                                                                {filteredSkills.map(
                                                                    (skill) => (
                                                                        <label
                                                                            key={
                                                                                skill.value
                                                                            }
                                                                            className={cn(
                                                                                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                                                                            )}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                name="skill_ids[]"
                                                                                value={
                                                                                    skill.value
                                                                                }
                                                                                defaultChecked={profile.skill_ids.includes(
                                                                                    Number(
                                                                                        skill.value,
                                                                                    ),
                                                                                )}
                                                                                className="size-4 rounded border-input text-primary focus:ring-ring/50"
                                                                            />
                                                                            <span className="truncate">
                                                                                {
                                                                                    skill.label
                                                                                }
                                                                            </span>
                                                                        </label>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Field>
                                        </section>

                                        <Button disabled={processing}>
                                            {processing
                                                ? t(
                                                      'candidate.profile.btn_saving',
                                                  )
                                                : t(
                                                      'candidate.profile.btn_save',
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
                                    {t('candidate.profile.progress_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'candidate.profile.progress_description',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-4xl font-semibold">
                                    {profile.profile_completion}%
                                </p>
                                <ProgressBar
                                    value={profile.profile_completion}
                                />
                                {profile.profile_completion_missing.length >
                                0 ? (
                                    <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3">
                                        <p className="text-xs font-semibold tracking-[0.1em] text-primary-700 uppercase">
                                            {t(
                                                'candidate.profile.missing_label',
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {t(
                                                'candidate.profile.missing_count',
                                                {
                                                    count: profile
                                                        .profile_completion_missing
                                                        .length,
                                                },
                                            )}
                                        </p>
                                        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                            {profile.profile_completion_missing.map(
                                                (item) => {
                                                    const action =
                                                        completionActionByKey(
                                                            item.key,
                                                        );

                                                    return (
                                                        <li
                                                            key={item.key}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="mt-1 size-1.5 rounded-full bg-primary-500" />
                                                            <span className="flex flex-wrap items-center gap-2">
                                                                <span>
                                                                    {item.label}
                                                                </span>
                                                                <Link
                                                                    href={
                                                                        action.href
                                                                    }
                                                                    className="text-xs font-semibold text-primary-700 underline underline-offset-2"
                                                                >
                                                                    {action.cta}
                                                                </Link>
                                                            </span>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                                        {t(
                                            'candidate.profile.profile_complete_message',
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('candidate.profile.ai_cv_summary_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {profile.ai_cv_summary ??
                                        t(
                                            'candidate.profile.ai_cv_summary_empty',
                                        )}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
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
