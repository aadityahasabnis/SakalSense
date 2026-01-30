'use client';
// =============================================
// Public Profile Client - View any user's public profile
// =============================================

import { useState } from 'react';

import Link from 'next/link';

import { Prisma } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import {
    Award,
    BookOpen,
    Calendar,
    CheckCircle,
    Code,
    Flame,
    GraduationCap,
    Medal,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';

import {
    EmptyState,
    LevelBadge,
    LoadMoreButton,
    SectionHeader,
    StatCard,
    StatsGrid,
    FeedSkeleton,
    UserCardSkeleton,
} from '@/components/common';
import { ActivityFeedItem } from '@/components/social/ActivityFeedItem';
import { FollowButton } from '@/components/social/FollowButton';
import { UserCard } from '@/components/social/UserCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUrlTabs } from '@/hooks';
import {
    formatCompactNumber,
    formatDate,
    formatXP,
    getInitials,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { getUserActivityFeed } from '@/server/actions/social/activityFeedActions';
import {
    getFollowers,
    getFollowing,
} from '@/server/actions/social/socialActions';
import {
    getUserDisplayedBadges,
    getUserRecentAchievements,
    type IPublicUserProfile,
} from '@/server/actions/user/publicProfileActions';

// =============================================
// Types
// =============================================

type ProfileTab = 'overview' | 'activity' | 'followers' | 'following';

interface IPublicProfileClientProps {
    profile: IPublicUserProfile;
}

// =============================================
// Badge Rarity Colors
// =============================================

const badgeRarityColors: Record<string, string> = {
    COMMON: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    UNCOMMON: 'bg-green-500/10 text-green-600 border-green-500/30',
    RARE: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    EPIC: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    LEGENDARY: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
};

// =============================================
// Profile Header Component
// =============================================

const ProfileHeader = ({ profile }: { profile: IPublicUserProfile }) => {
    const initials = getInitials(profile.fullName);

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
                        <AvatarImage
                            src={profile.avatarLink ?? undefined}
                            alt={profile.fullName}
                        />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                            <LevelBadge level={profile.stats.level} />
                        </div>

                        {profile.username && (
                            <p className="text-muted-foreground mt-1">@{profile.username}</p>
                        )}

                        {profile.bio && (
                            <p className="text-sm mt-2 text-muted-foreground max-w-lg">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {formatDate(profile.createdAt)}</span>
                            </div>
                            {profile.stats.currentStreak > 0 && (
                                <div className="flex items-center gap-1.5 text-orange-500">
                                    <Flame className="h-4 w-4" />
                                    <span>{profile.stats.currentStreak} day streak</span>
                                </div>
                            )}
                        </div>

                        {/* Follow Stats */}
                        <div className="flex items-center gap-4 mt-3">
                            <div className="text-sm">
                                <span className="font-semibold">{formatCompactNumber(profile.stats.followers)}</span>
                                <span className="text-muted-foreground ml-1">Followers</span>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold">{formatCompactNumber(profile.stats.following)}</span>
                                <span className="text-muted-foreground ml-1">Following</span>
                            </div>
                        </div>
                    </div>

                    {/* Follow Button (not for own profile) */}
                    {!profile.isOwnProfile && (
                        <div className="w-full sm:w-auto">
                            <FollowButton
                                userId={profile.id}
                                initialIsFollowing={profile.isFollowing}
                                size="default"
                            />
                        </div>
                    )}

                    {/* Edit Profile Link (own profile) */}
                    {profile.isOwnProfile && (
                        <Link
                            href="/profile/edit"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Edit Profile
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Stats Section Component
// =============================================

const StatsSection = ({ profile }: { profile: IPublicUserProfile }) => {
    return (
        <StatsGrid columns={4}>
            <StatCard
                icon={<Sparkles className="h-5 w-5" />}
                label="Total XP"
                value={formatXP(profile.stats.totalXP)}
                variant="highlight"
            />
            <StatCard
                icon={<BookOpen className="h-5 w-5" />}
                label="Content Completed"
                value={profile.stats.contentCompleted}
                variant="info"
            />
            <StatCard
                icon={<GraduationCap className="h-5 w-5" />}
                label="Courses Completed"
                value={profile.stats.coursesCompleted}
                variant="success"
            />
            <StatCard
                icon={<Code className="h-5 w-5" />}
                label="Problems Solved"
                value={profile.stats.problemsSolved}
                variant="default"
            />
        </StatsGrid>
    );
};

// =============================================
// Displayed Badges Component
// =============================================

const DisplayedBadges = ({ userId }: { userId: string }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['displayed-badges', userId],
        queryFn: () => getUserDisplayedBadges(userId),
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Medal className="h-4 w-4" />
                        Displayed Badges
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const badges = data?.data ?? [];

    if (badges.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Medal className="h-4 w-4" />
                    Displayed Badges
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 flex-wrap">
                    {badges.map((badge) => (
                        <Badge
                            key={badge.id}
                            variant="outline"
                            className={cn(
                                'gap-1.5 py-1.5 px-3',
                                badgeRarityColors[badge.rarity] ?? badgeRarityColors.COMMON
                            )}
                        >
                            {badge.icon && <span>{badge.icon}</span>}
                            {badge.name}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Recent Achievements Component
// =============================================

const RecentAchievements = ({ userId }: { userId: string }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['recent-achievements', userId],
        queryFn: () => getUserRecentAchievements(userId, 5),
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Recent Achievements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-24 bg-muted animate-pulse rounded mt-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const achievements = data?.data ?? [];

    if (achievements.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Recent Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                {achievement.icon ? (
                                    <span className="text-lg">{achievement.icon}</span>
                                ) : (
                                    <Award className="h-5 w-5 text-yellow-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{achievement.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {achievement.description}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(achievement.unlockedAt, { relative: true })}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Overview Tab Component
// =============================================

const OverviewTab = ({ profile }: { profile: IPublicUserProfile }) => {
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['user-activity-preview', profile.id],
        queryFn: () => getUserActivityFeed(profile.id, 1, 5),
    });

    return (
        <div className="space-y-6">
            {/* Stats */}
            <StatsSection profile={profile} />

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column: Badges & Achievements */}
                <div className="space-y-6">
                    <DisplayedBadges userId={profile.id} />
                    <RecentAchievements userId={profile.id} />
                </div>

                {/* Right Column: Recent Activity Preview */}
                <Card>
                    <CardHeader className="pb-3">
                        <SectionHeader
                            title="Recent Activity"
                            action={{
                                label: 'View all',
                                href: `?tab=activity`,
                            }}
                        />
                    </CardHeader>
                    <CardContent>
                        {activityLoading ? (
                            <FeedSkeleton count={3} />
                        ) : (activityData?.data?.length ?? 0) > 0 ? (
                            <div className="space-y-1">
                                {activityData?.data?.slice(0, 5).map((activity) => (
                                    <ActivityFeedItem key={activity.id} activity={activity} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CheckCircle}
                                title="No recent activity"
                                description="Activities will appear here as the user completes content"
                                size="sm"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// =============================================
// Activity Tab Component
// =============================================

const ActivityTab = ({ userId }: { userId: string }) => {
    const [page, setPage] = useState(1);
    const [allActivities, setAllActivities] = useState<Array<{
        id: string;
        type: string;
        targetId: string | null;
        metadata: Prisma.JsonValue;
        createdAt: Date;
        user: {
            id: string;
            fullName: string;
            username: string | null;
            avatarLink: string | null;
        };
    }>>([]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['user-activity', userId, page],
        queryFn: async () => {
            const result = await getUserActivityFeed(userId, page, 20);
            if (result.success && result.data) {
                if (page === 1) {
                    setAllActivities(result.data);
                } else {
                    setAllActivities((prev) => [...prev, ...result.data!]);
                }
            }
            return result;
        },
    });

    const hasMore = data?.hasMore ?? false;

    if (isLoading && page === 1) {
        return <FeedSkeleton count={5} />;
    }

    if (allActivities.length === 0) {
        return (
            <EmptyState
                icon={CheckCircle}
                title="No activity yet"
                description="Activities will appear here as the user completes content, earns achievements, and more"
                variant="card"
            />
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-1">
                        {allActivities.map((activity) => (
                            <ActivityFeedItem key={activity.id} activity={activity} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {hasMore && (
                <LoadMoreButton
                    onClick={() => setPage((p) => p + 1)}
                    loading={isFetching}
                />
            )}
        </div>
    );
};

// =============================================
// Followers Tab Component
// =============================================

const FollowersTab = ({ userId, currentUserId }: { userId: string; currentUserId?: string }) => {
    const [page, setPage] = useState(1);
    const [allFollowers, setAllFollowers] = useState<Array<{
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
        bio: string | null;
        isFollowing?: boolean;
    }>>([]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['followers', userId, page],
        queryFn: async () => {
            const result = await getFollowers(userId, page, 20);
            if (result.success && result.data) {
                if (page === 1) {
                    setAllFollowers(result.data);
                } else {
                    setAllFollowers((prev) => [...prev, ...result.data!]);
                }
            }
            return result;
        },
    });

    const total = data?.total ?? 0;
    const hasMore = allFollowers.length < total;

    if (isLoading && page === 1) {
        return <UserCardSkeleton count={4} />;
    }

    if (allFollowers.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="No followers yet"
                description="When people follow this user, they'll appear here"
                variant="card"
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {allFollowers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        showFollowButton={user.id !== currentUserId}
                    />
                ))}
            </div>

            {hasMore && (
                <LoadMoreButton
                    onClick={() => setPage((p) => p + 1)}
                    loading={isFetching}
                />
            )}
        </div>
    );
};

// =============================================
// Following Tab Component
// =============================================

const FollowingTab = ({ userId, currentUserId }: { userId: string; currentUserId?: string }) => {
    const [page, setPage] = useState(1);
    const [allFollowing, setAllFollowing] = useState<Array<{
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
        bio: string | null;
        isFollowing?: boolean;
    }>>([]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['following', userId, page],
        queryFn: async () => {
            const result = await getFollowing(userId, page, 20);
            if (result.success && result.data) {
                if (page === 1) {
                    setAllFollowing(result.data);
                } else {
                    setAllFollowing((prev) => [...prev, ...result.data!]);
                }
            }
            return result;
        },
    });

    const total = data?.total ?? 0;
    const hasMore = allFollowing.length < total;

    if (isLoading && page === 1) {
        return <UserCardSkeleton count={4} />;
    }

    if (allFollowing.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Not following anyone"
                description="When this user follows people, they'll appear here"
                variant="card"
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {allFollowing.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        showFollowButton={user.id !== currentUserId}
                    />
                ))}
            </div>

            {hasMore && (
                <LoadMoreButton
                    onClick={() => setPage((p) => p + 1)}
                    loading={isFetching}
                />
            )}
        </div>
    );
};

// =============================================
// Main Component
// =============================================

export const PublicProfileClient = ({ profile }: IPublicProfileClientProps) => {
    const [activeTab, setActiveTab] = useUrlTabs<ProfileTab>('overview', 'tab');

    return (
        <div className="container max-w-5xl py-6 space-y-6">
            {/* Profile Header */}
            <ProfileHeader profile={profile} />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="followers" className="gap-1">
                        <span className="hidden sm:inline">Followers</span>
                        <span className="sm:hidden">Followers</span>
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {formatCompactNumber(profile.stats.followers)}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-1">
                        <span className="hidden sm:inline">Following</span>
                        <span className="sm:hidden">Following</span>
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {formatCompactNumber(profile.stats.following)}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <OverviewTab profile={profile} />
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                    <ActivityTab userId={profile.id} />
                </TabsContent>

                <TabsContent value="followers" className="mt-6">
                    <FollowersTab
                        userId={profile.id}
                        currentUserId={profile.isOwnProfile ? profile.id : undefined}
                    />
                </TabsContent>

                <TabsContent value="following" className="mt-6">
                    <FollowingTab
                        userId={profile.id}
                        currentUserId={profile.isOwnProfile ? profile.id : undefined}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};
