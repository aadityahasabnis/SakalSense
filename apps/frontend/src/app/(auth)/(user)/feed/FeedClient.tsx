'use client';
// =============================================
// Activity Feed Client - Main feed UI component
// =============================================

import { useCallback, useEffect, useState } from 'react';

import { Loader2, Rss, TrendingUp, Users } from 'lucide-react';

import { ActivityFeedItem } from '@/components/social/ActivityFeedItem';
import { UserCard } from '@/components/social/UserCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getActivityFeed, getGlobalActivityFeed } from '@/server/actions/social/activityFeedActions';
import { discoverUsers } from '@/server/actions/social/socialActions';

// =============================================
// Types
// =============================================

interface IActivityItem {
    id: string;
    type: string;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    user: {
        id: string;
        fullName: string;
        username: string | null;
        avatarLink: string | null;
    };
}

interface ISuggestedUser {
    id: string;
    fullName: string;
    username: string | null;
    avatarLink: string | null;
    bio: string | null;
    isFollowing: boolean;
}

interface IFeedClientProps {
    currentUserId: string;
}

// =============================================
// Loading Skeleton Components
// =============================================

const ActivitySkeleton = () => (
    <div className='flex items-start gap-3 p-3'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <div className='flex-1 space-y-2'>
            <div className='flex items-center gap-2'>
                <Skeleton className='h-6 w-6 rounded-full' />
                <Skeleton className='h-4 w-24' />
            </div>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-3 w-16' />
        </div>
    </div>
);

const UserCardSkeleton = () => (
    <Card>
        <CardContent className='flex items-center gap-4 p-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-16' />
            </div>
            <Skeleton className='h-8 w-20' />
        </CardContent>
    </Card>
);

// =============================================
// Empty State Components
// =============================================

const EmptyFeedState = ({ isFollowing }: { isFollowing: boolean }) => (
    <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='rounded-full bg-muted p-4 mb-4'>
                <Rss className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>No activities yet</h3>
            <p className='text-muted-foreground text-center max-w-sm'>
                {isFollowing
                    ? 'Follow more users to see their activities in your feed, or start learning to create your own activities!'
                    : 'Be the first to start learning! Activities will appear here as the community grows.'}
            </p>
        </CardContent>
    </Card>
);

const EmptyDiscoverState = () => (
    <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-8'>
            <Users className='h-8 w-8 text-muted-foreground mb-2' />
            <p className='text-sm text-muted-foreground text-center'>
                No suggestions available
            </p>
        </CardContent>
    </Card>
);

// =============================================
// Main Component
// =============================================

