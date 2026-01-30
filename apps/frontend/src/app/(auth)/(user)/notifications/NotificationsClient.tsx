'use client';
// =============================================
// Notifications Client - Full notifications page
// =============================================

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    Bell,
    CheckCheck,
    Filter,
    Flame,
    Loader2,
    Medal,
    MessageSquare,
    Sparkles,
    Trash2,
    TrendingUp,
    UserPlus,
} from 'lucide-react';

import {
    EmptyState,
    LoadMoreButton,
    PageHeader,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUrlTabs } from '@/hooks';
import { formatTimeAgo } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
    deleteAllReadNotifications,
    deleteNotification,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '@/server/actions/notifications/notificationActions';

// =============================================
// Types
// =============================================

type NotificationTab = 'all' | 'unread';

interface INotification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    metadata: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: Date;
}

// =============================================
// Notification Type Config
// =============================================

const notificationConfig: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
    ACHIEVEMENT: { icon: Award, color: 'text-yellow-500 bg-yellow-500/10' },
    BADGE: { icon: Medal, color: 'text-purple-500 bg-purple-500/10' },
    FOLLOW: { icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' },
    COMMENT_REPLY: { icon: MessageSquare, color: 'text-green-500 bg-green-500/10' },
    MENTION: { icon: MessageSquare, color: 'text-cyan-500 bg-cyan-500/10' },
    STREAK: { icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
    GOAL_REMINDER: { icon: Bell, color: 'text-gray-500 bg-gray-500/10' },
    LEVEL_UP: { icon: TrendingUp, color: 'text-yellow-500 bg-yellow-500/10' },
    XP_EARNED: { icon: Sparkles, color: 'text-orange-500 bg-orange-500/10' },
};

// =============================================
// Notification Item Component
// =============================================

const NotificationItem = ({
    notification,
    onRead,
    onDelete,
}: {
    notification: INotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    const router = useRouter();
    const config = notificationConfig[notification.type] ?? {
        icon: Bell,
        color: 'text-gray-500 bg-gray-500/10',
    };
    const Icon = config.icon;

    const handleClick = () => {
        if (!notification.isRead) {
            onRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <Card
            className={cn(
                'transition-colors cursor-pointer hover:bg-muted/50',
                !notification.isRead && 'bg-muted/30 border-primary/20'
            )}
            onClick={handleClick}
        >
            <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('p-2.5 rounded-full shrink-0', config.color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p
                                className={cn(
                                    'font-medium',
                                    !notification.isRead && 'text-primary'
                                )}
                            >
                                {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {formatTimeAgo(notification.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <span className="sr-only">Actions</span>
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle cx="12" cy="12" r="1" />
                                            <circle cx="12" cy="5" r="1" />
                                            <circle cx="12" cy="19" r="1" />
                                        </svg>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRead(notification.id);
                                            }}
                                        >
                                            <CheckCheck className="mr-2 h-4 w-4" />
                                            Mark as read
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(notification.id);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Notification Skeleton
// =============================================

const NotificationSkeleton = () => (
    <Card>
        <CardContent className="flex items-start gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-3 w-20 mt-2" />
            </div>
        </CardContent>
    </Card>
);

// =============================================
// Main Component
// =============================================

export const NotificationsClient = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useUrlTabs<NotificationTab>('all', 'filter');
    const [page, setPage] = useState(1);
    const [allNotifications, setAllNotifications] = useState<INotification[]>([]);

    const unreadOnly = activeTab === 'unread';

    // Fetch notifications
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['notifications', unreadOnly, page],
        queryFn: async () => {
            const result = await getNotifications(page, 20, unreadOnly);
            if (result.success && result.data) {
                if (page === 1) {
                    setAllNotifications(result.data);
                } else {
                    setAllNotifications((prev) => [...prev, ...result.data!]);
                }
            }
            return result;
        },
    });

    const total = data?.total ?? 0;
    const unreadCount = data?.unreadCount ?? 0;
    const hasMore = allNotifications.length < total;

    // Reset when tab changes
    const handleTabChange = (tab: NotificationTab) => {
        setActiveTab(tab);
        setPage(1);
        setAllNotifications([]);
    };

    // Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
        },
    });

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
        },
    });

    // Delete notification mutation
    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
        },
    });

    // Delete all read mutation
    const deleteAllReadMutation = useMutation({
        mutationFn: deleteAllReadNotifications,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
        },
    });

    const handleMarkAsRead = (id: string) => {
        markReadMutation.mutate(id);
        // Optimistic update
        setAllNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
        // Optimistic update
        setAllNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <div className="container max-w-3xl py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Notifications"
                    description="Stay updated on your learning journey"
                    badge={
                        unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {unreadCount} unread
                            </Badge>
                        )
                    }
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending || unreadCount === 0}
                        >
                            {markAllReadMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCheck className="mr-2 h-4 w-4" />
                            )}
                            Mark all as read
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteAllReadMutation.mutate()}
                            disabled={deleteAllReadMutation.isPending}
                        >
                            {deleteAllReadMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete all read
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as NotificationTab)}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread" className="gap-1">
                        Unread
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <NotificationList
                        notifications={allNotifications}
                        isLoading={isLoading && page === 1}
                        isFetching={isFetching}
                        hasMore={hasMore}
                        onLoadMore={() => setPage((p) => p + 1)}
                        onRead={handleMarkAsRead}
                        onDelete={handleDelete}
                    />
                </TabsContent>

                <TabsContent value="unread" className="mt-6">
                    <NotificationList
                        notifications={allNotifications}
                        isLoading={isLoading && page === 1}
                        isFetching={isFetching}
                        hasMore={hasMore}
                        onLoadMore={() => setPage((p) => p + 1)}
                        onRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        emptyMessage="No unread notifications"
                        emptyDescription="You're all caught up!"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// =============================================
// Notification List Component
// =============================================

const NotificationList = ({
    notifications,
    isLoading,
    isFetching,
    hasMore,
    onLoadMore,
    onRead,
    onDelete,
    emptyMessage = 'No notifications yet',
    emptyDescription = "When you receive notifications, they'll appear here",
}: {
    notifications: INotification[];
    isLoading: boolean;
    isFetching: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    emptyMessage?: string;
    emptyDescription?: string;
}) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <EmptyState
                icon={Bell}
                title={emptyMessage}
                description={emptyDescription}
                variant="card"
            />
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={onRead}
                    onDelete={onDelete}
                />
            ))}

            {hasMore && (
                <LoadMoreButton onClick={onLoadMore} loading={isFetching} />
            )}
        </div>
    );
};
