'use client';

// =============================================
// Professional Content List - Complete Table with Filters
// =============================================

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Archive,
    Calendar,
    Edit,
    Eye,
    FileText,
    MoreHorizontal,
    Send,
    TrendingUp,
    Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    CONTENT_STATUS_COLORS,
    CONTENT_STATUS_LABELS,
    CONTENT_TYPE_LABELS,
    type ContentStatusType,
    type ContentType,
    DIFFICULTY_COLORS,
    DIFFICULTY_LABELS,
    type DifficultyType,
} from '@/constants/content.constants';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { useDialog } from '@/hooks/useDialog';
import {
    archiveContent,
    deleteContent,
    getContentList,
    publishContent,
} from '@/server/actions/content/contentActions';
import { type IContentListItem } from '@/types/content.types';
import {
    type ITableColumn,
    type ITableConfig,
    type ITableFilter,
    type ITableQueryParams,
    type ITableQueryResult,
    type ITableTab,
} from '@/types/table.types';

// =============================================
// Query Function Adapter
// =============================================

const fetchContent = async (
    params: ITableQueryParams,
    statusFilter?: ContentStatusType,
): Promise<ITableQueryResult<IContentListItem>> => {
    const filters = params.filters as Record<string, string> | undefined;
    const result = await getContentList({
        search: params.search,
        type: filters?.type as ContentType,
        status: statusFilter ?? (filters?.status as ContentStatusType),
        difficulty: filters?.difficulty as DifficultyType,
        page: params.page,
        limit: params.limit,
        sortField: params.sortBy,
        sortDir: params.sortOrder,
    });

    if (!result.success || !result.data) {
        return { data: [], total: 0, page: params.page, totalPages: 0 };
    }

    return {
        data: result.data.contents,
        total: result.data.total,
        page: params.page,
        totalPages: result.data.pages,
    };
};

// =============================================
// Main Component
// =============================================

