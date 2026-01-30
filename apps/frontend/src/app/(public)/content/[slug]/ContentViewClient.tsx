'use client';
// =============================================
// ContentViewClient - Public content viewer with progress tracking
// =============================================

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { ArrowLeft, Check, Clock } from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { ContentReader } from '@/components/content/ContentReader';
import { CommentSection } from '@/components/engagement/CommentSection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadingProgress, formatReadingTime } from '@/hooks/useProgress';
import { userIdAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';
import { getContentBySlug, getRelatedContent, recordContentView } from '@/server/actions/content/publicContentActions';

interface IContentViewClientProps {
    slug: string;
}

export const ContentViewClient = ({ slug }: IContentViewClientProps) => {
    const userId = useAtomValue(userIdAtom);
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [showProgressBar, setShowProgressBar] = useState(false);

    // Fetch content
    const { data: contentData, isLoading, isError } = useQuery({
        queryKey: ['content', slug],
        queryFn: () => getContentBySlug(slug, userId ?? undefined),
        staleTime: 60000,
    });

    // Fetch related content
    const { data: relatedData } = useQuery({
        queryKey: ['related-content', contentData?.data?.id],
        queryFn: () => getRelatedContent(contentData!.data!.id),
        enabled: !!contentData?.data?.id,
        staleTime: 120000,
    });

    const content = contentData?.data;
    const relatedContent = relatedData?.data ?? [];

    // Progress tracking (only for authenticated users)
    const {
        savedProgress,
        displayProgress,
        timeSpent,
        isCompleted,
    } = useReadingProgress({
        contentId: content?.id ?? '',
        containerRef: contentRef,
        enabled: !!content?.id && !!userId,
    });

    // Record view (once per page load)
    useEffect(() => {
        if (content && !viewRecorded) {
            void recordContentView(content.id, userId ?? undefined);
            setViewRecorded(true);
        }
    }, [content, userId, viewRecorded]);

    // Show/hide progress bar based on scroll
    useEffect(() => {
        const handleScroll = () => {
            setShowProgressBar(window.scrollY > 200);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <Skeleton className="mb-4 h-8 w-32" />
                    <Skeleton className="mb-8 h-64 w-full" />
                    <Skeleton className="mb-4 h-12 w-3/4" />
                    <Skeleton className="mb-4 h-6 w-full" />
                    <Skeleton className="mb-4 h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            </div>
        );
    }

    if (isError || !content) {
        return (
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
                        <p className="mb-4 text-lg font-medium text-destructive">Content not found</p>
                        <p className="mb-6 text-sm text-muted-foreground">
                            The content you&apos;re looking for doesn&apos;t exist or has been removed.
                        </p>
                        <Button onClick={() => router.push('/articles')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Browse Articles
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Fixed Progress Bar */}
            {userId && (
                <div
                    className={cn(
                        'fixed left-0 right-0 top-0 z-50 transition-transform duration-300',
                        showProgressBar ? 'translate-y-0' : '-translate-y-full'
                    )}
                >
                    <Progress value={displayProgress} className="h-1 rounded-none" />
                    <div className="flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <span className="hidden text-sm font-medium md:inline">
                                {content.title}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {timeSpent > 0 && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatReadingTime(timeSpent)}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                {isCompleted ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span className="text-emerald-600">Completed</span>
                                    </>
                                ) : (
                                    <>{displayProgress}%</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={contentRef} className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    {/* Reading Progress Indicator (for returning readers) */}
                    {userId && savedProgress > 0 && savedProgress < 100 && !isCompleted && (
                        <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium">Continue reading</p>
                                <p className="text-xs text-muted-foreground">
                                    You&apos;ve read {savedProgress}% of this article
                                </p>
                            </div>
                            <div className="w-24">
                                <Progress value={savedProgress} className="h-2" />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <ContentReader content={content} userId={userId ?? undefined} />

                    {/* Comments Section */}
                    <div className="mx-auto mt-16 max-w-4xl">
                        <CommentSection contentId={content.id} userId={userId ?? undefined} />
                    </div>

                    {/* Related Content */}
                    {relatedContent.length > 0 && (
                        <div className="mt-16">
                            <h2 className="mb-6 text-2xl font-bold">Related Content</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {relatedContent.map((item) => (
                                    <ContentCard key={item.id} content={item} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
