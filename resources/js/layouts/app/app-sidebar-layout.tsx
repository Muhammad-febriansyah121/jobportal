import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { lazy, Suspense, useEffect, useState } from 'react';

const NotificationPermissionBanner = lazy(() =>
    import('@/components/notification-permission-banner').then((m) => ({
        default: m.NotificationPermissionBanner,
    })),
);

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    // The banner is a browser-only feature (uses the Notification API) and is
    // lazy-loaded. Rendering Suspense during SSR aborts server rendering
    // (renderToString does not support Suspense), so mount it client-side only.
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {isMounted ? (
                    <div className="px-4 pt-4 md:px-6">
                        <Suspense fallback={null}>
                            <NotificationPermissionBanner />
                        </Suspense>
                    </div>
                ) : null}
                {children}
            </AppContent>
        </AppShell>
    );
}
