'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import Link from 'next/link';

import { addNotificationAtom } from '@/jotai/atoms';
import {
    getPlatformStats,
    getRecentActivity,
    getPendingAdminRequests,
    getTopCreators,
    approveAdminRequest,
    rejectAdminRequest,
    type IRecentActivity,
    type IAdminRequest,
} from '@/server/actions/administrator/dashboardActions';

// =============================================
// Stats Card Component
// =============================================

interface IStatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    color: 'amber' | 'blue' | 'green' | 'purple' | 'rose';
}

const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
};

const StatsCard = ({ title, value, subtitle, icon, trend, color }: IStatsCardProps) => (
    <div className='rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 backdrop-blur-sm'>
        <div className='flex items-start justify-between'>
            <div>
                <p className='text-sm text-zinc-400'>{title}</p>
                <p className='mt-1 text-2xl font-bold text-white'>{typeof value === 'number' ? value.toLocaleString() : value}</p>
                {subtitle && <p className='mt-1 text-xs text-zinc-500'>{subtitle}</p>}
                {trend && (
                    <p className={`mt-2 text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}% from last week
                    </p>
                )}
            </div>
            <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
                {icon}
            </div>
        </div>
    </div>
);

// =============================================
// Activity Item Component
// =============================================

const activityIcons: Record<IRecentActivity['type'], { icon: React.ReactNode; color: string }> = {
    user_joined: {
        icon: (
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
            </svg>
        ),
        color: 'text-blue-400 bg-blue-500/20',
    },
    content_published: {
        icon: (
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
        ),
        color: 'text-green-400 bg-green-500/20',
    },
    course_created: {
        icon: (
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
            </svg>
        ),
        color: 'text-purple-400 bg-purple-500/20',
    },
    admin_request: {
        icon: (
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
            </svg>
        ),
        color: 'text-amber-400 bg-amber-500/20',
    },
};

const ActivityItem = ({ activity }: { activity: IRecentActivity }) => {
    const { icon, color } = activityIcons[activity.type];
    const timeAgo = getTimeAgo(new Date(activity.timestamp));

    return (
        <div className='flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-700/30'>
            <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-white truncate'>{activity.title}</p>
                <p className='text-xs text-zinc-400 truncate'>{activity.subtitle}</p>
            </div>
            <span className='text-xs text-zinc-500 whitespace-nowrap'>{timeAgo}</span>
        </div>
    );
};

// =============================================
// Admin Request Card Component
// =============================================

interface IAdminRequestCardProps {
    request: IAdminRequest;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isLoading: boolean;
}

const AdminRequestCard = ({ request, onApprove, onReject, isLoading }: IAdminRequestCardProps) => (
    <div className='rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4'>
        <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
                <p className='font-medium text-white truncate'>{request.fullName}</p>
                <p className='text-sm text-zinc-400 truncate'>{request.email}</p>
                {request.reason && (
                    <p className='mt-2 text-xs text-zinc-500 line-clamp-2'>{request.reason}</p>
                )}
                <p className='mt-2 text-xs text-zinc-600'>
                    Requested {getTimeAgo(new Date(request.createdAt))}
                </p>
            </div>
            <div className='flex gap-2'>
                <button
                    onClick={() => onApprove(request.id)}
                    disabled={isLoading}
                    className='rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50'
                >
                    Approve
                </button>
                <button
                    onClick={() => onReject(request.id)}
                    disabled={isLoading}
                    className='rounded-lg bg-zinc-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50'
                >
                    Reject
                </button>
            </div>
        </div>
    </div>
);

// =============================================
// Top Creator Card Component
// =============================================

interface ITopCreator {
    id: string;
    fullName: string;
    avatarLink: string | null;
    contentCount: number;
    totalViews: number;
}

const TopCreatorCard = ({ creator, rank }: { creator: ITopCreator; rank: number }) => (
    <div className='flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-zinc-700/30'>
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            rank === 1 ? 'bg-amber-500 text-black' :
            rank === 2 ? 'bg-zinc-300 text-black' :
            rank === 3 ? 'bg-amber-700 text-white' :
            'bg-zinc-700 text-zinc-300'
        }`}>
            {rank}
        </div>
        <div className='h-8 w-8 rounded-full bg-zinc-700 overflow-hidden'>
            {creator.avatarLink ? (
                <img src={creator.avatarLink} alt={creator.fullName} className='h-full w-full object-cover' />
            ) : (
                <div className='flex h-full w-full items-center justify-center text-xs text-zinc-400'>
                    {creator.fullName.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
        <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-white truncate'>{creator.fullName}</p>
            <p className='text-xs text-zinc-500'>{creator.contentCount} articles</p>
        </div>
        <div className='text-right'>
            <p className='text-sm font-medium text-white'>{creator.totalViews.toLocaleString()}</p>
            <p className='text-xs text-zinc-500'>views</p>
        </div>
    </div>
);

// =============================================
// Helper Functions
// =============================================

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// =============================================
// Main Dashboard Client Component
// =============================================

export const DashboardClient = () => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    // Queries
    const { data: statsData } = useQuery({
        queryKey: ['administrator', 'platform-stats'],
        queryFn: () => getPlatformStats(),
        staleTime: 60000, // 1 minute
    });

    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['administrator', 'recent-activity'],
        queryFn: () => getRecentActivity(10),
        staleTime: 30000, // 30 seconds
    });

    const { data: requestsData } = useQuery({
        queryKey: ['administrator', 'pending-requests'],
        queryFn: () => getPendingAdminRequests(),
        staleTime: 30000,
    });

    const { data: creatorsData, isLoading: creatorsLoading } = useQuery({
        queryKey: ['administrator', 'top-creators'],
        queryFn: () => getTopCreators(5),
        staleTime: 60000,
    });

    // Mutations
    const approveMutation = useMutation({
        mutationFn: approveAdminRequest,
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: result.message ?? 'Admin request approved' });
                queryClient.invalidateQueries({ queryKey: ['administrator', 'pending-requests'] });
                queryClient.invalidateQueries({ queryKey: ['administrator', 'platform-stats'] });
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to approve request' });
            }
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (requestId: string) => rejectAdminRequest(requestId),
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: 'Admin request rejected' });
                queryClient.invalidateQueries({ queryKey: ['administrator', 'pending-requests'] });
                queryClient.invalidateQueries({ queryKey: ['administrator', 'platform-stats'] });
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to reject request' });
            }
        },
    });

    const stats = statsData?.data;
    const activities = activityData?.data ?? [];
    const pendingRequests = requestsData?.data ?? [];
    const topCreators = creatorsData?.data ?? [];

    return (
        <div className='space-y-6'>
            {/* Stats Grid */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <StatsCard
                    title='Total Users'
                    value={stats?.users.total ?? 0}
                    subtitle={`${stats?.users.newThisWeek ?? 0} new this week`}
                    color='blue'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                        </svg>
                    }
                />
                <StatsCard
                    title='Content Published'
                    value={stats?.content.published ?? 0}
                    subtitle={`${stats?.content.draft ?? 0} drafts`}
                    color='green'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                    }
                />
                <StatsCard
                    title='Total Views'
                    value={stats?.content.totalViews ?? 0}
                    color='purple'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                    }
                />
                <StatsCard
                    title='Course Enrollments'
                    value={stats?.courses.totalEnrollments ?? 0}
                    subtitle={`${stats?.courses.published ?? 0} courses`}
                    color='amber'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                        </svg>
                    }
                />
            </div>

            {/* Engagement Stats */}
            <div className='grid gap-4 md:grid-cols-3'>
                <StatsCard
                    title='Total Likes'
                    value={stats?.engagement.totalLikes ?? 0}
                    color='rose'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                        </svg>
                    }
                />
                <StatsCard
                    title='Total Comments'
                    value={stats?.engagement.totalComments ?? 0}
                    color='blue'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                        </svg>
                    }
                />
                <StatsCard
                    title='Total Bookmarks'
                    value={stats?.engagement.totalBookmarks ?? 0}
                    color='amber'
                    icon={
                        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
                        </svg>
                    }
                />
            </div>

            {/* Main Content Grid */}
            <div className='grid gap-6 lg:grid-cols-3'>
                {/* Recent Activity */}
                <div className='lg:col-span-2 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 backdrop-blur-sm'>
                    <div className='mb-4 flex items-center justify-between'>
                        <h2 className='text-lg font-semibold text-white'>Recent Activity</h2>
                        <Link href='/administrator/activity' className='text-xs text-amber-400 hover:text-amber-300'>
                            View all
                        </Link>
                    </div>
                    {activityLoading ? (
                        <div className='space-y-3'>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className='h-14 animate-pulse rounded-lg bg-zinc-700/30' />
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <p className='text-center text-sm text-zinc-500 py-8'>No recent activity</p>
                    ) : (
                        <div className='space-y-1'>
                            {activities.map((activity) => (
                                <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Creators */}
                <div className='rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 backdrop-blur-sm'>
                    <div className='mb-4 flex items-center justify-between'>
                        <h2 className='text-lg font-semibold text-white'>Top Creators</h2>
                        <Link href='/administrator/admins' className='text-xs text-amber-400 hover:text-amber-300'>
                            View all
                        </Link>
                    </div>
                    {creatorsLoading ? (
                        <div className='space-y-3'>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className='h-12 animate-pulse rounded-lg bg-zinc-700/30' />
                            ))}
                        </div>
                    ) : topCreators.length === 0 ? (
                        <p className='text-center text-sm text-zinc-500 py-8'>No creators yet</p>
                    ) : (
                        <div className='space-y-1'>
                            {topCreators.map((creator, index) => (
                                <TopCreatorCard key={creator.id} creator={creator} rank={index + 1} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Admin Requests */}
            {pendingRequests.length > 0 && (
                <div className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-5'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <svg className='h-5 w-5 text-amber-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                            </svg>
                            <h2 className='text-lg font-semibold text-white'>
                                Pending Admin Requests ({pendingRequests.length})
                            </h2>
                        </div>
                        <Link href='/administrator/admin-requests' className='text-xs text-amber-400 hover:text-amber-300'>
                            View all
                        </Link>
                    </div>
                    <div className='space-y-3'>
                        {pendingRequests.slice(0, 3).map((request) => (
                            <AdminRequestCard
                                key={request.id}
                                request={request}
                                onApprove={(id) => approveMutation.mutate(id)}
                                onReject={(id) => rejectMutation.mutate(id)}
                                isLoading={approveMutation.isPending || rejectMutation.isPending}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Links */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <QuickLinkCard
                    href='/administrator/domains'
                    title='Manage Taxonomy'
                    description='Domains, categories & topics'
                    icon={
                        <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
                        </svg>
                    }
                />
                <QuickLinkCard
                    href='/administrator/admin-requests'
                    title='Admin Requests'
                    description='Review access requests'
                    badge={pendingRequests.length > 0 ? pendingRequests.length : undefined}
                    icon={
                        <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                        </svg>
                    }
                />
                <QuickLinkCard
                    href='/administrator/mail'
                    title='Mail System'
                    description='Email templates & logs'
                    icon={
                        <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                        </svg>
                    }
                />
                <QuickLinkCard
                    href='/administrator/settings'
                    title='System Settings'
                    description='Platform configuration'
                    icon={
                        <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                    }
                />
            </div>
        </div>
    );
};

// =============================================
// Quick Link Card Component
// =============================================

interface IQuickLinkCardProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
}

const QuickLinkCard = ({ href, title, description, icon, badge }: IQuickLinkCardProps) => (
    <Link
        href={href}
        className='group relative flex items-center gap-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-all hover:border-amber-500/30 hover:bg-zinc-700/50'
    >
        <div className='rounded-lg bg-zinc-700/50 p-3 text-zinc-400 transition-colors group-hover:bg-amber-500/20 group-hover:text-amber-400'>
            {icon}
        </div>
        <div>
            <p className='font-medium text-white'>{title}</p>
            <p className='text-xs text-zinc-500'>{description}</p>
        </div>
        {badge !== undefined && badge > 0 && (
            <span className='absolute right-4 top-4 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-black'>
                {badge}
            </span>
        )}
    </Link>
);

export default DashboardClient;
