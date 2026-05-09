import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useTranslate } from '@/hooks/use-translate';
import { home } from '@/routes';
import { index as companiesIndex } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';

const ArrowIcon = () => (
    <svg
        className="size-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
        />
    </svg>
);

const InstagramIcon = () => (
    <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.713 5.897zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const YouTubeIcon = () => (
    <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

type SocialKey = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'youtube';

const socialMeta: Record<SocialKey, { label: string; icon: React.ReactNode }> =
    {
        instagram: { label: 'Instagram', icon: <InstagramIcon /> },
        linkedin: { label: 'LinkedIn', icon: <LinkedInIcon /> },
        twitter: { label: 'Twitter / X', icon: <TwitterIcon /> },
        facebook: { label: 'Facebook', icon: <FacebookIcon /> },
        youtube: { label: 'YouTube', icon: <YouTubeIcon /> },
    };

export default function FrontFooter() {
    const { branding, name } = usePage<{
        branding?: {
            name?: string;
            logo_url?: string | null;
            social?: Partial<Record<SocialKey, string | null>>;
        };
        name: string;
    }>().props;
    const { t } = useTranslate();

    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;
    const social = branding?.social ?? {};

    const activeSocials = (
        Object.entries(social) as [SocialKey, string | null][]
    ).filter(([, url]) => url);

    const footerLinks = useMemo(
        () => ({
            [t('footer.section.jobseekers')]: [
                { label: t('footer.link.search_jobs'), href: jobsIndex().url },
                { label: t('footer.link.companies'), href: companiesIndex().url },
                { label: t('footer.link.salary'), href: '/salary' },
                { label: t('footer.link.career_resources'), href: '/career-resources' },
            ],
            [t('footer.section.companies')]: [
                { label: t('footer.link.post_job'), href: '/employer/jobs/create' },
                { label: t('footer.link.find_candidates'), href: '/employer' },
                { label: t('footer.link.pricing'), href: '/pricing' },
            ],
            [t('footer.section.brand')]: [
                { label: t('footer.link.about'), href: '/about' },
                { label: t('footer.link.contact'), href: '/contact' },
                { label: t('footer.link.privacy'), href: '/privacy' },
                { label: t('footer.link.terms'), href: '/terms' },
            ],
        }),
        [t],
    );

    const stats = useMemo(
        () => [
            { value: '50K+', label: t('footer.stats.jobs') },
            { value: '10K+', label: t('footer.stats.companies') },
            { value: '500K+', label: t('footer.stats.jobseekers') },
        ],
        [t],
    );

    return (
        <footer className="relative overflow-hidden bg-white">
            {/* Ambient blur blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute -right-20 -bottom-20 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[80px]" />
                <div className="absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-100/40 blur-[80px]" />
            </div>

            {/* CTA Banner */}
            <div className="relative border-t border-border">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-400 px-8 py-10 shadow-lg shadow-primary/20 md:px-12">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        </div>
                        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                                    {t('footer.cta.eyebrow')}
                                </p>
                                <h3 className="text-2xl font-bold text-white md:text-3xl">
                                    {t('footer.cta.title')}
                                </h3>
                                <p className="mt-1 text-sm text-white/70">
                                    {t('footer.cta.subtitle', { site: siteName })}
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                                <Link
                                    href={jobsIndex().url}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-95"
                                >
                                    {t('footer.cta.find_jobs')}
                                    <ArrowIcon />
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                                >
                                    {t('footer.cta.signup_free')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="relative mx-auto max-w-6xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-12">
                    {/* Brand column */}
                    <div className="col-span-2 flex flex-col gap-6 lg:col-span-4">
                        <Link
                            href={home.url()}
                            className="inline-flex items-center self-start"
                        >
                            <div className="flex h-24 w-auto shrink-0 items-center">
                                {siteLogoUrl ? (
                                    <img
                                        src={siteLogoUrl}
                                        alt={siteName}
                                        className="h-full w-auto max-w-[320px] object-contain"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary">
                                        <AppLogoIcon className="size-8 fill-white" />
                                    </div>
                                )}
                            </div>
                        </Link>

                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {t('footer.brand.tagline')}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex flex-col gap-0.5"
                                >
                                    <span className="text-lg font-bold text-primary">
                                        {stat.value}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Social icons from DB */}
                        {activeSocials.length > 0 && (
                            <div className="flex items-center gap-2">
                                {activeSocials.map(([key, url]) => {
                                    const meta = socialMeta[key];

                                    if (!meta) {
                                        return null;
                                    }

                                    return (
                                        <a
                                            key={key}
                                            href={url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={meta.label}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
                                        >
                                            {meta.icon}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:col-span-1 lg:block" />

                    {/* Nav columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div
                            key={title}
                            className="col-span-1 flex flex-col gap-5 lg:col-span-2"
                        >
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold tracking-widest text-foreground/50 uppercase">
                                    {title}
                                </p>
                                <div className="h-px w-8 rounded-full bg-primary/40" />
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-all duration-200 hover:text-foreground"
                                        >
                                            <svg
                                                className="size-3 translate-x-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                />
                                            </svg>
                                            <span className="relative">
                                                {link.label}
                                                <span className="absolute -bottom-px left-0 h-px w-0 rounded-full bg-primary transition-all duration-200 group-hover:w-full" />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="relative border-t border-border/60 bg-gray-50/80">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <p className="text-xs text-muted-foreground">
                            {t('footer.bottom.rights', { year: new Date().getFullYear(), site: siteName })}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/privacy"
                            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary"
                        >
                            {t('footer.link.privacy')}
                        </Link>
                        <span className="text-border">·</span>
                        <Link
                            href="/terms"
                            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary"
                        >
                            {t('footer.link.terms')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
