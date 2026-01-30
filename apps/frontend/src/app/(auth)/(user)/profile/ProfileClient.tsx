'use client';
// =============================================
// ProfileClient - User profile and settings page
// =============================================

import React, { useState } from 'react';

import Link from 'next/link';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Bookmark,
    Calendar,
    Edit2,
    Heart,
    Loader2,
    Mail,
    MessageSquare,
    Phone,
    Save,
    Shield,
    Trash2,
    Trophy,
    User,
    X,
    Zap
} from 'lucide-react';

import { LogoutButton } from '@/components/auth/LogoutButton';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    deleteUserAccount,
    getUserProfile,
    getUserReadingHistory,
    getUserStatsSummary,
    type IUpdateProfileInput,
    updateUserProfile
} from '@/server/actions/user/profileActions';

interface IProfileClientProps {
    userId: string;
}

// =============================================
// Main Component
// =============================================

export const ProfileClient = ({ userId }: IProfileClientProps) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<IUpdateProfileInput>({});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

    // Update profile mutation
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

    // Delete account mutation
    const deleteMutation = useMutation({
        mutationFn: deleteUserAccount,
        onSuccess: (result) => {
            if (result.success) {
                window.location.href = '/login';
            }
        },
    });

    const profile = profileData?.data;
    const stats = statsData?.data;
    const history = historyData?.data?.history ?? [];

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
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Loading state
    if (profileLoading) {
        return <ProfileSkeleton />;
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen items-center justify-center">
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
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/explore">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Explore
                        </Link>
                    </Button>
                </div>

                {/* Profile Header Card */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                            {/* Avatar */}
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={profile.avatarLink ?? undefined} alt={profile.fullName} />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(profile.fullName)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Profile Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
                                    <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                                    {profile.isVerified && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Shield className="h-3 w-3" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                                        <Mail className="h-4 w-4" />
                                        <span>{profile.email}</span>
                                    </div>
                                    {profile.mobile && (
                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                            <Phone className="h-4 w-4" />
                                            <span>{profile.mobile}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                                        <Calendar className="h-4 w-4" />
                                        <span>Member since {formatDate(profile.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                                    <StatBadge icon={Zap} value={profile.stats.currentStreak} label="day streak" />
                                    <StatBadge icon={Trophy} value={profile.stats.longestStreak} label="best streak" />
                                    <StatBadge icon={Bookmark} value={profile.stats.bookmarksCount} label="bookmarks" />
                                    <StatBadge icon={Heart} value={profile.stats.likesCount} label="likes" />
                                    <StatBadge icon={MessageSquare} value={profile.stats.commentsCount} label="comments" />
                                </div>
                            </div>

                            {/* Edit Button */}
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <Button variant="outline" onClick={handleStartEdit}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            disabled={updateMutation.isPending}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={updateMutation.isPending}
                                        >
                                            {updateMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Save
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                            <>
                                <Separator className="my-6" />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={editForm.fullName ?? ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                            placeholder="Your full name"
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
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="avatarLink">Avatar URL</Label>
                                        <Input
                                            id="avatarLink"
                                            value={editForm.avatarLink ?? ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, avatarLink: e.target.value }))}
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                    {updateMutation.isError && (
                                        <p className="text-sm text-destructive sm:col-span-2">
                                            Failed to update profile. Please try again.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Tabs for Activity & Settings */}
                <Tabs defaultValue="activity" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="progress">Progress</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-4">
                        {/* Weekly Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">This Week&apos;s Activity</CardTitle>
                                <CardDescription>Your learning activity over the past 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? (
                                    <div className="flex gap-2">
                                        {Array.from({ length: 7 }).map((_, i) => (
                                            <Skeleton key={i} className="h-20 flex-1" />
                                        ))}
                                    </div>
                                ) : stats?.thisWeekActivity ? (
                                    <div className="flex gap-2">
                                        {stats.thisWeekActivity.map((day) => (
                                            <ActivityDay key={day.date} date={day.date} count={day.count} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No activity data available</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Reading History */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Recent Reading</CardTitle>
                                    <CardDescription>Content you&apos;ve been reading</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/dashboard/history">View All</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {historyLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="space-y-3">
                                        {history.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/content/${item.content.slug}`}
                                                className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.content.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.isCompleted ? 'Completed' : `${item.progress}% complete`}
                                                    </p>
                                                </div>
                                                <Badge variant={item.isCompleted ? 'default' : 'secondary'}>
                                                    {item.content.type}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No reading history yet. Start exploring content!
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Progress Tab */}
                    <TabsContent value="progress" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <ProgressCard
                                title="Content Read"
                                value={stats?.contentRead ?? 0}
                                description="Articles and tutorials completed"
                                loading={statsLoading}
                            />
                            <ProgressCard
                                title="Courses Completed"
                                value={stats?.coursesCompleted ?? 0}
                                description="Full courses finished"
                                loading={statsLoading}
                            />
                            <ProgressCard
                                title="Time Spent"
                                value={`${stats?.totalTimeSpent ?? 0}m`}
                                description="Total learning time"
                                loading={statsLoading}
                            />
                            <ProgressCard
                                title="Courses Enrolled"
                                value={profile.stats.coursesEnrolled}
                                description="Courses you're taking"
                                loading={false}
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Streak Stats</CardTitle>
                                <CardDescription>Keep your learning streak going!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Zap className="h-8 w-8 text-orange-500" />
                                            <span className="text-4xl font-bold">{profile.stats.currentStreak}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Current Streak</p>
                                    </div>
                                    <Separator orientation="vertical" className="h-16" />
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="h-8 w-8 text-yellow-500" />
                                            <span className="text-4xl font-bold">{profile.stats.longestStreak}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Longest Streak</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Account Actions</CardTitle>
                                <CardDescription>Manage your account</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Logout */}
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">Log Out</p>
                                        <p className="text-sm text-muted-foreground">
                                            Sign out of your account on this device
                                        </p>
                                    </div>
                                    <LogoutButton role="USER" loginPath="/login" />
                                </div>

                                {/* Delete Account */}
                                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                                    <div>
                                        <p className="font-medium text-destructive">Delete Account</p>
                                        <p className="text-sm text-muted-foreground">
                                            Permanently delete your account and all data
                                        </p>
                                    </div>
                                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Account</DialogTitle>
                                                <DialogDescription>
                                                    This action cannot be undone. This will permanently delete your
                                                    account and remove all your data from our servers.
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
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowDeleteDialog(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteAccount}
                                                    disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
                                                >
                                                    {deleteMutation.isPending ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4" />
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
        </div>
    );
};

// =============================================
// Helper Components
// =============================================

const StatBadge = ({
    icon: Icon,
    value,
    label
}: {
    icon: React.ElementType;
    value: number;
    label: string;
}) => (
    <div className="flex items-center gap-1.5 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value}</span>
        <span className="text-muted-foreground">{label}</span>
    </div>
);

const ActivityDay = ({ date, count }: { date: string; count: number }) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const intensity = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3;

    const bgColors = [
        'bg-muted',
        'bg-green-200 dark:bg-green-900',
        'bg-green-400 dark:bg-green-700',
        'bg-green-600 dark:bg-green-500',
    ];

    return (
        <div className="flex flex-1 flex-col items-center gap-2">
            <div
                className={`h-12 w-full rounded ${bgColors[intensity]}`}
                title={`${count} activities on ${date}`}
            />
            <span className="text-xs text-muted-foreground">{dayName}</span>
        </div>
    );
};

const ProgressCard = ({
    title,
    value,
    description,
    loading
}: {
    title: string;
    value: number | string;
    description: string;
    loading: boolean;
}) => (
    <Card>
        <CardContent className="pt-6">
            {loading ? (
                <>
                    <Skeleton className="mb-2 h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                </>
            ) : (
                <>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </>
            )}
        </CardContent>
    </Card>
);

const ProfileSkeleton = () => (
    <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8">
            <Skeleton className="mb-6 h-8 w-32" />
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="flex gap-4">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-28" />
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-10 w-full max-w-md" />
        </div>
    </div>
);
