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
        is_saved: boolean;
    }>;
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
    latestCareerResources: Array<{
        id: number;
        title: string;
        slug: string;
        type: string;
        category?: string | null;
        thumbnail_path?: string | null;
        published_at?: string | null;
    }>;
    faqs: Array<{
        id: number;
        title: string;
        description: string;
    }>;
};

export default function Home({
    jobs,
    stats,
    industries,
    registeredCompanies,
    latestCareerResources,
    faqs,
}: HomeProps) {
    return (
        <HomeLayout>
            <HeroSection
                jobs={jobs}
                stats={stats}
                industries={industries}
                registeredCompanies={registeredCompanies}
                latestCareerResources={latestCareerResources}
                faqs={faqs}
            />
        </HomeLayout>
    );
}
