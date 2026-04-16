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
import { edit as employerCompanyEdit } from '@/routes/employer/company';
import { edit as candidateProfileEdit } from '@/routes/candidate/profile';
import { edit as settingsProfileEdit } from '@/routes/profile';
import { logout } from '@/routes';
import type { Auth, BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs: _breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
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

    return (
        <header className="flex min-h-18 shrink-0 flex-col gap-4 border-b border-[#e8edf3] bg-white px-4 py-4 transition-[width,height] ease-linear md:h-18 md:flex-row md:items-center md:justify-between md:px-8 md:py-0">
            <div className="flex items-center gap-3 md:flex-1">
                <SidebarTrigger className="-ml-1 text-[#667085] hover:text-[#f45113]" />
                <div className="relative w-full max-w-[520px]">
                    <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#9aa4b2]" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="h-11 rounded-lg border-0 bg-[#f4f7fa] pl-12 text-sm font-medium text-[#4b5565] shadow-none focus-visible:bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 md:justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-11 w-11 rounded-lg bg-[#f4f7fa] text-[#667085] hover:bg-[#fff4ef] hover:text-[#f45113]"
                >
                    <Bell className="size-5" />
                    <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#f45113]" />
                </Button>
                <div className="hidden h-10 w-px bg-[#e8edf3] md:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#fff4ef] data-[state=open]:bg-[#fff4ef]">
                            <span className="text-right">
                                <span className="block text-sm font-bold text-[#111827]">
                                    {auth.user?.name ?? 'Karivia'}
                                </span>
                                <span className="block text-xs font-medium text-[#8490a3]">
                                    {roleLabel}
                                </span>
                            </span>
                            <span className="flex size-11 items-center justify-center rounded-full border-2 border-[#ffe0d4] bg-[#f2a05f] text-sm font-bold text-white">
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
