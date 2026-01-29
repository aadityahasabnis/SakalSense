'use client';
// =============================================
// ContentReader - Rich content display component
// =============================================

import { useEffect, useState } from 'react';

import { Clock, Eye, Share2, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookmarkButton } from '@/components/engagement/BookmarkButton';
import { LikeButton } from '@/components/engagement/LikeButton';
import {
    CONTENT_TYPE_LABELS,
    DIFFICULTY_COLORS,
    DIFFICULTY_LABELS,
    type ContentType,
    type DifficultyType,
} from '@/constants/content.constants';
import { type IContentWithRelations } from '@/types/content.types';

interface IContentReaderProps {
    content: IContentWithRelations;
    userId?: string;
}

export const ContentReader = ({ content, userId }: IContentReaderProps) => {
    const [readingTime, setReadingTime] = useState(0);

    // Calculate reading time
    useEffect(() => {
        if (content.body) {
            const text = JSON.stringify(content.body);
            const words = text.split(/\s+/).length;
            const minutes = Math.ceil(words / 200); // Average reading speed
            setReadingTime(minutes);
        }
    }, [content.body]);

    return (
        <article className='mx-auto max-w-4xl'>
            {/* Hero Section */}
            {content.coverImageUrl && (
                <div className='relative mb-8 aspect-video w-full overflow-hidden rounded-lg'>
                    <img
                        src={content.coverImageUrl}
                        alt={content.title}
                        className='h-full w-full object-cover'
                    />
                </div>
            )}

            {/* Header */}
            <header className='mb-8'>
                {/* Meta Info */}
                <div className='mb-4 flex flex-wrap items-center gap-3'>
                    <Badge variant='secondary'>
                        {CONTENT_TYPE_LABELS[content.type as ContentType]}
                    </Badge>
                    <Badge className={DIFFICULTY_COLORS[content.difficulty as DifficultyType]}>
                        {DIFFICULTY_LABELS[content.difficulty as DifficultyType]}
                    </Badge>
                    {content.category && (
                        <Badge variant='outline'>{content.category.name}</Badge>
                    )}
                </div>

                {/* Title */}
                <h1 className='mb-4 text-4xl font-bold leading-tight lg:text-5xl'>
                    {content.title}
                </h1>

                {/* Description */}
                {content.description && (
                    <p className='mb-6 text-xl text-muted-foreground'>
                        {content.description}
                    </p>
                )}

                {/* Author & Stats */}
                <div className='flex flex-wrap items-center gap-6 text-sm text-muted-foreground'>
                    {/* Author */}
                    <div className='flex items-center gap-2'>
                        {content.creator.avatarLink ? (
                            <img
                                src={content.creator.avatarLink}
                                alt={content.creator.fullName}
                                className='h-10 w-10 rounded-full'
                            />
                        ) : (
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
                                <User className='h-5 w-5' />
                            </div>
                        )}
                        <div>
                            <p className='font-medium text-foreground'>
                                {content.creator.fullName}
                            </p>
                            {content.publishedAt && (
                                <p className='text-xs'>
                                    {new Date(content.publishedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator orientation='vertical' className='h-10' />

                    {/* Reading Time */}
                    {readingTime > 0 && (
                        <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            <span>{readingTime} min read</span>
                        </div>
                    )}

                    {/* Views */}
                    <div className='flex items-center gap-1'>
                        <Eye className='h-4 w-4' />
                        <span>{content.viewCount.toLocaleString()} views</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-6 flex flex-wrap items-center gap-3'>
                    <LikeButton contentId={content.id} variant='default' size='sm' />
                    <BookmarkButton contentId={content.id} variant='outline' size='sm' showLabel />
                    <Button variant='outline' size='sm'>
                        <Share2 className='mr-2 h-4 w-4' />
                        Share
                    </Button>
                </div>
            </header>

            <Separator className='my-8' />

            {/* Topics */}
            {content.topics && content.topics.length > 0 && (
                <div className='mb-8'>
                    <p className='mb-2 text-sm font-medium'>Topics:</p>
                    <div className='flex flex-wrap gap-2'>
                        {content.topics.map((topic) => (
                            <Badge key={topic.id} variant='secondary'>
                                {topic.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className='prose prose-slate dark:prose-invert max-w-none'>
                {content.body ? (
                    <ContentBodyRenderer body={content.body} />
                ) : (
                    <p className='text-muted-foreground'>No content available.</p>
                )}
            </div>

            {/* Source Code Link */}
            {content.sourceCodeUrl && (
                <div className='mt-8 rounded-lg border bg-muted/50 p-4'>
                    <p className='mb-2 font-medium'>Source Code</p>
                    <a
                        href={content.sourceCodeUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline'
                    >
                        {content.sourceCodeUrl}
                    </a>
                </div>
            )}

            <Separator className='my-12' />

            {/* Footer Actions */}
            <div className='flex items-center justify-between'>
                <LikeButton contentId={content.id} variant='default' size='default' />
                <Button variant='outline'>
                    <Share2 className='mr-2 h-4 w-4' />
                    Share
                </Button>
            </div>
        </article>
    );
};

// Simple content body renderer (can be enhanced with proper rich text editor)
const ContentBodyRenderer = ({ body }: { body: unknown }) => {
    // If body is stored as HTML string
    if (typeof body === 'string') {
        return <div dangerouslySetInnerHTML={{ __html: body }} />;
    }

    // If body is stored as JSON (e.g., from a rich text editor)
    if (typeof body === 'object' && body !== null) {
        // Convert to readable format - this is a placeholder
        // In production, use a proper renderer like TipTap, Slate, or ProseMirror
        return (
            <div className='whitespace-pre-wrap'>
                {JSON.stringify(body, null, 2)}
            </div>
        );
    }

    return null;
};
