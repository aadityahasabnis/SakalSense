// =============================================
// LoadMoreButton Component - Infinite scroll trigger
// =============================================

'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ILoadMoreButtonProps {
    onClick: () => void;
    loading?: boolean;
    hasMore?: boolean;
    loadingText?: string;
    buttonText?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
    fullWidth?: boolean;
}

export const LoadMoreButton = ({
    onClick,
    loading = false,
    hasMore = true,
    loadingText = 'Loading...',
    buttonText = 'Load More',
    variant = 'outline',
    size = 'default',
    className,
    fullWidth = false,
}: ILoadMoreButtonProps) => {
    if (!hasMore) return null;

    return (
        <div className={cn('flex justify-center p-4', className)}>
            <Button
                variant={variant}
                size={size}
                onClick={onClick}
                disabled={loading}
                className={cn(fullWidth && 'w-full')}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText}
                    </>
                ) : (
                    buttonText
                )}
            </Button>
        </div>
    );
};

// =============================================
// LoadingOverlay - For loading states
// =============================================

interface ILoadingOverlayProps {
    show: boolean;
    message?: string;
    className?: string;
}

export const LoadingOverlay = ({ show, message, className }: ILoadingOverlayProps) => {
    if (!show) return null;

    return (
        <div
            className={cn(
                'absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10',
                className
            )}
        >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </div>
    );
};

// =============================================
// InlineLoader - For inline loading states
// =============================================

interface IInlineLoaderProps {
    loading: boolean;
    children: React.ReactNode;
    className?: string;
}

export const InlineLoader = ({ loading, children, className }: IInlineLoaderProps) => {
    if (loading) {
        return (
            <span className={cn('inline-flex items-center gap-2', className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
            </span>
        );
    }

    return <>{children}</>;
};
