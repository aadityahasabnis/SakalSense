'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { useAtom } from 'jotai';
import { Archive, Edit, Eye, MoreHorizontal, Send, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable, type ITableColumn } from '@/components/table/DataTable';
import { TableFilters } from '@/components/table/TableFilters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, type ContentStatusType, type ContentType , DIFFICULTY_COLORS, DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { useContentActions, useContentList } from '@/hooks/useContentActions';
import { tableFiltersAtom, tablePaginationAtom, tableSortAtom } from '@/jotai/atoms';
import { type IContentListItem } from '@/types/content.types';

export const ContentListClient = () => {
    const [filters] = useAtom(tableFiltersAtom);
    const [sort] = useAtom(tableSortAtom);
    const [pagination, setPagination] = useAtom(tablePaginationAtom);
    const { data, total, loading, fetchList } = useContentList();
    const { remove, publish, archive } = useContentActions();

    useEffect(() => {
        void fetchList({ search: filters.search, type: filters.type as ContentType, status: filters.status as ContentStatusType, difficulty: filters.difficulty as DifficultyType, page: pagination.page, limit: pagination.limit, sortField: sort.field, sortDir: sort.direction });
    }, [filters, sort, pagination.page, pagination.limit, fetchList]);

    useEffect(() => { setPagination((p) => ({ ...p, total })); }, [total, setPagination]);

    const handleAction = (action: 'publish' | 'archive' | 'delete', id: string) => {
        const refetch = () => void fetchList({ search: filters.search, type: filters.type as ContentType, status: filters.status as ContentStatusType, difficulty: filters.difficulty as DifficultyType, page: pagination.page, limit: pagination.limit, sortField: sort.field, sortDir: sort.direction });
        if (action === 'publish') void publish(id, refetch);
        else if (action === 'archive') void archive(id, refetch);
        else if (action === 'delete') void remove(id, refetch);
    };

    const columns: Array<ITableColumn<IContentListItem>> = [
        { key: 'title', header: 'Title', sortable: true, render: (row) => <div><p className="font-medium">{row.title}</p><p className="text-sm text-muted-foreground">{row.slug}</p></div> },
        { key: 'type', header: 'Type', sortable: true, render: (row) => <Badge variant="outline">{CONTENT_TYPE_LABELS[row.type]}</Badge> },
        { key: 'status', header: 'Status', sortable: true, render: (row) => <Badge className={CONTENT_STATUS_COLORS[row.status]}>{CONTENT_STATUS_LABELS[row.status]}</Badge> },
        { key: 'difficulty', header: 'Difficulty', render: (row) => <Badge className={DIFFICULTY_COLORS[row.difficulty]}>{DIFFICULTY_LABELS[row.difficulty]}</Badge> },
        { key: 'viewCount', header: 'Views', sortable: true, className: 'text-right', render: (row) => row.viewCount.toLocaleString() },
        { key: 'actions', header: '', className: 'w-12', render: (row) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href={`/admin/content/${row.id}`}><Eye className="mr-2 h-4 w-4" />View</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href={`/admin/content/${row.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></DropdownMenuItem>
                    {row.status !== 'PUBLISHED' && <DropdownMenuItem onClick={() => handleAction('publish', row.id)}><Send className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    {row.status !== 'ARCHIVED' && <DropdownMenuItem onClick={() => handleAction('archive', row.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>}
                    <DropdownMenuItem className="text-destructive" onClick={() => handleAction('delete', row.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )},
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Content" description="Manage your articles, tutorials, projects, and more" action={{ label: BUTTON_LABEL.CREATE, href: '/admin/content/new' }} />
            <TableFilters showDifficultyFilter />
            <DataTable columns={columns} data={data} rowKey="id" loading={loading} />
        </div>
    );
};
