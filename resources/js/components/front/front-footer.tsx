import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

const footerLinks = {
    'Pencari Kerja': [
        { label: 'Cari Lowongan', href: '/jobs' },
        { label: 'Perusahaan', href: '/companies' },
        { label: 'Info Gaji', href: '/salary' },
        { label: 'Sumber Karier', href: '/career-resources' },
    ],
    'Perusahaan': [
        { label: 'Pasang Lowongan', href: '/employer/jobs/create' },
        { label: 'Cari Kandidat', href: '/employer' },
        { label: 'Pricing', href: '/pricing' },
    ],
    'Karivia': [
        { label: 'Tentang Kami', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Hubungi Kami', href: '/contact' },
        { label: 'Kebijakan Privasi', href: '/privacy' },
        { label: 'Syarat & Ketentuan', href: '/terms' },
    ],
};

const socialLinks = [
    {
        label: 'Instagram',
        href: 'https://instagram.com/karivia.id',
        icon: (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
    },
    {
        label: 'LinkedIn',
        href: 'https://linkedin.com/company/karivia',
        icon: (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    {
        label: 'Twitter / X',
        href: 'https://x.com/karivia_id',
        icon: (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.713 5.897zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
];

export default function FrontFooter() {
    return (
        <footer className="border-t border-border bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12">
                {/* Top */}
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
                        <Link href={home.url()} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                                <AppLogoIcon className="size-5 fill-white" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                                Karivia
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Platform job portal terpercaya yang menghubungkan talenta terbaik Indonesia dengan perusahaan impian.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Nav columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title} className="flex flex-col gap-3">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <ul className="flex flex-col gap-2">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Karivia. Semua hak dilindungi.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
                            Kebijakan Privasi
                        </Link>
                        <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
                            Syarat & Ketentuan
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
