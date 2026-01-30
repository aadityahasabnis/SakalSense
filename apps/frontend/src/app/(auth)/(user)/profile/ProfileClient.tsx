'use client';
// =============================================
// ProfileClient - Professional user profile page
// Clean, minimal design with all features properly integrated
// =============================================

import React, { useState, Suspense } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Bookmark,
    BookmarkX,
    Check,
    ChevronRight,
    Clock,
    Edit2,
    Eye,
    Flame,
    Heart,
    Key,
    Loader2,
    Mail,
    MessageSquare,
    Save,
    Settings,
    Shield,
    Trash2,
    TrendingUp,
    Trophy,
    User,
} from 'lucide-react';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { ActivityCalendar, MonthCalendar } from '@/components/profile/ActivityCalendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getUserBookmarks, toggleBookmark } from '@/server/actions/engagement/bookmarkActions';
import {
    changePassword,
    deleteUserAccount,
    getUserProfile,
    getUserReadingHistory,
    getUserStatsSummary,
    getYearlyActivity,
    type IUpdateProfileInput,
    updateUserProfile
} from '@/server/actions/user/profileActions';

// =============================================
// Types
// =============================================

interface IProfileClientProps {
    userId: string;
}

type TabValue = 'overview' | 'activity' | 'bookmarks' | 'settings';

// =============================================
// Main Component
// =============================================

export const ProfileClient = ({ userId }: IProfileClientProps) => {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <ProfileClientInner userId={userId} />
        </Suspense>
    );
};

