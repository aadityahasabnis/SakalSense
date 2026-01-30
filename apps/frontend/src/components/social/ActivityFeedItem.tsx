'use client';
// =============================================
// ActivityFeedItem - Single activity item display
// =============================================

import Link from 'next/link';

import {
    Award,
    BookOpen,
    CheckCircle,
    Code,
    GraduationCap,
    Medal,
    Play,
    TrendingUp,
    Trophy,
    UserPlus,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

// =============================================
// Activity Type Config
// =============================================

const activityConfig: Record<string, { 
    action: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string;
}> = {
    CONTENT_READ: {
        action: 'read an article',
        icon: BookOpen,
        color: 'text-blue-500',
    },
    CONTENT_COMPLETED: {
        action: 'completed an article',
        icon: CheckCircle,
        color: 'text-green-500',
    },
    COURSE_ENROLLED: {
        action: 'enrolled in a course',
        icon: GraduationCap,
        color: 'text-purple-500',
    },
    COURSE_COMPLETED: {
        action: 'completed a course',
        icon: Trophy,
        color: 'text-yellow-500',
    },
    LESSON_COMPLETED: {
        action: 'completed a lesson',
        icon: Play,
        color: 'text-blue-500',
    },
    PROBLEM_SOLVED: {
        action: 'solved a practice problem',
        icon: Code,
        color: 'text-green-500',
    },
    ACHIEVEMENT_UNLOCKED: {
        action: 'unlocked an achievement',
        icon: Award,
        color: 'text-yellow-500',
    },
    BADGE_EARNED: {
        action: 'earned a badge',
        icon: Medal,
        color: 'text-purple-500',
    },
    FOLLOWED_USER: {
        action: 'started following',
        icon: UserPlus,
        color: 'text-blue-500',
    },
    LEVEL_UP: {
        action: 'reached a new level',
        icon: TrendingUp,
        color: 'text-yellow-500',
    },
};

// =============================================
// Types
// =============================================

interface IActivityFeedItemProps {
    activity: {
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
    };
}

// =============================================
// Component
// =============================================

export const ActivityFeedItem = ({ activity }: IActivityFeedItemProps) => {
    const config = activityConfig[activity.type] || {
        action: 'performed an action',
        icon: BookOpen,
        color: 'text-muted-foreground',
    };

    const Icon = config.icon;
    const metadata = activity.metadata || {};

    const initials = activity.user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    // Format time ago
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Get action description with metadata
    const getActionText = () => {
        switch (activity.type) {
            case 'LEVEL_UP':
                return `reached level ${metadata.level ?? '?'}`;
            case 'FOLLOWED_USER':
                return metadata.followedName 
                    ? `started following ${metadata.followedName}` 
                    : 'started following someone';
            case 'CONTENT_READ':
            case 'CONTENT_COMPLETED':
                return metadata.contentTitle
                    ? `${config.action}: "${metadata.contentTitle}"`
                    : config.action;
            case 'COURSE_ENROLLED':
            case 'COURSE_COMPLETED':
                return metadata.courseTitle
                    ? `${config.action}: "${metadata.courseTitle}"`
                    : config.action;
            case 'PROBLEM_SOLVED':
                return metadata.problemTitle
                    ? `solved "${metadata.problemTitle}"`
                    : config.action;
            case 'ACHIEVEMENT_UNLOCKED':
                return metadata.achievementName
                    ? `unlocked "${metadata.achievementName}"`
                    : config.action;
            case 'BADGE_EARNED':
                return metadata.badgeName
                    ? `earned the "${metadata.badgeName}" badge`
                    : config.action;
            default:
                return config.action;
        }
    };

    return (
        <Card className='border-0 shadow-none bg-transparent'>
            <CardContent className='flex items-start gap-3 p-3'>
                {/* Icon */}
                <div className={`mt-1 rounded-full p-2 bg-muted ${config.color}`}>
                    <Icon className='h-4 w-4' />
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                        <Link href={`/user/${activity.user.username || activity.user.id}`}>
                            <Avatar className='h-6 w-6'>
                                <AvatarImage 
                                    src={activity.user.avatarLink ?? undefined} 
                                    alt={activity.user.fullName} 
                                />
                                <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <Link 
                            href={`/user/${activity.user.username || activity.user.id}`}
                            className='font-medium text-sm hover:underline'
                        >
                            {activity.user.fullName}
                        </Link>
                    </div>
                    <p className='text-sm text-muted-foreground mt-1'>
                        {getActionText()}
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                        {formatTimeAgo(activity.createdAt)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
