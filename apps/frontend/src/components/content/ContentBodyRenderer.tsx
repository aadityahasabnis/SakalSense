'use client';
// =============================================
// ContentBodyRenderer - Rich content rendering component
// Supports HTML, Markdown, and Tiptap JSON formats
// =============================================

import React, { useMemo } from 'react';

import { useAtom } from 'jotai';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    type CodeTheme,
    codeThemeAtom,
    enableCodeCopyAtom,
    fontSizeAtom,
    fontSizeClassMap,
    lineHeightAtom,
    lineHeightClassMap,
    showLineNumbersAtom,
} from '@/jotai/atoms';

// =============================================
// Types
// =============================================

// Tiptap/ProseMirror JSON format
interface ITiptapNode {
    type: string;
    content?: Array<ITiptapNode>;
    text?: string;
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
    attrs?: Record<string, unknown>;
}

interface ITiptapDocument {
    type: 'doc';
    content: Array<ITiptapNode>;
}

interface IContentBodyRendererProps {
    body: unknown;
    className?: string;
}

// =============================================
// Code Theme Styles
// =============================================

const codeThemeStyles: Record<CodeTheme, { bg: string; text: string; border: string }> = {
    'github-dark': { bg: 'bg-[#0d1117]', text: 'text-[#c9d1d9]', border: 'border-[#30363d]' },
    'github-light': { bg: 'bg-[#f6f8fa]', text: 'text-[#24292e]', border: 'border-[#e1e4e8]' },
    'dracula': { bg: 'bg-[#282a36]', text: 'text-[#f8f8f2]', border: 'border-[#44475a]' },
    'monokai': { bg: 'bg-[#272822]', text: 'text-[#f8f8f2]', border: 'border-[#3e3d32]' },
    'one-dark': { bg: 'bg-[#282c34]', text: 'text-[#abb2bf]', border: 'border-[#3e4451]' },
    'vs-code': { bg: 'bg-[#1e1e1e]', text: 'text-[#d4d4d4]', border: 'border-[#3c3c3c]' },
};

// =============================================
// Main Component
// =============================================

export const ContentBodyRenderer = ({ body, className = '' }: IContentBodyRendererProps) => {
    const [fontSize] = useAtom(fontSizeAtom);
    const [lineHeight] = useAtom(lineHeightAtom);

    const fontSizeClass = fontSizeClassMap[fontSize];
    const lineHeightClass = lineHeightClassMap[lineHeight];

    const renderedContent = useMemo(() => {
        if (!body) return null;

        // Handle string content (HTML or plain text)
        if (typeof body === 'string') {
            return <HTMLRenderer html={body} />;
        }

        // Handle Tiptap/ProseMirror JSON document
        if (isValidTiptapDocument(body)) {
            return <TiptapRenderer document={body} />;
        }

        // Handle array of blocks (custom format)
        if (Array.isArray(body)) {
            return <BlockArrayRenderer blocks={body} />;
        }

        // Fallback: render as formatted JSON
        return (
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                {JSON.stringify(body, null, 2)}
            </pre>
        );
    }, [body]);

    return (
        <div className={`content-body ${fontSizeClass} ${lineHeightClass} ${className}`}>
            {renderedContent}
        </div>
    );
};

// =============================================
// Type Guards
// =============================================

function isValidTiptapDocument(body: unknown): body is ITiptapDocument {
    return (
        typeof body === 'object' &&
        body !== null &&
        'type' in body &&
        (body as ITiptapDocument).type === 'doc' &&
        'content' in body &&
        Array.isArray((body as ITiptapDocument).content)
    );
}

// =============================================
// HTML Renderer
// =============================================

