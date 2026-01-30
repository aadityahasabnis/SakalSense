// =============================================
// Badges Components - Difficulty and Status badges
// =============================================

import { CheckCircle2, XCircle, Target, Clock, AlertCircle, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// =============================================
// Difficulty Badge
// =============================================

type Difficulty = 'BEGINNER' | 'EASY' | 'INTERMEDIATE' | 'MEDIUM' | 'ADVANCED' | 'HARD' | 'EXPERT';

interface IDifficultyConfig {
    label: string;
    className: string;
}

const DIFFICULTY_CONFIG: Record<string, IDifficultyConfig> = {
    BEGINNER: { label: 'Beginner', className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
    EASY: { label: 'Easy', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
    INTERMEDIATE: { label: 'Intermediate', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
    MEDIUM: { label: 'Medium', className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
    ADVANCED: { label: 'Advanced', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
    HARD: { label: 'Hard', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
    EXPERT: { label: 'Expert', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
};

interface IDifficultyBadgeProps {
    difficulty: string;
    size?: 'sm' | 'md';
    className?: string;
}

export const DifficultyBadge = ({ difficulty, size = 'md', className }: IDifficultyBadgeProps) => {
    const normalized = difficulty.toUpperCase();
    const config = DIFFICULTY_CONFIG[normalized] || { label: difficulty, className: 'bg-muted' };

    return (
        <Badge
            variant="outline"
            className={cn(
                config.className,
                size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
                className
            )}
        >
            {config.label}
        </Badge>
    );
};

// =============================================
// Status Badge
// =============================================

type StatusType = 'submission' | 'content' | 'course' | 'generic';

interface IStatusConfig {
    label: string;
    icon?: LucideIcon;
    className: string;
}

const STATUS_CONFIGS: Record<StatusType, Record<string, IStatusConfig>> = {
    submission: {
        PASSED: { label: 'Passed', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600 border-green-500/30' },
        ACCEPTED: { label: 'Accepted', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600 border-green-500/30' },
        FAILED: { label: 'Failed', icon: XCircle, className: 'bg-red-500/20 text-red-600 border-red-500/30' },
        REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-500/20 text-red-600 border-red-500/30' },
        PARTIAL: { label: 'Partial', icon: Target, className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
        PENDING: { label: 'Pending', icon: Clock, className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
        ERROR: { label: 'Error', icon: AlertCircle, className: 'bg-red-500/20 text-red-600 border-red-500/30' },
    },
    content: {
        DRAFT: { label: 'Draft', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
        PUBLISHED: { label: 'Published', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600 border-green-500/30' },
        ARCHIVED: { label: 'Archived', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
        PENDING: { label: 'Pending', icon: Clock, className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
    },
    course: {
        NOT_STARTED: { label: 'Not Started', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
        IN_PROGRESS: { label: 'In Progress', icon: Clock, className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
        COMPLETED: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600 border-green-500/30' },
    },
    generic: {
        ACTIVE: { label: 'Active', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
        INACTIVE: { label: 'Inactive', className: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
        PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
    },
};

interface IStatusBadgeProps {
    status: string;
    type?: StatusType;
    showIcon?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export const StatusBadge = ({
    status,
    type = 'generic',
    showIcon = true,
    size = 'md',
    className,
}: IStatusBadgeProps) => {
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    const typeConfigs = STATUS_CONFIGS[type] || STATUS_CONFIGS.generic;
    const config = typeConfigs[normalized] || { label: status, className: 'bg-muted' };
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1',
                config.className,
                size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
                className
            )}
        >
            {showIcon && Icon && <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
            {config.label}
        </Badge>
    );
};

// =============================================
// Content Type Badge
// =============================================

const CONTENT_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
    ARTICLE: { label: 'Article', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
    TUTORIAL: { label: 'Tutorial', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
    VIDEO: { label: 'Video', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
    COURSE: { label: 'Course', className: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30' },
    PROBLEM: { label: 'Problem', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
    QUIZ: { label: 'Quiz', className: 'bg-pink-500/20 text-pink-600 border-pink-500/30' },
};

interface IContentTypeBadgeProps {
    type: string;
    size?: 'sm' | 'md';
    className?: string;
}

export const ContentTypeBadge = ({ type, size = 'md', className }: IContentTypeBadgeProps) => {
    const normalized = type.toUpperCase();
    const config = CONTENT_TYPE_CONFIG[normalized] || { label: type, className: 'bg-muted' };

    return (
        <Badge
            variant="outline"
            className={cn(
                config.className,
                size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
                className
            )}
        >
            {config.label}
        </Badge>
    );
};

// =============================================
// XP Badge
// =============================================

interface IXPBadgeProps {
    xp: number;
    size?: 'sm' | 'md';
    className?: string;
}

export const XPBadge = ({ xp, size = 'md', className }: IXPBadgeProps) => {
    return (
        <Badge
            variant="outline"
            className={cn(
                'bg-amber-500/20 text-amber-600 border-amber-500/30',
                size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
                className
            )}
        >
            +{xp} XP
        </Badge>
    );
};

// =============================================
// Level Badge
// =============================================

interface ILevelBadgeProps {
    level: number;
    size?: 'sm' | 'md';
    className?: string;
}

export const LevelBadge = ({ level, size = 'md', className }: ILevelBadgeProps) => {
    const getColor = () => {
        if (level >= 50) return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
        if (level >= 30) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
        if (level >= 15) return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
        if (level >= 5) return 'bg-green-500/20 text-green-600 border-green-500/30';
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                getColor(),
                size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
                className
            )}
        >
            Lvl {level}
        </Badge>
    );
};
