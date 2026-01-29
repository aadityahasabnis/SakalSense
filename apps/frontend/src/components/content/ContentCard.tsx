'use client';
// =============================================
// ContentCard - Card component for browsing content
// =============================================

import Link from 'next/link';

import { Calendar, Eye, Heart, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CONTENT_TYPE_LABELS,
    type ContentType,
    DIFFICULTY_COLORS,
    DIFFICULTY_LABELS,
    type DifficultyType,
} from '@/constants/content.constants';
import { cn } from '@/lib/utils';
import { type IContentListItem } from '@/types/content.types';

interface IContentCardProps {
    content: IContentListItem;
    variant?: 'default' | 'compact' | 'featured';
}

export const ContentCard = ({ content, variant = 'default' }: IContentCardProps) => {
    const isCompact = variant === 'compact';
    const isFeatured = variant === 'featured';

    return (
        <Link href={`/content/${content.slug}`}>
            <Card
                className={cn(
                    'group h-full overflow-hidden transition-all hover:shadow-lg',
                    isFeatured && 'border-primary'
                )}
            >
                {/* Thumbnail */}
                {!isCompact && content.thumbnailUrl && (
                    <div className='relative aspect-video w-full overflow-hidden bg-muted'>
                        <img
                            src={content.thumbnailUrl}
                            alt={content.title}
                            className='h-full w-full object-cover transition-transform group-hover:scale-105'
                        />
                        <div className='absolute left-3 top-3'>
                            <Badge variant='secondary' className='bg-background/80 backdrop-blur-sm'>
                                {CONTENT_TYPE_LABELS[content.type as ContentType]}
                            </Badge>
                        </div>
                    </div>
                )}

                <CardHeader className={cn(isCompact && 'pb-3')}>
                    <div className='mb-2 flex items-center gap-2'>
                        {isCompact && (
                            <Badge variant='outline' className='text-xs'>
                                {CONTENT_TYPE_LABELS[content.type as ContentType]}
                            </Badge>
                        )}
                        <Badge className={cn('text-xs', DIFFICULTY_COLORS[content.difficulty as DifficultyType])}>
                            {DIFFICULTY_LABELS[content.difficulty as DifficultyType]}
                        </Badge>
                    </div>

                    <CardTitle className={cn('line-clamp-2 group-hover:text-primary', isFeatured && 'text-xl')}>
                        {content.title}
                    </CardTitle>

                    {(content.description ?? content.excerpt) && (
                        <CardDescription className={cn('line-clamp-2', isCompact && 'text-xs')}>
                            {content.description ?? content.excerpt}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent className={cn(isCompact && 'pb-3 pt-0')}>
                    {/* Category (if available) */}
                    {content.category && (
                        <div className='mb-3 flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                                {content.category.name}
                            </Badge>
                        </div>
                    )}

                    {/* Stats */}
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                            <Eye className='h-3 w-3' />
                            <span>{content.viewCount.toLocaleString()}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                            <Heart className='h-3 w-3' />
                            <span>{content.likeCount.toLocaleString()}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className={cn('flex items-center justify-between pt-0', isCompact && 'pb-3')}>
                    {/* Author */}
                    {content.creator && (
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <User className='h-3 w-3' />
                            <span>{content.creator.fullName}</span>
                        </div>
                    )}

                    {/* Date */}
                    {content.publishedAt && (
                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>{new Date(content.publishedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
};
