import { Skeleton } from '@/components/ui/skeleton';

export const ContentListSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between"><div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div><Skeleton className="h-10 w-32" /></div>
        <div className="flex gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /></div>
        <div className="rounded-md border">
            <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-6 w-20" /><Skeleton className="h-8 w-8 rounded" /></div>
                ))}
            </div>
        </div>
    </div>
);
