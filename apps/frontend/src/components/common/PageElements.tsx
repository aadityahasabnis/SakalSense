// =============================================
// Common Page Components - Reusable UI elements
// =============================================
// Centralized components for consistent UX across the platform

import { type ReactNode, type ComponentType } from 'react';

import Link from 'next/link';

import { ArrowLeft, Plus, Inbox, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// =============================================
// Page Header
// =============================================

interface IPageHeaderProps {
    title: string;
    description?: string;
    backHref?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: ReactNode;
        variant?: 'default' | 'outline' | 'secondary';
    };
    badge?: ReactNode;
}

export const PageHeader = ({ title, description, backHref, action, badge }: IPageHeaderProps) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            {backHref && (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={backHref}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            )}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {badge}
                </div>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
        </div>
        {action && (
            action.href ? (
                <Button variant={action.variant ?? 'default'} asChild>
                    <Link href={action.href}>
                        {action.icon ?? <Plus className="mr-2 h-4 w-4" />}
                        {action.label}
                    </Link>
                </Button>
            ) : (
                <Button variant={action.variant ?? 'default'} onClick={action.onClick}>
                    {action.icon ?? <Plus className="mr-2 h-4 w-4" />}
                    {action.label}
                </Button>
            )
        )}
    </div>
);

export const PageHeaderSkeleton = ({ hasAction = false }: { hasAction?: boolean }) => (
    <div className="flex items-center justify-between">
        <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
        </div>
        {hasAction && <Skeleton className="h-10 w-32" />}
    </div>
);

// =============================================
// Empty State
// =============================================

type EmptyStateSize = 'sm' | 'md' | 'lg';
type EmptyStateVariant = 'default' | 'card' | 'dashed';

interface IEmptyStateProps {
    icon?: LucideIcon | ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        variant?: 'default' | 'outline' | 'secondary';
    };
    variant?: EmptyStateVariant;
    size?: EmptyStateSize;
    className?: string;
}

const emptySizeClasses: Record<EmptyStateSize, { icon: string; padding: string; title: string; desc: string }> = {
    sm: { icon: 'h-8 w-8', padding: 'py-6', title: 'text-base', desc: 'text-xs' },
    md: { icon: 'h-12 w-12', padding: 'py-12', title: 'text-lg', desc: 'text-sm' },
    lg: { icon: 'h-16 w-16', padding: 'py-16', title: 'text-xl', desc: 'text-base' },
};