export const ContentListClient = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openDialog, DialogRenderer } = useDialog();

    // Invalidate all content queries on refresh
    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['content'] });

    // =============================================
    // Row Actions with useDialog
    // =============================================

    const handleView = (row: IContentListItem) => {
        router.push(`/admin/content/${row.id}`);
    };

    const handleEdit = (row: IContentListItem) => {
        router.push(`/admin/content/${row.id}/edit`);
    };

    const handlePublish = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Publish Content?',
            description: `This will make "${row.title}" publicly visible to all users.`,
            confirmLabel: 'Publish Now',
            variant: 'default',
            onConfirm: async () => {
                const result = await publishContent(row.id);
                if (result.success) {
                    void invalidateQueries();
                }
            },
        });
    };

    const handleArchive = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Archive Content?',
            description: `This will archive "${row.title}" and hide it from public view. You can restore it later.`,
            confirmLabel: 'Archive',
            variant: 'default',
            onConfirm: async () => {
                const result = await archiveContent(row.id);
                if (result.success) {
                    void invalidateQueries();
                }
            },
        });
    };

    const handleDelete = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Delete Content?',
            description: `Are you sure you want to permanently delete "${row.title}"? This action cannot be undone and will remove all associated data.`,
            confirmLabel: 'Delete Permanently',
            variant: 'destructive',
            onConfirm: async () => {
                const result = await deleteContent(row.id);
                if (result.success) {
                    void invalidateQueries();
                }
            },
        });
    };

    // =============================================
    // Table Configuration
    // =============================================

    const columns: Array<ITableColumn<IContentListItem>> = [
        // Title Column with Thumbnail
        {
            key: 'title',
            header: 'Content',
            sortable: true,
            render: (row) => (
                <div className='flex items-start gap-3'>
                    {/* Thumbnail */}
                    {row.thumbnailUrl ? (
                        <div className='h-12 w-16 flex-shrink-0 overflow-hidden rounded border bg-muted'>
                            <img
                                src={row.thumbnailUrl}
                                alt={row.title}
                                className='h-full w-full object-cover'
                            />
                        </div>
                    ) : (
                        <div className='flex h-12 w-16 flex-shrink-0 items-center justify-center rounded border bg-muted'>
                            <FileText className='h-5 w-5 text-muted-foreground' />
                        </div>
                    )}

                    {/* Title and Slug */}
                    <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-foreground'>{row.title}</p>
                        <p className='truncate text-xs text-muted-foreground'>/{row.slug}</p>
                        {row.excerpt && (
                            <p className='mt-0.5 line-clamp-1 text-xs text-muted-foreground'>
                                {row.excerpt}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },

        // Type & Category Column
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (row) => (
                <div className='space-y-1'>
                    <Badge variant='outline' className='font-normal'>
                        {CONTENT_TYPE_LABELS[row.type]}
                    </Badge>
                    {row.category && (
                        <p className='text-xs text-muted-foreground'>{row.category.name}</p>
                    )}
                </div>
            ),
        },

        // Status Column
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => (
                <div className='space-y-1'>
                    <Badge className={CONTENT_STATUS_COLORS[row.status]}>
                        {CONTENT_STATUS_LABELS[row.status]}
                    </Badge>
                    {row.publishedAt && (
                        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            {format(new Date(row.publishedAt), 'MMM d, yyyy')}
                        </p>
                    )}
                </div>
            ),
        },

        // Difficulty Column
        {
            key: 'difficulty',
            header: 'Difficulty',
            render: (row) => (
                <Badge className={DIFFICULTY_COLORS[row.difficulty]}>
                    {DIFFICULTY_LABELS[row.difficulty]}
                </Badge>
            ),
        },

        // Engagement Stats Column
        {
            key: 'stats',
            header: 'Engagement',
            render: (row) => (
                <div className='space-y-1 text-sm'>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <Eye className='h-3.5 w-3.5' />
                        <span>{row.viewCount.toLocaleString()}</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <TrendingUp className='h-3.5 w-3.5' />
                        <span>{row.likeCount.toLocaleString()}</span>
                    </div>
                </div>
            ),
        },

        // Created Date Column
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (row) => (
                <div className='text-sm text-muted-foreground'>
                    <p>{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
                    <p className='text-xs'>{format(new Date(row.createdAt), 'h:mm a')}</p>
                </div>
            ),
        },

        // Actions Column
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleView(row)}>
                            <Eye className='mr-2 h-4 w-4' />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                        </DropdownMenuItem>
                        {row.status !== 'PUBLISHED' && (
                            <DropdownMenuItem onClick={() => handlePublish(row)}>
                                <Send className='mr-2 h-4 w-4' />
                                Publish
                            </DropdownMenuItem>
                        )}
                        {row.status !== 'ARCHIVED' && (
                            <DropdownMenuItem onClick={() => handleArchive(row)}>
                                <Archive className='mr-2 h-4 w-4' />
                                Archive
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDelete(row)}
                            className='text-destructive focus:text-destructive'
                        >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const config: ITableConfig<IContentListItem> = {
        rowKey: 'id',
        columns,
        pageSize: 20,
        emptyIcon: FileText,
        emptyTitle: 'No content found',
        emptyMessage: 'Create your first article, tutorial, or project to get started.',
        onRowClick: (row) => router.push(`/admin/content/${row.id}`),
    };

    // =============================================
    // Tabs - Status-based filtering with TanStack Query caching
    // =============================================

    const tabs: Array<ITableTab<IContentListItem>> = [
        {
            key: 'all',
            label: 'All Content',
            queryKey: ['content', 'all'],
            queryFn: (params) => fetchContent(params),
        },
        {
            key: 'draft',
            label: 'Drafts',
            queryKey: ['content', 'draft'],
            queryFn: (params) => fetchContent(params, 'DRAFT'),
        },
        {
            key: 'published',
            label: 'Published',
            queryKey: ['content', 'published'],
            queryFn: (params) => fetchContent(params, 'PUBLISHED'),
        },
        {
            key: 'archived',
            label: 'Archived',
            queryKey: ['content', 'archived'],
            queryFn: (params) => fetchContent(params, 'ARCHIVED'),
        },
    ];

    // =============================================
    // Filters
    // =============================================

    const filters: Array<ITableFilter> = [
        {
            key: 'type',
            label: 'Content Type',
            type: 'select',
            options: Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
            })),
            placeholder: 'All Types',
        },
        {
            key: 'difficulty',
            label: 'Difficulty Level',
            type: 'select',
            options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
            placeholder: 'All Levels',
        },
    ];

    // =============================================
    // Render
    // =============================================

    return (
        <>
            <div className='space-y-6'>
                <PageHeader
                    title='Content Management'
                    description='Manage your articles, tutorials, projects, and more'
                    action={{ label: BUTTON_LABEL.CREATE, href: '/admin/content/new' }}
                />
                <DataTable<IContentListItem>
                    config={config}
                    tabs={tabs}
                    defaultTab='all'
                    filters={filters}
                    searchPlaceholder='Search by title, slug, or description...'
                    showSearch
                    showRefresh
                />
            </div>
            {DialogRenderer()}
        </>
    );
};
