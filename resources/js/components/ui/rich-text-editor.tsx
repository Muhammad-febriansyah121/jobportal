import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Italic,
    Link2,
    Link2Off,
    List,
    ListOrdered,
    Strikethrough,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeightClass?: string;
};

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    minHeightClass = 'min-h-40',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                horizontalRule: false,
                codeBlock: false,
                blockquote: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    class: 'text-primary-600 underline',
                    rel: 'noopener noreferrer nofollow',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder ?? 'Tulis pesan...',
                emptyEditorClass:
                    'before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html === '<p></p>' ? '' : html);
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm max-w-none focus:outline-none px-3 py-2',
                    minHeightClass,
                ),
            },
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }
        const current = editor.getHTML();
        const next = value || '<p></p>';
        if (current !== next && next !== '<p></p>') {
            editor.commands.setContent(next, { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('URL', previousUrl ?? 'https://');
        if (url === null) {
            return;
        }
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
    };

    return (
        <div
            className={cn(
                'rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                className,
            )}
        >
            <div className="flex flex-wrap gap-1 border-b border-input px-2 py-1.5">
                <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    label="Bold"
                >
                    <Bold className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    label="Italic"
                >
                    <Italic className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    label="Strikethrough"
                >
                    <Strikethrough className="size-3.5" />
                </ToolbarButton>
                <span className="mx-1 self-center text-muted-foreground">
                    |
                </span>
                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    label="Bullet list"
                >
                    <List className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    label="Numbered list"
                >
                    <ListOrdered className="size-3.5" />
                </ToolbarButton>
                <span className="mx-1 self-center text-muted-foreground">
                    |
                </span>
                <ToolbarButton
                    active={editor.isActive('link')}
                    onClick={setLink}
                    label="Add link"
                >
                    <Link2 className="size-3.5" />
                </ToolbarButton>
                {editor.isActive('link') ? (
                    <ToolbarButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .extendMarkRange('link')
                                .unsetLink()
                                .run()
                        }
                        label="Remove link"
                    >
                        <Link2Off className="size-3.5" />
                    </ToolbarButton>
                ) : null}
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

function ToolbarButton({
    active,
    onClick,
    label,
    children,
}: {
    active?: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex size-7 items-center justify-center rounded text-sm transition-colors',
                active
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}
