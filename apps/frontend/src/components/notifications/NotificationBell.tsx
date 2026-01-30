'use client';
// =============================================
// NotificationBell - Notification dropdown for navbar
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    Bell,
    CheckCheck,
    Flame,
    Loader2,
    Medal,
    MessageSquare,
    Sparkles,
    TrendingUp,
    UserPlus,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTimeAgo } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '@/server/actions/notifications/notificationActions';

// =============================================
// Types
// =============================================

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
}: {
    notification: INotification;
    onRead: (id: string) => void;
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
        <DropdownMenuItem
            onClick={handleClick}
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                !notification.isRead && 'bg-muted/50'
            )}
        >
            <div className={cn('p-2 rounded-full shrink-0', config.color)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        'text-sm leading-tight',
                        !notification.isRead && 'font-medium'
                    )}
                >
                    {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.createdAt)}
                </p>
            </div>
            {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
            )}
        </DropdownMenuItem>
    );
};

// =============================================
// Main Component
// =============================================

export const NotificationBell = () => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    // Fetch unread count
    const { data: countData } = useQuery({
        queryKey: ['notification-count'],
        queryFn: getUnreadNotificationCount,
        refetchInterval: 60000, // Refetch every minute
    });

    const unreadCount = countData?.count ?? 0;

    // Fetch notifications when dropdown opens
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications-preview'],
        queryFn: () => getNotifications(1, 10),
        enabled: open,
    });

    const notifications = (notificationsData?.data ?? []) as INotification[];

    // Mark single notification as read
    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read
    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        markAllReadMutation.mutate();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-medium"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between py-2">
                    <span className="font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={handleMarkAllRead}
                            disabled={markAllReadMutation.isPending}
                        >
                            {markAllReadMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <CheckCheck className="h-3 w-3 mr-1" />
                            )}
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No notifications</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            You're all caught up!
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[400px]">
                        <div className="py-1">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={handleMarkAsRead}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center py-2">
                    <Link href="/notifications" className="text-sm text-primary">
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
