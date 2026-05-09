export type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    locale?: string | null;
    role?: 'admin' | 'candidate' | 'employer' | 'mentor';
    is_active?: boolean;
    onboarding_completed_at?: string | null;
    avatar?: string;
    avatar_url?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    candidate_profile_completion?: number | null;
    candidate_profile_counts?: {
        experiences: number;
        educations: number;
        skills: number;
        cvs: number;
    } | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
