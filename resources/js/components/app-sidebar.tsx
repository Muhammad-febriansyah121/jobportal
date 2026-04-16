import { Link, router, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    BadgeCheck,
    Bell,
    Bot,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    CreditCard,
    FileCheck2,
    FileText,
    GraduationCap,
    Grid2X2,
    LayoutGrid,
    Library,
    LogOut,
    MessageSquareText,
    PlusCircle,
    Rocket,
    Search,
    Settings,
    ShieldAlert,
    Sparkles,
    Tags,
    Users,
    UserRound,
    WalletCards,
} from 'lucide-react';
import type { ComponentType } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn, toUrl } from '@/lib/utils';
import {
    dashboard as adminDashboard,
    analytics as adminAnalytics,
} from '@/routes/admin';
import { edit as adminSettings } from '@/routes/admin/settings';
import { index as adminActivityLogs } from '@/routes/admin/activity-logs';
import { index as adminAiAuditLogs } from '@/routes/admin/ai-audit-logs';
import { index as adminCareerResources } from '@/routes/admin/career-resources';
import { index as adminCompanies } from '@/routes/admin/companies';
import { index as adminCompanyVerifications } from '@/routes/admin/company-verifications';
import { index as adminCompanySizes } from '@/routes/admin/company-sizes';
import { index as adminIndustries } from '@/routes/admin/industries';
import { index as adminJobs } from '@/routes/admin/jobs';
import { index as adminPricingPlans } from '@/routes/admin/pricing-plans';
import { index as adminReports } from '@/routes/admin/reports';
import { index as adminSalaryInsights } from '@/routes/admin/salary-insights';
import { index as adminSkills } from '@/routes/admin/skills';
import { index as adminSubscriptions } from '@/routes/admin/subscriptions';
import { index as adminUsers } from '@/routes/admin/users';
import { index as candidateApplications } from '@/routes/candidate/applications';
import { index as candidateAssessments } from '@/routes/candidate/assessments';
import { index as candidateCareerCoach } from '@/routes/candidate/career-coach';
import { dashboard as candidateDashboard } from '@/routes/candidate';
import { index as candidateMessages } from '@/routes/candidate/messages';
import { index as candidateSavedJobs } from '@/routes/candidate/saved-jobs';
import { edit as employerCompanyEdit } from '@/routes/employer/company';
import { dashboard as employerDashboard } from '@/routes/employer';
import { index as employerAnalytics } from '@/routes/employer/analytics';
import { index as employerBilling } from '@/routes/employer/billing';
import { index as employerCandidates } from '@/routes/employer/candidates';
import { index as employerJobs } from '@/routes/employer/jobs';
import { index as employerMessages } from '@/routes/employer/messages';
import { index as employerTalentSearch } from '@/routes/employer/talent-search';
import { index as employerTeam } from '@/routes/employer/team';
import { edit as settingsProfileEdit } from '@/routes/profile';
import { dashboard, logout } from '@/routes';
import type { Auth, NavItem } from '@/types';

const platformNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: adminDashboard(), icon: Grid2X2 },
    { title: 'Analytics', href: adminAnalytics(), icon: BarChart3 },
    {
        title: 'Pengguna',
        href: adminUsers(),
        icon: Users,
        children: [
            { title: 'Admin', href: adminUsers({ query: { role: 'admin' } }) },
            {
                title: 'Employer',
                href: adminUsers({ query: { role: 'employer' } }),
            },
            {
                title: 'Kandidat',
                href: adminUsers({ query: { role: 'candidate' } }),
            },
            {
                title: 'Mentor',
                href: adminUsers({ query: { role: 'mentor' } }),
            },
        ],
    },
    { title: 'Perusahaan', href: adminCompanies(), icon: Building2 },
    {
        title: 'Verifikasi Perusahaan',
        href: adminCompanyVerifications(),
        icon: FileCheck2,
    },
    { title: 'Lowongan', href: adminJobs(), icon: BriefcaseBusiness },
    { title: 'Skill & Keahlian', href: adminSkills(), icon: Tags },
    { title: 'Industri', href: adminIndustries(), icon: Library },
    { title: 'Ukuran Perusahaan', href: adminCompanySizes(), icon: Building2 },
    { title: 'Insight Gaji', href: adminSalaryInsights(), icon: BarChart3 },
    {
        title: 'Resource Karir',
        href: adminCareerResources(),
        icon: GraduationCap,
    },
    { title: 'Paket Harga', href: adminPricingPlans(), icon: WalletCards },
    { title: 'Subscription', href: adminSubscriptions(), icon: ClipboardCheck },
    { title: 'Report', href: adminReports(), icon: ShieldAlert },
    { title: 'AI Audit', href: adminAiAuditLogs(), icon: Bot },
    { title: 'Activity Log', href: adminActivityLogs(), icon: Activity },
    { title: 'Pengaturan Web', href: adminSettings(), icon: Settings },
];

