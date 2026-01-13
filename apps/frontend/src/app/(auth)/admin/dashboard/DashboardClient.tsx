'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { ArrowUpRight, Clock, Eye, FileText, Heart } from 'lucide-react';

import { EmptyState, LoadingSpinner, PageHeader, StatCard } from '@/components/common/PageElements';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, type ContentStatusType, type ContentType } from '@/constants/content.constants';
import { getDashboardStats, getRecentContent } from '@/server/actions/content/dashboardActions';

interface IRecentContent { id: string; title: string; type: string; status: ContentStatusType; viewCount: number; createdAt: Date }

export const DashboardClient = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalContent: 0, totalViews: 0, totalLikes: 0, publishedCount: 0, draftCount: 0, reviewCount: 0 });
    const [recentContent, setRecentContent] = useState<Array<IRecentContent>>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [statsResult, recentResult] = await Promise.all([getDashboardStats(), getRecentContent()]);
            if (statsResult.success && statsResult.data) setStats(statsResult.data);
            if (recentResult.success && recentResult.data) setRecentContent(recentResult.data);
            setLoading(false);
        };
        void fetchData();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <PageHeader title="Dashboard" description="Welcome back! Here's an overview of your content." action={{ label: 'New Content', href: '/admin/content/new' }} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Content" value={stats.totalContent} description={`${stats.publishedCount} published, ${stats.draftCount} drafts`} icon={<FileText className="h-4 w-4" />} />
                <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} description="Across all content" icon={<Eye className="h-4 w-4" />} />
                <StatCard title="Total Likes" value={stats.totalLikes.toLocaleString()} description="User engagement" icon={<Heart className="h-4 w-4" />} />
                <StatCard title="In Review" value={stats.reviewCount} description="Awaiting approval" icon={<Clock className="h-4 w-4" />} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Recent Content</CardTitle><CardDescription>Your latest articles, tutorials, and projects</CardDescription></div>
                    <Button variant="ghost" size="sm" asChild><Link href="/admin/content">View All<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
                </CardHeader>
                <CardContent>
                    {recentContent.length === 0 ? (
                        <EmptyState title="No content yet" action={{ label: 'Create your first piece!', href: '/admin/content/new' }} />
                    ) : (
                        <div className="space-y-4">
                            {recentContent.map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                                        <div>
                                            <Link href={`/admin/content/${item.id}`} className="font-medium hover:underline">{item.title}</Link>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>{CONTENT_TYPE_LABELS[item.type as ContentType]}</span><span>•</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">{item.viewCount.toLocaleString()} views</span>
                                        <Badge className={CONTENT_STATUS_COLORS[item.status]}>{CONTENT_STATUS_LABELS[item.status]}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
