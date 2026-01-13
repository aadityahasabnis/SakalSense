// Common Page Components — Reusable page elements

import { type ReactNode } from 'react';

import Link from 'next/link';

import { ArrowLeft, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Page Header
interface IPageHeaderProps { title: string; description?: string; backHref?: string; action?: { label: string; href: string; icon?: ReactNode } }
export const PageHeader = ({ title, description, backHref, action }: IPageHeaderProps) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            {backHref && <Button variant="ghost" size="icon" asChild><Link href={backHref}><ArrowLeft className="h-5 w-5" /></Link></Button>}
            <div><h1 className="text-2xl font-bold">{title}</h1>{description && <p className="text-muted-foreground">{description}</p>}</div>
        </div>
        {action && <Button asChild><Link href={action.href}>{action.icon ?? <Plus className="mr-2 h-4 w-4" />}{action.label}</Link></Button>}
    </div>
);

// Page Header Skeleton
export const PageHeaderSkeleton = ({ hasAction = false }: { hasAction?: boolean }) => (
    <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-72" /></div>
        {hasAction && <Skeleton className="h-10 w-32" />}
    </div>
);

// Empty State
interface IEmptyStateProps { title: string; description?: string; action?: { label: string; href: string } }
export const EmptyState = ({ title, description, action }: IEmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {action && <Button asChild className="mt-4"><Link href={action.href}>{action.label}</Link></Button>}
    </div>
);

// Loading Spinner
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
    return (
        <div className="flex items-center justify-center h-64">
            <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
        </div>
    );
};

// Stat Card
interface IStatCardProps { title: string; value: string | number; description?: string; icon?: ReactNode; trend?: { value: number; positive: boolean } }
export const StatCard = ({ title, value, description, icon, trend }: IStatCardProps) => (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && <div className={`mt-2 flex items-center text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>{trend.positive ? '+' : '-'}{trend.value}%</div>}
    </div>
);
