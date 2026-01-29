'use client';

// =============================================
// Professional Rich Text Editor
// Markdown-based editor with preview and toolbar
// =============================================

import { useState } from 'react';

import {
    Bold,
    Code,
    Eye,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Strikethrough,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// =============================================
// Types
// =============================================

interface IRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number;
}

// =============================================
// Toolbar Button Component
// =============================================

interface IToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

const ToolbarButton = ({ icon, label, onClick, disabled }: IToolbarButtonProps) => (
    <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={onClick}
        disabled={disabled}
        className='h-8 w-8 p-0'
        title={label}
    >
        {icon}
    </Button>
);

// =============================================
// Main Component
// =============================================

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = 'Start writing your amazing content...',
    readOnly = false,
    minHeight = 400,
}: IRichTextEditorProps) => {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const textareaRef = useState<HTMLTextAreaElement | null>(null)[0];

    // =============================================
    // Text Formatting Helpers
    // =============================================

    const insertText = (before: string, after = '', placeholder = 'text') => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || placeholder;
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selectedText.length,
            );
        }, 0);
    };

    // =============================================
    // Toolbar Actions
    // =============================================

    const handleBold = () => insertText('**', '**', 'bold text');
    const handleItalic = () => insertText('*', '*', 'italic text');
    const handleStrikethrough = () => insertText('~~', '~~', 'strikethrough');
    const handleCode = () => insertText('`', '`', 'code');
    const handleH1 = () => insertText('\n# ', '', 'Heading 1');
    const handleH2 = () => insertText('\n## ', '', 'Heading 2');
    const handleH3 = () => insertText('\n### ', '', 'Heading 3');
    const handleBulletList = () => insertText('\n- ', '', 'List item');
    const handleNumberList = () => insertText('\n1. ', '', 'List item');
    const handleQuote = () => insertText('\n> ', '', 'Quote');
    const handleLink = () => insertText('[', '](https://example.com)', 'Link text');
    const handleImage = () => insertText('![', '](https://example.com/image.jpg)', 'Alt text');

    // =============================================
    // Preview Renderer (Simple)
    // =============================================

    const renderPreview = () => {
        if (!value) {
            return (
                <div className='flex h-full items-center justify-center text-muted-foreground'>
                    <div className='text-center'>
                        <Eye className='mx-auto mb-2 h-8 w-8' />
                        <p>Nothing to preview yet</p>
                        <p className='text-sm'>Start writing to see a preview</p>
                    </div>
                </div>
            );
        }

        // Basic markdown-like rendering (simplified)
        // In production, use a proper markdown parser like 'marked' or 'remark'
        const lines = value.split('\n');
        const rendered = lines.map((line, index) => {
            // Headings
            if (line.startsWith('### ')) {
                return (
                    <h3 key={index} className='mb-2 mt-4 text-xl font-semibold'>
                        {line.replace('### ', '')}
                    </h3>
                );
            }
            if (line.startsWith('## ')) {
                return (
                    <h2 key={index} className='mb-3 mt-5 text-2xl font-bold'>
                        {line.replace('## ', '')}
                    </h2>
                );
            }
            if (line.startsWith('# ')) {
                return (
                    <h1 key={index} className='mb-4 mt-6 text-3xl font-bold'>
                        {line.replace('# ', '')}
                    </h1>
                );
            }

            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                    <li key={index} className='ml-4'>
                        {line.replace(/^[*-]\s/, '')}
                    </li>
                );
            }
            if (line.match(/^\d+\.\s/)) {
                return (
                    <li key={index} className='ml-4'>
                        {line.replace(/^\d+\.\s/, '')}
                    </li>
                );
            }

            // Blockquote
            if (line.startsWith('> ')) {
                return (
                    <blockquote
                        key={index}
                        className='border-l-4 border-primary pl-4 italic text-muted-foreground'
                    >
                        {line.replace('> ', '')}
                    </blockquote>
                );
            }

            // Code block
            if (line.startsWith('```')) {
                return (
                    <code
                        key={index}
                        className='block rounded bg-muted p-2 font-mono text-sm'
                    >
                        {line}
                    </code>
                );
            }

            // Regular paragraph
            if (line.trim()) {
                return (
                    <p key={index} className='mb-2'>
                        {line}
                    </p>
                );
            }

            // Empty line
            return <br key={index} />;
        });

        return <div className='prose prose-sm max-w-none dark:prose-invert'>{rendered}</div>;
    };

    // =============================================
    // Render
    // =============================================

    return (
        <div className='rounded-lg border border-input bg-background'>
            {/* Toolbar */}
            {!readOnly && (
                <div className='flex flex-wrap items-center gap-1 border-b border-border p-2'>
                    <div className='flex items-center gap-0.5 border-r pr-2'>
                        <ToolbarButton icon={<Bold className='h-4 w-4' />} label='Bold' onClick={handleBold} />
                        <ToolbarButton
                            icon={<Italic className='h-4 w-4' />}
                            label='Italic'
                            onClick={handleItalic}
                        />
                        <ToolbarButton
                            icon={<Strikethrough className='h-4 w-4' />}
                            label='Strikethrough'
                            onClick={handleStrikethrough}
                        />
                        <ToolbarButton
                            icon={<Code className='h-4 w-4' />}
                            label='Code'
                            onClick={handleCode}
                        />
                    </div>

                    <div className='flex items-center gap-0.5 border-r pr-2'>
                        <ToolbarButton
                            icon={<Heading1 className='h-4 w-4' />}
                            label='Heading 1'
                            onClick={handleH1}
                        />
                        <ToolbarButton
                            icon={<Heading2 className='h-4 w-4' />}
                            label='Heading 2'
                            onClick={handleH2}
                        />
                        <ToolbarButton
                            icon={<Heading3 className='h-4 w-4' />}
                            label='Heading 3'
                            onClick={handleH3}
                        />
                    </div>

                    <div className='flex items-center gap-0.5 border-r pr-2'>
                        <ToolbarButton
                            icon={<List className='h-4 w-4' />}
                            label='Bullet List'
                            onClick={handleBulletList}
                        />
                        <ToolbarButton
                            icon={<ListOrdered className='h-4 w-4' />}
                            label='Numbered List'
                            onClick={handleNumberList}
                        />
                        <ToolbarButton
                            icon={<Quote className='h-4 w-4' />}
                            label='Quote'
                            onClick={handleQuote}
                        />
                    </div>

                    <div className='flex items-center gap-0.5'>
                        <ToolbarButton
                            icon={<Link2 className='h-4 w-4' />}
                            label='Link'
                            onClick={handleLink}
                        />
                        <ToolbarButton
                            icon={<ImageIcon className='h-4 w-4' />}
                            label='Image'
                            onClick={handleImage}
                        />
                    </div>
                </div>
            )}

            {/* Editor Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
                {!readOnly && (
                    <div className='border-b border-border px-4'>
                        <TabsList className='h-10 bg-transparent'>
                            <TabsTrigger value='write' className='text-sm'>
                                Write
                            </TabsTrigger>
                            <TabsTrigger value='preview' className='text-sm'>
                                Preview
                            </TabsTrigger>
                        </TabsList>
                    </div>
                )}

                {/* Write Tab */}
                <TabsContent value='write' className='m-0'>
                    <Textarea
                        ref={(ref) => {
                            if (ref) textareaRef; // Store ref
                        }}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        readOnly={readOnly}
                        className='min-h-[400px] resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0'
                        style={{ minHeight: `${minHeight}px` }}
                    />
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value='preview' className='m-0 p-6' style={{ minHeight: `${minHeight}px` }}>
                    {renderPreview()}
                </TabsContent>
            </Tabs>

            {/* Character Count */}
            <div className='flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground'>
                <span>Markdown supported</span>
                <span>{value.length} characters</span>
            </div>
        </div>
    );
};

// =============================================
// Export Default
// =============================================

export default RichTextEditor;
