'use client';
// =============================================
// Admin ProfileClient - Creator profile and stats page
// =============================================

import React, { useState } from 'react';

import Link from 'next/link';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Edit2,
    Eye,
    FileText,
    FolderOpen,
    GraduationCap,
    Heart,
    Key,
    Layers,
    Loader2,
    Mail,
    MessageSquare,
    PenTool,
    Save,
    Shield,
    Users,
    X,
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
import { Textarea } from '@/components/ui/textarea';
import {
    changeAdminPassword,
    deactivateAdminAccount,
    getAdminContentStats,
    getAdminCourseStats,
    getAdminProfile,
    type IUpdateAdminProfileInput,
    updateAdminProfile,
} from '@/server/actions/admin/adminProfileActions';

interface IProfileClientProps {
    adminId: string;
}

// =============================================
// Main Component
// =============================================

export const ProfileClient = ({ adminId }: IProfileClientProps) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<IUpdateAdminProfileInput>({});
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [deactivateConfirm, setDeactivateConfirm] = useState('');

    // Fetch profile
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['admin-profile', adminId],
        queryFn: getAdminProfile,
        staleTime: 60000,
    });

    // Fetch content stats
    const { data: contentStatsData, isLoading: contentStatsLoading } = useQuery({
        queryKey: ['admin-content-stats', adminId],
        queryFn: getAdminContentStats,
        staleTime: 60000,
    });

    // Fetch course stats
    const { data: courseStatsData, isLoading: courseStatsLoading } = useQuery({
        queryKey: ['admin-course-stats', adminId],
        queryFn: getAdminCourseStats,
        staleTime: 60000,
    });

    // Update profile mutation
    const updateMutation = useMutation({
        mutationFn: (input: IUpdateAdminProfileInput) => updateAdminProfile(input),
        onSuccess: (result) => {
            if (result.success) {
                void queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
                setIsEditing(false);
                setEditForm({});
            }
        },
    });

    // Change password mutation
    const passwordMutation = useMutation({
        mutationFn: (input: { currentPassword: string; newPassword: string }) => changeAdminPassword(input),
        onSuccess: (result) => {
            if (result.success) {
                setShowPasswordDialog(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        },
    });

    // Deactivate account mutation
    const deactivateMutation = useMutation({
        mutationFn: deactivateAdminAccount,
        onSuccess: (result) => {
            if (result.success) {
                window.location.href = '/login/admin';
            }
        },
    });

    const profile = profileData?.data;
    const contentStats = contentStatsData?.data;
    const courseStats = courseStatsData?.data;

    const handleStartEdit = () => {
        if (profile) {
            setEditForm({
                fullName: profile.fullName,
                avatarLink: profile.avatarLink ?? '',
                bio: profile.bio ?? '',
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

    const handleChangePassword = () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return;
        }
        passwordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        });
    };

    const handleDeactivateAccount = () => {
        if (deactivateConfirm === 'DEACTIVATE') {
            deactivateMutation.mutate();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'default';
            case 'DRAFT':
                return 'secondary';
            case 'ARCHIVED':
                return 'outline';
            default:
                return 'secondary';
        }
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
                        <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
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
                                    <Badge variant="secondary" className="gap-1">
                                        <PenTool className="h-3 w-3" />
                                        Creator
                                    </Badge>
                                    {!profile.isActive && (
                                        <Badge variant="destructive">Inactive</Badge>
                                    )}
                                </div>

                                {profile.bio && (
                                    <p className="mb-3 max-w-lg text-sm text-muted-foreground">{profile.bio}</p>
                                )}

                                <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                                        <Mail className="h-4 w-4" />
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                                        <Calendar className="h-4 w-4" />
                                        <span>Member since {formatDate(profile.createdAt)}</span>
                                    </div>
                                    {profile.invitedBy && (
                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                            <Users className="h-4 w-4" />
                                            <span>Invited by {profile.invitedBy.fullName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                                    <StatBadge icon={FileText} value={profile.stats.contentsCreated} label="contents" />
                                    <StatBadge icon={FolderOpen} value={profile.stats.seriesCreated} label="series" />
                                    <StatBadge icon={GraduationCap} value={profile.stats.coursesCreated} label="courses" />
                                    <StatBadge icon={Users} value={profile.stats.followersCount} label="followers" />
                                    <StatBadge icon={Eye} value={profile.stats.totalContentViews} label="views" />
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
                                        <Label htmlFor="avatarLink">Avatar URL</Label>
                                        <Input
                                            id="avatarLink"
                                            value={editForm.avatarLink ?? ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, avatarLink: e.target.value }))}
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            value={editForm.bio ?? ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {(editForm.bio ?? '').length}/500 characters
                                        </p>
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

                {/* Tabs for Content, Courses & Settings */}
                <Tabs defaultValue="content" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="courses">Courses</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* Content Tab */}
                    <TabsContent value="content" className="space-y-4">
                        {/* Content Overview */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Views"
                                value={contentStats?.totalViews ?? 0}
                                icon={Eye}
                                loading={contentStatsLoading}
                            />
                            <StatCard
                                title="Total Likes"
                                value={contentStats?.totalLikes ?? 0}
                                icon={Heart}
                                loading={contentStatsLoading}
                            />
                            <StatCard
                                title="Comments"
                                value={contentStats?.totalComments ?? 0}
                                icon={MessageSquare}
                                loading={contentStatsLoading}
                            />
                            <StatCard
                                title="Total Content"
                                value={profile.stats.contentsCreated}
                                icon={FileText}
                                loading={false}
                            />
                        </div>

                        {/* Content by Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Content by Type</CardTitle>
                                <CardDescription>Distribution of your content types</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contentStatsLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-8 w-full" />
                                        ))}
                                    </div>
                                ) : contentStats?.contentByType && contentStats.contentByType.length > 0 ? (
                                    <div className="space-y-3">
                                        {contentStats.contentByType.map((item) => {
                                            const total = contentStats.contentByType.reduce((s, c) => s + c.count, 0);
                                            const percentage = total > 0 ? (item.count / total) * 100 : 0;
                                            return (
                                                <div key={item.type} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{item.type}</span>
                                                        <span className="text-muted-foreground">{item.count}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No content created yet</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Contents */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Recent Content</CardTitle>
                                    <CardDescription>Your latest published content</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/admin/content">View All</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {contentStatsLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : contentStats?.recentContents && contentStats.recentContents.length > 0 ? (
                                    <div className="space-y-3">
                                        {contentStats.recentContents.map((content) => (
                                            <Link
                                                key={content.id}
                                                href={`/admin/content/${content.id}`}
                                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{content.title}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>{content.type}</span>
                                                        <span>-</span>
                                                        <span>{content.viewCount} views</span>
                                                    </div>
                                                </div>
                                                <Badge variant={getStatusColor(content.status)}>
                                                    {content.status}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No content created yet</p>
                                        <Button className="mt-4" size="sm" asChild>
                                            <Link href="/admin/content/new">Create Content</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Courses Tab */}
                    <TabsContent value="courses" className="space-y-4">
                        {/* Course Overview */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard
                                title="Total Courses"
                                value={profile.stats.coursesCreated}
                                icon={GraduationCap}
                                loading={false}
                            />
                            <StatCard
                                title="Total Enrollments"
                                value={courseStats?.totalEnrollments ?? 0}
                                icon={Users}
                                loading={courseStatsLoading}
                            />
                            <StatCard
                                title="Completions"
                                value={courseStats?.totalCompletions ?? 0}
                                icon={Layers}
                                loading={courseStatsLoading}
                            />
                        </div>

                        {/* Courses List */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Your Courses</CardTitle>
                                    <CardDescription>Manage your courses and track enrollments</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/admin/courses">View All</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {courseStatsLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-20 w-full" />
                                        ))}
                                    </div>
                                ) : courseStats?.courses && courseStats.courses.length > 0 ? (
                                    <div className="space-y-3">
                                        {courseStats.courses.map((course) => (
                                            <Link
                                                key={course.id}
                                                href={`/admin/courses/${course.id}`}
                                                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{course.title}</p>
                                                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>{course.enrollmentCount} enrolled</span>
                                                        <span>{course.completionRate}% completion rate</span>
                                                    </div>
                                                </div>
                                                <Badge variant={getStatusColor(course.status)}>
                                                    {course.status}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No courses created yet</p>
                                        <Button className="mt-4" size="sm" asChild>
                                            <Link href="/admin/courses/new">Create Course</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Account Settings</CardTitle>
                                <CardDescription>Manage your account security and preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Change Password */}
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">Change Password</p>
                                        <p className="text-sm text-muted-foreground">
                                            Update your account password
                                        </p>
                                    </div>
                                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                <Key className="mr-2 h-4 w-4" />
                                                Change
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Change Password</DialogTitle>
                                                <DialogDescription>
                                                    Enter your current password and choose a new one.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword">Current Password</Label>
                                                    <Input
                                                        id="currentPassword"
                                                        type="password"
                                                        value={passwordForm.currentPassword}
                                                        onChange={(e) =>
                                                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) =>
                                                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={(e) =>
                                                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                                {passwordForm.newPassword !== passwordForm.confirmPassword &&
                                                    passwordForm.confirmPassword && (
                                                        <p className="text-sm text-destructive">Passwords do not match</p>
                                                    )}
                                                {passwordMutation.data && !passwordMutation.data.success && (
                                                    <p className="text-sm text-destructive">{passwordMutation.data.error}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleChangePassword}
                                                    disabled={
                                                        passwordMutation.isPending ||
                                                        !passwordForm.currentPassword ||
                                                        !passwordForm.newPassword ||
                                                        passwordForm.newPassword !== passwordForm.confirmPassword
                                                    }
                                                >
                                                    {passwordMutation.isPending ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Key className="mr-2 h-4 w-4" />
                                                    )}
                                                    Update Password
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Logout */}
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">Log Out</p>
                                        <p className="text-sm text-muted-foreground">
                                            Sign out of your account on this device
                                        </p>
                                    </div>
                                    <LogoutButton role="ADMIN" loginPath="/login/admin" />
                                </div>

                                {/* Deactivate Account */}
                                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                                    <div>
                                        <p className="font-medium text-destructive">Deactivate Account</p>
                                        <p className="text-sm text-muted-foreground">
                                            Deactivate your account. Your content will remain but you won&apos;t be able to log in.
                                        </p>
                                    </div>
                                    <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive">Deactivate</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Deactivate Account</DialogTitle>
                                                <DialogDescription>
                                                    This will deactivate your account. You won&apos;t be able to log in,
                                                    but your content will remain published. Contact an administrator to reactivate.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <p className="text-sm">
                                                    Type <strong>DEACTIVATE</strong> to confirm:
                                                </p>
                                                <Input
                                                    value={deactivateConfirm}
                                                    onChange={(e) => setDeactivateConfirm(e.target.value)}
                                                    placeholder="DEACTIVATE"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeactivateAccount}
                                                    disabled={deactivateConfirm !== 'DEACTIVATE' || deactivateMutation.isPending}
                                                >
                                                    {deactivateMutation.isPending ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : null}
                                                    Deactivate Account
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
    label,
}: {
    icon: React.ElementType;
    value: number;
    label: string;
}) => (
    <div className="flex items-center gap-1.5 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value.toLocaleString()}</span>
        <span className="text-muted-foreground">{label}</span>
    </div>
);

const StatCard = ({
    title,
    value,
    icon: Icon,
    loading,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    loading: boolean;
}) => (
    <Card>
        <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                    {loading ? (
                        <>
                            <Skeleton className="mb-2 h-8 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{title}</p>
                        </>
                    )}
                </div>
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
        </CardContent>
    </Card>
);

const ProfileSkeleton = () => (
    <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
            <Skeleton className="mb-6 h-8 w-32" />
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-full max-w-md" />
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
