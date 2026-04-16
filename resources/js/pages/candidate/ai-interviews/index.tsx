import { Form, Head, Link } from '@inertiajs/react';
import CandidateAiInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateAiInterviewController';
import Heading from '@/components/heading';
import { EmptyState, StatusBadge } from '@/components/candidate/candidate-ui';
import { Field, Select } from '@/components/candidate/candidate-form';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index, show } from '@/routes/candidate/ai-interviews';

type AiInterviewIndexProps = {
    applications: Array<{
        id: number;
        job_title?: string | null;
        company?: string | null;
        status: string;
    }>;
    sessions: Array<{
        id: number;
        application_id: number;
        job_title?: string | null;
        company?: string | null;
        status: string;
        started_at?: string | null;
        completed_at?: string | null;
    }>;
};

export default function CandidateAiInterviewIndex({
    applications,
    sessions,
}: AiInterviewIndexProps) {
    return (
        <>
            <Head title="AI Interview Simulator" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="AI Interview Simulator"
                    description="Latihan menjawab pertanyaan interview berdasarkan lamaran yang sudah kamu kirim."
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mulai simulasi</CardTitle>
                            <CardDescription>
                                Pilih lamaran sebagai konteks pertanyaan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...CandidateAiInterviewController.store.form()}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            label="Lamaran"
                                            name="application_id"
                                            error={errors.application_id}
                                        >
                                            <Select name="application_id">
                                                <option value="">
                                                    Pilih lamaran
                                                </option>
                                                {applications.map(
                                                    (application) => (
                                                        <option
                                                            key={
                                                                application.id
                                                            }
                                                            value={
                                                                application.id
                                                            }
                                                        >
                                                            {
                                                                application.job_title
                                                            }{' '}
                                                            -{' '}
                                                            {
                                                                application.company
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </Select>
                                        </Field>
                                        <Button disabled={processing}>
                                            {processing
                                                ? 'Memulai...'
                                                : 'Mulai simulasi'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat simulasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sessions.length ? (
                                sessions.map((session) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={session.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {session.job_title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {session.company} ·{' '}
                                                    {session.started_at}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <StatusBadge
                                                    status={session.status}
                                                />
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={show(session.id)}
                                                    >
                                                        Buka
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada simulasi"
                                    description="Mulai sesi latihan dari lamaran yang sudah kamu kirim."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CandidateAiInterviewIndex.layout = {
    breadcrumbs: [
        {
            title: 'AI Interview',
            href: index(),
        },
    ],
};
