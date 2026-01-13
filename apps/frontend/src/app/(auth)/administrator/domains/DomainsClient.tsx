'use client';

import { useEffect, useState } from 'react';

import { useAtom } from 'jotai';
import { Edit2, Layers, Plus, Tag, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LOADING_LABEL } from '@/constants/messages.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { createCategory, createDomain, createTopic, deleteCategory, deleteDomain, deleteTopic, getCategoryList, getDomainList, getTopicList, toggleDomainActive, updateCategory, updateDomain, updateTopic } from '@/server/actions/administrator/taxonomy-admin.actions';

// =============================================
// Types
// =============================================

interface DomainItem { id: string; name: string; slug: string; description?: string; icon?: string; order: number; isActive: boolean; _count: { categories: number }; createdAt: Date }
interface CategoryItem { id: string; name: string; slug: string; description?: string; domainId: string; order: number; domain: { name: string }; _count: { contents: number }; createdAt: Date }
interface TopicItem { id: string; name: string; slug: string; description?: string; _count: { contents: number; followers: number }; createdAt: Date }

// =============================================
// Main Component
// =============================================

export const DomainsClient = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [activeTab, setActiveTab] = useState('domains');
    const [loading, setLoading] = useState(true);

    // Data
    const [domains, setDomains] = useState<Array<DomainItem>>([]);
    const [categories, setCategories] = useState<Array<CategoryItem>>([]);
    const [topics, setTopics] = useState<Array<TopicItem>>([]);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'domain' | 'category' | 'topic'>('domain');
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formIcon, setFormIcon] = useState('');
    const [formDomainId, setFormDomainId] = useState('');

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'domain' | 'category' | 'topic'; id: string; name: string } | null>(null);

    // =============================================
    // Data Fetching
    // =============================================

    const fetchData = async () => {
        setLoading(true);
        const [domainsRes, categoriesRes, topicsRes] = await Promise.all([getDomainList(), getCategoryList(), getTopicList()]);
        if (domainsRes.success && domainsRes.data) setDomains(domainsRes.data);
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
        if (topicsRes.success && topicsRes.data) setTopics(topicsRes.data);
        setLoading(false);
    };

    useEffect(() => { void fetchData(); }, []);

    // =============================================
    // Dialog Handlers
    // =============================================

    const openCreateDialog = (type: 'domain' | 'category' | 'topic') => {
        setDialogType(type);
        setDialogMode('create');
        setEditingId(undefined);
        setFormName('');
        setFormDescription('');
        setFormIcon('');
        setFormDomainId(domains[0]?.id ?? '');
        setDialogOpen(true);
    };

    const openEditDialog = (type: 'domain' | 'category' | 'topic', item: DomainItem | CategoryItem | TopicItem) => {
        setDialogType(type);
        setDialogMode('edit');
        setEditingId(item.id);
        setFormName(item.name);
        setFormDescription(item.description ?? '');
        setFormIcon('icon' in item ? (item.icon ?? '') : '');
        if (type === 'category') setFormDomainId((item as CategoryItem).domainId);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) { addNotification({ type: 'error', message: 'Name is required' }); return; }
        setSaving(true);

        let result;
        if (dialogType === 'domain') {
            result = dialogMode === 'create'
                ? await createDomain({ name: formName, description: formDescription, icon: formIcon })
                : await updateDomain(editingId!, { name: formName, description: formDescription, icon: formIcon });
        } else if (dialogType === 'category') {
            if (!formDomainId) { addNotification({ type: 'error', message: 'Please select a domain' }); setSaving(false); return; }
            result = dialogMode === 'create'
                ? await createCategory({ name: formName, description: formDescription, domainId: formDomainId })
                : await updateCategory(editingId!, { name: formName, description: formDescription });
        } else {
            result = dialogMode === 'create'
                ? await createTopic({ name: formName, description: formDescription })
                : await updateTopic(editingId!, { name: formName, description: formDescription });
        }

        if (result.success) {
            addNotification({ type: 'success', message: `${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} ${dialogMode === 'create' ? 'created' : 'updated'}` });
            setDialogOpen(false);
            void fetchData();
        } else addNotification({ type: 'error', message: result.error ?? 'Operation failed' });
        setSaving(false);
    };

    // =============================================
    // Delete Handlers
    // =============================================

    const openDeleteDialog = (type: 'domain' | 'category' | 'topic', id: string, name: string) => {
        setDeleteTarget({ type, id, name });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        const result = deleteTarget.type === 'domain' ? await deleteDomain(deleteTarget.id) : deleteTarget.type === 'category' ? await deleteCategory(deleteTarget.id) : await deleteTopic(deleteTarget.id);
        if (result.success) {
            addNotification({ type: 'success', message: `${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted` });
            setDeleteDialogOpen(false);
            void fetchData();
        } else addNotification({ type: 'error', message: result.error ?? 'Delete failed' });
        setSaving(false);
    };

    // =============================================
    // Toggle Active
    // =============================================

    const handleToggleActive = async (id: string) => {
        const result = await toggleDomainActive(id);
        if (result.success) void fetchData();
        else addNotification({ type: 'error', message: result.error ?? 'Failed to toggle' });
    };

    // =============================================
    // Render
    // =============================================

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" /></div>;

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
                    <TabsTrigger value="domains" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"><Layers className="mr-2 h-4 w-4" />Domains ({domains.length})</TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"><Layers className="mr-2 h-4 w-4" />Categories ({categories.length})</TabsTrigger>
                    <TabsTrigger value="topics" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"><Tag className="mr-2 h-4 w-4" />Topics ({topics.length})</TabsTrigger>
                </TabsList>

                {/* Domains Tab */}
                <TabsContent value="domains">
                    <Card className="mt-4 border-zinc-700 bg-zinc-800/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Domains</CardTitle>
                            <Button onClick={() => openCreateDialog('domain')} className="bg-amber-500 hover:bg-amber-600 text-black"><Plus className="mr-2 h-4 w-4" />Add Domain</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow className="border-zinc-700"><TableHead className="text-zinc-400">Name</TableHead><TableHead className="text-zinc-400">Description</TableHead><TableHead className="text-zinc-400">Categories</TableHead><TableHead className="text-zinc-400">Active</TableHead><TableHead className="text-zinc-400 text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {domains.map((d) => (
                                        <TableRow key={d.id} className="border-zinc-700 hover:bg-zinc-700/50">
                                            <TableCell className="font-medium text-white">{d.icon && <span className="mr-2">{d.icon}</span>}{d.name}</TableCell>
                                            <TableCell className="text-zinc-400 max-w-xs truncate">{d.description ?? '-'}</TableCell>
                                            <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{d._count.categories}</Badge></TableCell>
                                            <TableCell><Switch checked={d.isActive} onCheckedChange={() => handleToggleActive(d.id)} /></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog('domain', d)} className="text-zinc-400 hover:text-white"><Edit2 className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('domain', d.id, d.name)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {domains.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">No domains yet. Click "Add Domain" to create one.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories">
                    <Card className="mt-4 border-zinc-700 bg-zinc-800/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Categories</CardTitle>
                            <Button onClick={() => openCreateDialog('category')} className="bg-amber-500 hover:bg-amber-600 text-black" disabled={domains.length === 0}><Plus className="mr-2 h-4 w-4" />Add Category</Button>
                        </CardHeader>
                        <CardContent>
                            {domains.length === 0 ? (
                                <div className="text-center text-zinc-500 py-8">Create a domain first before adding categories.</div>
                            ) : (
                                <Table>
                                    <TableHeader><TableRow className="border-zinc-700"><TableHead className="text-zinc-400">Name</TableHead><TableHead className="text-zinc-400">Domain</TableHead><TableHead className="text-zinc-400">Description</TableHead><TableHead className="text-zinc-400">Content</TableHead><TableHead className="text-zinc-400 text-right">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {categories.map((c) => (
                                            <TableRow key={c.id} className="border-zinc-700 hover:bg-zinc-700/50">
                                                <TableCell className="font-medium text-white">{c.name}</TableCell>
                                                <TableCell><Badge className="bg-zinc-700 text-zinc-300">{c.domain.name}</Badge></TableCell>
                                                <TableCell className="text-zinc-400 max-w-xs truncate">{c.description ?? '-'}</TableCell>
                                                <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{c._count.contents}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog('category', c)} className="text-zinc-400 hover:text-white"><Edit2 className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('category', c.id, c.name)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {categories.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">No categories yet. Click "Add Category" to create one.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Topics Tab */}
                <TabsContent value="topics">
                    <Card className="mt-4 border-zinc-700 bg-zinc-800/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Topics</CardTitle>
                            <Button onClick={() => openCreateDialog('topic')} className="bg-amber-500 hover:bg-amber-600 text-black"><Plus className="mr-2 h-4 w-4" />Add Topic</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow className="border-zinc-700"><TableHead className="text-zinc-400">Name</TableHead><TableHead className="text-zinc-400">Description</TableHead><TableHead className="text-zinc-400">Content</TableHead><TableHead className="text-zinc-400">Followers</TableHead><TableHead className="text-zinc-400 text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topics.map((t) => (
                                        <TableRow key={t.id} className="border-zinc-700 hover:bg-zinc-700/50">
                                            <TableCell className="font-medium text-white">{t.name}</TableCell>
                                            <TableCell className="text-zinc-400 max-w-xs truncate">{t.description ?? '-'}</TableCell>
                                            <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{t._count.contents}</Badge></TableCell>
                                            <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{t._count.followers}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog('topic', t)} className="text-zinc-400 hover:text-white"><Edit2 className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('topic', t.id, t.name)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {topics.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">No topics yet. Click "Add Topic" to create one.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === 'create' ? 'Add' : 'Edit'} {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Name</label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={`Enter ${dialogType} name`} className="bg-zinc-700 border-zinc-600 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Description</label>
                            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" rows={3} className="bg-zinc-700 border-zinc-600 text-white" />
                        </div>
                        {dialogType === 'domain' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Icon (emoji)</label>
                                <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="💻" className="bg-zinc-700 border-zinc-600 text-white" />
                            </div>
                        )}
                        {dialogType === 'category' && dialogMode === 'create' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Domain</label>
                                <Select value={formDomainId} onValueChange={setFormDomainId}>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white"><SelectValue placeholder="Select domain" /></SelectTrigger>
                                    <SelectContent className="bg-zinc-700 border-zinc-600">{domains.map((d) => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-600 text-zinc-300">Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">{saving ? LOADING_LABEL.SAVING : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Delete {deleteTarget?.type}?</DialogTitle>
                    </DialogHeader>
                    <p className="text-zinc-400">Are you sure you want to delete <span className="font-medium text-white">"{deleteTarget?.name}"</span>? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-zinc-600 text-zinc-300">Cancel</Button>
                        <Button onClick={handleDelete} disabled={saving} variant="destructive">{saving ? 'Deleting...' : 'Delete'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
