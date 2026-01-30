'use server';
// =============================================
// Social Actions - Follow/Unfollow & User Discovery
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/server/db/prisma';
import { createFollowNotification } from '@/server/actions/notifications/notificationActions';

// =============================================
// Response Types
// =============================================

interface IFollowStats {
    followers: number;
    following: number;
}

interface IFollowStatsResponse {
    success: boolean;
    data?: IFollowStats;
    error?: string;
}

interface IUserListItem {
    id: string;
    fullName: string;
    username: string | null;
    avatarLink: string | null;
    bio: string | null;
    isFollowing?: boolean;
}

interface IUserListResponse {
    success: boolean;
    data?: Array<IUserListItem>;
    total?: number;
    error?: string;
}

interface IFollowResponse {
    success: boolean;
    isFollowing?: boolean;
    error?: string;
}

// =============================================
// Follow User
// =============================================

export const followUser = async (userId: string): Promise<IFollowResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) return { success: false, error: 'Please log in to follow users' };

        if (currentUser.userId === userId) {
            return { success: false, error: 'You cannot follow yourself' };
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!targetUser) return { success: false, error: 'User not found' };

        // Check if already following
        const existingFollow = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser.userId,
                    followingId: userId,
                },
            },
        });

        if (existingFollow) {
            return { success: true, isFollowing: true };
        }

        // Create follow relationship
        await prisma.userFollow.create({
            data: {
                followerId: currentUser.userId,
                followingId: userId,
            },
        });

        // Create activity for following a user
        await prisma.activityFeed.create({
            data: {
                userId: currentUser.userId,
                type: 'FOLLOWED_USER',
                targetId: userId,
                isPublic: true,
            },
        });

        // Create notification for the followed user
        const followerInfo = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { fullName: true, username: true },
        });

        if (followerInfo) {
            await createFollowNotification(
                userId,
                followerInfo.fullName,
                followerInfo.username
            );
        }

        return { success: true, isFollowing: true };
    } catch (error) {
        console.error('followUser error:', error);
        return { success: false, error: 'Failed to follow user' };
    }
};

// =============================================
// Unfollow User
// =============================================

export const unfollowUser = async (userId: string): Promise<IFollowResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) return { success: false, error: 'Please log in' };

        // Delete follow relationship
        await prisma.userFollow.deleteMany({
            where: {
                followerId: currentUser.userId,
                followingId: userId,
            },
        });

        return { success: true, isFollowing: false };
    } catch (error) {
        console.error('unfollowUser error:', error);
        return { success: false, error: 'Failed to unfollow user' };
    }
};

// =============================================
// Toggle Follow (Convenience function)
// =============================================

export const toggleFollow = async (userId: string): Promise<IFollowResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) return { success: false, error: 'Please log in' };

        const isCurrentlyFollowing = await checkIsFollowing(userId);

        if (isCurrentlyFollowing.isFollowing) {
            return unfollowUser(userId);
        } else {
            return followUser(userId);
        }
    } catch (error) {
        console.error('toggleFollow error:', error);
        return { success: false, error: 'Failed to toggle follow' };
    }
};

// =============================================
// Check if Following User
// =============================================

export const checkIsFollowing = async (userId: string): Promise<IFollowResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) return { success: true, isFollowing: false };

        const follow = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser.userId,
                    followingId: userId,
                },
            },
        });

        return { success: true, isFollowing: !!follow };
    } catch (error) {
        console.error('checkIsFollowing error:', error);
        return { success: false, error: 'Failed to check follow status' };
    }
};

// =============================================
// Get Follow Stats for a User
// =============================================

export const getFollowStats = async (userId: string): Promise<IFollowStatsResponse> => {
    try {
        const [followers, following] = await Promise.all([
            prisma.userFollow.count({ where: { followingId: userId } }),
            prisma.userFollow.count({ where: { followerId: userId } }),
        ]);

        return { success: true, data: { followers, following } };
    } catch (error) {
        console.error('getFollowStats error:', error);
        return { success: false, error: 'Failed to fetch follow stats' };
    }
};

// =============================================
// Get User's Followers
// =============================================