const adminNavSections: { title: string; items: NavItem[] }[] = [
    {
        title: 'Overview',
        items: adminNavItems.slice(0, 2),
    },
    {
        title: 'Operasional',
        items: adminNavItems.slice(2, 6),
    },
    {
        title: 'Konten & Data',
        items: adminNavItems.slice(6, 10),
    },
    {
        title: 'Billing',
        items: adminNavItems.slice(10, 12),
    },
    {
        title: 'Monitoring',
        items: adminNavItems.slice(12, 15),
    },
    {
        title: 'Sistem',
        items: adminNavItems.slice(15),
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = auth.user?.role;

    if (role === 'employer') {
        return <EmployerSidebar />;
    }

    if (role === 'candidate') {
        return <CandidateSidebar />;
    }

    if (role === 'admin') {
        return <AdminSidebar />;
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={platformNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function AdminSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#e8edf3] bg-white text-[#4a5568]"
        >
            <SidebarHeader className="gap-0 px-5 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 rounded-lg px-0 group-data-[collapsible=icon]:justify-center hover:bg-transparent data-[active=true]:bg-transparent"
                        >
                            <Link href={adminDashboard()} prefetch>
                                <span className="flex size-11 items-center justify-center rounded-lg bg-[#f45113] text-white shadow-sm">
                                    <Rocket className="size-5" />
                                </span>
                                <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-lg font-bold tracking-wide text-[#111827]">
                                        KARIVIA
                                    </span>
                                    <span className="truncate text-xs font-bold tracking-[0.18em] text-[#8490a3] uppercase">
                                        Admin Panel
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white px-4 py-5 group-data-[collapsible=icon]:px-2">
                <div className="space-y-5">
                    {adminNavSections.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <p className="px-4 text-[10px] font-bold tracking-[0.18em] text-[#9aa4b2] uppercase group-data-[collapsible=icon]:hidden">
                                {section.title}
                            </p>
                            <SidebarMenu className="gap-2">
                                {section.items.map((item) => (
                                    <AdminSidebarMenuItem
                                        key={item.title}
                                        item={item}
                                        isCurrentUrl={isCurrentUrl}
                                    />
                                ))}
                            </SidebarMenu>
                        </div>
                    ))}
                </div>
            </SidebarContent>
        </Sidebar>
    );
}

function AdminSidebarMenuItem({
    item,
    isCurrentUrl,
}: {
    item: NavItem;
    isCurrentUrl: (href: NonNullable<InertiaLinkProps['href']>) => boolean;
}) {
    const hasChildren = Boolean(item.children?.length);
    const isActive =
        isCurrentUrl(item.href) ||
        Boolean(item.children?.some((child) => isCurrentUrl(child.href)));

    if (hasChildren) {
        return (
            <Collapsible
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isActive={isActive}
                            tooltip={{ children: item.title }}
                            className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#fff4ef] hover:text-[#f45113] data-[active=true]:bg-[#fff4ef] data-[active=true]:text-[#f45113]"
                        >
                            {item.icon ? (
                                <item.icon className="size-5" />
                            ) : null}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub className="mx-3 mt-1 border-l border-[#f1d8cf] px-2">
                            {item.children?.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl(child.href)}
                                        className="h-8 rounded-lg text-sm font-semibold text-[#667085] hover:bg-[#fff4ef] hover:text-[#f45113] data-[active=true]:bg-[#fff4ef] data-[active=true]:text-[#f45113]"
                                    >
                                        <Link href={child.href} prefetch>
                                            <span>{child.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={{ children: item.title }}
                className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#fff4ef] hover:text-[#f45113] data-[active=true]:bg-[#fff4ef] data-[active=true]:text-[#f45113]"
            >
                <Link href={item.href} prefetch>
                    {item.icon ? <item.icon className="size-5" /> : null}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

type EmployerMenuItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon: ComponentType<{ className?: string }>;
    badge?: string;
};

type CandidateMenuItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon: ComponentType<{ className?: string }>;
};

const candidateMenuItems: CandidateMenuItem[] = [
    {
        title: 'Dashboard',
        href: candidateDashboard(),
        icon: Grid2X2,
    },
    {
        title: 'Aplikasi',
        href: candidateApplications(),
        icon: ClipboardList,
    },
    {
        title: 'Simpanan',
        href: candidateSavedJobs(),
        icon: Bookmark,
    },
    {
        title: 'Pesan',
        href: candidateMessages(),
        icon: MessageSquareText,
    },
    {
        title: 'Assessment',
        href: candidateAssessments(),
        icon: BadgeCheck,
    },
    {
        title: 'Pengaturan',
        href: settingsProfileEdit(),
        icon: Settings,
    },
];

function CandidateSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#e8edf3] bg-white text-[#4a5568]"
        >
            <SidebarHeader className="gap-0 px-5 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 rounded-lg px-0 group-data-[collapsible=icon]:justify-center hover:bg-transparent data-[active=true]:bg-transparent"
                        >
                            <Link href={candidateDashboard()} prefetch>
                                <span className="flex size-11 items-center justify-center rounded-lg bg-[#f45113] text-white shadow-sm">
                                    <Rocket className="size-5" />
                                </span>
                                <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-lg font-bold tracking-wide text-[#111827]">
                                        KARIVIA
                                    </span>
                                    <span className="truncate text-xs font-bold tracking-[0.18em] text-[#8490a3] uppercase">
                                        Kandidat Pilihan
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="justify-between bg-white px-4 py-5 group-data-[collapsible=icon]:px-2">
                <SidebarMenu className="gap-2">
                    {candidateMenuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#fff4ef] hover:text-[#f45113] data-[active=true]:bg-[#fff4ef] data-[active=true]:text-[#f45113]"
                            >
                                <Link href={item.href} prefetch>
                                    <item.icon className="size-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>

                <div className="rounded-lg border border-[#f5d6c9] bg-[#fff8f4] p-4 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-bold tracking-[0.12em] text-[#f45113] uppercase">
                        Pusat Bantuan
                    </p>
                    <p className="mt-3 text-sm leading-6 font-medium text-[#6b7280]">
                        Butuh bantuan navigasi atau tips karir?
                    </p>
                    <Link
                        href={candidateCareerCoach()}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#f45113] text-sm font-bold text-white shadow-sm transition hover:bg-[#d94710]"
                    >
                        Hubungi Kami
                    </Link>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}

const employerMenuItems: EmployerMenuItem[] = [
    {
        title: 'Overview',
        href: employerDashboard(),
        icon: Grid2X2,
    },
    {
        title: 'Lowongan Saya',
        href: employerJobs(),
        icon: BriefcaseBusiness,
    },
    {
        title: 'Kandidat',
        href: employerCandidates(),
        icon: Users,
    },
    {
        title: 'Pesan',
        href: employerMessages(),
        icon: MessageSquareText,
        badge: '4',
    },
    {
        title: 'Analytics',
        href: employerAnalytics(),
        icon: BarChart3,
    },
    {
        title: 'Tim',
        href: employerTeam(),
        icon: Users,
    },
    {
        title: 'Billing',
        href: employerBilling(),
        icon: CreditCard,
    },
];

function EmployerSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#e8edf3] bg-white text-[#4a5568]"
        >
            <SidebarHeader className="gap-0 border-b border-[#eef2f6] px-5 py-6 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-14 rounded-lg px-0 group-data-[collapsible=icon]:justify-center hover:bg-transparent data-[active=true]:bg-transparent"
                        >
                            <Link href={employerDashboard()} prefetch>
                                <span className="flex size-11 items-center justify-center rounded-lg bg-[#f45113] text-white shadow-sm">
                                    <Rocket className="size-5" />
                                </span>
                                <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-lg font-bold tracking-wide text-[#111827]">
                                        KARIVIA
                                    </span>
                                    <span className="truncate text-xs font-medium text-[#8490a3]">
                                        Pemberi Kerja
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-7 bg-white px-4 py-6 group-data-[collapsible=icon]:px-2">
                <SidebarMenu className="gap-3">
                    {employerMenuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={
                                    !toUrl(item.href).startsWith('#') &&
                                    isCurrentUrl(item.href)
                                }
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'h-11 rounded-lg px-3 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#fff4ef] hover:text-[#f45113] data-[active=true]:bg-[#fff4ef] data-[active=true]:text-[#f45113]',
                                    item.badge ? 'pr-9' : '',
                                )}
                            >
                                <Link
                                    href={item.href}
                                    prefetch={!toUrl(item.href).startsWith('#')}
                                >
                                    <item.icon className="size-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            {item.badge ? (
                                <SidebarMenuBadge className="top-2.5 right-2 size-5 rounded-full bg-[#f45113] text-[10px] font-bold text-white">
                                    {item.badge}
                                </SidebarMenuBadge>
                            ) : null}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>

                <div className="space-y-3 group-data-[collapsible=icon]:hidden">
                    <p className="px-1 text-[11px] font-bold tracking-[0.22em] text-[#9aa4b2] uppercase">
                        Quick Actions
                    </p>
                    <div className="grid gap-3">
                        <Link
                            href={employerJobs()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f45113] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94710]"
                        >
                            <PlusCircle className="size-4" />
                            Buat Lowongan
                        </Link>
                        <Link
                            href={employerTalentSearch()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#e4e9f0] bg-white px-4 text-sm font-bold text-[#313947] shadow-sm transition hover:border-[#f45113]/30 hover:bg-[#fff4ef] hover:text-[#f45113]"
                        >
                            <Search className="size-4" />
                            Cari Talenta
                        </Link>
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-[#eef2f6] bg-white p-5 group-data-[collapsible=icon]:p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-14 rounded-lg p-0 group-data-[collapsible=icon]:justify-center hover:bg-[#fff4ef] data-[state=open]:bg-[#fff4ef]"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-full bg-[#f2a05f] text-sm font-bold text-white">
                                        {getInitials(auth.user?.name ?? 'HR')}
                                    </span>
                                    <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                        <span className="truncate text-sm font-bold text-[#1f2937]">
                                            {auth.user?.name ?? 'HR Manager'}
                                        </span>
                                        <span className="truncate text-xs font-medium text-[#8490a3]">
                                            HR Manager
                                        </span>
                                    </span>
                                    <Settings className="size-4 text-[#8490a3] group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-56 rounded-lg border-[#e8edf3] p-2"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={employerCompanyEdit()}
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
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
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
