'use client';

// =============================================
// Professional Content Form - Complete Rewrite
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
    ArrowLeft,
    Check,
    Eye,
    Loader2,
    Plus,
    Save,
    Send,
    Sparkles,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    CONTENT_TYPE,
    CONTENT_TYPE_LABELS,
    type ContentType,
    DIFFICULTY_LABELS,
    DIFFICULTY_LEVEL,
    type DifficultyType,
} from '@/constants/content.constants';
import {
    createContent,
    getContentById,
    publishContent,
    updateContent,
} from '@/server/actions/content/contentActions';
import {
    getAllCategories,
    getDomains,
    getOrCreateTopic,
    searchTopics,
} from '@/server/actions/content/taxonomyActions';
import {
    type ICategory,
    type IContentInput,
    type IDomain,
    type ITopic,
} from '@/types/content.types';

// =============================================
// Types
// =============================================

interface IContentFormProps {
    mode: 'create' | 'edit';
    contentId?: string;
}

interface ITopicBase {
    id: string;
    name: string;
    slug: string;
}

// =============================================
// Helper Functions
// =============================================

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const validateForm = (data: IContentInput): Array<string> => {
    const errors: Array<string> = [];

    if (!data.title || data.title.trim().length < 3) {
        errors.push('Title must be at least 3 characters');
    }

    if (!data.slug || data.slug.trim().length < 3) {
        errors.push('Slug must be at least 3 characters');
    }

    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
        errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    if (!data.excerpt || data.excerpt.trim().length < 10) {
        errors.push('Excerpt must be at least 10 characters');
    }

    if (!data.description || data.description.trim().length < 20) {
        errors.push('Description must be at least 20 characters');
    }

    if (!data.body || (typeof data.body === 'string' && data.body.trim().length < 50)) {
        errors.push('Content body must be at least 50 characters');
    }

    return errors;
};

// =============================================
// Main Component
// =============================================

