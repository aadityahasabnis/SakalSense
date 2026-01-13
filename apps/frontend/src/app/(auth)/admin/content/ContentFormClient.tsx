'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { ArrowLeft, Eye, Plus, Save, Send, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CONTENT_TYPE_LABELS, type ContentType, DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { createContent, getContentById, publishContent, updateContent } from '@/server/actions/content/contentActions';
import { getAllCategories, getDomains, getOrCreateTopic, searchTopics } from '@/server/actions/content/taxonomyActions';
import { type ICategory, type IContentInput, type IDomain, type ITopic } from '@/types/content.types';

interface IContentFormClientProps { mode: 'create' | 'edit'; contentId?: string }

const generateSlug = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const ContentFormClient = ({ mode, contentId }: IContentFormClientProps) => {
    const router = useRouter();
    const [, addNotification] = useAtom(addNotificationAtom);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');

    // Taxonomy data
    const [domains, setDomains] = useState<Array<IDomain>>([]);
    const [categories, setCategories] = useState<Array<ICategory & { domainId: string }>>([]);
    const [selectedDomainId, setSelectedDomainId] = useState('');

    // Topics - use interface since topics from content may not have createdAt
    interface ITopicBase { id: string; name: string; slug: string }
    const [selectedTopics, setSelectedTopics] = useState<Array<ITopicBase>>([]);
    const [topicInput, setTopicInput] = useState('');
    const [topicSuggestions, setTopicSuggestions] = useState<Array<ITopic>>([]);
    const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);

    const [formData, setFormData] = useState<IContentInput>({
        title: '', slug: '', description: '', excerpt: '',
        type: 'ARTICLE', difficulty: 'BEGINNER', body: '',
        thumbnailUrl: '', coverImageUrl: '', sourceCodeUrl: '',
        metaTitle: '', metaDescription: '', categoryId: '', topicIds: [],
        isFeatured: false,
    });

    // Filtered categories based on selected domain
    const filteredCategories = selectedDomainId
        ? categories.filter(c => c.domainId === selectedDomainId)
        : categories;

    // =============================================
    // Data Loading
    // =============================================

    useEffect(() => {
        const loadData = async () => {
            // Load domains and categories
            const [domainsRes, categoriesRes] = await Promise.all([getDomains(), getAllCategories()]);
            if (domainsRes.success && domainsRes.data) setDomains(domainsRes.data);
            if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data as Array<ICategory & { domainId: string }>);

            // Load content if editing
            if (mode === 'edit' && contentId) {
                const result = await getContentById(contentId);
                if (result.success && result.data) {
                    const { id: _id, creator: _creator, category, topics, viewCount: _viewCount, likeCount: _likeCount, commentCount: _commentCount, featuredAt: _featuredAt, publishedAt: _publishedAt, createdAt: _createdAt, updatedAt: _updatedAt, status: _status, ...rest } = result.data;
                    setFormData({ ...rest, categoryId: category?.id ?? '', topicIds: topics.map(t => t.id), body: rest.body ?? '' });
                    setSelectedTopics(topics);
                    // Set the domain if category exists
                    if (category && categoriesRes.success && categoriesRes.data) {
                        const cat = categoriesRes.data.find(c => c.id === category.id);
                        if (cat && 'domainId' in cat) setSelectedDomainId((cat as { domainId: string }).domainId);
                    }
                } else addNotification({ type: 'error', message: result.error ?? 'Failed to load content' });
            }
            setLoading(false);
        };
        void loadData();
    }, [mode, contentId, addNotification]);

    // =============================================
    // Topic Search
    // =============================================

    useEffect(() => {
        const searchDebounce = setTimeout(async () => {
            if (topicInput.trim().length >= 2) {
                const result = await searchTopics(topicInput.trim());
                if (result.success && result.data) {
                    // Filter out already selected topics
                    const filtered = result.data.filter(t => !selectedTopics.some(st => st.id === t.id));
                    setTopicSuggestions(filtered);
                    setShowTopicSuggestions(true);
                }
            } else {
                setTopicSuggestions([]);
                setShowTopicSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(searchDebounce);
    }, [topicInput, selectedTopics]);

    // =============================================
    // Field Handlers
    // =============================================

    const updateField = <K extends keyof IContentInput>(key: K, value: IContentInput[K]) => setFormData(prev => ({ ...prev, [key]: value }));
    const handleTitleChange = (title: string) => { updateField('title', title); if (mode === 'create' && !formData.slug) updateField('slug', generateSlug(title)); };

    const handleDomainChange = (domainId: string) => {
        setSelectedDomainId(domainId);
        // Clear category if it doesn't belong to new domain
        const currentCat = categories.find(c => c.id === formData.categoryId);
        if (currentCat && currentCat.domainId !== domainId) updateField('categoryId', '');
    };

    const handleAddTopic = async (topic?: ITopic) => {
        if (topic) {
            setSelectedTopics(prev => [...prev, topic]);
            setFormData(prev => ({ ...prev, topicIds: [...(prev.topicIds ?? []), topic.id] }));
        } else if (topicInput.trim()) {
            // Create new topic
            const result = await getOrCreateTopic(topicInput.trim());
            if (result.success && result.data) {
                setSelectedTopics(prev => [...prev, result.data!]);
                setFormData(prev => ({ ...prev, topicIds: [...(prev.topicIds ?? []), result.data!.id] }));
            }
        }
        setTopicInput('');
        setShowTopicSuggestions(false);
    };

    const handleRemoveTopic = (topicId: string) => {
        setSelectedTopics(prev => prev.filter(t => t.id !== topicId));
        setFormData(prev => ({ ...prev, topicIds: (prev.topicIds ?? []).filter(id => id !== topicId) }));
    };

    const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void handleAddTopic();
        }
    };

    // =============================================
    // Save Handler
    // =============================================

    const handleSave = async (publish = false) => {
        if (!formData.title || !formData.slug) { addNotification({ type: 'error', message: 'Title and slug are required' }); return; }
        setSaving(true);
        const result = mode === 'create' ? await createContent(formData) : await updateContent(contentId!, formData);
        if (result.success) {
            if (publish && result.data?.id) await publishContent(result.data.id);
            addNotification({ type: 'success', message: publish ? 'Content published' : 'Content saved' });
            router.push('/admin/content');
        } else addNotification({ type: 'error', message: result.error ?? 'Failed to save' });
        setSaving(false);
    };

    // =============================================
    // Render
    // =============================================

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild><Link href="/admin/content"><ArrowLeft className="h-5 w-5" /></Link></Button>
                    <div><h1 className="text-2xl font-bold">{mode === 'create' ? 'Create Content' : 'Edit Content'}</h1><p className="text-muted-foreground">{mode === 'create' ? 'Create a new article, tutorial, or project' : 'Update your content'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={saving}><Eye className="mr-2 h-4 w-4" />Preview</Button>
                    <Button variant="outline" onClick={() => handleSave(false)} loading={saving}><Save className="mr-2 h-4 w-4" />Save Draft</Button>
                    <Button onClick={() => handleSave(true)} loading={saving}><Send className="mr-2 h-4 w-4" />Publish</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList><TabsTrigger value="content">Content</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger></TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><label className="text-sm font-medium">Title</label><Input value={formData.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Enter content title" /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Slug</label><Input value={formData.slug} onChange={e => updateField('slug', e.target.value)} placeholder="content-url-slug" /><p className="text-xs text-muted-foreground">URL: /content/{formData.slug || 'your-slug'}</p></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Excerpt</label><Textarea value={formData.excerpt ?? ''} onChange={e => updateField('excerpt', e.target.value)} placeholder="Brief description for previews" rows={2} /></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={formData.description ?? ''} onChange={e => updateField('description', e.target.value)} placeholder="Detailed description" rows={3} /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Content Body</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea value={typeof formData.body === 'string' ? formData.body : ''} onChange={e => updateField('body', e.target.value)} placeholder="Write your content here... (Rich editor coming soon)" rows={15} className="font-mono" />
                            <p className="mt-2 text-xs text-muted-foreground">Note: Rich editor integration planned for future</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Content Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Type & Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-sm font-medium">Type</label>
                                    <Select value={formData.type} onValueChange={v => updateField('type', v as ContentType)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><label className="text-sm font-medium">Difficulty</label>
                                    <Select value={formData.difficulty} onValueChange={v => updateField('difficulty', v as DifficultyType)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.entries(DIFFICULTY_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Domain & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Domain</label>
                                    <Select value={selectedDomainId} onValueChange={handleDomainChange}>
                                        <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                                        <SelectContent>
                                            {domains.length === 0
                                                ? <SelectItem value="none" disabled>No domains available</SelectItem>
                                                : domains.map(d => <SelectItem key={d.id} value={d.id}>{d.icon && <span className="mr-2">{d.icon}</span>}{d.name}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                    {domains.length === 0 && <p className="text-xs text-amber-600">Ask Administrator to add domains</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select value={formData.categoryId ?? ''} onValueChange={v => updateField('categoryId', v)} disabled={!selectedDomainId}>
                                        <SelectTrigger><SelectValue placeholder={selectedDomainId ? 'Select category' : 'Select domain first'} /></SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.length === 0
                                                ? <SelectItem value="none" disabled>No categories in this domain</SelectItem>
                                                : filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Topics */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Topics (Tags)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedTopics.map(topic => (
                                        <Badge key={topic.id} variant="secondary" className="gap-1 pr-1">
                                            {topic.name}
                                            <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={() => handleRemoveTopic(topic.id)}><X className="h-3 w-3" /></Button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="relative">
                                    <div className="flex gap-2">
                                        <Input value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={handleTopicKeyDown} onFocus={() => topicSuggestions.length > 0 && setShowTopicSuggestions(true)} placeholder="Type to search or create topic" />
                                        <Button variant="outline" size="icon" onClick={() => handleAddTopic()} disabled={!topicInput.trim()}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    {showTopicSuggestions && topicSuggestions.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                                            {topicSuggestions.map(topic => (
                                                <button key={topic.id} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => handleAddTopic(topic)}>{topic.name}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Press Enter to add a new topic, or select from suggestions</p>
                            </div>

                            {/* Source Code URL for Projects */}
                            {formData.type === 'PROJECT' && (
                                <div className="space-y-2"><label className="text-sm font-medium">Source Code URL</label><Input value={formData.sourceCodeUrl ?? ''} onChange={e => updateField('sourceCodeUrl', e.target.value)} placeholder="https://github.com/..." /></div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Media & Visibility */}
                    <Card>
                        <CardHeader><CardTitle>Media & Visibility</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Featured Toggle */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium">Featured Content</label>
                                    <p className="text-xs text-muted-foreground">Show this content prominently on the homepage</p>
                                </div>
                                <Switch
                                    checked={formData.isFeatured ?? false}
                                    onCheckedChange={(checked) => updateField('isFeatured', checked)}
                                />
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Thumbnail URL</label>
                                    <Input value={formData.thumbnailUrl ?? ''} onChange={e => updateField('thumbnailUrl', e.target.value)} placeholder="https://example.com/thumb.jpg" />
                                    <p className="text-xs text-muted-foreground">Used in cards and lists (400x300 recommended)</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cover Image URL</label>
                                    <Input value={formData.coverImageUrl ?? ''} onChange={e => updateField('coverImageUrl', e.target.value)} placeholder="https://example.com/cover.jpg" />
                                    <p className="text-xs text-muted-foreground">Used as header banner (1200x400 recommended)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><label className="text-sm font-medium">Meta Title</label><Input value={formData.metaTitle ?? ''} onChange={e => updateField('metaTitle', e.target.value)} placeholder={formData.title ?? 'Page title for search engines'} /><p className="text-xs text-muted-foreground">{(formData.metaTitle ?? formData.title).length}/60 characters</p></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Meta Description</label><Textarea value={formData.metaDescription ?? ''} onChange={e => updateField('metaDescription', e.target.value)} placeholder={formData.excerpt ?? 'Description for search engines'} rows={3} /><p className="text-xs text-muted-foreground">{(formData.metaDescription ?? formData.excerpt ?? '').length}/160 characters</p></div>
                            <div className="rounded-lg border p-4 bg-muted/50">
                                <p className="text-sm font-medium text-blue-600">{formData.metaTitle ?? formData.title ?? 'Page Title'}</p>
                                <p className="text-xs text-green-600">sakalsense.com/content/{formData.slug ?? 'your-slug'}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formData.metaDescription ?? formData.excerpt ?? 'Page description will appear here...'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
