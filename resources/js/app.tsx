import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName =
    (typeof document !== 'undefined'
        ? document.querySelector<HTMLMetaElement>('meta[name="site-name"]')
              ?.content
        : null) ??
    import.meta.env.VITE_APP_NAME ??
    'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'auth/login':
            case name === 'auth/register-candidate':
            case name === 'auth/register-employer':
            case name === 'auth/forgot-password':
            case name.startsWith('front/'):
            case name.startsWith('companies/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
            case name === 'candidate/profile':
            case name === 'candidate/experiences':
            case name === 'candidate/educations':
            case name === 'candidate/skills':
            case name === 'candidate/cvs/index':
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
