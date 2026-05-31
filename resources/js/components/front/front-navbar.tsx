import { Link, router, usePage } from '@inertiajs/react';
import {
    Bot,
    ChevronDown,
    ScanSearch,
    Sparkles,
} from 'lucide-react';
import { forwardRef, useMemo, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
    MobileNav,
    MobileNavHeader,
    MobileNavMenu,
    MobileNavToggle,
    Navbar,
    NavBody,
} from '@/components/ui/resizable-navbar';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useTranslate } from '@/hooks/use-translate';
import { home, login, register } from '@/routes';
import { index as companiesIndex } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';
import type { Auth } from '@/types';

type MotionLikeProps<T extends HTMLElement> = React.HTMLAttributes<T> & {
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    layoutId?: unknown;
    transition?: unknown;
    variants?: unknown;
    viewport?: unknown;
    whileInView?: unknown;
};

function stripMotionProps<T extends HTMLElement>({
    animate: _animate,
    exit: _exit,
    initial: _initial,
    layoutId: _layoutId,
    transition: _transition,
    variants: _variants,
    viewport: _viewport,
    whileInView: _whileInView,
    ...props
}: MotionLikeProps<T>): React.HTMLAttributes<T> {
    return props;
}

const MotionDiv = forwardRef<HTMLDivElement, MotionLikeProps<HTMLDivElement>>(
    function MotionDiv(props, ref) {
        return <div ref={ref} {...stripMotionProps(props)} />;
    },
);

const AnimatePresence = ({
    children,
}: {
    children: React.ReactNode;
    initial?: boolean;
}) => <>{children}</>;

const motion = {
    div: MotionDiv,
};

type DropdownItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    desc?: string;
    badge?: string;
};

