import { Head, Link, router } from '@inertiajs/react';
import { MessageSquareText, Search } from 'lucide-react';
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
import { cleanPaginationLabel, shouldRenderPagination } from '@/lib/pagination';
import { index, show } from '@/routes/employer/messages';

type ConversationRow = {
    id: number;
    candidate: {
        id: number | null;
        name: string;
        avatar_url: string | null;
        headline: string | null;
    };
    latest_message: {
        body: string;
        sent_at: string;
        is_mine: boolean;
    } | null;
    job_title: string | null;
    unread_count: number;
    last_message_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type MessagesPageProps = {
    filters: {
        search: string;
    };
    conversations: {
        data: ConversationRow[];
        links: PaginationLink[];
    };
    unread_total: number;
};

export default function EmployerMessages({
    filters,
    conversations,
    unread_total,
}: MessagesPageProps) {
    const { t } = useTranslate();

    function submitFilter(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        router.get(
            index(),
            { search: formData.get('search')?.toString() ?? '' },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <>
            <Head title={t('employer.messages.title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.messages.title')}
                    description={t('employer.messages.description')}
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                            <MessageSquareText className="size-5" />
                        </div>
                        <p className="text-2xl font-semibold">{unread_total}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('employer.messages.unread_messages')}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.messages.search_conversation')}</CardTitle>
                        <CardDescription>
                            {t('employer.messages.search_conversation_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilter}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    className="pl-9"
                                    placeholder={t('employer.messages.search_candidate_placeholder')}
                                />
                            </div>
                            <Button type="submit" variant="outline">
                                {t('employer.messages.apply')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    {conversations.data.length > 0 ? (
                        conversations.data.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                            />
                        ))
                    ) : (
                        <div className="rounded-lg border bg-white p-8 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#f8fafc] text-[#64748b]">
                                <MessageSquareText className="size-6" />
                            </div>
                            <h2 className="mt-4 text-lg font-semibold">
                                {t('employer.messages.no_conversations')}
                            </h2>
                            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                                {t('employer.messages.no_conversations_desc')}
                            </p>
                        </div>
                    )}
                </div>

                {shouldRenderPagination(conversations.links) && (
                    <div className="flex flex-wrap justify-end gap-2">
                        {conversations.links.map((link) => (
                            <Button
                                key={`${link.label}-${link.url}`}
                                asChild={Boolean(link.url)}
                                disabled={!link.url}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                            >
                                {link.url ? (
                                    <Link href={link.url}>
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span>{cleanPaginationLabel(link.label)}</span>
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function ConversationRow({ conversation }: { conversation: ConversationRow }) {
    const { t } = useTranslate();

    return (
        <Link
            href={show(conversation.id).url}
            className="flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-[#fafafa]"
        >
            <CandidateAvatar
                name={conversation.candidate.name}
                src={conversation.candidate.avatar_url}
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                            {conversation.candidate.name}
                        </span>
                        {conversation.unread_count > 0 && (
                            <Badge className="bg-[#0F4C94] text-white hover:bg-[#0F4C94]">
                                {conversation.unread_count}
                            </Badge>
                        )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {conversation.latest_message?.sent_at ??
                            conversation.last_message_at}
                    </span>
                </div>

                {conversation.candidate.headline && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {conversation.candidate.headline}
                    </p>
                )}

                {conversation.job_title && (
                    <p className="mt-1 text-xs text-[#64748b]">
                        {t('employer.messages.job_label')} {conversation.job_title}
                    </p>
                )}

                {conversation.latest_message ? (
                    <p
                        className={`mt-1 truncate text-sm ${
                            conversation.unread_count > 0
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {conversation.latest_message.is_mine ? t('employer.messages.you_prefix') : ''}
                        {conversation.latest_message.body}
                    </p>
                ) : (
                    <p className="mt-1 text-sm text-muted-foreground italic">
                        {t('employer.messages.no_messages')}
                    </p>
                )}
            </div>
        </Link>
    );
}

function CandidateAvatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="size-11 shrink-0 rounded-lg object-cover"
            />
        );
    }

    return (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0F2747] text-sm font-semibold text-white">
            {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
        </div>
    );
}

EmployerMessages.layout = {
    breadcrumbs: [
        {
            title: 'Pesan',
            href: index(),
        },
    ],
};
