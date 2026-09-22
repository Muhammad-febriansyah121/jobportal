import FrontFooter from '@/components/front/front-footer';
import FrontNavbar from '@/components/front/front-navbar';

interface HomeLayoutProps {
    children: React.ReactNode;
    overlayNavbar?: boolean;
}

export default function HomeLayout({
    children,
    overlayNavbar = true,
}: HomeLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <FrontNavbar overlay={overlayNavbar} />
            <main className="flex-1">{children}</main>
            <FrontFooter />
        </div>
    );
}
