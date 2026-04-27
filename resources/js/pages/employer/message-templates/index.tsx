import { Head, Link, router } from '@inertiajs/react';
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import EmployerMessageTemplateController from '@/actions/App/Http/Controllers/Employer/EmployerMessageTemplateController';
import Heading from '@/components/heading';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { create, edit, index as indexRoute } from '@/routes/employer/message-templates';

type Channel = 'whatsapp' | 'email';

type TemplateRow = {
    id: number;
    name: string;
    channel: Channel;
    subject: string | null;
    body_preview: string;
    description: string | null;
    is_active: boolean;
    updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    templates: {
        data: TemplateRow[];
        links: PaginationLink[];
    };
    filters: {
        channel: string;
        search: string;
    };
};

export default function EmployerMessageTemplatesIndex({
    templates,
    filters,
}: Props) {
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const submitFilter = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        router.get(
            indexRoute(),
            {
                search: formData.get('search')?.toString() ?? '',
                channel: formData.get('channel')?.toString() ?? '',
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = (id: number) => {
        router.delete(
            EmployerMessageTemplateController.destroy.url(id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Template dihapus.');
                },
                onError: () => {
                    toast.error('Gagal menghapus template.');
                },
                onFinish: () => {
                    setConfirmId(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="Template Pesan" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title="Template Pesan"
                        description="Simpan template pesan WhatsApp & Email yang sering dipakai untuk broadcast atau undangan interview."
                    />
                    <Button asChild>
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Buat template
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar template</CardTitle>
                        <CardDescription>
                            Cari berdasarkan nama atau isi pesan, saring per
                            channel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            onSubmit={submitFilter}
                            className="grid gap-3 md:grid-cols-[1fr_240px_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari nama atau isi pesan"
                                    className="pl-9"
                                />
                            </div>
                            <select
                                name="channel"
                                defaultValue={filters.channel}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                            >
                                <option value="">Semua channel</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="email">Email</option>
                            </select>
                            <Button type="submit" variant="outline">
                                Filter
                            </Button>
                        </form>

                        {templates.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-10 text-center">
                                <FileText className="size-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Belum ada template. Klik &ldquo;Buat
                                    template&rdquo; untuk mulai.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Channel</TableHead>
                                            <TableHead>Pratinjau</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Diperbarui</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templates.data.map((tpl) => (
                                            <TableRow key={tpl.id}>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {tpl.name}
                                                    </p>
                                                    {tpl.subject ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Subject:{' '}
                                                            {tpl.subject}
                                                        </p>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            tpl.channel ===
                                                            'email'
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        }
                                                    >
                                                        {tpl.channel === 'email'
                                                            ? 'Email'
                                                            : 'WhatsApp'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-md text-xs text-muted-foreground">
                                                    {tpl.body_preview}
                                                    {tpl.body_preview.length >=
                                                    120
                                                        ? '...'
                                                        : ''}
                                                </TableCell>
                                                <TableCell>
                                                    {tpl.is_active ? (
                                                        <Badge className="border-green-200 bg-green-50 text-green-700">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {tpl.updated_at ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Link
                                                                href={
                                                                    edit(
                                                                        tpl.id,
                                                                    ).url
                                                                }
                                                            >
                                                                <Pencil className="size-3.5" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                                            onClick={() =>
                                                                setConfirmId(
                                                                    tpl.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog
                open={confirmId !== null}
                onOpenChange={(open) => !open && setConfirmId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Template yang dihapus tidak bisa dikembalikan. Pesan
                            yang sudah dikirim sebelumnya tidak terpengaruh.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() =>
                                confirmId && handleDelete(confirmId)
                            }
                        >
                            Ya, hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

EmployerMessageTemplatesIndex.layout = {
    breadcrumbs: [
        { title: 'Template Pesan', href: indexRoute() },
    ],
};