export const FeedClient = ({ currentUserId }: IFeedClientProps) => {
    const [activeTab, setActiveTab] = useState<'following' | 'global'>('following');
    
    // Following feed state
    const [followingActivities, setFollowingActivities] = useState<IActivityItem[]>([]);
    const [followingPage, setFollowingPage] = useState(1);
    const [followingHasMore, setFollowingHasMore] = useState(true);
    const [followingLoading, setFollowingLoading] = useState(true);
    const [followingLoadingMore, setFollowingLoadingMore] = useState(false);
    
    // Global feed state
    const [globalActivities, setGlobalActivities] = useState<IActivityItem[]>([]);
    const [globalPage, setGlobalPage] = useState(1);
    const [globalHasMore, setGlobalHasMore] = useState(true);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalLoadingMore, setGlobalLoadingMore] = useState(false);
    
    // Discover users state
    const [suggestedUsers, setSuggestedUsers] = useState<ISuggestedUser[]>([]);
    const [discoverLoading, setDiscoverLoading] = useState(true);

    // =============================================
    // Fetch Functions
    // =============================================

    const fetchFollowingFeed = useCallback(async (page: number, append: boolean = false) => {
        if (append) {
            setFollowingLoadingMore(true);
        } else {
            setFollowingLoading(true);
        }

        try {
            const result = await getActivityFeed(page, 15);
            if (result.success && result.data) {
                if (append) {
                    setFollowingActivities((prev) => [...prev, ...result.data!]);
                } else {
                    setFollowingActivities(result.data);
                }
                setFollowingHasMore(result.hasMore ?? false);
                setFollowingPage(page);
            }
        } catch (error) {
            console.error('Error fetching following feed:', error);
        } finally {
            setFollowingLoading(false);
            setFollowingLoadingMore(false);
        }
    }, []);

    const fetchGlobalFeed = useCallback(async (page: number, append: boolean = false) => {
        if (append) {
            setGlobalLoadingMore(true);
        } else {
            setGlobalLoading(true);
        }

        try {
            const result = await getGlobalActivityFeed(page, 15);
            if (result.success && result.data) {
                if (append) {
                    setGlobalActivities((prev) => [...prev, ...result.data!]);
                } else {
                    setGlobalActivities(result.data);
                }
                setGlobalHasMore(result.hasMore ?? false);
                setGlobalPage(page);
            }
        } catch (error) {
            console.error('Error fetching global feed:', error);
        } finally {
            setGlobalLoading(false);
            setGlobalLoadingMore(false);
        }
    }, []);

    const fetchSuggestedUsers = useCallback(async () => {
        setDiscoverLoading(true);
        try {
            const result = await discoverUsers({ limit: 5 });
            if (result.success && result.data) {
                setSuggestedUsers(result.data as ISuggestedUser[]);
            }
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        } finally {
            setDiscoverLoading(false);
        }
    }, []);

    // =============================================
    // Initial Load
    // =============================================

    useEffect(() => {
        fetchFollowingFeed(1);
        fetchSuggestedUsers();
    }, [fetchFollowingFeed, fetchSuggestedUsers]);

    // Load global feed when tab is switched
    useEffect(() => {
        if (activeTab === 'global' && globalActivities.length === 0 && !globalLoading) {
            fetchGlobalFeed(1);
        }
    }, [activeTab, globalActivities.length, globalLoading, fetchGlobalFeed]);

    // =============================================
    // Load More Handlers
    // =============================================

    const loadMoreFollowing = () => {
        if (!followingLoadingMore && followingHasMore) {
            fetchFollowingFeed(followingPage + 1, true);
        }
    };

    const loadMoreGlobal = () => {
        if (!globalLoadingMore && globalHasMore) {
            fetchGlobalFeed(globalPage + 1, true);
        }
    };

    // =============================================
    // Render
    // =============================================

    return (
        <div className='container mx-auto px-4 py-8 max-w-6xl'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold'>Activity Feed</h1>
                <p className='text-muted-foreground mt-1'>
                    See what the community is learning and achieving
                </p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Main Feed */}
                <div className='lg:col-span-2'>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'global')}>
                        <TabsList className='grid w-full grid-cols-2 mb-6'>
                            <TabsTrigger value='following' className='flex items-center gap-2'>
                                <Users className='h-4 w-4' />
                                Following
                            </TabsTrigger>
                            <TabsTrigger value='global' className='flex items-center gap-2'>
                                <TrendingUp className='h-4 w-4' />
                                Global
                            </TabsTrigger>
                        </TabsList>

                        {/* Following Feed */}
                        <TabsContent value='following' className='mt-0'>
                            <Card>
                                <CardContent className='divide-y p-0'>
                                    {followingLoading ? (
                                        // Loading skeleton
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <ActivitySkeleton key={i} />
                                        ))
                                    ) : followingActivities.length === 0 ? (
                                        <div className='p-4'>
                                            <EmptyFeedState isFollowing />
                                        </div>
                                    ) : (
                                        <>
                                            {followingActivities.map((activity) => (
                                                <ActivityFeedItem
                                                    key={activity.id}
                                                    activity={activity}
                                                />
                                            ))}
                                            
                                            {/* Load More Button */}
                                            {followingHasMore && (
                                                <div className='p-4 flex justify-center'>
                                                    <Button
                                                        variant='outline'
                                                        onClick={loadMoreFollowing}
                                                        disabled={followingLoadingMore}
                                                    >
                                                        {followingLoadingMore ? (
                                                            <>
                                                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            'Load More'
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Global Feed */}
                        <TabsContent value='global' className='mt-0'>
                            <Card>
                                <CardContent className='divide-y p-0'>
                                    {globalLoading ? (
                                        // Loading skeleton
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <ActivitySkeleton key={i} />
                                        ))
                                    ) : globalActivities.length === 0 ? (
                                        <div className='p-4'>
                                            <EmptyFeedState isFollowing={false} />
                                        </div>
                                    ) : (
                                        <>
                                            {globalActivities.map((activity) => (
                                                <ActivityFeedItem
                                                    key={activity.id}
                                                    activity={activity}
                                                />
                                            ))}
                                            
                                            {/* Load More Button */}
                                            {globalHasMore && (
                                                <div className='p-4 flex justify-center'>
                                                    <Button
                                                        variant='outline'
                                                        onClick={loadMoreGlobal}
                                                        disabled={globalLoadingMore}
                                                    >
                                                        {globalLoadingMore ? (
                                                            <>
                                                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            'Load More'
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar - Discover Users */}
                <div className='lg:col-span-1'>
                    <Card>
                        <CardHeader className='pb-3'>
                            <CardTitle className='text-lg flex items-center gap-2'>
                                <Users className='h-5 w-5' />
                                Discover Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            {discoverLoading ? (
                                // Loading skeleton
                                Array.from({ length: 3 }).map((_, i) => (
                                    <UserCardSkeleton key={i} />
                                ))
                            ) : suggestedUsers.length === 0 ? (
                                <EmptyDiscoverState />
                            ) : (
                                suggestedUsers.map((user) => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        currentUserId={currentUserId}
                                        showFollowButton
                                    />
                                ))
                            )}
                            
                            {/* View All Users Link */}
                            {suggestedUsers.length > 0 && (
                                <Button
                                    variant='ghost'
                                    className='w-full text-muted-foreground hover:text-foreground'
                                    asChild
                                >
                                    <a href='/users'>View all users</a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className='mt-6'>
                        <CardHeader className='pb-3'>
                            <CardTitle className='text-lg'>Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className='text-sm text-muted-foreground space-y-2'>
                                <li className='flex items-start gap-2'>
                                    <span className='text-primary'>•</span>
                                    Follow users to see their learning activities
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='text-primary'>•</span>
                                    Read articles and solve problems to earn XP
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='text-primary'>•</span>
                                    Unlock achievements by reaching milestones
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='text-primary'>•</span>
                                    Your public activities appear in the global feed
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
