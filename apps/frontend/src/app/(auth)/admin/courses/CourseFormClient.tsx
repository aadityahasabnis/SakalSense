'use client';
// =============================================
// CourseFormClient - Course create/edit form with sections & lessons
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { ArrowLeft, GripVertical, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { createCourse, getCourseById, updateCourse } from '@/server/actions/content/courseActions';

interface ICourseFormClientProps {
    mode: 'create' | 'edit';
    courseId?: string;
}

interface ICourseFormData {
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string;
    difficulty: DifficultyType;
    estimatedHours: number;
}

const generateSlug = (title: string): string =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const CourseFormClient = ({ mode, courseId }: ICourseFormClientProps) => {
    const router = useRouter();
    const [, addNotification] = useAtom(addNotificationAtom);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');

    const [formData, setFormData] = useState<ICourseFormData>({
        title: '',
        slug: '',
        description: '',
        thumbnailUrl: '',
        difficulty: 'BEGINNER',
        estimatedHours: 0,
    });

    // =============================================
    // Data Loading (Edit Mode)
    // =============================================

    useEffect(() => {
        if (mode === 'edit' && courseId) {
            const loadData = async () => {
                const result = await getCourseById(courseId);
                if (result.success && result.data) {
                    const { title, slug, description, thumbnailUrl, difficulty, estimatedHours } = result.data;
                    setFormData({
                        title,
                        slug,
                        description: description ?? '',
                        thumbnailUrl: thumbnailUrl ?? '',
                        difficulty,
                        estimatedHours: estimatedHours ?? 0,
                    });
                } else {
                    addNotification({ type: 'error', message: result.error ?? 'Failed to load course' });
                    router.push('/admin/courses');
                }
                setLoading(false);
            };
            void loadData();
        }
    }, [mode, courseId, addNotification, router]);

    // =============================================
    // Field Handlers
    // =============================================

    const updateField = <K extends keyof ICourseFormData>(key: K, value: ICourseFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleTitleChange = (title: string) => {
        updateField('title', title);
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

        const courseData = {
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || undefined,
            thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
            difficulty: formData.difficulty,
            estimatedHours: formData.estimatedHours || undefined,
        };

        if (mode === 'create') {
            const result = await createCourse(courseData);
            if (result.success && result.data?.id) {
                addNotification({ type: 'success', message: 'Course created successfully' });
                router.push(`/admin/courses/${result.data.id}`);
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to create course' });
            }
        } else if (courseId) {
            const result = await updateCourse(courseId, courseData);
            if (result.success) {
                addNotification({ type: 'success', message: 'Course updated successfully' });
                router.push(`/admin/courses/${courseId}`);
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to update course' });
            }
        }

        setSaving(false);
    };

    // =============================================
    // Render
    // =============================================

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/courses">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {mode === 'create' ? 'Create Course' : 'Edit Course'}
                        </h1>
                        <p className="text-muted-foreground">
                            {mode === 'create'
                                ? 'Create a new structured learning course'
                                : 'Update course information'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/courses">Cancel</Link>
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Course
                    </Button>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Enter course title"
                            disabled={saving}
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => updateField('slug', e.target.value)}
                            placeholder="course-url-slug"
                            disabled={saving}
                        />
                        <p className="text-xs text-muted-foreground">
                            URL: /courses/{formData.slug || 'your-slug'}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Brief description of what students will learn"
                            rows={4}
                            disabled={saving}
                        />
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Difficulty */}
                        <div className="space-y-2">
                            <Label>Difficulty Level *</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(v) => updateField('difficulty', v as DifficultyType)}
                                disabled={saving}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estimated Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="estimatedHours">Estimated Hours</Label>
                            <Input
                                id="estimatedHours"
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.estimatedHours || ''}
                                onChange={(e) => updateField('estimatedHours', parseFloat(e.target.value) || 0)}
                                placeholder="10"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Thumbnail URL */}
                    <div className="space-y-2">
                        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                        <Input
                            id="thumbnailUrl"
                            value={formData.thumbnailUrl}
                            onChange={(e) => updateField('thumbnailUrl', e.target.value)}
                            placeholder="https://example.com/thumbnail.jpg"
                            disabled={saving}
                        />
                        <p className="text-xs text-muted-foreground">
                            Used in course cards and preview (recommended: 16:9 aspect ratio)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Info about sections */}
            {mode === 'create' && (
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                        <GripVertical className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <h3 className="mb-2 font-semibold">Add Sections & Lessons</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            After creating the course, you can add sections and lessons from the course view page.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
