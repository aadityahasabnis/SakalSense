// =============================================
// UserDisplay Component - Consistent user info display
// =============================================

'use client';

import Link from 'next/link';

import { Shield } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/formatters';

// =============================================
// Types
// =============================================

type UserDisplaySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IUserData {
    id: string;
    fullName: string;
    username?: string | null;
    email?: string | null;
    avatarLink?: string | null;
    isVerified?: boolean;
}

interface IUserDisplayProps {
    user: IUserData;
    size?: UserDisplaySize;
    showEmail?: boolean;
    showUsername?: boolean;
    showVerifiedBadge?: boolean;
    linkToProfile?: boolean;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
    avatarClassName?: string;
    vertical?: boolean;
}

// =============================================
// Size Configuration
// =============================================

const sizeConfig: Record<UserDisplaySize, {
    avatar: string;
    name: string;
    sub: string;
    fallbackText: string;
}> = {
    xs: { avatar: 'h-6 w-6', name: 'text-xs', sub: 'text-[10px]', fallbackText: 'text-[10px]' },
    sm: { avatar: 'h-8 w-8', name: 'text-sm', sub: 'text-xs', fallbackText: 'text-xs' },
    md: { avatar: 'h-10 w-10', name: 'text-sm', sub: 'text-xs', fallbackText: 'text-sm' },
    lg: { avatar: 'h-14 w-14', name: 'text-base', sub: 'text-sm', fallbackText: 'text-base' },
    xl: { avatar: 'h-20 w-20', name: 'text-xl', sub: 'text-base', fallbackText: 'text-xl' },
};

// =============================================
// UserDisplay Component
// =============================================

export const UserDisplay = ({
    user,
    size = 'md',
    showEmail = false,
    showUsername = false,
    showVerifiedBadge = false,
    linkToProfile = false,
    subtitle,
    action,
    className,
    avatarClassName,
    vertical = false,
}: IUserDisplayProps) => {
    const config = sizeConfig[size];
    const initials = getInitials(user.fullName);
    const profilePath = `/user/${user.username || user.id}`;

    const avatarElement = (
        <Avatar className={cn(config.avatar, 'border', avatarClassName)}>
            <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
            <AvatarFallback className={config.fallbackText}>{initials}</AvatarFallback>
        </Avatar>
    );

    const nameElement = (
        <span className={cn('font-medium leading-none', config.name)}>{user.fullName}</span>
    );

    const wrappedAvatar = linkToProfile ? (
        <Link href={profilePath} className="shrink-0">
            {avatarElement}
        </Link>
    ) : (
        <div className="shrink-0">{avatarElement}</div>
    );

    const wrappedName = linkToProfile ? (
        <Link href={profilePath} className="hover:underline">
            {nameElement}
        </Link>
    ) : (
        nameElement
    );

    if (vertical) {
        return (
            <div className={cn('flex flex-col items-center text-center gap-2', className)}>
                {wrappedAvatar}
                <div className="min-w-0">
                    <div className="flex items-center justify-center gap-1.5">
                        {wrappedName}
                        {showVerifiedBadge && user.isVerified && (
                            <Badge variant="secondary" className="h-5 gap-0.5 px-1 text-[10px]">
                                <Shield className="h-2.5 w-2.5" />
                            </Badge>
                        )}
                    </div>
                    {showUsername && user.username && (
                        <p className={cn('text-muted-foreground', config.sub)}>@{user.username}</p>
                    )}
                    {showEmail && user.email && (
                        <p className={cn('text-muted-foreground truncate', config.sub)}>{user.email}</p>
                    )}
                    {subtitle && <p className={cn('text-muted-foreground', config.sub)}>{subtitle}</p>}
                </div>
                {action}
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-3', className)}>
            {wrappedAvatar}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    {wrappedName}
                    {showVerifiedBadge && user.isVerified && (
                        <Badge variant="secondary" className="h-5 gap-0.5 px-1 text-[10px]">
                            <Shield className="h-2.5 w-2.5" />
                        </Badge>
                    )}
                </div>
                {showUsername && user.username && (
                    <p className={cn('text-muted-foreground', config.sub)}>@{user.username}</p>
                )}
                {showEmail && user.email && (
                    <p className={cn('text-muted-foreground truncate', config.sub)}>{user.email}</p>
                )}
                {subtitle && <p className={cn('text-muted-foreground', config.sub)}>{subtitle}</p>}
            </div>
            {action}
        </div>
    );
};

// =============================================
// UserDisplaySkeleton
// =============================================

interface IUserDisplaySkeletonProps {
    size?: UserDisplaySize;
    showSubtitle?: boolean;
    showAction?: boolean;
    className?: string;
}

export const UserDisplaySkeleton = ({
    size = 'md',
    showSubtitle = false,
    showAction = false,
    className,
}: IUserDisplaySkeletonProps) => {
    const config = sizeConfig[size];

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <Skeleton className={cn('rounded-full', config.avatar)} />
            <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                {showSubtitle && <Skeleton className="h-3 w-16" />}
            </div>
            {showAction && <Skeleton className="h-8 w-20" />}
        </div>
    );
};

// =============================================
// AvatarGroup - Multiple avatars stacked
// =============================================

interface IAvatarGroupProps {
    users: Array<{ id: string; fullName: string; avatarLink?: string | null }>;
    max?: number;
    size?: 'sm' | 'md';
    className?: string;
}

export const AvatarGroup = ({ users, max = 4, size = 'md', className }: IAvatarGroupProps) => {
    const displayUsers = users.slice(0, max);
    const remaining = users.length - max;
    const avatarSize = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
    const overlap = size === 'sm' ? '-ml-2' : '-ml-3';

    return (
        <div className={cn('flex items-center', className)}>
            {displayUsers.map((user, index) => (
                <Avatar
                    key={user.id}
                    className={cn(
                        avatarSize,
                        'border-2 border-background',
                        index > 0 && overlap
                    )}
                >
                    <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        avatarSize,
                        overlap,
                        'flex items-center justify-center rounded-full bg-muted border-2 border-background font-medium'
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};
