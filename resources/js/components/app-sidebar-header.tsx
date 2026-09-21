import { Link, router, useHttp, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, LogOut, Search, UserRound } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit as candidateProfileEdit } from '@/routes/candidate/profile';
import { edit as employerCompanyEdit } from '@/routes/employer/company';
import { read as markNotificationRead, readAll as markAllNotificationsRead } from '@/routes/notifications';
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
    const { t } = useTranslate();
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
            : t('app_header.role_candidate_default');
    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };
    const roleLabel = isCandidate
        ? candidateHeadline
        : isEmployer
          ? t('app_header.role_employer')
          : auth.user?.role === 'admin'
            ? t('app_header.role_admin')
            : 'Karivia';
    const profileHref = isCandidate
        ? candidateProfileEdit()
        : isEmployer
          ? employerCompanyEdit()
          : settingsProfileEdit();
    const searchPlaceholder = isCandidate
        ? t('app_header.search_candidate')
        : isEmployer
          ? t('app_header.search_employer')
          : auth.user?.role === 'admin'
            ? t('app_header.search_admin')
            : t('app_header.search_default');
    const notifications = Array.isArray(header_notifications?.items)
        ? header_notifications.items
        : [];
    const unreadNotificationCount = Math.max(
        0,
        Number(header_notifications?.unread_count ?? 0),
    );
    const { submit: submitHttp } = useHttp();

    const extractNotificationId = (id: string): number | null => {
        if (!id.startsWith('notif-')) {
            return null;
        }

        const parsed = Number(id.slice('notif-'.length));

        return Number.isFinite(parsed) ? parsed : null;
    };

    const handleNotificationClick = (notification: HeaderNotification): void => {
        cleanup();

        const dbId = extractNotificationId(notification.id);

        if (dbId === null || notification.is_read) {
            return;
        }

        void submitHttp(markNotificationRead(dbId)).catch(() => undefined);
    };

    const handleMarkAllRead = (): void => {
        if (unreadNotificationCount === 0) {
            return;
        }

        router.patch(
            markAllNotificationsRead(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['header_notifications'],
            },
        );
    };

    return (
        <header className="flex h-18 shrink-0 items-center justify-between gap-4 border-b border-[#E5EDF7] bg-white px-4 py-3 transition-[width,height] ease-linear md:px-8 md:py-0">
            <div className="flex items-center gap-3 md:flex-1">
                <SidebarTrigger className="-ml-1 text-[#667085] hover:text-[#0F4C94]" />
                <div className="relative hidden w-full max-w-[520px] md:block">
                    <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#9aa4b2]" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="h-11 rounded-lg border-0 bg-[#F8FAFC] pl-12 text-sm font-medium text-[#64748B] shadow-none focus-visible:bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 md:justify-end">
                <LanguageSwitcher
                    align="end"
                    variant="inline"
                    triggerClassName="h-11 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:bg-[#F4F8FF] hover:text-[#0F4C94]"
                />

                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-11 w-11 rounded-lg bg-[#F8FAFC] text-[#667085] hover:bg-[#F4F8FF] hover:text-[#0F4C94]"
                            aria-label={t('shared.notification_bell')}
                        >
                            <Bell className="size-5" />
                            {unreadNotificationCount > 0 ? (
                                <span className="absolute top-1.5 right-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#0F4C94] px-1 text-[10px] font-bold text-white">
                                    {unreadNotificationCount > 9
                                        ? '9+'
                                        : unreadNotificationCount}
                                </span>
                            ) : null}
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
                    >
                        <SheetHeader className="border-b border-[#E5EDF7] px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1">
                                    <SheetTitle className="text-base font-bold text-[#0F2747]">
                                        {t('app_header.notifications_title')}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-[#64748B]">
                                        {unreadNotificationCount > 0
                                            ? t('app_header.notifications_unread', { count: unreadNotificationCount })
                                            : t('app_header.notifications_none')}
                                    </SheetDescription>
                                </div>
                                {unreadNotificationCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllRead}
                                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#0F4C94] transition hover:bg-[#F4F8FF]"
                                    >
                                        <CheckCheck className="size-3.5" />
                                        {t('app_header.notifications_mark_all_read')}
                                    </button>
                                ) : null}
                            </div>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto p-3">
                            {notifications.length === 0 ? (
                                <div className="rounded-md px-3 py-10 text-center text-sm text-[#64748B]">
                                    {t('app_header.notifications_empty')}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {notifications.map((notification) => (
                                        <Link
                                            key={notification.id}
                                            href={notification.href}
                                            prefetch
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification,
                                                )
                                            }
                                            className={cn(
                                                'flex w-full flex-col gap-1 rounded-md px-3 py-2.5 transition',
                                                notification.is_read
                                                    ? 'hover:bg-[#f8fafc]'
                                                    : 'bg-[#eff4ff] hover:bg-[#dde8ff]',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-semibold text-[#0F2747]">
                                                    {notification.title}
                                                </span>
                                                {notification.is_read ? null : (
                                                    <span className="mt-1 size-2 rounded-full bg-[#0F4C94]" />
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
                                                        t,
                                                    )}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="hidden h-10 w-px bg-[#E5EDF7] md:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#F4F8FF] data-[state=open]:bg-[#F4F8FF]">
                            <span className="hidden min-w-0 text-right md:block">
                                <span className="block truncate text-sm font-bold text-[#0F2747]">
                                    {auth.user?.name ?? 'Karivia'}
                                </span>
                                <span className="block truncate text-xs font-medium text-[#64748B]">
                                    {roleLabel}
                                </span>
                            </span>
                            <span className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#E5EDF7] bg-[#136BB4] text-sm font-bold text-white">
                                {auth.user?.avatar_url ? (
                                    <img
                                        src={auth.user.avatar_url}
                                        alt={auth.user.name ?? 'Karivia'}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    getInitials(auth.user?.name ?? 'Karivia')
                                )}
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-lg border-[#E5EDF7] p-2"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                href={profileHref}
                                prefetch
                                onClick={cleanup}
                                className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm font-semibold"
                            >
                                <UserRound className="mr-2 size-4" />
                                {t('app_header.profile_link')}
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
                                {t('common.logout')}
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

function getNotificationTypeLabel(type: string, t: (key: string) => string): string {
    const msg = t('app_header.notification_type_messages');
    const interview = t('app_header.notification_type_interview');
    const aiInterview = t('app_header.notification_type_ai_interview');
    return (
        {
            unread_messages: msg,
            upcoming_interviews: interview,
            interview_scheduled: interview,
            ai_interview_scheduled: aiInterview,
            ai_interview_confirmed: aiInterview,
            ai_interview_declined: aiInterview,
            ai_interview_completed: aiInterview,
            ai_interview_reschedule_requested: aiInterview,
            ai_interview_reschedule_approved: aiInterview,
            ai_interview_reschedule_rejected: aiInterview,
            application_submitted: t('app_header.notification_type_application'),
            company_verification: t('app_header.notification_type_verification'),
        }[type] ?? t('app_header.notification_type_activity')
    );
}
