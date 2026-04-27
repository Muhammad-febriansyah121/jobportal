import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    ChevronLeft,
    CircleCheck,
    CircleX,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/assessment-questions';

type Question = {
    id: number;
    question: string;
    options: string[];
    correct_option_index: number;
    difficulty: 'easy' | 'medium' | 'hard';
    source: 'admin' | 'ai';
    is_active: boolean;
    created_at: string;
    edit_url: string;
    delete_url: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedQuestions = {
    data: Question[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

type Props = {
    skill: { id: number; name: string };
    questions: PaginatedQuestions;
    filters: { search: string; difficulty: string; status: string };
    index_url: string;
    create_url: string;
};

const DIFFICULTY_CONFIG = {
    easy: { label: 'Easy', className: 'bg-emerald-100 text-emerald-700' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
    hard: { label: 'Hard', className: 'bg-red-100 text-red-700' },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function AdminAssessmentQuestionShow({
    skill,
    questions,
    filters,
    index_url,
    create_url,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [difficulty, setDifficulty] = useState(filters.difficulty || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function applyFilter(params: Record<string, string>) {
        router.get(
            window.location.pathname,
            {
                search,
                difficulty: difficulty === 'all' ? '' : difficulty,
                status: status === 'all' ? '' : status,
                ...params,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter({ search });
    }

    function handleDelete() {
        if (!deletingUrl) return;
        setIsDeleting(true);
        router.delete(deletingUrl, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletingId(null);
                setDeletingUrl(null);
            },
        });
    }

    return (
        <>
            <Head title={`Bank Soal — ${skill.name}`} />
            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={`Bank Soal: ${skill.name}`}
                    description={`${questions.total} soal tersedia. Kelola, edit, atau hapus soal untuk skill ini.`}
                    backHref={index_url}
                    actions={
                        <Button asChild>
                            <Link href={create_url}>
                                <Plus className="size-4" />
                                Tambah / Generate Soal
                            </Link>
                        </Button>
                    }
                />

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari pertanyaan..."
                                className="w-64 pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            Cari
                        </Button>
                    </form>

                    <Select
                        value={difficulty}
                        onValueChange={(val) => {
                            setDifficulty(val);
                            applyFilter({ difficulty: val === 'all' ? '' : val });
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua level</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            applyFilter({ status: val === 'all' ? '' : val });
                        }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Questions list */}
                {questions.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <Brain className="size-10 text-muted-foreground/40" />
                            <div>
                                <p className="font-semibold">Belum ada soal</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Generate soal dengan AI atau tambah manual.
                                </p>
                            </div>
                            <Button asChild size="sm">
                                <Link href={create_url}>
                                    <Sparkles className="size-4" />
                                    Generate dengan AI
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {questions.data.map((q, index) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                number={(questions.current_page - 1) * 20 + index + 1}
                                onDelete={() => {
                                    setDeletingId(q.id);
                                    setDeletingUrl(q.delete_url);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {questions.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {questions.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className="min-w-9"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete dialog */}
            <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus soal?</DialogTitle>
                        <DialogDescription>
                            Soal ini akan dihapus permanen dari bank soal.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingId(null)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function QuestionCard({
    question,
    number,
    onDelete,
}: {
    question: Question;
    number: number;
    onDelete: () => void;
}) {
    const diff = DIFFICULTY_CONFIG[question.difficulty] ?? DIFFICULTY_CONFIG.medium;

    return (
        <Card className="overflow-hidden">
            {/* Status bar */}
            <div
                className={`flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold ${question.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
            >
                {question.is_active ? (
                    <CircleCheck className="size-3.5" />
                ) : (
                    <CircleX className="size-3.5" />
                )}
                {question.is_active ? 'Aktif' : 'Nonaktif'}
                <span className="ml-auto flex items-center gap-2 font-normal">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${diff.className}`}>
                        {diff.label}
                    </span>
                    {question.source === 'ai' && (
                        <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">
                            <Sparkles className="size-3" />
                            AI
                        </span>
                    )}
                    <span className="text-muted-foreground">{question.created_at}</span>
                </span>
            </div>

            <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                        {/* Question text */}
                        <p className="text-sm font-semibold leading-relaxed">
                            <span className="mr-2 text-muted-foreground">{number}.</span>
                            {question.question}
                        </p>

                        {/* Options */}
                        <div className="grid gap-1.5 sm:grid-cols-2">
                            {question.options.map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
                                        idx === question.correct_option_index
                                            ? 'bg-emerald-50 font-medium text-emerald-800 ring-1 ring-emerald-300'
                                            : 'bg-muted/40 text-muted-foreground'
                                    }`}
                                >
                                    <span className="shrink-0 font-semibold">
                                        {OPTION_LABELS[idx]}.
                                    </span>
                                    <span>{option}</span>
                                    {idx === question.correct_option_index && (
                                        <CircleCheck className="ml-auto size-4 shrink-0 text-emerald-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2">
                        <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <Link href={question.edit_url}>
                                <Pencil className="size-3.5" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-3.5" />
                            Hapus
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

AdminAssessmentQuestionShow.layout = ({ skill, index_url }: Props) => ({
    breadcrumbs: [
        { title: 'Bank Soal', href: index_url },
        { title: skill.name },
    ],
});
