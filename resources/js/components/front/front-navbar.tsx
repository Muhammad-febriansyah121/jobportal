import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
    MobileNav,
    MobileNavHeader,
    MobileNavMenu,
    MobileNavToggle,
    Navbar,
    NavBody,
    NavItems,
} from '@/components/ui/resizable-navbar';
import { home, login, register } from '@/routes';
import type { Auth } from '@/types';

const navLinks = [
    { name: 'Lowongan', link: '/jobs' },
    { name: 'Perusahaan', link: '/companies' },
    { name: 'Gaji', link: '/salary' },
    { name: 'Sumber Karier', link: '/career-resources' },
    { name: 'Pricing', link: '/pricing' },
];

export default function FrontNavbar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <Navbar>
            {/* Desktop */}
            <NavBody>
                {/* Logo */}
                <Link href={home.url()} className="relative z-20 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <AppLogoIcon className="size-5 fill-white" />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-foreground">
                        Karivia
                    </span>
                </Link>

                {/* Nav Items */}
                <NavItems items={navLinks} />

                {/* Auth Buttons */}
                <div className="relative z-20 flex items-center gap-2">
                    {auth?.user ? (
                        <ShimmerButton
                            background="var(--primary)"
                            className="h-9 px-5 text-sm font-medium"
                            onClick={() => router.visit('/dashboard')}
                        >
                            Dashboard
                        </ShimmerButton>
                    ) : (
                        <>
                            <Link
                                href={login.url()}
                                className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                            >
                                Masuk
                            </Link>
                            <ShimmerButton
                                background="var(--primary)"
                                className="h-9 px-5 text-sm font-medium"
                                onClick={() => router.visit(register.url())}
                            >
                                Daftar
                            </ShimmerButton>
                        </>
                    )}
                </div>
            </NavBody>

            {/* Mobile */}
            <MobileNav>
                <MobileNavHeader>
                    <Link href={home.url()} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <AppLogoIcon className="size-5 fill-white" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-foreground">
                            Karivia
                        </span>
                    </Link>
                    <MobileNavToggle
                        isOpen={mobileOpen}
                        onClick={() => setMobileOpen((v) => !v)}
                    />
                </MobileNavHeader>

                <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.link}
                            href={link.link}
                            className="w-full text-sm font-medium text-neutral-600 hover:text-neutral-900"
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="flex w-full flex-col gap-2 border-t border-neutral-100 pt-2">
                        {auth?.user ? (
                            <ShimmerButton
                                background="var(--primary)"
                                className="w-full justify-center text-sm font-medium"
                                onClick={() => { router.visit('/dashboard'); setMobileOpen(false); }}
                            >
                                Dashboard
                            </ShimmerButton>
                        ) : (
                            <>
                                <Link
                                    href={login.url()}
                                    className="w-full rounded-full border border-neutral-200 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Masuk
                                </Link>
                                <ShimmerButton
                                    background="var(--primary)"
                                    className="w-full justify-center text-sm font-medium"
                                    onClick={() => { router.visit(register.url()); setMobileOpen(false); }}
                                >
                                    Daftar
                                </ShimmerButton>
                            </>
                        )}
                    </div>
                </MobileNavMenu>
            </MobileNav>
        </Navbar>
    );
}
