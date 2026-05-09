import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Brain, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { index } from '@/routes/admin/assessment-questions';
import { useTranslate } from '@/hooks/use-translate';

type SkillCard = {
    id: number;
    name: string;
    total_questions: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    active_count: number;
    detail_url: string;
    create_url: string;
};

type Props = {
    skills: SkillCard[];
    create_url: string;
};

const DIFFICULTY_COLORS = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
} as const;

export default function AdminAssessmentQuestionIndex({ skills, create_url }: Props) {
    const { t } = useTranslate();
    const withQuestions = skills.filter((s) => s.total_questions > 0);
    const withoutQuestions = skills.filter((s) => s.total_questions === 0);
    const totalQuestions = skills.reduce((sum, s) => sum + s.total_questions, 0);

    return (
        <>
            <Head title={t("admin.assessment.index.title")} />
            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={t("admin.assessment.index.title")}
                    description={t("admin.assessment.index.desc")}
                    actions={[
                        {
                            label: t('admin.assessment.index.btn_add'),
                            icon: 'plus',
                            href: create_url,
                        },
                    ]}
                />

                {/* Summary strip */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                        <Brain className="size-4 text-muted-foreground" />
                        <span className="font-semibold">{totalQuestions}</span>
                        <span className="text-muted-foreground">{t("admin.assessment.index.total_questions")}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-xs">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <span className="font-semibold">{withQuestions.length}</span>
                        <span className="text-muted-foreground">{t("admin.assessment.index.skills_with_questions")}</span>
                    </div>
                </div>

                {/* Skills with questions */}
                {withQuestions.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Skill dengan soal
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {withQuestions.map((skill) => (
                                <SkillCard key={skill.id} skill={skill} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills without questions */}
                {withoutQuestions.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Skill belum ada soal
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {withoutQuestions.map((skill) => (
                                <div
                                    key={skill.id}
                                    className="flex items-center justify-between rounded-lg border border-dashed bg-white px-4 py-3"
                                >
                                    <span className="text-sm font-medium">{skill.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="gap-1.5 text-xs"
                                    >
                                        <Link href={skill.create_url}>
                                            <Sparkles className="size-3.5" />
                                            Generate
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {skills.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <Brain className="size-10 text-muted-foreground/40" />
                            <div>
                                <p className="font-semibold">{t("admin.assessment.index.empty_title")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tambah skill terlebih dahulu di menu Skills.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function SkillCard({ skill }: { skill: SkillCard }) {
    const { t } = useTranslate();
    return (
        <Card className="flex flex-col overflow-hidden bg-white">
            {/* color top stripe based on question count */}
            <div
                className={`h-1 w-full ${skill.total_questions >= 20 ? 'bg-emerald-500' : skill.total_questions >= 5 ? 'bg-amber-400' : 'bg-red-400'}`}
            />
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span>{skill.name}</span>
                    <span className="shrink-0 text-xl font-bold text-foreground">
                        {skill.total_questions}
                    </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    {skill.active_count}  {t('admin.assessment.index.card_active')} · {skill.total_questions - skill.active_count} {t('admin.assessment.index.card_inactive')}
                </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 pb-3">
                {skill.easy_count > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS.easy}`}>
                        Easy {skill.easy_count}
                    </span>
                )}
                {skill.medium_count > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS.medium}`}>
                        Medium {skill.medium_count}
                    </span>
                )}
                {skill.hard_count > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS.hard}`}>
                        Hard {skill.hard_count}
                    </span>
                )}
            </CardContent>
            <CardFooter className="mt-auto flex gap-2 border-t pt-3">
                <Button asChild size="sm" className="flex-1">
                    <Link href={skill.detail_url}>
                        Detail
                        <ChevronRight className="size-3.5" />
                    </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                    <Link href={skill.create_url}>
                        <Plus className="size-3.5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

AdminAssessmentQuestionIndex.layout = {
    breadcrumbs: [{ title: 'Bank Soal', href: index() }],
};
