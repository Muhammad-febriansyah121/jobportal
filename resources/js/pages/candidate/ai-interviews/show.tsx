import { Form, Head } from '@inertiajs/react';
import CandidateAiInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateAiInterviewController';
import Heading from '@/components/heading';
import { Field, Textarea } from '@/components/candidate/candidate-form';
import { StatusBadge } from '@/components/candidate/candidate-ui';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index, show } from '@/routes/candidate/ai-interviews';

type AiInterviewShowProps = {
    session: {
        id: number;
        job_title?: string | null;
        company?: string | null;
        status: string;
        started_at?: string | null;
        completed_at?: string | null;
        questions: Array<{
            id: number;
            question: string;
            category?: string | null;
            answer_text?: string | null;
            ai_score?: number | null;
            ai_analysis?: string | null;
        }>;
        analysis?: {
            fit_score?: number | null;
            recommendation?: string | null;
            summary?: string | null;
        } | null;
    };
};

export default function CandidateAiInterviewShow({
    session,
}: AiInterviewShowProps) {
    return (
        <>
            <Head title="Simulasi Interview" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={session.job_title ?? 'Simulasi Interview'}
                    description={`${session.company ?? 'Perusahaan'} · ${session.started_at ?? '-'}`}
                />

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jawaban simulasi</CardTitle>
                            <CardDescription>
                                Jawab singkat, spesifik, dan berbasis contoh.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...CandidateAiInterviewController.answer.form(
                                    session.id,
                                )}
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {session.questions.map((question) => (
                                            <Field
                                                key={question.id}
                                                label={question.question}
                                                name={`answers[${question.id}]`}
                                                error={
                                                    errors[
                                                        `answers.${question.id}`
                                                    ]
                                                }
                                            >
                                                <Textarea
                                                    name={`answers[${question.id}]`}
                                                    defaultValue={
                                                        question.answer_text ??
                                                        ''
                                                    }
                                                    placeholder="Tulis jawaban kamu"
                                                />
                                            </Field>
                                        ))}
                                        <Button disabled={processing}>
                                            {processing
                                                ? 'Menyimpan...'
                                                : 'Simpan jawaban'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <StatusBadge status={session.status} />
                                <p className="text-sm text-muted-foreground">
                                    Mulai {session.started_at}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Selesai {session.completed_at ?? '-'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Analisis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {session.analysis?.summary ??
                                        'Analisis akan muncul setelah jawaban diproses.'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateAiInterviewShow.layout = ({ session }: AiInterviewShowProps) => ({
    breadcrumbs: [
        {
            title: 'AI Interview',
            href: index(),
        },
        {
            title: session.job_title ?? 'Simulasi',
            href: show(session.id),
        },
    ],
});
