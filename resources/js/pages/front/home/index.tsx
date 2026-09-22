import HeroSection from '@/components/front/hero-section';
import HomeLayout from '@/layouts/front/home-layout';

type HomeProps = {
    jobs: Array<{
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        type: string;
        work_mode: string;
        location: string;
        salary: string;
        published_at?: string | null;
        is_saved: boolean;
    }>;
    scrapedJobs: Array<{
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        is_urgent?: boolean;
        company?: string | null;
        company_logo?: string | null;
        type: string;
        work_mode: string;
        location: string;
        salary: string;
        published_at?: string | null;
        is_saved: boolean;
        is_scraped: boolean;
        source_url: string;
        source_platform: string;
    }>;
    jobs_pagination?: {
        current_page: number;
        last_page: number;
        has_more: boolean;
    };
    stats: {
        active_jobs: number;
        active_companies: number;
        total_candidates: number;
    };
    industries: Array<{
        id: number;
        name: string;
        jobs_count: number;
    }>;
    registeredCompanies: Array<{
        id: number;
        name: string;
        slug: string;
        logo_url: string | null;
        hq_city: string | null;
        is_verified: boolean;
    }>;
    faqs: Array<{
        id: number;
        title: string;
        description: string;
    }>;
};

export default function Home({
    jobs,
    scrapedJobs,
    jobs_pagination,
    stats,
    industries,
    registeredCompanies,
    faqs,
}: HomeProps) {
    return (
        <HomeLayout overlayNavbar>
            <HeroSection
                jobs={jobs}
                scrapedJobs={scrapedJobs}
                jobs_pagination={jobs_pagination}
                stats={stats}
                industries={industries}
                registeredCompanies={registeredCompanies}
                faqs={faqs}
            />
        </HomeLayout>
    );
}