const HTMLRenderer = ({ html }: { html: string }) => {
    // Sanitization should be done server-side
    // Here we trust the content from our database
    return (
        <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

// =============================================
// Tiptap Document Renderer
// =============================================

const TiptapRenderer = ({ document }: { document: ITiptapDocument }) => {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            {document.content.map((node, index) => (
                <TiptapNodeRenderer key={index} node={node} />
            ))}
        </div>
    );
};

// =============================================
// Tiptap Node Renderer
// =============================================

const TiptapNodeRenderer = ({ node }: { node: ITiptapNode }): React.ReactElement | null => {
    switch (node.type) {
        case 'paragraph':
            return (
                <p>
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </p>
            );

        case 'heading': {
            const level = (node.attrs?.level as number) || 1;
            const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
            return (
                <HeadingTag>
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </HeadingTag>
            );
        }

        case 'text': {
            let content: React.ReactNode = node.text ?? '';

            // Apply marks (bold, italic, code, link, etc.)
            if (node.marks) {
                for (const mark of node.marks) {
                    switch (mark.type) {
                        case 'bold':
                        case 'strong':
                            content = <strong>{content}</strong>;
                            break;
                        case 'italic':
                        case 'em':
                            content = <em>{content}</em>;
                            break;
                        case 'code':
                            content = (
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                                    {content}
                                </code>
                            );
                            break;
                        case 'underline':
                            content = <u>{content}</u>;
                            break;
                        case 'strike':
                            content = <s>{content}</s>;
                            break;
                        case 'link':
                            content = (
                                <a
                                    href={(mark.attrs?.href as string) || '#'}
                                    target={(mark.attrs?.target as string) || '_blank'}
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {content}
                                </a>
                            );
                            break;
                        case 'highlight':
                            content = (
                                <mark className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
                                    {content}
                                </mark>
                            );
                            break;
                    }
                }
            }

            return <>{content}</>;
        }

        case 'codeBlock': {
            const code = node.content
                ?.filter((child) => child.type === 'text')
                .map((child) => child.text)
                .join('') ?? '';
            const language = (node.attrs?.language as string) || 'plaintext';

            return <CodeBlock code={code} language={language} />;
        }

        case 'bulletList':
            return (
                <ul className="list-disc pl-6">
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </ul>
            );

        case 'orderedList':
            return (
                <ol className="list-decimal pl-6" start={(node.attrs?.start as number) || 1}>
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </ol>
            );

        case 'listItem':
            return (
                <li>
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </li>
            );

        case 'taskList':
            return (
                <ul className="list-none space-y-1 pl-0">
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </ul>
            );

        case 'taskItem': {
            const checked = (node.attrs?.checked as boolean) || false;
            return (
                <li className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mt-1.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                        {node.content?.map((child, idx) => (
                            <TiptapNodeRenderer key={idx} node={child} />
                        ))}
                    </div>
                </li>
            );
        }

        case 'blockquote':
            return (
                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic">
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </blockquote>
            );

        case 'horizontalRule':
            return <hr className="my-6 border-muted" />;

        case 'image':
            return (
                <figure className="my-4">
                    <img
                        src={(node.attrs?.src as string) || ''}
                        alt={(node.attrs?.alt as string) || ''}
                        title={(node.attrs?.title as string) || undefined}
                        className="max-w-full rounded-lg"
                    />
                    {typeof node.attrs?.title === 'string' && node.attrs.title && (
                        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                            {node.attrs.title}
                        </figcaption>
                    )}
                </figure>
            );

        case 'table':
            return (
                <div className="my-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        {node.content?.map((child, idx) => (
                            <TiptapNodeRenderer key={idx} node={child} />
                        ))}
                    </table>
                </div>
            );

        case 'tableRow':
            return (
                <tr>
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </tr>
            );

        case 'tableCell':
            return (
                <td className="border border-border px-4 py-2">
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </td>
            );

        case 'tableHeader':
            return (
                <th className="border border-border bg-muted px-4 py-2 font-semibold">
                    {node.content?.map((child, idx) => (
                        <TiptapNodeRenderer key={idx} node={child} />
                    ))}
                </th>
            );

        case 'hardBreak':
            return <br />;

        default:
            // Fallback for unknown node types
            if (node.content) {
                return (
                    <>
                        {node.content.map((child, idx) => (
                            <TiptapNodeRenderer key={idx} node={child} />
                        ))}
                    </>
                );
            }
            return null;
    }
};

// =============================================
// Block Array Renderer (Custom Format)
// =============================================

interface IBlock {
    type: string;
    content?: unknown;
    text?: string;
    language?: string;
    level?: number;
    items?: Array<unknown>;
    src?: string;
    alt?: string;
    caption?: string;
    [key: string]: unknown;
}