function NavDropdown({ label, items, currentPath }: { label: string; items: DropdownItem[]; currentPath: string }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isActive = items.some((i) => currentPath === i.href || currentPath.startsWith(i.href + '/'));

    function handleMouseEnter() {
        if (closeTimer.current) {
clearTimeout(closeTimer.current);
}

        setOpen(true);
    }

    function handleMouseLeave() {
        closeTimer.current = setTimeout(() => setOpen(false), 80);
    }

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'font-semibold text-primary' : 'text-neutral-700 hover:text-neutral-900'
                } hover:bg-gray-100`}
            >
                {isActive && <span className="absolute inset-0 rounded-full bg-primary/10" />}
                <span className="relative z-10">{label}</span>
                <ChevronDown className={`relative z-10 size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Gap bridge */}
            {open && <div className="absolute left-0 top-full h-2 w-full" />}

            {open && (
                <div className="absolute left-1/2 top-[calc(100%+4px)] w-60 -translate-x-1/2 rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-xl shadow-neutral-200/60">
                    {items.map((item) => {
                        const active = currentPath === item.href || currentPath.startsWith(item.href + '/');

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                                    active ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-primary/5 hover:text-primary'
                                }`}
                            >
                                <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary/10' : 'bg-neutral-100'}`}>
                                    <item.icon className={`size-3.5 ${active ? 'text-primary' : 'text-neutral-500'}`} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium leading-tight">{item.name}</span>
                                        {item.badge && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                                <Sparkles className="size-2.5" />
                                                {item.badge}
                                            </span>
                                        )}
                                    </span>
                                    {item.desc && <span className="mt-0.5 block text-xs text-neutral-400">{item.desc}</span>}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function MobileSection({ label, items, currentPath, onClose }: { label: string; items: DropdownItem[]; currentPath: string; onClose: () => void }) {
    const [open, setOpen] = useState(false);
    const isAnyActive = items.some((i) => currentPath === i.href || currentPath.startsWith(i.href + '/'));

    return (
        <div className="w-full">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isAnyActive ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
            >
                <span>{label}</span>
                <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isAnyActive ? 'text-primary' : 'text-neutral-400'}`} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 space-y-0.5 pb-1 pl-2">
                            {items.map((item) => {
                                const active = currentPath === item.href || currentPath.startsWith(item.href + '/');

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                            active ? 'bg-primary/5 font-medium text-primary' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
                                        }`}
                                        onClick={onClose}
                                    >
                                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary/10' : 'bg-neutral-100'}`}>
                                            <item.icon className={`size-3.5 ${active ? 'text-primary' : 'text-neutral-500'}`} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5">
                                                <span className="leading-tight">{item.name}</span>
                                                {item.badge && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                                        <Sparkles className="size-2.5" />
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </span>
                                            {item.desc && <span className="block text-xs text-neutral-400">{item.desc}</span>}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FrontBrandLogo({ siteLogoUrl, siteName }: { siteLogoUrl: string | null; siteName: string }) {
    return (
        <div className="flex h-20 w-auto shrink-0 items-center">
            {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteName} className="h-full w-auto max-w-[300px] object-contain" />
            ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
                    <AppLogoIcon className="size-9 fill-white" />
                </div>
            )}
        </div>
    );
}

export default function FrontNavbar() {
    const page = usePage<{ auth: Auth; branding?: { name?: string; logo_url?: string | null }; name: string }>();
    const { auth, branding, name } = page.props;
    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;
    const currentPath = page.url.split('?')[0];
    const [mobileOpen, setMobileOpen] = useState(false);
    const { t } = useTranslate();

    const aiToolsItems = useMemo<DropdownItem[]>(
        () => [
            {
                name: t('front.nav.cv_analyzer'),
                href: '/cv-analyzer',
                icon: ScanSearch,
                desc: t('front.nav.cv_analyzer.desc'),
            },
            {
                name: t('front.nav.ai_interview'),
                href: '/ai-interview-simulator',
                icon: Bot,
                desc: t('front.nav.ai_interview.desc'),
            },
        ],
        [t],
    );

    return (
        <Navbar>
            {/* Desktop */}
            <NavBody>
                <Link href={home.url()} className="relative z-20 flex items-center">
                    <FrontBrandLogo siteLogoUrl={siteLogoUrl} siteName={siteName} />
                </Link>

                <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 text-sm lg:flex">
                    {/* Home */}
                    <a
                        href={home.url()}
                        className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                            currentPath === '/' ? 'font-semibold text-primary' : 'text-neutral-700 hover:bg-gray-100 hover:text-neutral-900'
                        } rounded-full`}
                    >
                        {currentPath === '/' && <span className="absolute inset-0 rounded-full bg-primary/10" />}
                        <span className="relative z-10">{t('front.nav.home')}</span>
                    </a>

                    <a
                        href={jobsIndex().url}
                        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            currentPath.startsWith('/jobs') ? 'font-semibold text-primary' : 'text-neutral-700 hover:bg-gray-100 hover:text-neutral-900'
                        }`}
                    >
                        {currentPath.startsWith('/jobs') && <span className="absolute inset-0 rounded-full bg-primary/10" />}
                        <span className="relative z-10">{t('front.nav.jobs')}</span>
                    </a>
                    <a
                        href={companiesIndex().url}
                        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            currentPath.startsWith('/companies') ? 'font-semibold text-primary' : 'text-neutral-700 hover:bg-gray-100 hover:text-neutral-900'
                        }`}
                    >
                        {currentPath.startsWith('/companies') && <span className="absolute inset-0 rounded-full bg-primary/10" />}
                        <span className="relative z-10">{t('front.nav.companies')}</span>
                    </a>
                    <NavDropdown label={t('front.nav.ai_tools')} items={aiToolsItems} currentPath={currentPath} />
                    <a
                        href="/salary"
                        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            currentPath === '/salary' ? 'font-semibold text-primary' : 'text-neutral-700 hover:bg-gray-100 hover:text-neutral-900'
                        }`}
                    >
                        {currentPath === '/salary' && <span className="absolute inset-0 rounded-full bg-primary/10" />}
                        <span className="relative z-10">{t('front.nav.salary_check')}</span>
                    </a>
                </div>

                <div className="relative z-20 flex items-center gap-2">
                    <LanguageSwitcher align="end" variant="inline" />
                    {auth?.user ? (
                        <ShimmerButton
                            background="var(--primary)"
                            className="h-9 px-5 text-sm font-medium"
                            onClick={() => router.visit('/dashboard')}
                        >
                            {t('front.nav.dashboard')}
                        </ShimmerButton>
                    ) : (
                        <>
                            <Link
                                href={login.url()}
                                className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                            >
                                {t('front.nav.login')}
                            </Link>
                            <ShimmerButton
                                background="var(--primary)"
                                className="h-9 px-5 text-sm font-medium"
                                onClick={() => router.visit(register.url())}
                            >
                                {t('front.nav.register')}
                            </ShimmerButton>
                        </>
                    )}
                </div>
            </NavBody>

            {/* Mobile */}
            <MobileNav>
                <MobileNavHeader>
                    <Link href={home.url()} className="flex items-center">
                        <FrontBrandLogo siteLogoUrl={siteLogoUrl} siteName={siteName} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher align="end" variant="inline" />
                        <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
                    </div>
                </MobileNavHeader>

                <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
                    {/* Home */}
                    <Link
                        href={home.url()}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                            currentPath === '/' ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <span className={`flex size-7 items-center justify-center rounded-lg ${currentPath === '/' ? 'bg-primary/10' : 'bg-neutral-100'}`}>
                            <svg className={`size-3.5 ${currentPath === '/' ? 'text-primary' : 'text-neutral-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </span>
                        {t('front.nav.home')}
                    </Link>

                    {/* Nav sections */}
                    <div className="w-full space-y-0.5 border-t border-neutral-100 pt-1">
                        <Link
                            href={jobsIndex().url}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                currentPath.startsWith('/jobs') ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {t('front.nav.jobs')}
                        </Link>
                        <Link
                            href={companiesIndex().url}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                currentPath.startsWith('/companies') ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {t('front.nav.companies')}
                        </Link>
                        <MobileSection label={t('front.nav.ai_tools')} items={aiToolsItems} currentPath={currentPath} onClose={() => setMobileOpen(false)} />
                        <Link
                            href="/salary"
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                currentPath === '/salary' ? 'bg-primary/5 text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {t('front.nav.salary_check')}
                        </Link>
                    </div>

                    {/* Auth buttons */}
                    <div className="flex w-full flex-col gap-2 border-t border-neutral-100 pt-2">
                        {auth?.user ? (
                            <ShimmerButton
                                background="var(--primary)"
                                className="w-full justify-center text-sm font-medium"
                                onClick={() => { router.visit('/dashboard'); setMobileOpen(false); }}
                            >
                                {t('front.nav.dashboard')}
                            </ShimmerButton>
                        ) : (
                            <>
                                <Link
                                    href={login.url()}
                                    className="w-full rounded-full border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {t('front.nav.login')}
                                </Link>
                                <ShimmerButton
                                    background="var(--primary)"
                                    className="w-full justify-center text-sm font-medium"
                                    onClick={() => { router.visit(register.url()); setMobileOpen(false); }}
                                >
                                    {t('front.nav.register')}
                                </ShimmerButton>
                            </>
                        )}
                    </div>
                </MobileNavMenu>
            </MobileNav>
        </Navbar>
    );
}
