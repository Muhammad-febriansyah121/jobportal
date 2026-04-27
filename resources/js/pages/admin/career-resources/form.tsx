import { useForm } from '@inertiajs/react';
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
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

export type CareerResourceFormValue = {
    id?: number;
    title: string;
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
    const { t } = useTranslate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
        null,
    );
    const previewUrl = selectedPreviewUrl ?? resource?.thumbnail_url ?? null;
    const form = useForm<CareerResourceFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        title: resource?.title ?? '',
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
                toast.error(t('admin.career_resources_form.error_review'));
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
                            <Label htmlFor="title">{t('admin.career_resources_form.title')}</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder={t('admin.career_resources_form.placeholder_title')}
                                required
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">{t('admin.career_resources_form.type')}</Label>
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
                            <Label htmlFor="category">{t('admin.career_resources_form.category')}</Label>
                            <Input
                                id="category"
                                value={form.data.category}
                                onChange={(event) =>
                                    form.setData('category', event.target.value)
                                }
                                placeholder={t('admin.career_resources_form.placeholder_category')}
                            />
                            <InputError message={form.errors.category} />
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            {t('admin.career_resources_form.article_content')}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('admin.career_resources_form.toolbar_hint')}
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
                        <h2 className="text-lg font-semibold">{t('admin.career_resources_form.thumbnail')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('admin.career_resources_form.thumbnail_hint')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#d6e0f5] bg-[#eff4ff] text-left transition hover:border-[#01296A]',
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
                                    {t('admin.career_resources_form.change_thumbnail')}
                                </span>
                            </>
                        ) : (
                            <span className="grid place-items-center gap-3 text-center">
                                <span className="flex size-12 items-center justify-center rounded-lg bg-[#01296A] text-white">
                                    <ImagePlus className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-[#1f2937]">
                                        {t('admin.career_resources_form.upload_thumbnail')}
                                    </span>
                                    <span className="mt-1 block text-xs font-medium text-[#8490a3]">
                                        {t('admin.career_resources_form.click_to_select')}
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
                            {t('admin.career_resources_form.choose_image')}
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
                    <h2 className="text-lg font-semibold">{t('admin.career_resources_form.publication')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('admin.career_resources_form.publication_hint')}
                    </p>
                    {form.progress ? (
                        <div className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-[#f4f7fa]">
                                <div
                                    className="h-full rounded-full bg-[#01296A]"
                                    style={{
                                        width: `${form.progress.percentage}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-muted-foreground">
                                {t('admin.career_resources_form.upload')} {form.progress.percentage}%
                            </p>
                        </div>
                    ) : null}
                    <Button
                        type="submit"
                        className="mt-5 w-full bg-[#01296A] hover:bg-[#001D4D]"
                        disabled={form.processing}
                    >
                        {form.processing ? t('admin.career_resources_form.saving') : t('admin.career_resources_form.save_resource')}
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
                className="min-h-[360px] rounded-lg border bg-white px-4 py-3 text-sm leading-7 outline-none prose-headings:font-bold focus-visible:border-[#01296A] focus-visible:ring-[3px] focus-visible:ring-[#01296A]/15 [&_blockquote]:border-l-4 [&_blockquote]:border-[#01296A] [&_blockquote]:bg-[#eff4ff] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
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
