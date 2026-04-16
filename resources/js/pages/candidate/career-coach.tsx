import { Form, Head } from '@inertiajs/react';
import CandidateCareerCoachController from '@/actions/App/Http/Controllers/Candidate/CandidateCareerCoachController';
import Heading from '@/components/heading';
import { Field, Textarea } from '@/components/candidate/candidate-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { index } from '@/routes/candidate/career-coach';

type CareerCoachProps = {
    sessions: Array<{
        id: number;
        title?: string | null;
        status: string;
        updated_at?: string | null;
    }>;
    activeSession?: {
        id: number;
        title?: string | null;
        status: string;
        messages: Array<{
            id: number;
            role: 'user' | 'assistant';
            content: string;
            created_at?: string | null;
        }>;
    } | null;
    recommendations: Array<{
        id: number;
        title: string;
        match_score?: number | null;
        recommendation?: Record<string, unknown> | null;
    }>;
};

export default function CandidateCareerCoach({
    sessions,
    activeSession,
    recommendations,
}: CareerCoachProps) {
    return (
        <>
            <Head title="Career Coach" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Career Coach"
                    description="Catat arah karier, pertanyaan, dan rekomendasi pengembangan berikutnya."
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mulai sesi</CardTitle>
                                <CardDescription>
                                    Beri judul sesi agar mudah dilacak.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...CandidateCareerCoachController.start.form()}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label="Judul"
                                                name="title"
                                                error={errors.title}
                                            >
                                                <Input
                                                    name="title"
                                                    placeholder="Rencana pindah ke Product Manager"
                                                />
                                            </Field>
                                            <Button disabled={processing}>
                                                Mulai sesi
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sesi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sessions.map((session) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={session.id}
                                    >
                                        <p className="font-medium">
                                            {session.title ?? 'Career coaching'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {session.status} ·{' '}
                                            {session.updated_at}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {activeSession?.title ?? 'Percakapan'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="max-h-[420px] space-y-3 overflow-auto rounded-lg border p-3">
                                    {activeSession?.messages.length ? (
                                        activeSession.messages.map(
                                            (message) => (
                                                <div
                                                    className={
                                                        message.role === 'user'
                                                            ? 'ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                                                            : 'max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm'
                                                    }
                                                    key={message.id}
                                                >
                                                    {message.content}
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Mulai sesi lalu kirim pertanyaan
                                            pertama.
                                        </p>
                                    )}
                                </div>
                                <Form
                                    {...CandidateCareerCoachController.message.form()}
                                    className="space-y-3"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            {activeSession ? (
                                                <input
                                                    type="hidden"
                                                    name="session_id"
                                                    value={activeSession.id}
                                                />
                                            ) : null}
                                            <Field
                                                label="Pesan"
                                                name="content"
                                                error={errors.content}
                                            >
                                                <Textarea
                                                    name="content"
                                                    placeholder="Tanya soal skill gap, arah role, atau strategi apply."
                                                />
                                            </Field>
                                            <Button disabled={processing}>
                                                Kirim pesan
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rekomendasi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recommendations.length ? (
                                    recommendations.map((recommendation) => (
                                        <div
                                            className="rounded-lg border p-3"
                                            key={recommendation.id}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-medium">
                                                    {recommendation.title}
                                                </p>
                                                {recommendation.match_score ? (
                                                    <Badge variant="outline">
                                                        {
                                                            recommendation.match_score
                                                        }
                                                        %
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Rekomendasi akan muncul setelah sesi
                                        coaching berjalan.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateCareerCoach.layout = {
    breadcrumbs: [
        {
            title: 'Career Coach',
            href: index(),
        },
    ],
};
