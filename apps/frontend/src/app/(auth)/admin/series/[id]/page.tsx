import { Suspense } from 'react';

import { SeriesViewClient } from './SeriesViewClient';

import { Skeleton } from '@/components/ui/skeleton';

interface IViewPageProps { params: Promise<{ id: string }> }

export const metadata = { title: 'View Series | SakalSense Admin', description: 'View series details and manage items' };

const SeriesViewSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const ViewSeriesPage = async ({ params }: IViewPageProps) => {
    const { id } = await params;
    return (
        <Suspense fallback={<SeriesViewSkeleton />}>
            <SeriesViewClient seriesId={id} />
        </Suspense>
    );
};

export default ViewSeriesPage;
