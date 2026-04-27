import type { Auth } from '@/types/auth';
import '@inertiajs/core';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            branding?: {
                name: string;
                logo_url: string | null;
                favicon_url: string | null;
                login_banner_url?: string | null;
            };
            auth: Auth;
            sidebarOpen: boolean;
            locale?: string;
            available_locales?: string[];
            translations?: Record<string, string>;
            [key: string]: unknown;
        };
    }
}
