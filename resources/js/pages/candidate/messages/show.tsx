import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { index, show, store } from '@/routes/candidate/messages';

type MessageItem = {
    id: number;
    body: string;
    sent_at: string;
    is_mine: boolean;
    sender_name: string;
    sender_avatar: string | null;
};

type ShowPageProps = {
    conversation: {
        id: number;
        company: {
            name: string;
            logo_url: string | null;
        };
        job_title: string | null;
    };
    messages: MessageItem[];
};

export default function CandidateMessageShow({
    conversation,
    messages,
}: ShowPageProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
    });

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        post(store(conversation.id).url, {
            onSuccess: () => reset('body'),
        });
    }

    return (
        <>
            <Head title={`Pesan — ${conversation.company.name}`} />

            <div className="flex h-[calc(100dvh-4rem)] flex-col">
                <div className="flex items-center gap-4 border-b bg-white px-4 py-3 shadow-sm md:px-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>

                    <CompanyAvatar
                        name={conversation.company.name}
                        src={conversation.company.logo_url}
                    />

                    <div className="min-w-0 flex-1">
                        <p className="leading-tight font-semibold">
                            {conversation.company.name}
                        </p>
                        {conversation.job_title && (
                            <p className="truncate text-xs text-[#64748b]">
                                Posisi: {conversation.job_title}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                                Belum ada pesan. Mulai percakapan sekarang.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="border-t bg-white px-4 py-3 md:px-6">
                    <form onSubmit={submit} className="flex items-end gap-3">
                        <textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            placeholder="Tulis pesan..."
                            className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    submit(e as unknown as React.FormEvent);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={processing || !data.body.trim()}
                            size="icon"
                            className="shrink-0 bg-[#01296A] hover:bg-[#001D4D]"
                        >
                            <Send className="size-4" />
                        </Button>
                    </form>
                    {errors.body && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.body}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

function MessageBubble({ message }: { message: MessageItem }) {
    return (
        <div
            className={`flex items-end gap-2 ${message.is_mine ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {!message.is_mine && (
                <SenderAvatar
                    name={message.sender_name}
                    src={message.sender_avatar}
                />
            )}

            <div
                className={`max-w-[85%] space-y-1 sm:max-w-[70%] ${message.is_mine ? 'items-end' : 'items-start'} flex flex-col`}
            >
                <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        message.is_mine
                            ? 'rounded-br-sm bg-[#01296A] text-white'
                            : 'rounded-bl-sm bg-white text-foreground shadow-sm'
                    }`}
                >
                    {message.body}
                </div>
                <span className="text-xs text-muted-foreground">
                    {message.sent_at}
                </span>
            </div>
        </div>
    );
}

function SenderAvatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="size-8 shrink-0 rounded-full object-cover"
            />
        );
    }

    return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-semibold text-white">
            {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
        </div>
    );
}

function CompanyAvatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="size-10 shrink-0 rounded-lg object-cover"
            />
        );
    }

    return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-sm font-semibold text-white">
            <Building2 className="size-5" />
        </div>
    );
}

CandidateMessageShow.layout = {
    breadcrumbs: [
        { title: 'Pesan', href: index() },
        { title: 'Percakapan', href: show(0) },
    ],
};
