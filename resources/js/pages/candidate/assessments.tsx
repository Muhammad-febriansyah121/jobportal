import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { EmptyState, StatusBadge } from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index } from '@/routes/candidate/assessments';

type AssessmentsProps = {
    assessments: Array<{
        id: number;
        skill?: string | null;
        score?: number | null;
        max_score: number;
        passed: boolean;
        completed_at?: string | null;
    }>;
    suggestedSkills: Array<{
        id: number;
        name: string;
        category?: string | null;
    }>;
};

export default function CandidateAssessments({
    assessments,
    suggestedSkills,
}: AssessmentsProps) {
    return (
        <>
            <Head title="Assessment" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Assessment"
                    description="Lihat hasil assessment skill dan rekomendasi skill yang bisa diuji berikutnya."
                />

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hasil assessment</CardTitle>
                            <CardDescription>
                                Riwayat assessment yang sudah selesai.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {assessments.length ? (
                                assessments.map((assessment) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={assessment.id}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {assessment.skill}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {assessment.score ?? 0}/
                                                    {assessment.max_score} ·{' '}
                                                    {assessment.completed_at}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={
                                                    assessment.passed
                                                        ? 'hired'
                                                        : 'rejected'
                                                }
                                                label={
                                                    assessment.passed
                                                        ? 'Passed'
                                                        : 'Belum passed'
                                                }
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada assessment"
                                    description="Hasil assessment akan tampil setelah kamu menyelesaikan tes skill."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rekomendasi skill</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {suggestedSkills.map((skill) => (
                                <Badge key={skill.id} variant="outline">
                                    {skill.name}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CandidateAssessments.layout = {
    breadcrumbs: [
        {
            title: 'Assessment',
            href: index(),
        },
    ],
};
