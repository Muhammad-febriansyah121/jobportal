import { Form, Head } from '@inertiajs/react';
import CandidateCareerCoachController from '@/actions/App/Http/Controllers/Candidate/CandidateCareerCoachController';
import { Field, Textarea } from '@/components/candidate/candidate-form';
import Heading from '@/components/heading';
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
import { useTranslate } from '@/hooks/use-translate';
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
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.career_coach.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.career_coach.page_title')}
                    description={t('candidate.career_coach.page_description')}
                />

                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('candidate.career_coach.start_session')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'candidate.career_coach.start_session_description',
                                    )}
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
                                                label={t(
                                                    'candidate.career_coach.title_label',
                                                )}
                                                name="title"
                                                error={errors.title}
                                            >
                                                <Input
                                                    name="title"
                                                    placeholder={t(
                                                        'candidate.career_coach.title_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Button disabled={processing}>
                                                {t(
                                                    'candidate.career_coach.start_session',
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('candidate.career_coach.sessions')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sessions.map((session) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={session.id}
                                    >
                                        <p className="font-medium">
                                            {session.title ??
                                                t(
                                                    'candidate.career_coach.default_session_title',
                                                )}
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
                                    {activeSession?.title ??
                                        t(
                                            'candidate.career_coach.conversation_title',
                                        )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="max-h-105 space-y-3 overflow-auto rounded-lg border p-3">
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
                                            {t(
                                                'candidate.career_coach.empty_conversation',
                                            )}
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
                                                label={t(
                                                    'candidate.career_coach.message_label',
                                                )}
                                                name="content"
                                                error={errors.content}
                                            >
                                                <Textarea
                                                    name="content"
                                                    placeholder={t(
                                                        'candidate.career_coach.message_placeholder',
                                                    )}
                                                />
                                            </Field>
                                            <Button disabled={processing}>
                                                {t(
                                                    'candidate.career_coach.send_message',
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t(
                                        'candidate.career_coach.recommendations',
                                    )}
                                </CardTitle>
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
                                        {t(
                                            'candidate.career_coach.recommendations_empty',
                                        )}
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
