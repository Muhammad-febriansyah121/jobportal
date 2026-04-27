import { Link, router, usePage } from '@inertiajs/react';
import { Bell, LogOut, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit as candidateProfileEdit } from '@/routes/candidate/profile';
import { edit as employerCompanyEdit } from '@/routes/employer/company';
import { edit as settingsProfileEdit } from '@/routes/profile';
import type { Auth, BreadcrumbItem as BreadcrumbItemType } from '@/types';

type HeaderNotification = {
    id: string;
    type: string;
    title: string;
    message?: string | null;
    href: string;
    is_read: boolean;
    created_at?: string | null;
    time_label?: string | null;
};

export function AppSidebarHeader({
    breadcrumbs: _breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, header_notifications } = usePage<{
        auth: Auth;
        header_notifications?: {
            unread_count?: number;
            items?: HeaderNotification[];
        };
    }>().props;
    const cleanup = useMobileNavigation();
    const isEmployer = auth.user?.role === 'employer';
    const isCandidate = auth.user?.role === 'candidate';
    const candidateHeadline =
        typeof auth.user?.headline === 'string'
            ? auth.user.headline
            : 'Kandidat Pilihan';
    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };
    const roleLabel = isCandidate
        ? candidateHeadline
        : isEmployer
          ? 'Pemberi Kerja'
          : auth.user?.role === 'admin'
            ? 'Administrator'
            : 'Karivia';
    const profileHref = isCandidate
        ? candidateProfileEdit()
        : isEmployer
          ? employerCompanyEdit()
          : settingsProfileEdit();
    const searchPlaceholder = isCandidate
        ? 'Cari pekerjaan, perusahaan, atau skill...'
        : isEmployer
          ? 'Cari kandidat atau posisi...'
          : auth.user?.role === 'admin'
            ? 'Cari user, perusahaan, atau lowongan...'
            : 'Cari sesuatu disini...';
    const notifications = Array.isArray(header_notifications?.items)
        ? header_notifications.items
        : [];
    const unreadNotificationCount = Math.max(
        0,
        Number(header_notifications?.unread_count ?? 0),
    );

    return (
        <header className="flex h-18 shrink-0 items-center justify-between gap-4 border-b border-[#e8edf3] bg-white px-4 py-3 transition-[width,height] ease-linear md:px-8 md:py-0">
            <div className="flex items-center gap-3 md:flex-1">
                <SidebarTrigger className="-ml-1 text-[#667085] hover:text-[#01296A]" />
                <div className="relative hidden w-full max-w-[520px] md:block">
                    <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#9aa4b2]" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="h-11 rounded-lg border-0 bg-[#f4f7fa] pl-12 text-sm font-medium text-[#4b5565] shadow-none focus-visible:bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 md:justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-11 w-11 rounded-lg bg-[#f4f7fa] text-[#667085] hover:bg-[#eaf2ff] hover:text-[#01296A]"
                            aria-label="Notifikasi"
                        >
                            <Bell className="size-5" />
                            {unreadNotificationCount > 0 ? (
                                <span className="absolute top-1.5 right-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#01296A] px-1 text-[10px] font-bold text-white">
                                    {unreadNotificationCount > 9
                                        ? '9+'
                                        : unreadNotificationCount}
                                </span>
                            ) : null}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-[min(92vw,360px)] rounded-lg border-[#e8edf3] p-2"
                    >
                        <div className="px-2 py-1">
                            <p className="text-sm font-bold text-[#111827]">
                                Notifikasi
                            </p>
                            <p className="text-xs text-[#8490a3]">
                                {unreadNotificationCount > 0
                                    ? `${unreadNotificationCount} notifikasi belum dibaca`
                                    : 'Belum ada notifikasi baru'}
                            </p>
                        </div>
                        <DropdownMenuSeparator />
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="rounded-md px-3 py-6 text-center text-sm text-[#8490a3]">
                                    Belum ada notifikasi.
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        asChild
                                        className="p-0 focus:bg-transparent"
                                    >
                                        <Link
                                            href={notification.href}
                                            prefetch
                                            onClick={cleanup}
                                            className={cn(
                                                'flex w-full flex-col gap-1 rounded-md px-3 py-2.5 transition',
                                                notification.is_read
                                                    ? 'hover:bg-[#f8fafc]'
                                                    : 'bg-[#eff4ff] hover:bg-[#dde8ff]',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-semibold text-[#111827]">
                                                    {notification.title}
                                                </span>
                                                {notification.is_read ? null : (
                                                    <span className="mt-1 size-2 rounded-full bg-[#01296A]" />
                                                )}
                                            </div>
                                            {notification.message ? (
                                                <p className="line-clamp-2 text-xs text-[#5f6b7a]">
                                                    {notification.message}
                                                </p>
                                            ) : null}
                                            <p className="text-[11px] font-medium text-[#94a3b8]">
                                                {notification.time_label ??
                                                    getNotificationTypeLabel(
                                                        notification.type,
                                                    )}
                                            </p>
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="hidden h-10 w-px bg-[#e8edf3] md:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#eaf2ff] data-[state=open]:bg-[#eaf2ff]">
                            <span className="hidden min-w-0 text-right md:block">
                                <span className="block truncate text-sm font-bold text-[#111827]">
                                    {auth.user?.name ?? 'Karivia'}
                                </span>
                                <span className="block truncate text-xs font-medium text-[#8490a3]">
                                    {roleLabel}
                                </span>
                            </span>
                            <span className="flex size-11 items-center justify-center rounded-full border-2 border-[#d6e0f5] bg-[#1E4D96] text-sm font-bold text-white">
                                {getInitials(auth.user?.name ?? 'Karivia')}
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-lg border-[#e8edf3] p-2"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                href={profileHref}
                                prefetch
                                onClick={cleanup}
                                className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm font-semibold"
                            >
                                <UserRound className="mr-2 size-4" />
                                Profil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild variant="destructive">
                            <Link
                                href={logout()}
                                as="button"
                                onClick={handleLogout}
                                className="flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm font-semibold"
                                data-test="logout-button"
                            >
                                <LogOut className="mr-2 size-4" />
                                Logout
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function getNotificationTypeLabel(type: string): string {
    return (
        {
            unread_messages: 'Pesan',
            upcoming_interviews: 'Interview',
            interview_scheduled: 'Interview',
            ai_interview_scheduled: 'AI Interview',
            ai_interview_confirmed: 'AI Interview',
            ai_interview_declined: 'AI Interview',
            ai_interview_completed: 'AI Interview',
            ai_interview_reschedule_requested: 'AI Interview',
            ai_interview_reschedule_approved: 'AI Interview',
            ai_interview_reschedule_rejected: 'AI Interview',
            application_submitted: 'Lamaran',
            company_verification: 'Verifikasi',
        }[type] ?? 'Aktivitas'
    );
}
