// =============================================
// Pagination Component - Reusable pagination UI
// =============================================

'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================
// Types
// =============================================

interface IPaginationProps {
    page: number;
    totalPages: number;
    total?: number;
    limit?: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    showInfo?: boolean;
    showPageNumbers?: boolean;
    showFirstLast?: boolean;
    maxPageButtons?: number;
    size?: 'sm' | 'md';
    className?: string;
}

// =============================================
// Pagination Component
// =============================================

export const Pagination = ({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
    disabled = false,
    showInfo = false,
    showPageNumbers = false,
    showFirstLast = false,
    maxPageButtons = 5,
    size = 'md',
    className,
}: IPaginationProps) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = (): number[] => {
        const pages: number[] = [];

        if (totalPages <= maxPageButtons) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (page <= Math.ceil(maxPageButtons / 2)) {
            for (let i = 1; i <= maxPageButtons; i++) {
                pages.push(i);
            }
        } else if (page >= totalPages - Math.floor(maxPageButtons / 2)) {
            for (let i = totalPages - maxPageButtons + 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const half = Math.floor(maxPageButtons / 2);
            for (let i = page - half; i <= page + half; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const buttonSize = size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm';
    const pageButtonSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            {showInfo && total !== undefined && limit !== undefined && (
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
            )}

            <div className="flex items-center gap-1 ml-auto">
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="icon"
                        className={pageButtonSize}
                        onClick={() => onPageChange(1)}
                        disabled={page <= 1 || disabled}
                    >
                        <ChevronsLeft className={iconSize} />
                        <span className="sr-only">First page</span>
                    </Button>
                )}

                <Button
                    variant="outline"
                    className={buttonSize}
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1 || disabled}
                >
                    <ChevronLeft className={cn(iconSize, 'mr-1')} />
                    Previous
                </Button>

                {showPageNumbers && (
                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNum) => (
                            <Button
                                key={pageNum}
                                variant={page === pageNum ? 'default' : 'ghost'}
                                size="icon"
                                className={cn(pageButtonSize, 'p-0')}
                                onClick={() => onPageChange(pageNum)}
                                disabled={disabled}
                            >
                                {pageNum}
                            </Button>
                        ))}
                    </div>
                )}

                {!showPageNumbers && (
                    <span className="px-2 text-sm text-muted-foreground whitespace-nowrap">
                        Page {page} of {totalPages}
                    </span>
                )}

                <Button
                    variant="outline"
                    className={buttonSize}
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages || disabled}
                >
                    Next
                    <ChevronRight className={cn(iconSize, 'ml-1')} />
                </Button>

                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="icon"
                        className={pageButtonSize}
                        onClick={() => onPageChange(totalPages)}
                        disabled={page >= totalPages || disabled}
                    >
                        <ChevronsRight className={iconSize} />
                        <span className="sr-only">Last page</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

// =============================================
// Simple Pagination (compact version)
// =============================================

interface ISimplePaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
}

export const SimplePagination = ({
    page,
    totalPages,
    onPageChange,
    disabled = false,
    className,
}: ISimplePaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || disabled}
            >
                Previous
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || disabled}
            >
                Next
            </Button>
        </div>
    );
};