const BlockArrayRenderer = ({ blocks }: { blocks: Array<unknown> }) => {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            {(blocks as Array<IBlock>).map((block, index) => (
                <BlockRenderer key={index} block={block} />
            ))}
        </div>
    );
};

const BlockRenderer = ({ block }: { block: IBlock }): React.ReactElement | null => {
    switch (block.type) {
        case 'paragraph':
        case 'p':
            return <p>{String(block.text ?? block.content ?? '')}</p>;

        case 'heading':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
            const level = block.level ?? (parseInt(block.type.slice(1)) || 2);
            const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
            return <HeadingTag>{String(block.text ?? block.content ?? '')}</HeadingTag>;
        }

        case 'code':
        case 'codeBlock':
            return (
                <CodeBlock
                    code={String(block.content ?? block.text ?? '')}
                    language={block.language ?? 'plaintext'}
                />
            );

        case 'list':
        case 'ul':
            return (
                <ul className="list-disc pl-6">
                    {(block.items as Array<string | IBlock>)?.map((item, idx) => (
                        <li key={idx}>
                            {typeof item === 'string' ? item : String(item.text ?? item.content ?? '')}
                        </li>
                    ))}
                </ul>
            );

        case 'orderedList':
        case 'ol':
            return (
                <ol className="list-decimal pl-6">
                    {(block.items as Array<string | IBlock>)?.map((item, idx) => (
                        <li key={idx}>
                            {typeof item === 'string' ? item : String(item.text ?? item.content ?? '')}
                        </li>
                    ))}
                </ol>
            );

        case 'blockquote':
        case 'quote':
            return (
                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic">
                    {String(block.text ?? block.content ?? '')}
                </blockquote>
            );

        case 'image':
        case 'img':
            return (
                <figure className="my-4">
                    <img
                        src={block.src ?? ''}
                        alt={block.alt ?? ''}
                        className="max-w-full rounded-lg"
                    />
                    {block.caption && (
                        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                            {block.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'divider':
        case 'hr':
            return <hr className="my-6 border-muted" />;

        default:
            // Render text content if available
            if (block.text || block.content) {
                return <p>{String(block.text ?? block.content ?? '')}</p>;
            }
            return null;
    }
};

// =============================================
// Code Block Component
// =============================================

interface ICodeBlockProps {
    code: string;
    language: string;
}

const CodeBlock = ({ code, language }: ICodeBlockProps) => {
    const [codeTheme] = useAtom(codeThemeAtom);
    const [showLineNumbers] = useAtom(showLineNumbersAtom);
    const [enableCodeCopy] = useAtom(enableCodeCopyAtom);
    const [copied, setCopied] = React.useState(false);

    const themeStyles = codeThemeStyles[codeTheme];
    const lines = code.split('\n');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <div className={`group relative my-4 overflow-hidden rounded-lg border ${themeStyles.border}`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-4 py-2 ${themeStyles.bg} ${themeStyles.border}`}>
                <span className={`text-xs font-medium uppercase ${themeStyles.text} opacity-60`}>
                    {language}
                </span>
                {enableCodeCopy && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100 ${themeStyles.text}`}
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="mr-1 h-3 w-3" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="mr-1 h-3 w-3" />
                                Copy
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Code Content */}
            <div className={`overflow-x-auto p-4 ${themeStyles.bg}`}>
                <pre className={`font-mono text-sm ${themeStyles.text}`}>
                    <code>
                        {showLineNumbers ? (
                            <table className="w-full">
                                <tbody>
                                    {lines.map((line, idx) => (
                                        <tr key={idx} className="leading-relaxed">
                                            <td className="select-none pr-4 text-right opacity-40">
                                                {idx + 1}
                                            </td>
                                            <td className="whitespace-pre">{line || ' '}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            lines.map((line, idx) => (
                                <div key={idx} className="leading-relaxed">
                                    {line || ' '}
                                </div>
                            ))
                        )}
                    </code>
                </pre>
            </div>
        </div>
    );
};

// =============================================
// Export Individual Components for Flexibility
// =============================================

export { CodeBlock, HTMLRenderer, TiptapRenderer, BlockArrayRenderer };
