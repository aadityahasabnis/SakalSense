// =============================================
// Public Content View Page - View any published content
// Works for both authenticated and non-authenticated users
// =============================================

import { type Metadata } from 'next';
import { Suspense } from 'react';

import { ContentViewClient } from './ContentViewClient';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { getContentBySlug } from '@/server/actions/content/publicContentActions';

interface IContentPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: IContentPageProps): Promise<Metadata> {
    const { slug } = await params;
    const response = await getContentBySlug(slug);

    if (!response.success || !response.data) {
        return {
            title: 'Content Not Found | SakalSense',
        };
    }

    const content = response.data;

    return {
        title: `${content.title} | SakalSense`,
        description: content.description ?? content.excerpt ?? undefined,
        openGraph: {
            title: content.title,
            description: content.description ?? undefined,
            images: content.coverImageUrl ? [content.coverImageUrl] : content.thumbnailUrl ? [content.thumbnailUrl] : undefined,
        },
    };
}

const ContentViewSkeleton = () => (
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

export default async function ContentPage({ params }: IContentPageProps) {
    const { slug } = await params;

    return (
        <PublicLayout>
            <Suspense fallback={<ContentViewSkeleton />}>
                <ContentViewClient slug={slug} />
            </Suspense>
        </PublicLayout>
    );
}