export const EmptyState = ({
    icon: Icon = Inbox,
    title,
    description,
    action,
    variant = 'default',
    size = 'md',
    className,
}: IEmptyStateProps) => {
    const sizeStyles = emptySizeClasses[size];

    const content = (
        <div className={cn('flex flex-col items-center justify-center text-center', sizeStyles.padding, className)}>
            <div className="mb-4 rounded-full bg-muted p-4">
                <Icon className={cn('text-muted-foreground', sizeStyles.icon)} />
            </div>
            <h3 className={cn('mb-2 font-semibold', sizeStyles.title)}>{title}</h3>
            {description && (
                <p className={cn('max-w-sm text-muted-foreground', sizeStyles.desc)}>{description}</p>
            )}
            {action && (
                action.href ? (
                    <Button className="mt-4" variant={action.variant} asChild>
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ) : (
                    <Button className="mt-4" variant={action.variant} onClick={action.onClick}>
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );

    if (variant === 'card') {
        return (
            <Card className={className}>
                <CardContent className="p-0">{content}</CardContent>
            </Card>
        );
    }

    if (variant === 'dashed') {
        return (
            <div className={cn('rounded-lg border border-dashed bg-muted/50', className)}>
                {content}
            </div>
        );
    }

    return content;
};

// =============================================
// Loading Spinner
// =============================================

interface ILoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullHeight?: boolean;
    className?: string;
}

const spinnerSizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const LoadingSpinner = ({ size = 'md', fullHeight = true, className }: ILoadingSpinnerProps) => (
    <div className={cn('flex items-center justify-center', fullHeight && 'h-64', className)}>
        <div className={cn('animate-spin rounded-full border-2 border-primary border-t-transparent', spinnerSizeClasses[size])} />
    </div>
);

// =============================================
// Stat Card
// =============================================

type StatCardVariant = 'default' | 'success' | 'warning' | 'info' | 'highlight' | 'danger';
type StatCardSize = 'sm' | 'md' | 'lg';

interface IStatCardProps {
    icon?: ReactNode;
    label: string;
    value: string | number;
    suffix?: string;
    subtitle?: string;
    loading?: boolean;
    variant?: StatCardVariant;
    trend?: { value: number; positive: boolean };
    size?: StatCardSize;
    className?: string;
}

const statVariantStyles: Record<StatCardVariant, string> = {
    default: 'bg-card',
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    highlight: 'border-orange-500/30 bg-orange-500/5',
    danger: 'bg-red-500/10 border-red-500/20',
};

const statSizeStyles: Record<StatCardSize, { card: string; icon: string; iconBox: string; value: string; label: string }> = {
    sm: { card: 'p-3', icon: 'h-4 w-4', iconBox: 'h-8 w-8', value: 'text-lg', label: 'text-xs' },
    md: { card: 'p-4', icon: 'h-5 w-5', iconBox: 'h-9 w-9', value: 'text-xl', label: 'text-sm' },
    lg: { card: 'p-6', icon: 'h-6 w-6', iconBox: 'h-12 w-12', value: 'text-2xl', label: 'text-base' },
};

export const StatCard = ({
    icon,
    label,
    value,
    suffix,
    subtitle,
    loading = false,
    variant = 'default',
    trend,
    size = 'md',
    className,
}: IStatCardProps) => {
    const sizeStyle = statSizeStyles[size];

    return (
        <Card className={cn(statVariantStyles[variant], className)}>
            <CardContent className={cn('flex items-center gap-3', sizeStyle.card)}>
                {icon && (
                    <div
                        className={cn(
                            'flex items-center justify-center rounded-lg',
                            sizeStyle.iconBox,
                            variant === 'highlight'
                                ? 'bg-orange-500/10 text-orange-500'
                                : variant === 'success'
                                    ? 'bg-green-500/10 text-green-600'
                                    : variant === 'danger'
                                        ? 'bg-red-500/10 text-red-600'
                                        : variant === 'warning'
                                            ? 'bg-yellow-500/10 text-yellow-600'
                                            : variant === 'info'
                                                ? 'bg-blue-500/10 text-blue-600'
                                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <Skeleton className="mb-1 h-6 w-16" />
                    ) : (
                        <p className={cn('font-semibold leading-none', sizeStyle.value)}>
                            {value}
                            {suffix && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span>
                            )}
                        </p>
                    )}
                    <p className={cn('text-muted-foreground', sizeStyle.label)}>{label}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
                    {trend && (
                        <div
                            className={cn(
                                'mt-1 flex items-center text-xs font-medium',
                                trend.positive ? 'text-green-600' : 'text-red-600'
                            )}
                        >
                            {trend.positive ? '+' : ''}{trend.value}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export const StatCardSkeleton = ({ size = 'md' }: { size?: StatCardSize }) => {
    const sizeStyle = statSizeStyles[size];
    return (
        <Card>
            <CardContent className={cn('flex items-center gap-3', sizeStyle.card)}>
                <Skeleton className={cn('rounded-lg', sizeStyle.iconBox)} />
                <div className="flex-1">
                    <Skeleton className="mb-1 h-6 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Stats Grid
// =============================================

interface IStatsGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}

export const StatsGrid = ({ children, columns = 4, className }: IStatsGridProps) => {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>;
};

export const StatsGridSkeleton = ({ count = 4, columns = 4 }: { count?: number; columns?: 2 | 3 | 4 }) => (
    <StatsGrid columns={columns}>
        {Array.from({ length: count }).map((_, i) => (
            <StatCardSkeleton key={i} />
        ))}
    </StatsGrid>
);

// =============================================
// Section Header
// =============================================

interface ISectionHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    className?: string;
}

export const SectionHeader = ({ title, description, action, className }: ISectionHeaderProps) => (
    <div className={cn('flex items-center justify-between', className)}>
        <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && (
            action.href ? (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={action.href}>{action.label}</Link>
                </Button>
            ) : (
                <Button variant="ghost" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )
        )}
    </div>
);

// =============================================
// Divider
// =============================================

interface IDividerProps {
    className?: string;
    label?: string;
}

export const Divider = ({ className, label }: IDividerProps) => {
    if (label) {
        return (
            <div className={cn('relative', className)}>
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{label}</span>
                </div>
            </div>
        );
    }
    return <div className={cn('border-t', className)} />;
};
