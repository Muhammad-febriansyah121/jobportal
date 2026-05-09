import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    FileText,
    GraduationCap,
    Tags,
    UserRound,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as cvsIndex } from '@/routes/candidate/cvs';
import { index as experiencesIndex } from '@/routes/candidate/experiences';
import { index as educationsIndex } from '@/routes/candidate/educations';
import { edit as profileEdit } from '@/routes/candidate/profile';
import { index as skillsIndex } from '@/routes/candidate/skills';

export function ProfileDataTabs() {
    const { t } = useTranslate();
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage<{ auth: any }>().props;
    const counts = auth.candidate_profile_counts;

    const tabs = [
        {
            title: t('settings_layout.nav_profile'),
            href: profileEdit(),
            icon: UserRound,
            count: null,
        },
        {
            title: t('settings_layout.nav_experiences'),
            href: experiencesIndex(),
            icon: BriefcaseBusiness,
            count: counts?.experiences ?? null,
        },
        {
            title: t('settings_layout.nav_educations'),
            href: educationsIndex(),
            icon: GraduationCap,
            count: counts?.educations ?? null,
        },
        {
            title: t('settings_layout.nav_skills'),
            href: skillsIndex(),
            icon: Tags,
            count: counts?.skills ?? null,
        },
        {
            title: t('settings_layout.nav_cv'),
            href: cvsIndex(),
            icon: FileText,
            count: counts?.cvs ?? null,
        },
    ];

    return (
        <div className="border-b">
            <nav
                className="-mb-px flex gap-1 overflow-x-auto"
                aria-label={t('candidate.profile_tabs.aria_label')}
            >
                {tabs.map((tab) => {
                    const active = isCurrentUrl(tab.href);
                    return (
                        <Link
                            key={tab.title}
                            href={tab.href}
                            className={cn(
                                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                                active
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.title}
                            {tab.count !== null && tab.count > 0 && (
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                                        active
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
