import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { lazy, Suspense } from 'react';

const NotificationPermissionBanner = lazy(() =>
    import('@/components/notification-permission-banner').then((m) => ({
        default: m.NotificationPermissionBanner,
    })),
);

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="px-4 pt-4 md:px-6">
                    <Suspense fallback={null}>
                        <NotificationPermissionBanner />
                    </Suspense>
                </div>
                {children}
            </AppContent>
        </AppShell>
    );
}
