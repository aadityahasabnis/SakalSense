import { Suspense } from 'react';

import { ContentViewClient } from './ContentViewClient';

import { Skeleton } from '@/components/ui/skeleton';
import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

interface IContentPageProps {
    params: Promise<{ slug: string }>;
}

export const metadata = {
    title: 'Content | SakalSense',
    description: 'Read and learn from our community content',
};

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

const ContentPage = async ({ params }: IContentPageProps) => {
    const { slug } = await params;
    
    // Get current user if logged in (optional - content is public)
    const user = await getCurrentUser(STAKEHOLDER.USER).catch(() => null);

    return (
        <Suspense fallback={<ContentViewSkeleton />}>
            <ContentViewClient slug={slug} userId={user?.userId} />
        </Suspense>
    );
};

export default ContentPage;
