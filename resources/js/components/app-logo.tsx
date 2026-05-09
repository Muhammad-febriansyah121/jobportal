import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate text-base font-bold leading-tight tracking-wide text-sidebar-primary-foreground">
                    JobPortal
                </span>
                <span className="truncate text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest">
                    Admin Panel
                </span>
            </div>
        </>
    );
}
