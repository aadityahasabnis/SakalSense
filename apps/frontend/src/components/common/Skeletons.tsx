// =============================================
// Skeleton Presets - Common loading skeletons
// =============================================

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =============================================
// Profile Skeleton
// =============================================

interface IProfileSkeletonProps {
    showTabs?: boolean;
    className?: string;
}

export const ProfileSkeleton = ({ showTabs = true, className }: IProfileSkeletonProps) => (
    <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
            ))}
        </div>

        {/* Tabs */}
        {showTabs && <Skeleton className="h-10 w-80" />}

        {/* Content */}
        <Skeleton className="h-64 w-full" />
    </div>
);

// =============================================
// Card Grid Skeleton
// =============================================

interface ICardGridSkeletonProps {
    count?: number;
    columns?: 1 | 2 | 3 | 4;
    cardHeight?: string;
    className?: string;
}

export const CardGridSkeleton = ({
    count = 6,
    columns = 3,
    cardHeight = 'h-48',
    className,
}: ICardGridSkeletonProps) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={cardHeight} />
            ))}
        </div>
    );
};

// =============================================
// User Card Skeleton
// =============================================

interface IUserCardSkeletonProps {
    count?: number;
    columns?: 2 | 3 | 4;
    className?: string;
}

export const UserCardSkeleton = ({ count = 6, columns = 3, className }: IUserCardSkeletonProps) => {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                        <div className="mt-4 flex gap-4">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// =============================================
// Table Skeleton
// =============================================

interface ITableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
    className?: string;
}

export const TableSkeleton = ({
    rows = 5,
    columns = 4,
    showHeader = true,
    className,
}: ITableSkeletonProps) => (
    <div className={cn('space-y-3', className)}>
        {showHeader && (
            <div className="flex gap-4 border-b pb-3">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
        )}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-8 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

// =============================================
// Feed Skeleton
// =============================================

interface IFeedSkeletonProps {
    count?: number;
    className?: string;
}

export const FeedSkeleton = ({ count = 5, className }: IFeedSkeletonProps) => (
    <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

// =============================================
// Stats Skeleton
// =============================================

interface IStatsSkeletonProps {
    count?: number;
    columns?: 2 | 3 | 4;
    className?: string;
}

export const StatsSkeleton = ({ count = 4, columns = 4, className }: IStatsSkeletonProps) => {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="flex items-center gap-3 p-4">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="mb-1 h-6 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// =============================================
// Content Card Skeleton
// =============================================

interface IContentCardSkeletonProps {
    variant?: 'horizontal' | 'vertical';
    showImage?: boolean;
    className?: string;
}

export const ContentCardSkeleton = ({
    variant = 'vertical',
    showImage = true,
    className,
}: IContentCardSkeletonProps) => {
    if (variant === 'horizontal') {
        return (
            <Card className={className}>
                <CardContent className="flex gap-4 p-4">
                    {showImage && <Skeleton className="h-24 w-32 shrink-0 rounded" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            {showImage && <Skeleton className="h-40 w-full rounded-t-lg rounded-b-none" />}
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// List Skeleton
// =============================================

interface IListSkeletonProps {
    count?: number;
    showAvatar?: boolean;
    showAction?: boolean;
    className?: string;
}

export const ListSkeleton = ({
    count = 5,
    showAvatar = true,
    showAction = false,
    className,
}: IListSkeletonProps) => (
    <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
                {showAvatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
                {showAction && <Skeleton className="h-8 w-20" />}
            </div>
        ))}
    </div>
);
