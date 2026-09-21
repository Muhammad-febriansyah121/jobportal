import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import { home, login, register } from '@/routes';
import { index as companiesIndex } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';
import type { Auth } from '@/types';

type Branding = {
    name?: string;
    logo_url?: string | null;
};

const logoPath = '/images/karivia-assets/logo/karivia-logo-original.png';

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
    const siteName = branding?.name ?? name ?? 'Karivia';
    const currentPath = page.url.split('?')[0];

    const links = [
        { label: t('front.nav.jobs'), href: jobsIndex.url() },
        { label: t('front.nav.companies'), href: companiesIndex.url() },
        { label: 'Sumber Karier', href: '/career-resources' },
        { label: 'AI Tools', href: '/ai-interview-simulator', dropdown: true },
        { label: 'Cek Gaji', href: '/salary' },
    ];

    const logo = branding?.logo_url ?? logoPath;
    const isOverlay = overlay && !scrolled;

    useEffect(() => {
        if (!overlay) {
            return;
        }

        const handleScroll = () => setScrolled(window.scrollY > 16);

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [overlay]);

    return (
        <header
            className={
                overlay
                    ? `fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${isOverlay ? 'border-white/10 bg-transparent' : 'border-border/80 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur-md'}`
                    : 'relative z-50 border-b border-border bg-white'
            }
        >
            <div className="mx-auto flex h-14 max-w-[1160px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
                <Link
                    href={home.url()}
                    aria-label={`Kembali ke ${siteName}`}
                    className="shrink-0"
                >
                    <img
                        src={logo}
                        alt={siteName}
                        width={150}
                        height={42}
                        className={`h-10 w-[150px] object-cover object-center ${isOverlay ? 'brightness-0 invert' : ''}`}
                    />
                </Link>

                <nav
                    className="hidden items-center gap-0.5 xl:flex"
                    aria-label="Navigasi utama"
                >
                    {links.map((link) => {
                        const active =
                            link.href === '/'
                                ? currentPath === '/'
                                : currentPath.startsWith(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative inline-flex items-center gap-1 px-3.5 py-5 text-[12px] leading-none font-semibold transition-colors ${isOverlay ? (active ? 'text-white after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-white' : 'text-white/80 hover:text-white') : active ? 'text-primary after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary' : 'text-text hover:text-primary'}`}
                            >
                                {link.label}
                                {link.dropdown && (
                                    <ChevronDown
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {auth?.user ? (
                        <Link
                            href="/dashboard"
                            className={`inline-flex min-h-10 items-center rounded-full border px-5 text-xs font-bold transition focus-visible:ring-2 focus-visible:outline-none ${isOverlay ? 'border-white/70 text-white hover:bg-white/10 focus-visible:ring-white' : 'border-primary text-primary hover:bg-background-soft focus-visible:ring-primary'}`}
                        >
                            {t('front.nav.dashboard')}
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login.url()}
                                className={`inline-flex min-h-10 items-center rounded-full border px-5 text-xs font-bold transition focus-visible:ring-2 focus-visible:outline-none ${isOverlay ? 'border-white/70 text-white hover:bg-white/10 focus-visible:ring-white' : 'border-primary text-primary hover:bg-background-soft focus-visible:ring-primary'}`}
                            >
                                {t('front.nav.login')}
                            </Link>
                            <Link
                                href={register.url()}
                                className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(10,102,255,0.18)] transition hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                {t('front.nav.register')}
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((open) => !open)}
                    className={`flex size-11 items-center justify-center rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none xl:hidden ${isOverlay ? 'border-white/50 text-white hover:bg-white/10 focus-visible:ring-white' : 'border-border text-heading hover:bg-background-soft focus-visible:ring-primary'}`}
                >
                    {mobileOpen ? (
                        <X className="size-5" />
                    ) : (
                        <Menu className="size-5" />
                    )}
                </button>
            </div>

            {mobileOpen && (
                <div
                    className={`border-t px-5 py-4 xl:hidden ${isOverlay ? 'border-white/10 bg-[#103e9e]' : 'border-border bg-white'}`}
                >
                    <nav
                        className="mx-auto flex max-w-7xl flex-col gap-1"
                        aria-label="Navigasi mobile"
                    >
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold ${isOverlay ? 'text-white hover:bg-white/10 hover:text-white' : 'text-text hover:bg-background-soft hover:text-primary'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div
                            className={`mt-3 grid grid-cols-2 gap-2 border-t pt-4 ${isOverlay ? 'border-white/10' : 'border-border'}`}
                        >
                            <Link
                                href={login.url()}
                                onClick={() => setMobileOpen(false)}
                                className={`min-h-11 rounded-xl border px-4 py-3 text-center text-sm font-bold ${isOverlay ? 'border-white/60 text-white' : 'border-primary text-primary'}`}
                            >
                                {t('front.nav.login')}
                            </Link>
                            <Link
                                href={register.url()}
                                onClick={() => setMobileOpen(false)}
                                className="min-h-11 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white"
                            >
                                {t('front.nav.register')}
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
