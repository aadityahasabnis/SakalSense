'use client';
// =============================================
// SeriesFormClient - Optimized series create/edit form
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CONTENT_TYPE_LABELS, type ContentType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { createSeries, getSeriesById, updateSeries } from '@/server/actions/content/seriesActions';

interface ISeriesFormClientProps { mode: 'create' | 'edit'; seriesId?: string }
interface ISeriesFormData { title: string; slug: string; description?: string; thumbnailUrl?: string; contentType: ContentType }

const generateSlug = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const SeriesFormClient = ({ mode, seriesId }: ISeriesFormClientProps) => {
    const router = useRouter();
    const [, addNotification] = useAtom(addNotificationAtom);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');

    const [formData, setFormData] = useState<ISeriesFormData>({
        title: '',
        slug: '',
        description: '',
        thumbnailUrl: '',
        contentType: 'ARTICLE',
    });

    // =============================================
    // Data Loading (Edit Mode)
    // =============================================

    useEffect(() => {
        if (mode === 'edit' && seriesId) {
            const loadData = async () => {
                const result = await getSeriesById(seriesId);
                if (result.success && result.data) {
                    const { title, slug, description, thumbnailUrl, contentType } = result.data;
                    setFormData({ title, slug, description: description ?? '', thumbnailUrl: thumbnailUrl ?? '', contentType });
                } else {
                    addNotification({ type: 'error', message: result.error ?? 'Failed to load series' });
                    router.push('/admin/series');
                }
                setLoading(false);
            };
            void loadData();
        }
    }, [mode, seriesId, addNotification, router]);

    // =============================================
    // Field Handlers
    // =============================================

    const updateField = <K extends keyof ISeriesFormData>(key: K, value: ISeriesFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleTitleChange = (title: string) => {
        updateField('title', title);
        // Auto-generate slug only in create mode and if slug is empty
        if (mode === 'create' && !formData.slug) {
            updateField('slug', generateSlug(title));
        }
    };

    // =============================================
    // Save Handler
    // =============================================

    const handleSave = async () => {
        // Validation
        if (!formData.title.trim() || !formData.slug.trim()) {
            addNotification({ type: 'error', message: 'Title and slug are required' });
            return;
        }

        setSaving(true);

        if (mode === 'create') {
            const result = await createSeries(formData);
            if (result.success && result.data?.id) {
                addNotification({ type: 'success', message: 'Series created successfully' });
                router.push(`/admin/series/${result.data.id}`);
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to create series' });
            }
        } else if (seriesId) {
            const result = await updateSeries(seriesId, formData);
            if (result.success) {
                addNotification({ type: 'success', message: 'Series updated successfully' });
                router.push(`/admin/series/${seriesId}`);
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to update series' });
            }
        }

        setSaving(false);
    };

    // =============================================
    // Render
    // =============================================

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/series">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{mode === 'create' ? 'Create Series' : 'Edit Series'}</h1>
                        <p className="text-muted-foreground">{mode === 'create' ? 'Create a new content series' : 'Update series information'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSave} loading={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Series
                    </Button>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Series Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Enter series title"
                            disabled={saving}
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Slug *</label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => updateField('slug', e.target.value)}
                            placeholder="series-url-slug"
                            disabled={saving}
                        />
                        <p className="text-xs text-muted-foreground">URL: /series/{formData.slug || 'your-slug'}</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Brief description of the series"
                            rows={4}
                            disabled={saving}
                        />
                    </div>

                    {/* Content Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content Type *</label>
                        <Select
                            value={formData.contentType}
                            onValueChange={(v) => updateField('contentType', v as ContentType)}
                            disabled={saving}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This series will only contain content of this type</p>
                    </div>

                    {/* Thumbnail URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thumbnail URL</label>
                        <Input
                            value={formData.thumbnailUrl}
                            onChange={(e) => updateField('thumbnailUrl', e.target.value)}
                            placeholder="https://example.com/thumbnail.jpg"
                            disabled={saving}
                        />
                        <p className="text-xs text-muted-foreground">Used in series cards and preview (400x300 recommended)</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
