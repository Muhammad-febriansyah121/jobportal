import {
    Bold,
    Heading2,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Underline,
    Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    minHeight?: string;
    placeholder?: string;
}

type ToolbarItem = {
    label: string;
    icon: LucideIcon;
    command: string;
    value?: string;
    prompt?: string;
};

function ToolbarButton({
    label,
    icon: Icon,
    onClick,
}: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            aria-label={label}
            className="size-8 p-0"
        >
            <Icon className="size-3.5" />
            <span className="sr-only">{label}</span>
        </Button>
    );
}

const TOOLBAR_GROUPS: ToolbarItem[][] = [
    [
        {
            label: 'Heading 2',
            icon: Heading2,
            command: 'formatBlock',
            value: 'h2',
        },
        { label: 'Bold', icon: Bold, command: 'bold' },
        { label: 'Italic', icon: Italic, command: 'italic' },
        { label: 'Underline', icon: Underline, command: 'underline' },
    ],
    [
        { label: 'Bullet List', icon: List, command: 'insertUnorderedList' },
        {
            label: 'Numbered List',
            icon: ListOrdered,
            command: 'insertOrderedList',
        },
        {
            label: 'Quote',
            icon: Quote,
            command: 'formatBlock',
            value: 'blockquote',
        },
    ],
    [
        {
            label: 'Link',
            icon: Link2,
            command: 'createLink',
            prompt: 'rich_editor.link_prompt',
        },
        { label: 'Undo', icon: Undo2, command: 'undo' },
        { label: 'Redo', icon: Redo2, command: 'redo' },
    ],
];

export function RichEditor({
    value,
    onChange,
    error,
    minHeight = '480px',
    placeholder,
}: RichEditorProps) {
    const { t } = useTranslate();
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    function runCommand(
        command: string,
        commandValue?: string,
        promptKey?: string,
    ) {
        const val = promptKey
            ? (window.prompt(t(promptKey)) ?? undefined)
            : commandValue;
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        onChange(editorRef.current?.innerHTML ?? '');
    }

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2">
                {TOOLBAR_GROUPS.map((group, gi) => (
                    <div key={gi} className="flex items-center gap-1">
                        {gi > 0 && (
                            <div className="mx-1 h-5 w-px bg-gray-200" />
                        )}
                        {group.map((btn) => (
                            <ToolbarButton
                                key={btn.label}
                                label={btn.label}
                                icon={btn.icon}
                                onClick={() =>
                                    runCommand(
                                        btn.command,
                                        btn.value,
                                        btn.prompt,
                                    )
                                }
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Editor area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight }}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm leading-7 text-gray-800 transition outline-none empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-gray-600 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-800 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-6"
            />

            <InputError message={error} />
        </div>
    );
}
