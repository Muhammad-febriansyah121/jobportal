import { Link } from '@inertiajs/react';
import { Compass, Map } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as careerCoachIndex } from '@/routes/candidate/career-coach';
import { index as careerPathsIndex } from '@/routes/candidate/career-paths';

export function CareerModuleTabs() {
    const { t } = useTranslate();
    const { isCurrentUrl } = useCurrentUrl();

    const tabs = [
        {
            title: t('nav.candidate.career_coach'),
            href: careerCoachIndex(),
            icon: Compass,
        },
        {
            title: t('nav.candidate.career_paths'),
            href: careerPathsIndex(),
            icon: Map,
        },
    ];

    return (
        <div className="border-b">
            <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Career module">
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
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
