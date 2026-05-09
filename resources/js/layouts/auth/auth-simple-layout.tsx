import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    wide = false,
}: AuthLayoutProps) {
    const { name, branding } = usePage().props as {
        name: string;
        branding?: {
            name?: string;
            logo_url?: string | null;
        };
    };

    const siteName = branding?.name ?? name;
    const siteLogoUrl = branding?.logo_url ?? null;

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-white p-6 md:p-10">
            {/* Background blobs — same as login page */}
            <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

            <div className={`relative z-10 w-full space-y-8 rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-xl shadow-primary/10 backdrop-blur-md md:p-8 ${wide ? 'max-w-3xl' : 'max-w-sm'}`}>
                {/* Logo */}
                <Link
                    href={home()}
                    className="flex flex-col items-center gap-3 font-medium"
                >
                    <div className="flex h-20 w-auto items-center justify-center">
                        {siteLogoUrl ? (
                            <img
                                src={siteLogoUrl}
                                alt={siteName}
                                className="h-full w-auto max-w-[260px] object-contain"
                            />
                        ) : (
                            <AppLogoIcon className="size-20 fill-current text-primary" />
                        )}
                    </div>
                    <span className="text-base font-semibold tracking-wide text-foreground">
                        {siteName}
                    </span>
                </Link>

                {/* Title + description */}
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                {children}
            </div>
        </div>
    );
}
