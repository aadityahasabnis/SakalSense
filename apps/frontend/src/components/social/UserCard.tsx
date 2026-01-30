'use client';
// =============================================
// UserCard - Display user info with follow button
// =============================================

import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

import { FollowButton } from './FollowButton';

interface IUserCardProps {
    user: {
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
        bio?: string | null;
        isFollowing?: boolean;
    };
    showFollowButton?: boolean;
    currentUserId?: string;
}

export const UserCard = ({
    user,
    showFollowButton = true,
    currentUserId,
}: IUserCardProps) => {
    const isOwnProfile = currentUserId === user.id;
    const initials = user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <Card className='transition-shadow hover:shadow-md'>
            <CardContent className='flex items-center gap-4 p-4'>
                {/* Avatar */}
                <Link href={`/user/${user.username || user.id}`}>
                    <Avatar className='h-12 w-12'>
                        <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                        <AvatarFallback className='bg-primary/10 text-primary'>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                {/* User Info */}
                <div className='flex-1 min-w-0'>
                    <Link
                        href={`/user/${user.username || user.id}`}
                        className='font-medium hover:text-primary hover:underline'
                    >
                        {user.fullName}
                    </Link>
                    {user.username && (
                        <p className='text-sm text-muted-foreground'>@{user.username}</p>
                    )}
                    {user.bio && (
                        <p className='text-sm text-muted-foreground line-clamp-1 mt-1'>
                            {user.bio}
                        </p>
                    )}
                </div>

                {/* Follow Button */}
                {showFollowButton && !isOwnProfile && (
                    <FollowButton
                        userId={user.id}
                        initialIsFollowing={user.isFollowing}
                        size='sm'
                    />
                )}
            </CardContent>
        </Card>
    );
};
