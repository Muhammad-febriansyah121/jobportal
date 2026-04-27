import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
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
import { cn, toUrl } from '@/lib/utils';
import { index as candidateCvs } from '@/routes/candidate/cvs';
import { index as candidateEducations } from '@/routes/candidate/educations';
import { index as candidateExperiences } from '@/routes/candidate/experiences';
import { edit as candidateProfileEdit } from '@/routes/candidate/profile';
import { index as candidateSkills } from '@/routes/candidate/skills';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const profileDataNavItems: NavItem[] = [
    {
        title: 'Profil',
        href: candidateProfileEdit(),
        icon: UserRound,
    },
    {
        title: 'Pengalaman Kerja',
        href: candidateExperiences(),
        icon: BriefcaseBusiness,
    },
    {
        title: 'Pendidikan',
        href: candidateEducations(),
        icon: GraduationCap,
    },
    {
        title: 'Skill',
        href: candidateSkills(),
        icon: Tags,
    },
    {
        title: 'CV',
        href: candidateCvs(),
        icon: FileText,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage().props;
    const isCandidate = auth?.user?.role === 'candidate';

    return (
        <div className="px-4 py-6">
            <Heading
                title="Pengaturan Akun"
                description="Kelola profil user dan ganti password akun."
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
                                Ganti Password
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
                                Ganti Password
                            </Link>
                        </Button>

                        {isCandidate && (
                            <>
                                <div className="px-2 pt-3 pb-1">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Data Profil
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
