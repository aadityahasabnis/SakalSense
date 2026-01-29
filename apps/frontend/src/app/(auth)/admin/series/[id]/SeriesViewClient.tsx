'use client';
// =============================================
// SeriesViewClient - View series with item management
// =============================================

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { Edit, Eye, GripVertical, Heart, Plus, Trash2, X } from 'lucide-react';

import { EmptyState, LoadingSpinner, PageHeader } from '@/components/common/PageElements';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, DIFFICULTY_LABELS } from '@/constants/content.constants';
import { useDialog } from '@/hooks/useDialog';
import { addNotificationAtom } from '@/jotai/atoms';
import { getContentList } from '@/server/actions/content/contentActions';
import { addSeriesItem, deleteSeries, getSeriesById, removeSeriesItem, reorderSeriesItems } from '@/server/actions/content/seriesActions';
import { type IContentListItem, type ISeriesWithItems } from '@/types/content.types';

interface ISeriesViewClientProps { seriesId: string }

export const SeriesViewClient = ({ seriesId }: ISeriesViewClientProps) => {
    const router = useRouter();
    const [, addNotification] = useAtom(addNotificationAtom);
    const { openDialog, DialogRenderer } = useDialog();

    const [series, setSeries] = useState<ISeriesWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Array<{ id: string; order: number; content: IContentListItem }>>([]);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [addingContent, setAddingContent] = useState(false);
    const [contentSearch, setContentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<IContentListItem>>([]);
    const [searching, setSearching] = useState(false);

    // =============================================
    // Data Loading
    // =============================================

    const fetchSeries = async () => {
        setLoading(true);
        const result = await getSeriesById(seriesId);
        if (result.success && result.data) {
            setSeries(result.data);
            setItems(result.data.items || []);
        } else {
            addNotification({ type: 'error', message: result.error ?? 'Failed to load series' });
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchSeries();
    }, [seriesId]);

    // =============================================
    // Content Search
    // =============================================

    useEffect(() => {
        const searchDebounce = setTimeout(async () => {
            if (contentSearch.trim().length >= 2) {
                setSearching(true);
                const result = await getContentList({
                    search: contentSearch,
                    type: series?.contentType,
                    status: 'PUBLISHED',
                    limit: 10,
                });
                if (result.success && result.data) {
                    // Filter out already added content
                    const filtered = result.data.contents.filter((c: IContentListItem) => !items.some(item => item.content.id === c.id));
                    setSearchResults(filtered);
                }
                setSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(searchDebounce);
    }, [contentSearch, series, items]);

    // =============================================
    // Item Management
    // =============================================

    const handleAddContent = async (content: IContentListItem) => {
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) + 1 : 0;
        const result = await addSeriesItem(seriesId, { contentId: content.id, order: nextOrder });
        if (result.success) {
            addNotification({ type: 'success', message: 'Content added to series' });
            void fetchSeries();
            setContentSearch('');
            setSearchResults([]);
        } else {
            addNotification({ type: 'error', message: result.error ?? 'Failed to add content' });
        }
    };

    const handleRemoveItem = (contentId: string, contentTitle: string) => {
        openDialog({
            type: 'confirm',
            title: 'Remove Content?',
            description: `Remove "${contentTitle}" from this series? The content itself will not be deleted.`,
            confirmLabel: 'Remove',
            variant: 'destructive',
            onConfirm: async () => {
                const result = await removeSeriesItem(seriesId, contentId);
                if (result.success) {
                    addNotification({ type: 'success', message: 'Content removed from series' });
                    void fetchSeries();
                } else {
                    addNotification({ type: 'error', message: result.error ?? 'Failed to remove content' });
                }
            },
        });
    };

    // =============================================
    // Drag and Drop Handlers
    // =============================================

    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        setDraggedItem(itemId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetItemId) return;

        const draggedIndex = items.findIndex(i => i.id === draggedItem);
        const targetIndex = items.findIndex(i => i.id === targetItemId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder items array
        const newItems = [...items];
        const removed = newItems[draggedIndex];
        if (!removed) return;

        newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        // Update orders
        const updatedItems = newItems.map((item, index) => ({ ...item, order: index }));
        setItems(updatedItems);
        setDraggedItem(null);

        // Save to backend
        const result = await reorderSeriesItems(
            seriesId,
            updatedItems.map(item => ({ id: item.id, order: item.order }))
        );

        if (result.success) {
            addNotification({ type: 'success', message: 'Order updated successfully' });
        } else {
            addNotification({ type: 'error', message: result.error ?? 'Failed to update order' });
            void fetchSeries(); // Revert on error
        }
    };

    // =============================================
    // Series Actions
    // =============================================

    const handleDelete = () => {
        openDialog({
            type: 'confirm',
            title: 'Delete Series?',
            description: `Delete "${series?.title}"? Series items will not be deleted.`,
            confirmLabel: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                const result = await deleteSeries(seriesId);
                if (result.success) {
                    addNotification({ type: 'success', message: 'Series deleted successfully' });
                    router.push('/admin/series');
                } else {
                    addNotification({ type: 'error', message: result.error ?? 'Failed to delete series' });
                }
            },
        });
    };

    // =============================================
    // Render
    // =============================================

    if (loading) return <LoadingSpinner />;
    if (!series) return <EmptyState title="Series not found" action={{ label: 'Back to Series', href: '/admin/series' }} />;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <PageHeader title={series.title} description={series.slug} backHref="/admin/series" />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/series/${seriesId}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                    <Badge className={CONTENT_STATUS_COLORS[series.status]}>{CONTENT_STATUS_LABELS[series.status]}</Badge>
                    <Badge variant="outline">{CONTENT_TYPE_LABELS[series.contentType]}</Badge>
                    <Badge variant="secondary">{items.length} items</Badge>
                </div>

                {/* Series Info */}
                {series.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{series.description}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Add Content Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Series Items</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setAddingContent(!addingContent)}>
                            {addingContent ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                            {addingContent ? 'Cancel' : 'Add Content'}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add Content Form */}
                        {addingContent && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        value={contentSearch}
                                        onChange={(e) => setContentSearch(e.target.value)}
                                        placeholder={`Search ${CONTENT_TYPE_LABELS[series.contentType]} to add...`}
                                    />
                                    {searching && <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="rounded-md border bg-card">
                                        {searchResults.map((content) => (
                                            <div key={content.id} className="flex items-center justify-between p-3 border-b last:border-0">
                                                <div className="flex-1">
                                                    <p className="font-medium">{content.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{DIFFICULTY_LABELS[content.difficulty]}</Badge>
                                                        <span className="text-xs text-muted-foreground">{content.viewCount} views</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleAddContent(content)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {contentSearch.length >= 2 && searchResults.length === 0 && !searching && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No matching content found</p>
                                )}
                            </div>
                        )}

                        {/* Items List */}
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No items yet. Add content to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground mb-2">Drag to reorder items</p>
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, item.id)}
                                        className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-move"
                                    >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.content.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">{DIFFICULTY_LABELS[item.content.difficulty]}</Badge>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Eye className="h-3 w-3" />
                                                    {item.content.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Heart className="h-3 w-3" />
                                                    {item.content.likeCount}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/content/${item.content.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(item.content.id, item.content.title)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {DialogRenderer()}
        </>
    );
};