export const getFollowers = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<IUserListResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);

        const [follows, total] = await Promise.all([
            prisma.userFollow.findMany({
                where: { followingId: userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.userFollow.count({ where: { followingId: userId } }),
        ]);

        // Fetch follower user details
        const followerIds = follows.map((f) => f.followerId);
        const users = await prisma.user.findMany({
            where: { id: { in: followerIds } },
            select: {
                id: true,
                fullName: true,
                username: true,
                avatarLink: true,
                bio: true,
            },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        // If current user is logged in, check which of these followers they follow
        let followingSet = new Set<string>();
        if (currentUser) {
            const userFollowing = await prisma.userFollow.findMany({
                where: {
                    followerId: currentUser.userId,
                    followingId: { in: followerIds },
                },
                select: { followingId: true },
            });
            followingSet = new Set(userFollowing.map((f) => f.followingId));
        }

        const data: IUserListItem[] = follows
            .map((f) => {
                const user = userMap.get(f.followerId);
                if (!user) return null;
                return {
                    id: user.id,
                    fullName: user.fullName,
                    username: user.username,
                    avatarLink: user.avatarLink,
                    bio: user.bio,
                    isFollowing: followingSet.has(user.id),
                };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null);

        return { success: true, data, total };
    } catch (error) {
        console.error('getFollowers error:', error);
        return { success: false, error: 'Failed to fetch followers' };
    }
};

// =============================================
// Get User's Following
// =============================================

export const getFollowing = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<IUserListResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);

        const [follows, total] = await Promise.all([
            prisma.userFollow.findMany({
                where: { followerId: userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.userFollow.count({ where: { followerId: userId } }),
        ]);

        // Fetch following user details
        const followingIds = follows.map((f) => f.followingId);
        const users = await prisma.user.findMany({
            where: { id: { in: followingIds } },
            select: {
                id: true,
                fullName: true,
                username: true,
                avatarLink: true,
                bio: true,
            },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        // If current user is logged in, check which of these they follow
        let followingSet = new Set<string>();
        if (currentUser) {
            const userFollowing = await prisma.userFollow.findMany({
                where: {
                    followerId: currentUser.userId,
                    followingId: { in: followingIds },
                },
                select: { followingId: true },
            });
            followingSet = new Set(userFollowing.map((f) => f.followingId));
        }

        const data: IUserListItem[] = follows
            .map((f) => {
                const user = userMap.get(f.followingId);
                if (!user) return null;
                return {
                    id: user.id,
                    fullName: user.fullName,
                    username: user.username,
                    avatarLink: user.avatarLink,
                    bio: user.bio,
                    isFollowing: followingSet.has(user.id),
                };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null);

        return { success: true, data, total };
    } catch (error) {
        console.error('getFollowing error:', error);
        return { success: false, error: 'Failed to fetch following' };
    }
};

// =============================================
// Discover Users (Suggested/Popular)
// =============================================

interface IDiscoverUsersParams {
    page?: number;
    limit?: number;
    search?: string;
}

export const discoverUsers = async (
    params: IDiscoverUsersParams = {}
): Promise<IUserListResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        const { page = 1, limit = 20, search } = params;

        // Get users the current user is already following
        let excludeIds: string[] = [];
        if (currentUser) {
            const following = await prisma.userFollow.findMany({
                where: { followerId: currentUser.userId },
                select: { followingId: true },
            });
            excludeIds = [currentUser.userId, ...following.map((f) => f.followingId)];
        }

        const where = {
            id: { notIn: excludeIds },
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { username: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Get users sorted by follower count (most popular first)
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    username: true,
                    avatarLink: true,
                    bio: true,
                    _count: {
                        select: { followers: true },
                    },
                },
                orderBy: {
                    followers: { _count: 'desc' },
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        const data = users.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            avatarLink: u.avatarLink,
            bio: u.bio,
            isFollowing: false, // These are users not being followed
        }));

        return { success: true, data, total };
    } catch (error) {
        console.error('discoverUsers error:', error);
        return { success: false, error: 'Failed to discover users' };
    }
};

// =============================================
// Get Mutual Followers (Common connections)
// =============================================

export const getMutualFollowers = async (
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<IUserListResponse> => {
    try {
        const currentUser = await getCurrentUser(STAKEHOLDER.USER);
        if (!currentUser) return { success: true, data: [], total: 0 };

        if (currentUser.userId === userId) {
            return { success: true, data: [], total: 0 };
        }

        // Get users that both current user and target user follow
        const [currentFollowing, targetFollowing] = await Promise.all([
            prisma.userFollow.findMany({
                where: { followerId: currentUser.userId },
                select: { followingId: true },
            }),
            prisma.userFollow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            }),
        ]);

        const currentFollowingSet = new Set(currentFollowing.map((f) => f.followingId));
        const mutualIds = targetFollowing
            .map((f) => f.followingId)
            .filter((id) => currentFollowingSet.has(id));

        if (mutualIds.length === 0) {
            return { success: true, data: [], total: 0 };
        }

        const users = await prisma.user.findMany({
            where: { id: { in: mutualIds } },
            select: {
                id: true,
                fullName: true,
                username: true,
                avatarLink: true,
                bio: true,
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const data = users.map((u) => ({
            ...u,
            isFollowing: true,
        }));

        return { success: true, data, total: mutualIds.length };
    } catch (error) {
        console.error('getMutualFollowers error:', error);
        return { success: false, error: 'Failed to fetch mutual followers' };
    }
};
