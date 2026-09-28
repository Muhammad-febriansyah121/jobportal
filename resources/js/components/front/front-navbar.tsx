import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
    MobileNav,
    MobileNavHeader,
    MobileNavMenu,
    MobileNavToggle,
    Navbar,
    NavBody,
    NavItems,
} from '@/components/ui/resizable-navbar';
import { useTranslate } from '@/hooks/use-translate';
import {
    aiInterviewSimulator,
    dashboard,
    home,
    login,
    register,
} from '@/routes';
import { index as careerResourcesIndex } from '@/routes/career-resources';
import { index as companiesIndex } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';
import { index as salaryIndex } from '@/routes/salary';
import type { Auth } from '@/types';

type Branding = {
    name?: string;
    logo_url?: string | null;
};

export default function FrontNavbar({
    overlay = false,
}: {
    overlay?: boolean;
}) {
    const page = usePage<{ auth: Auth; branding?: Branding; name: string }>();
    const { auth, branding, name } = page.props;
    const { t } = useTranslate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();
    const siteName = branding?.name ?? name ?? 'Karivia';
    const currentPath = page.url.split('?')[0];
    const overlayActive = overlay && !scrolled;

    useMotionValueEvent(scrollY, 'change', (current) => {
        setScrolled(current > 100);
    });

    const links = [
        { name: t('front.nav.home'), link: home.url() },
        { name: t('front.nav.jobs'), link: jobsIndex.url() },
        { name: t('front.nav.companies'), link: companiesIndex.url() },
        { name: 'Sumber Karier', link: careerResourcesIndex.url() },
        { name: 'AI Tools', link: aiInterviewSimulator.url() },
        { name: 'Cek Gaji', link: salaryIndex.url() },
    ];

    const logo = branding?.logo_url ?? null;

    return (
        <header
            className={
                overlay
                    ? 'relative z-50 h-0'
                    : 'relative z-50 border-b border-transparent'
            }
        >
            <Navbar className="px-3 sm:px-5" overlay={overlay} tone="light">
                <NavBody className="px-4 sm:px-6">
                    <Link
                        href={home.url()}
                        aria-label={`Kembali ke ${siteName}`}
                        className="group relative z-20 flex shrink-0 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        {logo ? (
                            <img
                                src={logo}
                                alt={siteName}
                                width="200"
                                height="56"
                                className="max-h-12 w-auto max-w-[200px] object-contain object-left transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                        ) : (
                            <span className="text-sm font-extrabold tracking-tight text-heading">
                                {siteName}
                            </span>
                        )}
                    </Link>

                    <NavItems
                        items={links}
                        activeLink={currentPath}
                        overlay={overlay}
                        visible={scrolled}
                        tone="light"
                    />

                    <div className="relative z-20 ml-auto hidden items-center gap-2 lg:flex">
                        <LanguageSwitcher
                            align="end"
                            variant="inline"
                            triggerClassName="rounded-full border border-primary-100 bg-white/80 px-3 text-text/70 hover:bg-primary-50 hover:text-primary"
                        />
                        {auth?.user ? (
                            <Link
                                href={dashboard.url()}
                                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(10,102,255,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                {t('front.nav.dashboard')}
                                <ArrowRight
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login.url()}
                                    className="inline-flex min-h-11 items-center rounded-full border border-primary px-5 text-sm font-medium text-text/70 transition hover:bg-primary-50 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                >
                                    {t('front.nav.login')}
                                </Link>
                                <Link
                                    href={register.url()}
                                    className="group/cta inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(10,102,255,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                >
                                    {t('front.nav.register')}
                                    <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                                </Link>
                            </>
                        )}
                    </div>
                </NavBody>

                <MobileNav className="px-2" overlay={overlay} tone="light">
                    <MobileNavHeader>
                        <Link
                            href={home.url()}
                            aria-label={`Kembali ke ${siteName}`}
                            className="group flex items-center rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            {logo ? (
                                <img
                                    src={logo}
                                    alt={siteName}
                                    width="200"
                                    height="56"
                                    className="max-h-12 w-auto max-w-[180px] object-contain object-left transition-transform duration-200 group-hover:scale-[1.02]"
                                />
                            ) : (
                                <span className="text-sm font-extrabold tracking-tight text-heading">
                                    {siteName}
                                </span>
                            )}
                        </Link>
                        <MobileNavToggle
                            isOpen={mobileOpen}
                            onClick={() => setMobileOpen((open) => !open)}
                            overlay={overlayActive}
                            tone="light"
                        />
                    </MobileNavHeader>

                    <MobileNavMenu isOpen={mobileOpen}>
                        <nav
                            className="flex w-full flex-col gap-1"
                            aria-label="Navigasi mobile"
                        >
                            {links.map((link) => {
                                const active =
                                    currentPath === link.link ||
                                    currentPath.startsWith(`${link.link}/`);

                                return (
                                    <Link
                                        key={link.link}
                                        href={link.link}
                                        onClick={() => setMobileOpen(false)}
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                        className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${active ? 'bg-primary font-semibold text-white' : 'text-text/70 hover:bg-background-soft hover:text-primary'}`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex w-full items-center justify-between border-t border-border pt-4">
                            <span className="text-sm font-semibold text-text/70">
                                {t('language.label')}
                            </span>
                            <LanguageSwitcher align="end" variant="inline" />
                        </div>

                        <div className="grid w-full grid-cols-2 gap-2 border-t border-border pt-4">
                            <Link
                                href={login.url()}
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary px-4 text-sm font-bold text-primary transition hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            >
                                {t('front.nav.login')}
                            </Link>
                            <Link
                                href={register.url()}
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            >
                                {t('front.nav.register')}
                            </Link>
                        </div>
                    </MobileNavMenu>
                </MobileNav>
            </Navbar>
        </header>
    );
}
