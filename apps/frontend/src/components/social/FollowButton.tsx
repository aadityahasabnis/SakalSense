'use client';
// =============================================
// FollowButton - Follow/Unfollow user button
// =============================================

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    checkIsFollowing,
    followUser,
    unfollowUser,
} from '@/server/actions/social/socialActions';

interface IFollowButtonProps {
    userId: string;
    initialIsFollowing?: boolean;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    variant?: 'default' | 'outline' | 'ghost';
    showIcon?: boolean;
    className?: string;
}

export const FollowButton = ({
    userId,
    initialIsFollowing = false,
    size = 'sm',
    variant = 'default',
    showIcon = true,
    className = '',
}: IFollowButtonProps) => {
    const queryClient = useQueryClient();
    const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

    // Check current follow status
    const { data: followStatus } = useQuery({
        queryKey: ['follow-status', userId],
        queryFn: () => checkIsFollowing(userId),
        initialData: { success: true, isFollowing: initialIsFollowing },
        staleTime: 30000,
    });

    const isFollowing = optimisticFollowing ?? followStatus?.isFollowing ?? false;

    // Follow mutation
    const followMutation = useMutation({
        mutationFn: () => followUser(userId),
        onMutate: () => {
            setOptimisticFollowing(true);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
            queryClient.invalidateQueries({ queryKey: ['follow-stats'] });
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
        },
        onError: () => {
            setOptimisticFollowing(null);
        },
        onSettled: () => {
            setOptimisticFollowing(null);
        },
    });

    // Unfollow mutation
    const unfollowMutation = useMutation({
        mutationFn: () => unfollowUser(userId),
        onMutate: () => {
            setOptimisticFollowing(false);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
            queryClient.invalidateQueries({ queryKey: ['follow-stats'] });
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
        },
        onError: () => {
            setOptimisticFollowing(null);
        },
        onSettled: () => {
            setOptimisticFollowing(null);
        },
    });

    const isLoading = followMutation.isPending || unfollowMutation.isPending;

    const handleClick = () => {
        if (isLoading) return;

        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    return (
        <Button
            size={size}
            variant={isFollowing ? 'outline' : variant}
            onClick={handleClick}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
                <>
                    {showIcon && (
                        isFollowing ? (
                            <UserCheck className='mr-1 h-4 w-4' />
                        ) : (
                            <UserPlus className='mr-1 h-4 w-4' />
                        )
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                </>
            )}
        </Button>
    );
};
