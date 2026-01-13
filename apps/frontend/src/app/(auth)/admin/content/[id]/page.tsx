import { Suspense } from 'react';
import { ContentViewClient } from './ContentViewClient';
import { Skeleton } from '@/components/ui/skeleton';

interface IViewPageProps { params: Promise<{ id: string }> }

export const metadata = { title: 'View Content | SakalSense Admin', description: 'View content details' };

const ContentViewSkeleton = () => <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /><Skeleton className="h-64 w-full" /></div>;

const ViewContentPage = async ({ params }: IViewPageProps) => {
    const { id } = await params;
    return <Suspense fallback={<ContentViewSkeleton />}><ContentViewClient contentId={id} /></Suspense>;
};

export default ViewContentPage;
