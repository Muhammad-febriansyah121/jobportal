import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Camera,
    FileText,
    GraduationCap,
    ShieldCheck,
    Tags,
    UserRound,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTranslate } from '@/hooks/use-translate';
import { cn, toUrl } from '@/lib/utils';
import { index as candidateCvs } from '@/routes/candidate/cvs';
import { index as candidateEducations } from '@/routes/candidate/educations';
import { index as candidateExperiences } from '@/routes/candidate/experiences';
import { edit as candidateProfileEdit } from '@/routes/candidate/profile';
import { edit as candidateProfilePhoto } from '@/routes/candidate/profile/photo';
import { index as candidateSkills } from '@/routes/candidate/skills';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { t } = useTranslate();
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage().props;
    const isCandidate = auth?.user?.role === 'candidate';

    const profileDataNavItems: NavItem[] = [
        {
            title: t('settings_layout.nav_profile'),
            href: candidateProfileEdit(),
            icon: UserRound,
        },
        {
            title: t('settings_layout.nav_profile_photo'),
            href: candidateProfilePhoto(),
            icon: Camera,
        },
        {
            title: t('settings_layout.nav_experiences'),
            href: candidateExperiences(),
            icon: BriefcaseBusiness,
        },
        {
            title: t('settings_layout.nav_educations'),
            href: candidateEducations(),
            icon: GraduationCap,
        },
        {
            title: t('settings_layout.nav_skills'),
            href: candidateSkills(),
            icon: Tags,
        },
        {
            title: t('settings_layout.nav_cv'),
            href: candidateCvs(),
            icon: FileText,
        },
    ];

    return (
        <div className="px-4 py-6">
            <Heading
                title={t('settings_layout.heading_title')}
                description={t('settings_layout.heading_description')}
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
                {/* Mobile: horizontal scrollable nav */}
                <aside className="lg:hidden">
                    <nav
                        className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2"
                        aria-label="Pengaturan akun"
                    >
                        <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className={cn('shrink-0 justify-start gap-2', {
                                'bg-muted text-foreground':
                                    isCurrentOrParentUrl(editSecurity()),
                            })}
                        >
                            <Link href={editSecurity()}>
                                <ShieldCheck className="h-4 w-4" />
                                {t('settings_layout.change_password')}
                            </Link>
                        </Button>

                        {isCandidate &&
                            profileDataNavItems.map((item, index) => (
                                <Button
                                    key={`mobile-${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'shrink-0 justify-start gap-2',
                                        {
                                            'bg-muted text-foreground':
                                                isCurrentOrParentUrl(item.href),
                                        },
                                    )}
                                >
                                    <Link href={item.href}>
                                        {item.icon && (
                                            <item.icon className="h-4 w-4" />
                                        )}
                                        {item.title}
                                    </Link>
                                </Button>
                            ))}
                    </nav>
                </aside>

                {/* Desktop: vertical sidebar */}
                <aside className="hidden w-56 shrink-0 lg:block">
                    <nav
                        className="flex flex-col space-y-1 rounded-xl border bg-card p-2"
                        aria-label="Pengaturan akun"
                    >
                        <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className={cn('h-10 w-full justify-start gap-2', {
                                'bg-muted text-foreground':
                                    isCurrentOrParentUrl(editSecurity()),
                            })}
                        >
                            <Link href={editSecurity()}>
                                <ShieldCheck className="h-4 w-4" />
                                {t('settings_layout.change_password')}
                            </Link>
                        </Button>

                        {isCandidate && (
                            <>
                                <div className="px-2 pt-3 pb-1">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        {t('settings_layout.profile_data_heading')}
                                    </p>
                                </div>
                                {profileDataNavItems.map((item, index) => (
                                    <Button
                                        key={`${toUrl(item.href)}-${index}`}
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn(
                                            'h-10 w-full justify-start gap-2',
                                            {
                                                'bg-muted text-foreground':
                                                    isCurrentOrParentUrl(
                                                        item.href,
                                                    ),
                                            },
                                        )}
                                    >
                                        <Link href={item.href}>
                                            {item.icon && (
                                                <item.icon className="h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </>
                        )}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1">
                    <section className="space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
