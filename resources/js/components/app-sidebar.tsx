import { Link, router, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Bot,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CalendarCheck,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Compass,
    CreditCard,
    FileCheck2,
    FileSearch,
    FileText,
    GraduationCap,
    Grid2X2,
    LayoutGrid,
    Library,
    LogOut,
    Mail,
    MessageSquare,
    MessageSquareText,
    PlusCircle,
    Rocket,
    Search,
    Send,
    Settings,
    Star,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Tags,
    Users,
    UserRound,
    WalletCards,
    Smartphone,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import AppLogo from '@/components/app-logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTranslate } from '@/hooks/use-translate';
import { cn, toUrl } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import {
    dashboard as adminDashboard,
    analytics as adminAnalytics,
} from '@/routes/admin';
import { index as adminActivityLogs } from '@/routes/admin/activity-logs';
import { index as adminAiAuditLogs } from '@/routes/admin/ai-audit-logs';
import { index as adminAssessmentQuestions } from '@/routes/admin/assessment-questions';
import { index as adminCandidatePricingMenus } from '@/routes/admin/candidate-pricing-menus';
import { index as adminCareerResources } from '@/routes/admin/career-resources';
import { index as adminCompanies } from '@/routes/admin/companies';
import { index as adminCompanySizes } from '@/routes/admin/company-sizes';
import { index as adminCompanyVerifications } from '@/routes/admin/company-verifications';
import { index as adminCompanyReviews } from '@/routes/admin/company-reviews';
import { index as adminSystemReviews } from '@/routes/admin/system-reviews';
import { index as adminContactMessages } from '@/routes/admin/contact-messages';
import { index as adminFaqs } from '@/routes/admin/faqs';
import { index as adminIndustries } from '@/routes/admin/industries';
import { index as adminSubIndustries } from '@/routes/admin/sub-industries';
import { index as adminJobs } from '@/routes/admin/jobs';
import { index as adminLaporan } from '@/routes/admin/laporan';
import { edit as adminLegalPrivacy } from '@/routes/admin/legal/privacy';
import { edit as adminLegalTerms } from '@/routes/admin/legal/terms';
import { index as adminPricingPlans } from '@/routes/admin/pricing-plans';
import { index as adminReports } from '@/routes/admin/reports';
import { index as adminSalaryInsights } from '@/routes/admin/salary-insights';
import { edit as adminSettings } from '@/routes/admin/settings';
import { index as adminSkills } from '@/routes/admin/skills';
import { index as adminSubscriptions } from '@/routes/admin/subscriptions';
import { index as adminUsers } from '@/routes/admin/users';
import { edit as adminWhatsApp } from '@/routes/admin/whatsapp';
import { cvAnalyzer } from '@/routes';
import { dashboard as candidateDashboard } from '@/routes/candidate';
import { index as candidateAiInterviews } from '@/routes/candidate/ai-interviews';
import { index as candidateApplications } from '@/routes/candidate/applications';
import { index as candidateCareerCoach } from '@/routes/candidate/career-coach';
import { index as candidateCompanyReviews } from '@/routes/candidate/company-reviews';
import { builderPage as candidateCvBuilder } from '@/routes/candidate/cvs';
import { index as candidateInterviews } from '@/routes/candidate/interviews';
import { index as candidateMessages } from '@/routes/candidate/messages';
import { edit as candidateOnboardingEdit } from '@/routes/candidate/onboarding';
import { index as candidatePricing } from '@/routes/candidate/pricing';
import { index as candidateSavedJobs } from '@/routes/candidate/saved-jobs';
import { index as candidateSystemReviews } from '@/routes/candidate/system-reviews';
import { dashboard as employerDashboard } from '@/routes/employer';
import { index as employerAnalytics } from '@/routes/employer/analytics';
import { index as employerBilling } from '@/routes/employer/billing';
import { index as employerCandidates } from '@/routes/employer/candidates';
import { edit as employerCompanyEdit } from '@/routes/employer/company';
import { edit as employerEmailSettings } from '@/routes/employer/email-settings';
import {
    create as employerJobsCreate,
    index as employerJobs,
} from '@/routes/employer/jobs';
import { index as employerMessages } from '@/routes/employer/messages';
import { index as employerMessageTemplates } from '@/routes/employer/message-templates';
import { index as employerTalentPool } from '@/routes/employer/talent-pool';
import { index as employerTalentSearch } from '@/routes/employer/talent-search';
import { index as employerTeam } from '@/routes/employer/team';
import { index as employerReviews } from '@/routes/employer/reviews';
import { edit as employerWhatsApp } from '@/routes/employer/whatsapp';
import { index as employerWhatsAppBulk } from '@/routes/employer/whatsapp-bulk';
import { edit as settingsProfileEdit } from '@/routes/profile';
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = auth.user?.role;
    const { t } = useTranslate();

    if (role === 'employer') {
        return <EmployerSidebar />;
    }

    if (role === 'candidate') {
        return <CandidateSidebar />;
    }

    if (role === 'admin') {
        return <AdminSidebar />;
    }

    const platformNavItems: NavItem[] = [
        {
            title: t('common.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

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
                <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-xs text-muted-foreground">
                        {t('language.label')}
                    </span>
                    <LanguageSwitcher align="end" variant="inline" />
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function AdminSidebar() {
    const { name, branding } = usePage<{
        name: string;
        branding?: { name?: string; logo_url?: string | null };
    }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslate();
    const siteName = branding?.name ?? name ?? 'Karivia';
    const siteLogoUrl = branding?.logo_url ?? null;

    const adminNavSections = useMemo<{ title: string; items: NavItem[] }[]>(
        () => [
            {
                title: t('nav.section.overview'),
                items: [
                    { title: t('common.dashboard'), href: adminDashboard(), icon: Grid2X2 },
                    { title: t('nav.admin.analytics'), href: adminAnalytics(), icon: BarChart3 },
                ],
            },
            {
                title: t('nav.section.operational'),
                items: [
                    { title: t('nav.admin.reports'), href: adminLaporan(), icon: FileText },
                    {
                        title: t('nav.admin.users'),
                        href: adminUsers(),
                        icon: Users,
                        children: [
                            { title: t('nav.admin.users.admin'), href: adminUsers({ query: { role: 'admin' } }) },
                            { title: t('nav.admin.users.employer'), href: adminUsers({ query: { role: 'employer' } }) },
                            { title: t('nav.admin.users.candidate'), href: adminUsers({ query: { role: 'candidate' } }) },
                        ],
                    },
                    { title: t('nav.admin.companies'), href: adminCompanies(), icon: Building2 },
                    { title: t('nav.admin.company_verifications'), href: adminCompanyVerifications(), icon: FileCheck2 },
                    { title: t('nav.admin.jobs'), href: adminJobs(), icon: BriefcaseBusiness },
                ],
            },
            {
                title: t('nav.section.content_data'),
                items: [
                    { title: t('nav.admin.skills'), href: adminSkills(), icon: Tags },
                    { title: t('nav.admin.assessment_questions'), href: adminAssessmentQuestions(), icon: ClipboardList },
                    { title: t('nav.admin.industries'), href: adminIndustries(), icon: Library },
                    { title: t('nav.admin.sub_industries'), href: adminSubIndustries(), icon: Library },
                    { title: t('nav.admin.company_sizes'), href: adminCompanySizes(), icon: Building2 },
                    { title: t('nav.admin.salary_insights'), href: adminSalaryInsights(), icon: BarChart3 },
                ],
            },
            {
                title: t('nav.section.billing'),
                items: [
                    { title: t('nav.admin.career_resources'), href: adminCareerResources(), icon: GraduationCap },
                    { title: t('nav.admin.faqs'), href: adminFaqs(), icon: FileText },
                    { title: t('nav.admin.pricing_plans'), href: adminPricingPlans(), icon: WalletCards },
                ],
            },
            {
                title: t('nav.section.monitoring'),
                items: [
                    { title: t('nav.admin.candidate_pricing'), href: adminCandidatePricingMenus(), icon: CreditCard },
                    { title: t('nav.admin.subscriptions'), href: adminSubscriptions(), icon: ClipboardCheck },
                    { title: t('nav.admin.report_moderation'), href: adminReports(), icon: ShieldAlert },
                    { title: t('nav.admin.contact_messages'), href: adminContactMessages(), icon: MessageSquare },
                ],
            },
            {
                title: t('nav.section.system'),
                items: [
                    { title: t('nav.admin.system_reviews'), href: adminSystemReviews(), icon: Sparkles },
                    { title: t('nav.admin.company_reviews'), href: adminCompanyReviews(), icon: Star },
                    { title: t('nav.admin.ai_audit'), href: adminAiAuditLogs(), icon: Bot },
                    { title: t('nav.admin.activity_log'), href: adminActivityLogs(), icon: Activity },
                    { title: t('nav.admin.whatsapp'), href: adminWhatsApp(), icon: Smartphone },
                    { title: t('nav.admin.web_settings'), href: adminSettings(), icon: Settings },
                    { title: t('nav.admin.legal_terms'), href: adminLegalTerms(), icon: Scale },
                    { title: t('nav.admin.legal_privacy'), href: adminLegalPrivacy(), icon: ShieldCheck },
                ],
            },
        ],
        [t],
    );

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
                                <SidebarBrandMark
                                    logoUrl={siteLogoUrl}
                                    siteName={siteName}
                                />
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

            <SidebarFooter className="border-t border-[#eef2f6] bg-white p-4 group-data-[collapsible=icon]:p-2">
                <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[#8490a3] uppercase">
                        {t('language.label')}
                    </span>
                    <LanguageSwitcher align="end" variant="inline" />
                </div>
                <div className="hidden justify-center group-data-[collapsible=icon]:flex">
                    <LanguageSwitcher align="end" variant="icon" />
                </div>
            </SidebarFooter>
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
                            className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#eaf2ff] hover:text-[#01296A] data-[active=true]:bg-[#eaf2ff] data-[active=true]:text-[#01296A]"
                        >
                            {item.icon ? (
                                <item.icon className="size-5" />
                            ) : null}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub className="mx-3 mt-1 border-l border-[#d6e0f5] px-2">
                            {item.children?.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl(child.href)}
                                        className="h-8 rounded-lg text-sm font-semibold text-[#667085] hover:bg-[#eaf2ff] hover:text-[#01296A] data-[active=true]:bg-[#eaf2ff] data-[active=true]:text-[#01296A]"
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
                className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#eaf2ff] hover:text-[#01296A] data-[active=true]:bg-[#eaf2ff] data-[active=true]:text-[#01296A]"
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
};

type CandidateMenuItem = {
    key?: string;
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon: ComponentType<{ className?: string }>;
    lockWhenProfileIncomplete?: boolean;
    activeOnHrefs?: NonNullable<InertiaLinkProps['href']>[];
};

type CandidateMenuGroup = {
    label?: string;
    items: CandidateMenuItem[];
};

function CandidateSidebar() {
    const { auth, name, branding, nav_counts } = usePage<{
        auth: Auth;
        name: string;
        branding?: {
            name?: string;
            logo_url?: string | null;
            whatsapp_number?: string | null;
        };
        nav_counts?: {
            upcoming_interviews?: number;
            pending_ai_interviews?: number;
        };
    }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslate();
    const siteName = branding?.name ?? name ?? 'Karivia';
    const siteLogoUrl = branding?.logo_url ?? null;
    const isProfileLocked =
        !auth.user?.onboarding_completed_at ||
        (auth.candidate_profile_completion ?? 0) < 100;
    const waNumber = branding?.whatsapp_number?.replace(/\D/g, '');
    const waUrl = waNumber ? `https://wa.me/${waNumber}` : null;

    const candidateMenuGroups = useMemo<CandidateMenuGroup[]>(
        () => [
            {
                label: t('nav.section.overview'),
                items: [
                    {
                        title: t('common.home'),
                        href: candidateDashboard(),
                        icon: Grid2X2,
                    },
                ],
            },
            {
                label: t('nav.section.application_selection'),
                items: [
                    {
                        title: t('nav.candidate.applications'),
                        href: candidateApplications(),
                        icon: ClipboardList,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        title: t('nav.candidate.saved_jobs'),
                        href: candidateSavedJobs(),
                        icon: Bookmark,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        key: 'interviews',
                        title: t('nav.candidate.interviews'),
                        href: candidateInterviews(),
                        icon: CalendarCheck,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        title: t('nav.candidate.messages'),
                        href: candidateMessages(),
                        icon: MessageSquareText,
                        lockWhenProfileIncomplete: true,
                    },
                ],
            },
            {
                label: t('nav.section.career_prep'),
                items: [
                    {
                        key: 'ai_simulator',
                        title: t('nav.candidate.ai_simulator'),
                        href: candidateAiInterviews(),
                        icon: Bot,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        title: t('nav.candidate.cv_builder'),
                        href: candidateCvBuilder(),
                        icon: FileText,
                        lockWhenProfileIncomplete: true,
                    },
                    // Sembunyikan dulu — masih in-progress; aktifkan kembali bila sudah siap.
                    // {
                    //     title: t('nav.candidate.cv_analyzer'),
                    //     href: cvAnalyzer(),
                    //     icon: FileSearch,
                    //     lockWhenProfileIncomplete: true,
                    // },
                    {
                        title: t('nav.candidate.career_coach'),
                        href: candidateCareerCoach(),
                        icon: Compass,
                        lockWhenProfileIncomplete: true,
                    },
                ],
            },
            {
                label: t('nav.section.reviews'),
                items: [
                    {
                        title: t('nav.candidate.system_reviews'),
                        href: candidateSystemReviews(),
                        icon: Sparkles,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        title: t('nav.candidate.company_reviews'),
                        href: candidateCompanyReviews(),
                        icon: Star,
                        lockWhenProfileIncomplete: true,
                    },
                ],
            },
            {
                label: t('nav.section.account'),
                items: [
                    {
                        title: t('nav.candidate.pricing'),
                        href: candidatePricing(),
                        icon: CreditCard,
                        lockWhenProfileIncomplete: true,
                    },
                    {
                        title: t('common.settings'),
                        href: settingsProfileEdit(),
                        icon: Settings,
                        lockWhenProfileIncomplete: true,
                    },
                ],
            },
        ],
        [t],
    );
    const interviewNotificationCount = nav_counts?.upcoming_interviews ?? 0;
    const aiSimulatorNotificationCount = nav_counts?.pending_ai_interviews ?? 0;

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
                                <SidebarBrandMark
                                    logoUrl={siteLogoUrl}
                                    siteName={siteName}
                                />
                                <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-lg font-bold tracking-wide text-[#111827]">
                                        {siteName}
                                    </span>
                                    <span className="truncate text-xs font-bold tracking-[0.18em] text-[#8490a3] uppercase">
                                        {t('nav.candidate.tagline')}
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="justify-between bg-white px-4 py-5 group-data-[collapsible=icon]:px-2">
                <div className="space-y-5">
                    {candidateMenuGroups.map((group, groupIndex) => (
                        <div
                            key={group.label ?? `group-${groupIndex}`}
                            className="space-y-1.5"
                        >
                            {group.label ? (
                                <p className="px-3 text-[10px] font-bold tracking-[0.18em] text-[#8490a3] uppercase group-data-[collapsible=icon]:hidden">
                                    {group.label}
                                </p>
                            ) : null}
                            <SidebarMenu className="gap-1.5">
                                {group.items.map((item) => {
                                    const showInterviewBadge =
                                        item.key === 'interviews' &&
                                        interviewNotificationCount > 0;
                                    const showAiCoachBadge =
                                        item.key === 'ai_simulator' &&
                                        aiSimulatorNotificationCount > 0;
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            {isProfileLocked &&
                                            item.lockWhenProfileIncomplete ? (
                                                <SidebarMenuButton
                                                    disabled
                                                    tooltip={{
                                                        children: t(
                                                            'nav.candidate.profile_locked_tooltip',
                                                        ),
                                                    }}
                                                    className="h-11 rounded-lg px-4 text-[15px] font-semibold text-[#9aa4b2] group-data-[collapsible=icon]:justify-center"
                                                >
                                                    <item.icon className="size-5" />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            ) : (
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={
                                                        isCurrentUrl(
                                                            item.href,
                                                        ) ||
                                                        Boolean(
                                                            item.activeOnHrefs?.some(
                                                                (h) =>
                                                                    isCurrentUrl(
                                                                        h,
                                                                    ),
                                                            ),
                                                        )
                                                    }
                                                    tooltip={{
                                                        children: item.title,
                                                    }}
                                                    className={cn(
                                                        'h-11 rounded-lg px-4 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#eaf2ff] hover:text-[#01296A] data-[active=true]:bg-[#eaf2ff] data-[active=true]:text-[#01296A]',
                                                        showInterviewBadge ||
                                                            showAiCoachBadge
                                                            ? 'pr-9'
                                                            : '',
                                                    )}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        prefetch
                                                    >
                                                        <item.icon className="size-5" />
                                                        <span>
                                                            {item.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}
                                            {showInterviewBadge ? (
                                                <SidebarMenuBadge className="top-2.5 right-2 size-5 rounded-full bg-[#01296A] text-[10px] font-bold text-white!">
                                                    {interviewNotificationCount >
                                                    9
                                                        ? '9+'
                                                        : interviewNotificationCount}
                                                </SidebarMenuBadge>
                                            ) : null}
                                            {showAiCoachBadge ? (
                                                <SidebarMenuBadge className="top-2.5 right-2 size-5 rounded-full bg-[#01296A] text-[10px] font-bold text-white!">
                                                    {aiSimulatorNotificationCount >
                                                    9
                                                        ? '9+'
                                                        : aiSimulatorNotificationCount}
                                                </SidebarMenuBadge>
                                            ) : null}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </div>
                    ))}
                </div>

                {isProfileLocked && (
                    <div className="rounded-lg border border-[#d6e0f5] bg-[#eff4ff] p-4 group-data-[collapsible=icon]:hidden">
                        <p className="text-xs font-bold tracking-[0.12em] text-[#01296A] uppercase">
                            {t('nav.candidate.complete_profile_title')}
                        </p>
                        <p className="mt-3 text-sm leading-6 font-medium text-[#6b7280]">
                            {t('nav.candidate.complete_profile_message')}
                        </p>
                        <Link
                            href={candidateOnboardingEdit()}
                            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#01296A] text-sm font-bold text-white shadow-sm transition hover:bg-[#001D4D]"
                        >
                            {t('nav.candidate.complete_profile_cta')}
                        </Link>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-[#eef2f6] bg-white p-4 group-data-[collapsible=icon]:p-2">
                {waUrl && (
                    <div className="group-data-[collapsible=icon]:hidden">
                        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-3.5">
                            <div className="pointer-events-none absolute -top-6 -right-6 size-20 rounded-full bg-emerald-200/40 blur-2xl" />
                            <div className="relative flex items-start gap-2.5">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                                    <svg
                                        className="size-4.5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold leading-tight text-[#01296A]">
                                        {t('candidate.footer.contact_title')}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-snug text-[#5b6473]">
                                        {t('candidate.footer.contact_subtitle')}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`${waUrl}?text=${encodeURIComponent(t('candidate.footer.contact_prefilled', { name: auth.user?.name ?? '' }))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[12px] font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700"
                            >
                                {t('candidate.footer.contact_button')}
                                <svg
                                    className="size-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>
                )}
                {waUrl && (
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('candidate.footer.contact_button')}
                        className="hidden size-9 items-center justify-center self-center rounded-lg bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 group-data-[collapsible=icon]:flex"
                    >
                        <svg
                            className="size-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </a>
                )}
                <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[#8490a3] uppercase">
                        {t('language.label')}
                    </span>
                    <LanguageSwitcher align="end" variant="inline" />
                </div>
                <div className="hidden justify-center group-data-[collapsible=icon]:flex">
                    <LanguageSwitcher align="end" variant="icon" />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

type EmployerMenuItemWithKey = EmployerMenuItem & { key?: string };

type EmployerMenuGroup = {
    label?: string;
    items: EmployerMenuItemWithKey[];
};

function EmployerSidebar() {
    const { auth, name, branding, employer_unread_messages } = usePage<{
        auth: Auth;
        name: string;
        branding?: { name?: string; logo_url?: string | null };
        employer_unread_messages?: number;
    }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const cleanup = useMobileNavigation();
    const { t } = useTranslate();
    const siteName = branding?.name ?? name ?? 'Karivia';
    const siteLogoUrl = branding?.logo_url ?? null;
    const unreadMessages = Math.max(0, employer_unread_messages ?? 0);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const employerMenuGroups = useMemo<EmployerMenuGroup[]>(
        () => [
            {
                label: t('nav.section.overview'),
                items: [
                    { title: t('common.home'), href: employerDashboard(), icon: Grid2X2 },
                ],
            },
            {
                label: t('nav.section.recruitment'),
                items: [
                    { title: t('nav.employer.jobs'), href: employerJobs(), icon: BriefcaseBusiness },
                    { title: t('nav.employer.candidates'), href: employerCandidates(), icon: Users },
                    { title: t('nav.employer.talent_pool'), href: employerTalentPool(), icon: Bookmark },
                ],
            },
            {
                label: t('nav.section.communication'),
                items: [
                    { key: 'messages', title: t('nav.employer.messages'), href: employerMessages(), icon: MessageSquareText },
                    { title: t('nav.employer.whatsapp'), href: employerWhatsApp(), icon: MessageSquare },
                    { title: t('nav.employer.broadcast'), href: employerWhatsAppBulk(), icon: Send },
                    { title: t('nav.employer.message_templates'), href: employerMessageTemplates(), icon: FileText },
                ],
            },
            {
                label: t('nav.section.management'),
                items: [
                    { title: t('nav.employer.analytics'), href: employerAnalytics(), icon: BarChart3 },
                    { title: t('nav.employer.reviews'), href: employerReviews(), icon: Star },
                    { title: t('nav.employer.team'), href: employerTeam(), icon: Users },
                    { title: t('nav.employer.billing'), href: employerBilling(), icon: CreditCard },
                    { title: t('nav.employer.email_settings'), href: employerEmailSettings(), icon: Mail },
                ],
            },
        ],
        [t],
    );

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
                                <SidebarBrandMark
                                    logoUrl={siteLogoUrl}
                                    siteName={siteName}
                                />
                                <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-lg font-bold tracking-wide text-[#111827]">
                                        {siteName}
                                    </span>
                                    <span className="truncate text-xs font-medium text-[#8490a3]">
                                        {t('nav.employer.tagline')}
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white px-4 py-5 group-data-[collapsible=icon]:px-2">
                <div className="space-y-5">
                    {employerMenuGroups.map((group, groupIndex) => (
                        <div
                            key={group.label ?? `group-${groupIndex}`}
                            className="space-y-1.5"
                        >
                            {group.label ? (
                                <p className="px-3 text-[10px] font-bold tracking-[0.18em] text-[#8490a3] uppercase group-data-[collapsible=icon]:hidden">
                                    {group.label}
                                </p>
                            ) : null}
                            <SidebarMenu className="gap-1.5">
                                {group.items.map((item) => {
                                    const badgeValue =
                                        item.key === 'messages' &&
                                        unreadMessages > 0
                                            ? String(unreadMessages)
                                            : null;

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={
                                                    !toUrl(item.href).startsWith(
                                                        '#',
                                                    ) &&
                                                    isCurrentUrl(item.href)
                                                }
                                                tooltip={{
                                                    children: item.title,
                                                }}
                                                className={cn(
                                                    'h-11 rounded-lg px-3 text-[15px] font-semibold text-[#4b5565] group-data-[collapsible=icon]:justify-center hover:bg-[#eaf2ff] hover:text-[#01296A] data-[active=true]:bg-[#eaf2ff] data-[active=true]:text-[#01296A]',
                                                    badgeValue ? 'pr-9' : '',
                                                )}
                                            >
                                                <Link
                                                    href={item.href}
                                                    prefetch={
                                                        !toUrl(
                                                            item.href,
                                                        ).startsWith('#')
                                                    }
                                                >
                                                    <item.icon className="size-5" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {badgeValue ? (
                                                <SidebarMenuBadge className="top-2.5 right-2 size-5 rounded-full bg-[#01296A] text-[10px] font-bold text-white!">
                                                    {badgeValue}
                                                </SidebarMenuBadge>
                                            ) : null}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 group-data-[collapsible=icon]:hidden">
                    <p className="px-1 text-[11px] font-bold tracking-[0.22em] text-[#9aa4b2] uppercase">
                        {t('common.quick_actions')}
                    </p>
                    <div className="grid gap-3">
                        <Link
                            href={employerJobsCreate()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#01296A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#001D4D]"
                        >
                            <PlusCircle className="size-4" />
                            {t('nav.employer.create_job')}
                        </Link>
                        <Link
                            href={employerTalentSearch()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#e4e9f0] bg-white px-4 text-sm font-bold text-[#313947] shadow-sm transition hover:border-[#01296A]/30 hover:bg-[#eaf2ff] hover:text-[#01296A]"
                        >
                            <Search className="size-4" />
                            {t('nav.employer.find_talent')}
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
                                    className="h-14 rounded-lg p-0 group-data-[collapsible=icon]:justify-center hover:bg-[#eaf2ff] data-[state=open]:bg-[#eaf2ff]"
                                >
                                    <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[#1E4D96] text-sm font-bold text-white">
                                        {auth.user?.avatar_url ? (
                                            <img
                                                src={auth.user.avatar_url}
                                                alt={auth.user.name ?? 'HR'}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            getInitials(auth.user?.name ?? 'HR')
                                        )}
                                    </span>
                                    <span className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                                        <span className="truncate text-sm font-bold text-[#1f2937]">
                                            {auth.user?.name ?? 'HR Manager'}
                                        </span>
                                        <span className="truncate text-xs font-medium text-[#8490a3]">
                                            {t('nav.employer.role_label')}
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
                                        {t('common.profile')}
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
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mt-2 flex items-center justify-between px-2 group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[#8490a3] uppercase">
                        {t('language.label')}
                    </span>
                    <LanguageSwitcher align="end" variant="inline" />
                </div>
                <div className="mt-2 hidden justify-center group-data-[collapsible=icon]:flex">
                    <LanguageSwitcher align="end" variant="icon" />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

function SidebarBrandMark({
    logoUrl,
    siteName,
}: {
    logoUrl?: string | null;
    siteName: string;
}) {
    return (
        <span className="flex h-16 w-full items-center justify-center overflow-hidden px-1">
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={`${siteName} logo`}
                    className="h-full max-h-14 w-full object-contain"
                />
            ) : (
                <Rocket className="size-5 text-[#01296A]" />
            )}
        </span>
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
