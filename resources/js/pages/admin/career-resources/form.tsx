import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Bold,
    ImagePlus,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Underline,
    Undo2,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type CareerResourceFormValue = {
    id?: number;
    title: string;
    slug: string;
    type: string;
    category: string | null;
    thumbnail_url: string | null;
    content: string;
};

type ResourceTypeOption = {
    value: string;
    label: string;
};

type CareerResourceFormData = {
    _method?: 'patch';
    title: string;
    slug: string;
    type: string;
    category: string;
    thumbnail: File | null;
    content: string;
};

export function CareerResourceForm({
    action,
    method = 'post',
    resource,
    typeOptions,
}: {
    action: string;
    method?: 'patch' | 'post';
    resource?: CareerResourceFormValue;
    typeOptions: ResourceTypeOption[];
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
        null,
    );
    const previewUrl = selectedPreviewUrl ?? resource?.thumbnail_url ?? null;
    const form = useForm<CareerResourceFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        title: resource?.title ?? '',
        slug: resource?.slug ?? '',
        type: resource?.type ?? 'article',
        category: resource?.category ?? '',
        thumbnail: null,
        content: resource?.content ?? '',
    });

    useEffect(() => () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }
    }, []);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(action, {
            forceFormData: true,
            preserveScroll: true,
            onError: () => {
                toast.error('Periksa kembali data career resource.');
            },
        });
    }

    function chooseThumbnail(file: File | null) {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        if (file) {
            objectUrlRef.current = URL.createObjectURL(file);
            setSelectedPreviewUrl(objectUrlRef.current);
        } else {
            setSelectedPreviewUrl(null);
        }

        form.setData('thumbnail', file);
    }

    return (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="title">Judul</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="Contoh: Cara Menjawab Pertanyaan Gaji"
                                required
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                onChange={(event) =>
                                    form.setData('slug', event.target.value)
                                }
                                placeholder="Otomatis dari judul jika kosong"
                            />
                            <InputError message={form.errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <select
                                id="type"
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData('type', event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                required
                            >
                                {typeOptions.map((option) => (
                                    <option
                                        value={option.value}
                                        key={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.type} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Input
                                id="category"
                                value={form.data.category}
                                onChange={(event) =>
                                    form.setData('category', event.target.value)
                                }
                                placeholder="Contoh: Karir Strategi"
                            />
                            <InputError message={form.errors.category} />
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            Isi Artikel
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gunakan toolbar untuk membuat konten lebih mudah
                            dibaca.
                        </p>
                    </div>
                    <RichEditor
                        value={form.data.content}
                        onChange={(value) => form.setData('content', value)}
                        error={form.errors.content}
                    />
                </section>
            </div>

            <aside className="space-y-6">
                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Thumbnail</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            PNG, JPG, atau WebP. Maksimal 2 MB.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#f5b299] bg-[#fff8f4] text-left transition hover:border-[#f45113]',
                            previewUrl && 'border-solid bg-white',
                        )}
                    >
                        {previewUrl ? (
                            <>
                                <img
                                    src={previewUrl}
                                    alt="Preview thumbnail"
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                                    Ganti Thumbnail
                                </span>
                            </>
                        ) : (
                            <span className="grid place-items-center gap-3 text-center">
                                <span className="flex size-12 items-center justify-center rounded-lg bg-[#f45113] text-white">
                                    <ImagePlus className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-[#1f2937]">
                                        Upload thumbnail
                                    </span>
                                    <span className="mt-1 block text-xs font-medium text-[#8490a3]">
                                        Klik untuk memilih gambar
                                    </span>
                                </span>
                            </span>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) =>
                            chooseThumbnail(event.target.files?.[0] ?? null)
                        }
                    />

                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus />
                            Pilih Gambar
                        </Button>
                        {form.data.thumbnail ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => chooseThumbnail(null)}
                            >
                                <X />
                            </Button>
                        ) : null}
                    </div>
                    <InputError
                        message={form.errors.thumbnail}
                        className="mt-2"
                    />
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Publikasi</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Simpan dulu sebagai draft, lalu publish dari halaman
                        detail.
                    </p>
                    {form.progress ? (
                        <div className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-[#f4f7fa]">
                                <div
                                    className="h-full rounded-full bg-[#f45113]"
                                    style={{
                                        width: `${form.progress.percentage}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-muted-foreground">
                                Upload {form.progress.percentage}%
                            </p>
                        </div>
                    ) : null}
                    <Button
                        type="submit"
                        className="mt-5 w-full bg-[#f45113] hover:bg-[#d94710]"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Menyimpan...' : 'Simpan Resource'}
                    </Button>
                </section>
            </aside>
        </form>
    );
}

function RichEditor({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    function runCommand(command: string, commandValue?: string) {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        onChange(editorRef.current?.innerHTML ?? '');
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 rounded-lg border bg-[#f8fafc] p-2">
                <EditorButton
                    label="Bold"
                    onClick={() => runCommand('bold')}
                    icon={Bold}
                />
                <EditorButton
                    label="Italic"
                    onClick={() => runCommand('italic')}
                    icon={Italic}
                />
                <EditorButton
                    label="Underline"
                    onClick={() => runCommand('underline')}
                    icon={Underline}
                />
                <EditorButton
                    label="Quote"
                    onClick={() => runCommand('formatBlock', 'blockquote')}
                    icon={Quote}
                />
                <EditorButton
                    label="Bullet List"
                    onClick={() => runCommand('insertUnorderedList')}
                    icon={List}
                />
                <EditorButton
                    label="Numbered List"
                    onClick={() => runCommand('insertOrderedList')}
                    icon={ListOrdered}
                />
                <EditorButton
                    label="Undo"
                    onClick={() => runCommand('undo')}
                    icon={Undo2}
                />
                <EditorButton
                    label="Redo"
                    onClick={() => runCommand('redo')}
                    icon={Redo2}
                />
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(event) =>
                    onChange(event.currentTarget.innerHTML)
                }
                className="min-h-[360px] rounded-lg border bg-white px-4 py-3 text-sm leading-7 outline-none prose-headings:font-bold focus-visible:border-[#f45113] focus-visible:ring-[3px] focus-visible:ring-[#f45113]/15 [&_blockquote]:border-l-4 [&_blockquote]:border-[#f45113] [&_blockquote]:bg-[#fff8f4] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
            />
            <InputError message={error} />
        </div>
    );
}

function EditorButton({
    label,
    onClick,
    icon: Icon,
}: {
    label: string;
    onClick: () => void;
    icon: LucideIcon;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            aria-label={label}
        >
            <Icon />
            <span className="sr-only">{label}</span>
        </Button>
    );
}
