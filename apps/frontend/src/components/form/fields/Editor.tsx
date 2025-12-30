'use client';

// =============================================
// Editor Field Component (Yoopta Rich Text)
// =============================================

import { useMemo, useRef } from 'react';

import Accordion from '@yoopta/accordion';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Blockquote from '@yoopta/blockquote';
import Callout from '@yoopta/callout';
import Code from '@yoopta/code';
import Divider from '@yoopta/divider';
import YooptaEditor, { createYooptaEditor, type YooptaContentValue, type YooptaOnChangeOptions } from '@yoopta/editor';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import Link from '@yoopta/link';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import { Bold, CodeMark, Highlight, Italic, Strike, Underline } from '@yoopta/marks';
import Paragraph from '@yoopta/paragraph';
import Table from '@yoopta/table';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type EditorField as EditorFieldType } from '@/types/form.types';

// =============================================
// Plugins (with explicit any type to satisfy Yoopta's strict types)
// =============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLUGINS: Array<any> = [
    Paragraph,
    HeadingOne,
    HeadingTwo,
    HeadingThree,
    NumberedList,
    BulletedList,
    TodoList,
    Blockquote,
    Callout,
    Code,
    Divider,
    Link,
    Table,
    Accordion,
];

// =============================================
// Tools
// =============================================

const TOOLS = {
    ActionMenu: {
        render: DefaultActionMenuRender,
        tool: ActionMenuList,
    },
    Toolbar: {
        render: DefaultToolbarRender,
        tool: Toolbar,
    },
    LinkTool: {
        render: DefaultLinkToolRender,
        tool: LinkTool,
    },
};

// =============================================
// Marks
// =============================================

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

// =============================================
// Types
// =============================================

interface EditorProps {
    field: EditorFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function Editor({ field, value, onChange, error, disabled }: EditorProps) {
    const editor = useMemo(() => createYooptaEditor(), []);
    const selectionRef = useRef<HTMLDivElement>(null);

    const handleChange = (newValue: YooptaContentValue, _options: YooptaOnChangeOptions) => {
        onChange(field.name, newValue);
    };

    return (
        <div className={cn('space-y-2', field.className)}>
            {field.label && (
                <Label className="flex items-center gap-1">
                    {field.icon && <span className="text-muted-foreground">{field.icon}</span>}
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {field.tooltip && (
                        <span className="text-muted-foreground cursor-help" title={field.tooltip}>
                            ⓘ
                        </span>
                    )}
                </Label>
            )}

            <div
                ref={selectionRef}
                className={cn(
                    'min-h-[200px] rounded-md border p-4',
                    'bg-background',
                    error && 'border-destructive',
                    disabled && 'pointer-events-none opacity-50'
                )}
                style={{ minHeight: field.minHeight ?? 200 }}
            >
                <YooptaEditor
                    editor={editor}
                    plugins={PLUGINS}
                    tools={TOOLS}
                    marks={MARKS}
                    selectionBoxRoot={selectionRef}
                    value={(value as YooptaContentValue) ?? undefined}
                    onChange={handleChange}
                    readOnly={disabled ?? field.readOnly}
                    placeholder={field.placeholder ?? 'Start typing...'}
                    autoFocus={field.autoFocus}
                />
            </div>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
