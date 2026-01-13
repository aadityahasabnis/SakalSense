'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Archive, Clock, Edit, Eye, Heart, Send, Trash2 } from 'lucide-react';

import { EmptyState, LoadingSpinner, PageHeader } from '@/components/common/PageElements';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/constants/content.constants';
import { useContentActions, useContentDetail } from '@/hooks/useContentActions';

interface IContentViewClientProps { contentId: string }

export const ContentViewClient = ({ contentId }: IContentViewClientProps) => {
    const router = useRouter();
    const { data: content, loading, fetch } = useContentDetail(contentId);
    const { remove, publish, archive } = useContentActions();

    useEffect(() => { fetch(); }, [fetch]);

    const handlePublish = () => publish(contentId, () => router.refresh());
    const handleArchive = () => archive(contentId, () => router.refresh());
    const handleDelete = () => remove(contentId, () => router.push('/admin/content'));

    if (loading) return <LoadingSpinner />;
    if (!content) return <EmptyState title="Content not found" action={{ label: 'Back to Content', href: '/admin/content' }} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader title={content.title} description={content.slug} backHref="/admin/content" />
                <div className="flex items-center gap-2">
                    {content.status !== 'PUBLISHED' && <Button onClick={handlePublish}><Send className="mr-2 h-4 w-4" />Publish</Button>}
                    <Button variant="outline" asChild><Link href={`/admin/content/${contentId}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></Button>
                    {content.status !== 'ARCHIVED' && <Button variant="outline" onClick={handleArchive}><Archive className="mr-2 h-4 w-4" />Archive</Button>}
                    <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Badge className={CONTENT_STATUS_COLORS[content.status]}>{CONTENT_STATUS_LABELS[content.status]}</Badge>
                <Badge variant="outline">{CONTENT_TYPE_LABELS[content.type]}</Badge>
                <Badge className={DIFFICULTY_COLORS[content.difficulty]}>{DIFFICULTY_LABELS[content.difficulty]}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle></CardHeader><CardContent><div className="flex gap-4 text-sm"><span className="flex items-center gap-1"><Eye className="h-4 w-4" />{content.viewCount}</span><span className="flex items-center gap-1"><Heart className="h-4 w-4" />{content.likeCount}</span></div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Creator</CardTitle></CardHeader><CardContent><p className="text-sm">{content.creator.fullName}</p></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dates</CardTitle></CardHeader><CardContent><div className="text-sm space-y-1"><div className="flex items-center gap-1"><Clock className="h-4 w-4" />Created: {new Date(content.createdAt).toLocaleDateString()}</div>{content.publishedAt && <div>Published: {new Date(content.publishedAt).toLocaleDateString()}</div>}</div></CardContent></Card>
            </div>

            {content.excerpt && <Card><CardHeader><CardTitle>Excerpt</CardTitle></CardHeader><CardContent><p>{content.excerpt}</p></CardContent></Card>}
            {content.description && <Card><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p>{content.description}</p></CardContent></Card>}

            <Card>
                <CardHeader><CardTitle>Content Body</CardTitle></CardHeader>
                <CardContent><div className="prose max-w-none">{typeof content.body === 'string' ? <pre className="whitespace-pre-wrap">{content.body}</pre> : <p className="text-muted-foreground">No content body</p>}</div></CardContent>
            </Card>
        </div>
    );
};