export const ContentFormClient = ({ mode, contentId }: IContentFormProps) => {
    const router = useRouter();

    // Loading states
    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState('content');
    const [errors, setErrors] = useState<Array<string>>([]);

    // Taxonomy data
    const [domains, setDomains] = useState<Array<IDomain>>([]);
    const [categories, setCategories] = useState<Array<ICategory & { domainId: string }>>([]);
    const [selectedDomainId, setSelectedDomainId] = useState('');

    // Topics
    const [selectedTopics, setSelectedTopics] = useState<Array<ITopicBase>>([]);
    const [topicInput, setTopicInput] = useState('');
    const [topicSuggestions, setTopicSuggestions] = useState<Array<ITopic>>([]);
    const [showTopicDropdown, setShowTopicDropdown] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(false);

    // Form data
    const [formData, setFormData] = useState<IContentInput>({
        title: '',
        slug: '',
        description: '',
        excerpt: '',
        type: CONTENT_TYPE.ARTICLE,
        difficulty: DIFFICULTY_LEVEL.BEGINNER,
        body: '',
        thumbnailUrl: '',
        coverImageUrl: '',
        sourceCodeUrl: '',
        metaTitle: '',
        metaDescription: '',
        categoryId: '',
        topicIds: [],
        isFeatured: false,
    });

    // Filtered categories based on selected domain
    const filteredCategories = selectedDomainId
        ? categories.filter((c) => c.domainId === selectedDomainId)
        : categories;

    // =============================================
    // Data Loading
    // =============================================

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load domains and categories in parallel
                const [domainsRes, categoriesRes] = await Promise.all([
                    getDomains(),
                    getAllCategories(),
                ]);

                if (domainsRes.success && domainsRes.data) {
                    setDomains(domainsRes.data);
                }

                if (categoriesRes.success && categoriesRes.data) {
                    setCategories(categoriesRes.data as Array<ICategory & { domainId: string }>);
                }

                // Load content if editing
                if (mode === 'edit' && contentId) {
                    const contentRes = await getContentById(contentId);

                    if (contentRes.success && contentRes.data) {
                        const content = contentRes.data;

                        // Extract form fields
                        const {
                            id: _id,
                            creator: _creator,
                            category,
                            topics,
                            viewCount: _viewCount,
                            likeCount: _likeCount,
                            commentCount: _commentCount,
                            featuredAt: _featuredAt,
                            publishedAt: _publishedAt,
                            createdAt: _createdAt,
                            updatedAt: _updatedAt,
                            status: _status,
                            ...rest
                        } = content;

                        setFormData({
                            ...rest,
                            categoryId: category?.id ?? '',
                            topicIds: topics.map((t) => t.id),
                            body: typeof rest.body === 'string' ? rest.body : JSON.stringify(rest.body),
                        });

                        setSelectedTopics(topics);

                        // Set domain if category exists
                        if (category && categoriesRes.success && categoriesRes.data) {
                            const cat = categoriesRes.data.find((c) => c.id === category.id);
                            if (cat && 'domainId' in cat) {
                                setSelectedDomainId((cat as { domainId: string }).domainId);
                            }
                        }
                    } else {
                        toast.error(contentRes.error ?? 'Failed to load content');
                        router.push('/admin/content');
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        void loadInitialData();
    }, [mode, contentId, router]);

    // =============================================
    // Topic Search with Debounce
    // =============================================

    useEffect(() => {
        const searchDebounce = setTimeout(async () => {
            if (topicInput.trim().length >= 2) {
                setLoadingTopics(true);
                const result = await searchTopics(topicInput.trim());

                if (result.success && result.data) {
                    // Filter out already selected topics
                    const filtered = result.data.filter(
                        (t) => !selectedTopics.some((st) => st.id === t.id),
                    );
                    setTopicSuggestions(filtered);
                    setShowTopicDropdown(filtered.length > 0);
                } else {
                    setTopicSuggestions([]);
                    setShowTopicDropdown(false);
                }
                setLoadingTopics(false);
            } else {
                setTopicSuggestions([]);
                setShowTopicDropdown(false);
            }
        }, 300);

        return () => clearTimeout(searchDebounce);
    }, [topicInput, selectedTopics]);

    // =============================================
    // Form Handlers
    // =============================================

    const updateField = <K extends keyof IContentInput>(key: K, value: IContentInput[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleTitleChange = (title: string) => {
        updateField('title', title);

        // Auto-generate slug only on create and if slug is empty or auto-generated
        if (mode === 'create' || !formData.slug || formData.slug === generateSlug(formData.title)) {
            updateField('slug', generateSlug(title));
        }

        // Auto-fill meta title if empty
        if (!formData.metaTitle) {
            updateField('metaTitle', title);
        }
    };

    const handleExcerptChange = (excerpt: string) => {
        updateField('excerpt', excerpt);

        // Auto-fill meta description if empty
        if (!formData.metaDescription) {
            updateField('metaDescription', excerpt);
        }
    };

    const handleDomainChange = (domainId: string) => {
        setSelectedDomainId(domainId);

        // Clear category if it doesn't belong to new domain
        const currentCat = categories.find((c) => c.id === formData.categoryId);
        if (currentCat && currentCat.domainId !== domainId) {
            updateField('categoryId', '');
        }
    };

    const handleAddTopic = async (topic?: ITopic) => {
        try {
            if (topic) {
                // Add existing topic
                setSelectedTopics((prev) => [...prev, topic]);
                setFormData((prev) => ({
                    ...prev,
                    topicIds: [...(prev.topicIds ?? []), topic.id],
                }));
            } else if (topicInput.trim()) {
                // Create new topic
                const result = await getOrCreateTopic(topicInput.trim());

                if (result.success && result.data) {
                    setSelectedTopics((prev) => [...prev, result.data!]);
                    setFormData((prev) => ({
                        ...prev,
                        topicIds: [...(prev.topicIds ?? []), result.data!.id],
                    }));
                    toast.success(`Topic "${result.data.name}" added`);
                } else {
                    toast.error(result.error ?? 'Failed to create topic');
                }
            }

            setTopicInput('');
            setShowTopicDropdown(false);
        } catch (error) {
            console.error('Error adding topic:', error);
            toast.error('Failed to add topic');
        }
    };

    const handleRemoveTopic = (topicId: string) => {
        setSelectedTopics((prev) => prev.filter((t) => t.id !== topicId));
        setFormData((prev) => ({
            ...prev,
            topicIds: (prev.topicIds ?? []).filter((id) => id !== topicId),
        }));
    };

    // =============================================
    // Save Handlers
    // =============================================

    const handleSaveDraft = async () => {
        console.log('=== SAVE DRAFT CLICKED ===');
        console.log('Form Data:', formData);
        
        // Validate form
        const validationErrors = validateForm(formData);
        console.log('Validation Errors:', validationErrors);

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            toast.error('Please fix the errors before saving');
            setActiveTab('content'); // Switch to content tab to show errors
            return;
        }

        setSaving(true);
        setErrors([]);

        try {
            console.log('Calling createContent with:', formData);
            const result =
                mode === 'create'
                    ? await createContent(formData)
                    : await updateContent(contentId!, formData);

            console.log('Create/Update Result:', result);

            if (result.success) {
                console.log('✅ Content saved successfully');
                toast.success(result.message ?? 'Draft saved successfully');
                router.push('/admin/content');
            } else {
                console.error('❌ Save failed:', result.error);
                toast.error(result.error ?? 'Failed to save draft');
            }
        } catch (error) {
            console.error('💥 Exception during save:', error);
            toast.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        // Validate form
        const validationErrors = validateForm(formData);

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            toast.error('Please fix the errors before publishing');
            setActiveTab('content');
            return;
        }

        setPublishing(true);
        setErrors([]);

        try {
            // Save first
            const saveResult =
                mode === 'create'
                    ? await createContent(formData)
                    : await updateContent(contentId!, formData);

            if (!saveResult.success) {
                toast.error(saveResult.error ?? 'Failed to save content');
                setPublishing(false);
                return;
            }

            // Then publish
            const publishResult = await publishContent(saveResult.data!.id);

            if (publishResult.success) {
                toast.success(publishResult.message ?? 'Content published successfully');
                router.push('/admin/content');
            } else {
                toast.error(publishResult.error ?? 'Failed to publish content');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            toast.error('An error occurred while publishing');
        } finally {
            setPublishing(false);
        }
    };

    const handlePreview = () => {
        // TODO: Implement preview in a modal or new tab
        toast.info('Preview feature coming soon');
    };

    // =============================================
    // Render Loading
    // =============================================

    if (loading) {
        return (
            <div className='flex min-h-[600px] items-center justify-center'>
                <div className='text-center'>
                    <Loader2 className='mx-auto h-8 w-8 animate-spin text-primary' />
                    <p className='mt-4 text-sm text-muted-foreground'>Loading content...</p>
                </div>
            </div>
        );
    }

    // =============================================
    // Render Form
    // =============================================

    return (
        <div className='mx-auto max-w-6xl space-y-6 pb-16'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <Button variant='ghost' size='icon' asChild disabled={saving || publishing}>
                        <Link href='/admin/content'>
                            <ArrowLeft className='h-5 w-5' />
                        </Link>
                    </Button>
                    <div>
                        <h1 className='text-3xl font-bold'>
                            {mode === 'create' ? 'Create Content' : 'Edit Content'}
                        </h1>
                        <p className='text-muted-foreground'>
                            {mode === 'create'
                                ? 'Create a new article, tutorial, or project'
                                : 'Update your content'}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handlePreview}
                        disabled={saving || publishing}
                    >
                        <Eye className='mr-2 h-4 w-4' />
                        Preview
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleSaveDraft}
                        disabled={saving || publishing}
                    >
                        {saving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className='mr-2 h-4 w-4' />
                                Save Draft
                            </>
                        )}
                    </Button>
                    <Button size='sm' onClick={handlePublish} disabled={saving || publishing}>
                        {publishing ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Send className='mr-2 h-4 w-4' />
                                Publish
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
                <Card className='border-destructive bg-destructive/5'>
                    <CardHeader>
                        <CardTitle className='text-sm text-destructive'>
                            Please fix the following errors:
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className='list-inside list-disc space-y-1 text-sm text-destructive'>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='content'>
                        <Sparkles className='mr-2 h-4 w-4' />
                        Content
                    </TabsTrigger>
                    <TabsTrigger value='settings'>Settings</TabsTrigger>
                    <TabsTrigger value='seo'>SEO</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value='content' className='space-y-6'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                The main details of your content that will be displayed to readers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {/* Title */}
                            <div className='space-y-2'>
                                <Label htmlFor='title'>
                                    Title <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='title'
                                    value={formData.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    placeholder='Enter a compelling title that captures attention...'
                                    className='text-lg font-medium'
                                    maxLength={100}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {formData.title.length}/100 characters •{' '}
                                    {formData.title.length < 10 && 'Too short'}
                                    {formData.title.length >= 10 && formData.title.length < 40 && 'Could be longer'}
                                    {formData.title.length >= 40 && formData.title.length <= 60 && '✓ Good length'}
                                    {formData.title.length > 60 && 'Consider shortening'}
                                </p>
                            </div>

                            {/* Slug */}
                            <div className='space-y-2'>
                                <Label htmlFor='slug'>
                                    URL Slug <span className='text-destructive'>*</span>
                                </Label>
                                <Input
                                    id='slug'
                                    value={formData.slug}
                                    onChange={(e) => updateField('slug', e.target.value.toLowerCase())}
                                    placeholder='url-friendly-slug-with-hyphens'
                                    className='font-mono text-sm'
                                />
                                <div className='space-y-1'>
                                    <p className='text-xs text-muted-foreground'>
                                        Preview: sakalsense.com/content/
                                        <span className='font-semibold text-foreground'>{formData.slug || 'your-slug'}</span>
                                    </p>
                                    {formData.slug && !/^[a-z0-9-]+$/.test(formData.slug) && (
                                        <p className='text-xs text-destructive'>
                                            ⚠ Only lowercase letters, numbers, and hyphens allowed
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Excerpt */}
                            <div className='space-y-2'>
                                <Label htmlFor='excerpt'>
                                    Excerpt <span className='text-destructive'>*</span>
                                </Label>
                                <Textarea
                                    id='excerpt'
                                    value={formData.excerpt ?? ''}
                                    onChange={(e) => handleExcerptChange(e.target.value)}
                                    placeholder='A brief, engaging summary that makes readers want to learn more (shown in cards and previews)'
                                    rows={2}
                                    maxLength={200}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {(formData.excerpt ?? '').length}/200 characters •{' '}
                                    {(formData.excerpt ?? '').length < 50 && 'Consider adding more detail'}
                                    {(formData.excerpt ?? '').length >= 50 && (formData.excerpt ?? '').length <= 160 && '✓ Good length'}
                                    {(formData.excerpt ?? '').length > 160 && 'Consider shortening for better display'}
                                </p>
                            </div>

                            {/* Description */}
                            <div className='space-y-2'>
                                <Label htmlFor='description'>
                                    Description <span className='text-destructive'>*</span>
                                </Label>
                                <Textarea
                                    id='description'
                                    value={formData.description ?? ''}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder='A detailed description of what readers will learn and why it matters'
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {(formData.description ?? '').length}/500 characters •{' '}
                                    {(formData.description ?? '').length < 100 && 'Add more detail'}
                                    {(formData.description ?? '').length >= 100 && (formData.description ?? '').length <= 400 && '✓ Good length'}
                                    {(formData.description ?? '').length > 400 && 'Consider being more concise'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Body */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Body</CardTitle>
                            <CardDescription>
                                The main content that will be displayed to readers. Use Markdown for formatting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Label htmlFor='body'>
                                    Body <span className='text-destructive'>*</span>
                                </Label>
                                <RichTextEditor
                                    value={typeof formData.body === 'string' ? formData.body : ''}
                                    onChange={(value) => updateField('body', value)}
                                    placeholder='Write your amazing content here... Full Markdown support with live preview!'
                                    minHeight={500}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {typeof formData.body === 'string' ? formData.body.length : 0} characters
                                    • Markdown supported with live preview
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value='settings' className='space-y-6'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Settings</CardTitle>
                            <CardDescription>Configure the type, category, and tags</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {/* Type & Difficulty */}
                            <div className='grid gap-6 md:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label htmlFor='type'>Content Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => updateField('type', v as ContentType)}
                                    >
                                        <SelectTrigger id='type'>
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
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='difficulty'>Difficulty Level</Label>
                                    <Select
                                        value={formData.difficulty}
                                        onValueChange={(v) => updateField('difficulty', v as DifficultyType)}
                                    >
                                        <SelectTrigger id='difficulty'>
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
                            </div>

                            <Separator />

                            {/* Domain & Category */}
                            <div className='grid gap-6 md:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label htmlFor='domain'>Domain</Label>
                                    <Select value={selectedDomainId} onValueChange={handleDomainChange}>
                                        <SelectTrigger id='domain'>
                                            <SelectValue placeholder='Select a domain first' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {domains.length === 0 ? (
                                                <SelectItem value='none' disabled>
                                                    No domains available
                                                </SelectItem>
                                            ) : (
                                                domains.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.icon && <span className='mr-2'>{d.icon}</span>}
                                                        {d.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {domains.length === 0 && (
                                        <p className='text-xs text-amber-600'>
                                            Contact administrator to add domains
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='category'>Category</Label>
                                    <Select
                                        value={formData.categoryId || '__none__'}
                                        onValueChange={(v) => updateField('categoryId', v === '__none__' ? '' : v)}
                                        disabled={!selectedDomainId}
                                    >
                                        <SelectTrigger id='category'>
                                            <SelectValue
                                                placeholder={
                                                    selectedDomainId
                                                        ? 'Select a category'
                                                        : 'Select domain first'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.length === 0 ? (
                                                <SelectItem value='none' disabled>
                                                    No categories in this domain
                                                </SelectItem>
                                            ) : (
                                                <>
                                                    <SelectItem value='__none__'>None (No Category)</SelectItem>
                                                    {filteredCategories.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            {/* Topics */}
                            <div className='space-y-3'>
                                <Label>Topics (Tags)</Label>

                                {/* Selected Topics */}
                                {selectedTopics.length > 0 && (
                                    <div className='flex flex-wrap gap-2'>
                                        {selectedTopics.map((topic) => (
                                            <Badge key={topic.id} variant='secondary' className='gap-2 pr-1'>
                                                <span>{topic.name}</span>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-4 w-4 hover:bg-destructive/20'
                                                    onClick={() => handleRemoveTopic(topic.id)}
                                                >
                                                    <X className='h-3 w-3' />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Topic Input */}
                                <div className='relative'>
                                    <div className='flex gap-2'>
                                        <div className='relative flex-1'>
                                            <Input
                                                value={topicInput}
                                                onChange={(e) => setTopicInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        void handleAddTopic();
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (topicSuggestions.length > 0) {
                                                        setShowTopicDropdown(true);
                                                    }
                                                }}
                                                placeholder='Type to search or create a new topic...'
                                            />
                                            {loadingTopics && (
                                                <Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
                                            )}
                                        </div>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            size='icon'
                                            onClick={() => handleAddTopic()}
                                            disabled={!topicInput.trim() || loadingTopics}
                                        >
                                            <Plus className='h-4 w-4' />
                                        </Button>
                                    </div>

                                    {/* Topic Dropdown */}
                                    {showTopicDropdown && topicSuggestions.length > 0 && (
                                        <Card className='absolute z-10 mt-1 w-full shadow-lg'>
                                            <CardContent className='p-1'>
                                                {topicSuggestions.map((topic) => (
                                                    <button
                                                        key={topic.id}
                                                        type='button'
                                                        className='flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-accent'
                                                        onClick={() => handleAddTopic(topic)}
                                                    >
                                                        <Check className='h-4 w-4 text-muted-foreground' />
                                                        <span>{topic.name}</span>
                                                    </button>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                <p className='text-xs text-muted-foreground'>
                                    Press Enter or click + to add. Select from suggestions or create new.
                                </p>
                            </div>

                            {/* Source Code URL (for projects) */}
                            {formData.type === CONTENT_TYPE.PROJECT && (
                                <>
                                    <Separator />
                                    <div className='space-y-2'>
                                        <Label htmlFor='sourceCodeUrl'>Source Code URL</Label>
                                        <Input
                                            id='sourceCodeUrl'
                                            type='url'
                                            value={formData.sourceCodeUrl ?? ''}
                                            onChange={(e) => updateField('sourceCodeUrl', e.target.value)}
                                            placeholder='https://github.com/username/repo'
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Media & Visibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media & Visibility</CardTitle>
                            <CardDescription>Images and featured settings</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {/* Featured Toggle */}
                            <div className='flex items-center justify-between rounded-lg border p-4'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='featured' className='text-base'>
                                        Featured Content
                                    </Label>
                                    <p className='text-sm text-muted-foreground'>
                                        Display prominently on homepage and listings
                                    </p>
                                </div>
                                <Switch
                                    id='featured'
                                    checked={formData.isFeatured ?? false}
                                    onCheckedChange={(checked) => updateField('isFeatured', checked)}
                                />
                            </div>

                            <Separator />

                            {/* Images */}
                            <div className='space-y-4'>
                                <div className='space-y-2'>
                                    <Label htmlFor='thumbnailUrl'>Thumbnail URL</Label>
                                    <Input
                                        id='thumbnailUrl'
                                        type='url'
                                        value={formData.thumbnailUrl ?? ''}
                                        onChange={(e) => updateField('thumbnailUrl', e.target.value)}
                                        placeholder='https://example.com/thumbnail.jpg'
                                    />
                                    <p className='text-xs text-muted-foreground'>
                                        Recommended: 800x600px • Shown in cards and listings
                                    </p>
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor='coverImageUrl'>Cover Image URL</Label>
                                    <Input
                                        id='coverImageUrl'
                                        type='url'
                                        value={formData.coverImageUrl ?? ''}
                                        onChange={(e) => updateField('coverImageUrl', e.target.value)}
                                        placeholder='https://example.com/cover.jpg'
                                    />
                                    <p className='text-xs text-muted-foreground'>
                                        Recommended: 1200x400px • Shown as header banner
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value='seo' className='space-y-6'>
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Optimization</CardTitle>
                            <CardDescription>
                                Optimize your content for search engines and social media
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {/* Meta Title */}
                            <div className='space-y-2'>
                                <Label htmlFor='metaTitle'>Meta Title</Label>
                                <Input
                                    id='metaTitle'
                                    value={formData.metaTitle ?? ''}
                                    onChange={(e) => updateField('metaTitle', e.target.value)}
                                    placeholder={formData.title || 'Page title for search engines'}
                                    maxLength={60}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {(formData.metaTitle ?? formData.title).length}/60 characters • Keep it
                                    under 60 for best results
                                </p>
                            </div>

                            {/* Meta Description */}
                            <div className='space-y-2'>
                                <Label htmlFor='metaDescription'>Meta Description</Label>
                                <Textarea
                                    id='metaDescription'
                                    value={formData.metaDescription ?? ''}
                                    onChange={(e) => updateField('metaDescription', e.target.value)}
                                    placeholder={formData.excerpt ?? 'Description for search engines'}
                                    rows={3}
                                    maxLength={160}
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {(formData.metaDescription ?? formData.excerpt ?? '').length}/160
                                    characters • Keep it under 160 for best results
                                </p>
                            </div>

                            <Separator />

                            {/* Google Preview */}
                            <div>
                                <Label className='mb-3 block'>Search Preview</Label>
                                <div className='rounded-lg border bg-muted/30 p-4'>
                                    <p className='text-lg font-medium text-blue-600 hover:underline'>
                                        {formData.metaTitle || formData.title || 'Your Title Here'}
                                    </p>
                                    <p className='text-sm text-green-700'>
                                        sakalsense.com › content › {formData.slug || 'your-slug'}
                                    </p>
                                    <p className='mt-1 text-sm text-muted-foreground'>
                                        {formData.metaDescription ||
                                            formData.excerpt ||
                                            'Your description will appear here...'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Sticky Footer */}
            <div className='fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                <div className='container flex items-center justify-between py-4'>
                    <p className='text-sm text-muted-foreground'>
                        {mode === 'create' ? 'Creating new content' : 'Editing content'}
                    </p>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            onClick={handleSaveDraft}
                            disabled={saving || publishing}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className='mr-2 h-4 w-4' />
                                    Save Draft
                                </>
                            )}
                        </Button>
                        <Button onClick={handlePublish} disabled={saving || publishing}>
                            {publishing ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Send className='mr-2 h-4 w-4' />
                                    Publish Now
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
