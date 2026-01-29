'use client';
// =============================================
// ContentViewClient - Public content viewer
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { ContentReader } from '@/components/content/ContentReader';
import { CommentSection } from '@/components/engagement/CommentSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getContentBySlug, getRelatedContent, recordContentView } from '@/server/actions/content/publicContentActions';

interface IContentViewClientProps {
    slug: string;
    userId?: string;
}

export const ContentViewClient = ({ slug, userId }: IContentViewClientProps) => {
    const router = useRouter();
    const [viewRecorded, setViewRecorded] = useState(false);

    // Fetch content
    const { data: contentData, isLoading, isError } = useQuery({
        queryKey: ['content', slug],
        queryFn: () => getContentBySlug(slug, userId),
        staleTime: 60000, // 1 minute
    });

    // Fetch related content
    const { data: relatedData } = useQuery({
        queryKey: ['related-content', contentData?.data?.id],
        queryFn: () => getRelatedContent(contentData!.data!.id),
        enabled: !!contentData?.data?.id,
        staleTime: 120000, // 2 minutes
    });

    const content = contentData?.data;
    const relatedContent = relatedData?.data ?? [];

    // Record view (once per page load)
    useEffect(() => {
        if (content && !viewRecorded) {
            void recordContentView(content.id, userId);
            setViewRecorded(true);
        }
    }, [content, userId, viewRecorded]);

    if (isLoading) {
        return (
            <div className='min-h-screen bg-background'>
                <div className='mx-auto max-w-4xl px-4 py-8'>
                    <Skeleton className='mb-4 h-8 w-32' />
                    <Skeleton className='mb-8 h-64 w-full' />
                    <Skeleton className='mb-4 h-12 w-3/4' />
                    <Skeleton className='mb-4 h-6 w-full' />
                    <Skeleton className='mb-4 h-6 w-full' />
                    <Skeleton className='h-6 w-2/3' />
                </div>
            </div>
        );
    }

    if (isError || !content) {
        return (
            <div className='min-h-screen bg-background'>
                <div className='mx-auto max-w-4xl px-4 py-8'>
                    <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center'>
                        <p className='mb-4 text-lg font-medium text-destructive'>Content not found</p>
                        <p className='mb-6 text-sm text-muted-foreground'>
                            The content you're looking for doesn't exist or has been removed.
                        </p>
                        <Button onClick={() => router.push('/explore')}>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Explore
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <div className='mx-auto max-w-7xl px-4 py-8'>
                {/* Back Button */}
                <div className='mb-6'>
                    <Button variant='ghost' size='sm' asChild>
                        <Link href='/explore'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Explore
                        </Link>
                    </Button>
                </div>

                {/* Content */}
                <ContentReader content={content} userId={userId} />

                {/* Comments Section */}
                <div className='mx-auto mt-16 max-w-4xl'>
                    <CommentSection contentId={content.id} userId={userId} />
                </div>

                {/* Related Content */}
                {relatedContent.length > 0 && (
                    <div className='mt-16'>
                        <h2 className='mb-6 text-2xl font-bold'>Related Content</h2>
                        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                            {relatedContent.map((item) => (
                                <ContentCard key={item.id} content={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
