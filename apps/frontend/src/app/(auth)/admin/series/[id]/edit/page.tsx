import { Suspense } from 'react';

import { SeriesFormClient } from '../../SeriesFormClient';

import { Skeleton } from '@/components/ui/skeleton';

interface IEditPageProps { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Series | SakalSense Admin', description: 'Edit series information' };

const EditSeriesSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
    </div>
);

const EditSeriesPage = async ({ params }: IEditPageProps) => {
    const { id } = await params;
    return (
        <Suspense fallback={<EditSeriesSkeleton />}>
            <SeriesFormClient mode="edit" seriesId={id} />
        </Suspense>
    );
};

export default EditSeriesPage;