const ProfileClientInner = ({ userId }: IProfileClientProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // URL-based tab state
    const currentTab = (searchParams.get('tab') as TabValue) ?? 'overview';

    const handleTabChange = (tab: string) => {
        router.push(`/profile?tab=${tab}`, { scroll: false });
    };

    // Local state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<IUpdateProfileInput>({});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [activityYear, setActivityYear] = useState(new Date().getFullYear());

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Fetch profile
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['user-profile', userId],
        queryFn: getUserProfile,
        staleTime: 60000,
    });

    // Fetch stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['user-stats', userId],
        queryFn: getUserStatsSummary,
        staleTime: 60000,
    });

    // Fetch reading history
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['user-history', userId],
        queryFn: () => getUserReadingHistory({ page: 1, limit: 5 }),
        staleTime: 60000,
    });

    // Fetch yearly activity for calendar
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['user-yearly-activity', userId, activityYear],
        queryFn: () => getYearlyActivity(activityYear),
        staleTime: 300000,
    });

    // Fetch bookmarks (lazy load when tab is active)
    const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
        queryKey: ['user-bookmarks', userId],
        queryFn: () => getUserBookmarks({ page: 1, limit: 20 }),
        staleTime: 60000,
        enabled: currentTab === 'bookmarks',
    });

    // Mutations
    const updateMutation = useMutation({
        mutationFn: (input: IUpdateProfileInput) => updateUserProfile(input),
        onSuccess: (result) => {
            if (result.success) {
                void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
                setIsEditing(false);
                setEditForm({});
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUserAccount,
        onSuccess: (result) => {
            if (result.success) {
                window.location.href = '/login';
            }
        },
    });

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: (result) => {
            if (result.success) {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
                setPasswordSuccess(true);
                setTimeout(() => setPasswordSuccess(false), 3000);
            } else {
                setPasswordError(result.error ?? 'Failed to change password');
            }
        },
        onError: () => {
            setPasswordError('Failed to change password');
        },
    });

    const removeBookmarkMutation = useMutation({
        mutationFn: toggleBookmark,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
            void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
    });

    // Data
    const profile = profileData?.data;
    const stats = statsData?.data;
    const history = historyData?.data?.history ?? [];
    const bookmarks = bookmarksData?.data ?? [];
    const yearlyActivity = activityData?.data ?? [];

    // Handlers
    const handleStartEdit = () => {
        if (profile) {
            setEditForm({
                fullName: profile.fullName,
                mobile: profile.mobile ?? '',
                avatarLink: profile.avatarLink ?? '',
            });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const handleSaveProfile = () => {
        updateMutation.mutate(editForm);
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText === 'DELETE') {
            deleteMutation.mutate();
        }
    };

    const handlePasswordChange = () => {
        setPasswordError('');
        setPasswordSuccess(false);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        passwordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    };

    // Format time spent in human-readable format
    const formatTimeSpent = (minutes: number): string => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    // Loading state
    if (profileLoading) {
        return <ProfileSkeleton />;
    }

    if (!profile) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">Profile Not Found</h3>
                        <p className="text-sm text-muted-foreground">
                            Unable to load your profile. Please try again.
                        </p>
                        <Button className="mt-4" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border">
                        <AvatarImage src={profile.avatarLink ?? undefined} alt={profile.fullName} />
                        <AvatarFallback className="text-xl font-medium">
                            {getInitials(profile.fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{profile.fullName}</h1>
                            {profile.isVerified && (
                                <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-xs">
                                    <Shield className="h-3 w-3" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Member since {formatDate(profile.createdAt)}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Edit Profile
                </Button>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your profile information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={editForm.fullName ?? ''}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Phone Number</Label>
                            <Input
                                id="mobile"
                                value={editForm.mobile ?? ''}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                                placeholder="+1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avatarLink">Avatar URL</Label>
                            <Input
                                id="avatarLink"
                                value={editForm.avatarLink ?? ''}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, avatarLink: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stats Overview Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<Flame className="h-4 w-4" />}
                    label="Current Streak"
                    value={profile.stats.currentStreak}
                    suffix="days"
                    highlight={profile.stats.currentStreak > 0}
                />
                <StatCard
                    icon={<Trophy className="h-4 w-4" />}
                    label="Best Streak"
                    value={profile.stats.longestStreak}
                    suffix="days"
                />
                <StatCard
                    icon={<Clock className="h-4 w-4" />}
                    label="Time Spent"
                    value={formatTimeSpent(stats?.totalTimeSpent ?? 0)}
                    loading={statsLoading}
                />
                <StatCard
                    icon={<Check className="h-4 w-4" />}
                    label="Completed"
                    value={stats?.contentRead ?? 0}
                    suffix="items"
                    loading={statsLoading}
                />
            </div>

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="h-9 w-full justify-start rounded-lg bg-muted/50 p-1">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                    <TabsTrigger value="bookmarks" className="text-xs">Bookmarks</TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Activity Summary */}
                        <div className="lg:col-span-2">
                            <ActivityCalendar
                                activityData={yearlyActivity}
                                year={activityYear}
                                onYearChange={setActivityYear}
                                loading={activityLoading}
                            />
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Bookmark className="h-3.5 w-3.5" />
                                            Bookmarks
                                        </span>
                                        <span className="text-sm font-medium">{profile.stats.bookmarksCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Heart className="h-3.5 w-3.5" />
                                            Likes
                                        </span>
                                        <span className="text-sm font-medium">{profile.stats.likesCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Comments
                                        </span>
                                        <span className="text-sm font-medium">{profile.stats.commentsCount}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            Courses Enrolled
                                        </span>
                                        <span className="text-sm font-medium">{profile.stats.coursesEnrolled}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Month */}
                            <MonthCalendar
                                activityData={yearlyActivity}
                                loading={activityLoading}
                            />
                        </div>
                    </div>

                    {/* Recent History */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link href="/profile?tab=activity">
                                    View all
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-1">
                                    {history.slice(0, 5).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/content/${item.content.slug}`}
                                            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {item.content.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                                        {item.content.type}
                                                    </Badge>
                                                    <span>{item.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="w-20">
                                                <Progress value={item.progress} className="h-1" />
                                            </div>
                                            {item.isCompleted && (
                                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No activity yet. Start learning!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <ActivityCalendar
                        activityData={yearlyActivity}
                        year={activityYear}
                        onYearChange={setActivityYear}
                        loading={activityLoading}
                    />

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Reading History</CardTitle>
                            <CardDescription className="text-xs">
                                Your complete learning journey
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-1">
                                    {history.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/content/${item.content.slug}`}
                                            className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate font-medium">{item.content.title}</p>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                                        {item.content.type}
                                                    </Badge>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {item.isCompleted ? 'Completed' : `${item.progress}%`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24">
                                                    <Progress value={item.progress} className="h-1.5" />
                                                </div>
                                                {item.isCompleted && (
                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Eye className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">No reading history yet</p>
                                    <Button className="mt-4" variant="outline" size="sm" asChild>
                                        <Link href="/articles">Start Reading</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bookmarks Tab */}
                <TabsContent value="bookmarks" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Your Bookmarks</CardTitle>
                            <CardDescription className="text-xs">
                                {bookmarksData?.total ?? 0} saved items
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookmarksLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : bookmarks.length > 0 ? (
                                <div className="space-y-2">
                                    {bookmarks.map((bookmark) => (
                                        <div
                                            key={bookmark.id}
                                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <Link
                                                href={`/content/${bookmark.content.slug}`}
                                                className="flex flex-1 items-center gap-3 min-w-0"
                                            >
                                                {bookmark.content.thumbnailUrl ? (
                                                    <img
                                                        src={bookmark.content.thumbnailUrl}
                                                        alt=""
                                                        className="h-12 w-16 shrink-0 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-muted">
                                                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {bookmark.content.title}
                                                    </p>
                                                    <Badge variant="outline" className="mt-1 h-4 px-1 text-[10px]">
                                                        {bookmark.content.type}
                                                    </Badge>
                                                </div>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeBookmarkMutation.mutate(bookmark.content.id)}
                                                disabled={removeBookmarkMutation.isPending}
                                            >
                                                <BookmarkX className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Bookmark className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">No bookmarks yet</p>
                                    <Button className="mt-4" variant="outline" size="sm" asChild>
                                        <Link href="/articles">Browse Content</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    {/* Change Password */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Key className="h-4 w-4" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                currentPassword: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                newPassword: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-xs text-destructive">{passwordError}</p>
                                )}
                                {passwordSuccess && (
                                    <p className="text-xs text-emerald-600">Password changed successfully!</p>
                                )}

                                <Button
                                    size="sm"
                                    onClick={handlePasswordChange}
                                    disabled={
                                        passwordMutation.isPending ||
                                        !passwordForm.currentPassword ||
                                        !passwordForm.newPassword ||
                                        !passwordForm.confirmPassword
                                    }
                                >
                                    {passwordMutation.isPending && (
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    )}
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Settings className="h-4 w-4" />
                                Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">Sign Out</p>
                                    <p className="text-xs text-muted-foreground">
                                        Sign out from this device
                                    </p>
                                </div>
                                <LogoutButton role="USER" loginPath="/login" />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-destructive/30 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-destructive">Delete Account</p>
                                    <p className="text-xs text-muted-foreground">
                                        Permanently delete your account
                                    </p>
                                </div>
                                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete Account</DialogTitle>
                                            <DialogDescription>
                                                This action cannot be undone. All your data will be permanently removed.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <p className="text-sm">
                                                Type <strong>DELETE</strong> to confirm:
                                            </p>
                                            <Input
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                placeholder="DELETE"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleDeleteAccount}
                                                disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                                            >
                                                {deleteMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Delete Account
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// =============================================
// Stat Card Component
// =============================================

const StatCard = ({
    icon,
    label,
    value,
    suffix,
    loading,
    highlight,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    suffix?: string;
    loading?: boolean;
    highlight?: boolean;
}) => (
    <Card className={cn(highlight && 'border-orange-500/30 bg-orange-500/5')}>
        <CardContent className="flex items-center gap-3 p-4">
            <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                highlight ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground'
            )}>
                {icon}
            </div>
            <div>
                {loading ? (
                    <Skeleton className="mb-1 h-6 w-12" />
                ) : (
                    <p className="text-lg font-semibold leading-none">
                        {value}
                        {suffix && <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span>}
                    </p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </CardContent>
    </Card>
);

// =============================================
// Loading Skeleton
// =============================================

const ProfileSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
            ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
    </div>
);
