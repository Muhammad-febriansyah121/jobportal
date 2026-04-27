import { usePage } from '@inertiajs/react';
import { Bell, Volume2, X } from 'lucide-react';
import { useState } from 'react';
import { testNotificationSound, useFcm } from '@/hooks/use-fcm';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'karivia.notification-banner.dismissed';

export function NotificationPermissionBanner(): JSX.Element | null {
    const { auth } = usePage<{ auth: { user?: { id?: number } | null } }>().props;
    const { permission, requesting, request } = useFcm();
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.localStorage.getItem(DISMISS_KEY) === '1';
    });

    if (!auth?.user?.id) {
        return null;
    }

    if (!isFirebaseConfigured()) {
        return null;
    }

    if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
        return null;
    }

    if (dismissed) {
        return null;
    }

    const handleDismiss = (): void => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(DISMISS_KEY, '1');
        }
        setDismissed(true);
    };

    return (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-4 text-sm text-primary-900">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                <Bell className="size-4" />
            </span>
            <div className="flex-1">
                <p className="font-semibold">Aktifkan notifikasi</p>
                <p className="mt-0.5 text-xs leading-5 text-primary-800">
                    Dapatkan pengingat real-time saat ada jadwal interview, update status lamaran, atau aktivitas penting lainnya.
                </p>
                <div className="mt-3 flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700"
                        onClick={request}
                        disabled={requesting}
                    >
                        {requesting ? 'Memproses...' : 'Aktifkan sekarang'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                    >
                        Nanti saja
                    </Button>
                </div>
            </div>
            <button
                type="button"
                className="rounded-full p-1 text-primary-700 hover:bg-primary-100"
                onClick={handleDismiss}
                aria-label="Tutup"
            >
                <X className="size-4" />
            </button>
        </div>
    );
}
