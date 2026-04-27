import { Head, Link } from '@inertiajs/react';
import { Building2, CheckCircle2, CircleUserRound, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import { login, register } from '@/routes';

export default function Register() {
    const { t } = useTranslate();

    const candidateBenefits = useMemo(
        () => [
            t('auth.register.candidate_benefit_1'),
            t('auth.register.candidate_benefit_2'),
            t('auth.register.candidate_benefit_3'),
        ],
        [t],
    );

    const employerBenefits = useMemo(
        () => [
            t('auth.register.employer_benefit_1'),
            t('auth.register.employer_benefit_2'),
            t('auth.register.employer_benefit_3'),
        ],
        [t],
    );

    return (
        <>
            <Head title={t('auth.register.head_title')} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Kandidat card */}
                    <article className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary/30 bg-linear-to-br from-primary/5 to-white p-5 transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
                        {/* Top accent */}
                        <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-primary to-blue-400" />

                        {/* Popular badge */}
                        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                            <Sparkles className="size-2.5" />
                            {t('auth.register.popular_badge')}
                        </span>

                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                                <CircleUserRound className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-foreground">{t('auth.register.candidate_title')}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.register.candidate_subtitle')}
                                </p>
                            </div>
                        </div>

                        <ul className="mb-5 flex-1 space-y-2">
                            {candidateBenefits.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Button asChild className="w-full gap-2 font-semibold" data-test="select-candidate-register">
                            <Link href={register({ query: { type: 'candidate' } })}>
                                <CircleUserRound className="size-4" />
                                {t('auth.register.candidate_cta')}
                            </Link>
                        </Button>
                    </article>

                    {/* Perusahaan card */}
                    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-foreground">{t('auth.register.employer_title')}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.register.employer_subtitle')}
                                </p>
                            </div>
                        </div>

                        <ul className="mb-5 flex-1 space-y-2">
                            {employerBenefits.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Button
                            asChild
                            variant="outline"
                            className="w-full gap-2 font-semibold"
                            data-test="select-employer-register"
                        >
                            <Link href={register({ query: { type: 'employer' } })}>
                                <Building2 className="size-4" />
                                {t('auth.register.employer_cta')}
                            </Link>
                        </Button>
                    </article>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    {t('auth.register.have_account')}{' '}
                    <TextLink href={login()}>{t('auth.register.sign_in_now')}</TextLink>
                </p>
            </div>
        </>
    );
}

Register.layout = (page: React.ReactElement) => (
    <AuthSimpleLayout
        title="Pilih Tipe Akun"
        description="Daftar sebagai kandidat atau perusahaan sesuai kebutuhanmu."
        wide
    >
        {page}
    </AuthSimpleLayout>
);
