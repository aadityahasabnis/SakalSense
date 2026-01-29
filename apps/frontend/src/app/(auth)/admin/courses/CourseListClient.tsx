'use client';
// =============================================
// CourseListClient - Course list with DataTable system
// =============================================

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Edit, Eye, Send, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/badge';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, type ContentStatusType, DIFFICULTY_COLORS, DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { useDialog } from '@/hooks/useDialog';
import { deleteCourse, getCourseList, publishCourse } from '@/server/actions/content/courseActions';
import { type ICourse } from '@/types/content.types';
import { type ITableColumn, type ITableConfig, type ITableFilter, type ITableQueryParams, type ITableQueryResult, type ITableTab } from '@/types/table.types';

// =============================================
// Query Function Adapter
// =============================================

const fetchCourses = async (params: ITableQueryParams, statusFilter?: ContentStatusType): Promise<ITableQueryResult<ICourse>> => {
    const filters = params.filters as Record<string, string> | undefined;
    const result = await getCourseList({
        search: params.search,
        status: statusFilter ?? (filters?.status as ContentStatusType),
        difficulty: filters?.difficulty as DifficultyType,
        page: params.page,
        limit: params.limit,
    });

    if (!result.success || !result.data) {
        return { data: [], total: 0, page: params.page, totalPages: 0 };
    }

    const total = result.total ?? 0;
    return { data: result.data, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
};

// =============================================
// Main Component
// =============================================

export const CourseListClient = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openDialog, DialogRenderer } = useDialog();

    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['courses'] });

    // =============================================
    // Row Actions
    // =============================================

    const handlePublish = (row: ICourse) => {
        openDialog({
            type: 'confirm',
            title: 'Publish Course?',
            description: `This will make "${row.title}" publicly available.`,
            confirmLabel: 'Publish',
            variant: 'default',
            onConfirm: async () => {
                await publishCourse(row.id);
                void invalidateQueries();
            },
        });
    };

    const handleDelete = (row: ICourse) => {
        openDialog({
            type: 'confirm',
            title: 'Delete Course?',
            description: `Are you sure you want to delete "${row.title}"? This will also delete all sections and lessons.`,
            confirmLabel: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteCourse(row.id);
                void invalidateQueries();
            },
        });
    };

    // =============================================
    // Table Configuration
    // =============================================

    const columns: Array<ITableColumn<ICourse>> = [
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (row) => (
                <div>
                    <p className='font-medium'>{row.title}</p>
                    <p className='text-sm text-muted-foreground'>{row.slug}</p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => <Badge className={CONTENT_STATUS_COLORS[row.status]}>{CONTENT_STATUS_LABELS[row.status]}</Badge>,
        },
        {
            key: 'difficulty',
            header: 'Difficulty',
            render: (row) => <Badge className={DIFFICULTY_COLORS[row.difficulty]}>{DIFFICULTY_LABELS[row.difficulty]}</Badge>,
        },
        {
            key: 'estimatedHours',
            header: 'Est. Hours',
            sortable: true,
            className: 'text-right',
            render: (row) => row.estimatedHours ? `${row.estimatedHours}h` : '-',
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
    ];

    const config: ITableConfig<ICourse> = {
        rowKey: 'id',
        columns,
        pageSize: 20,
        emptyIcon: BookOpen,
        emptyTitle: 'No courses yet',
        emptyMessage: 'Create your first course to start teaching.',
        onRowClick: (row) => router.push(`/admin/courses/${row.id}`),
        rowActions: [
            { key: 'view', label: 'View', icon: Eye, onClick: (row) => router.push(`/admin/courses/${row.id}`) },
            { key: 'edit', label: 'Edit', icon: Edit, onClick: (row) => router.push(`/admin/courses/${row.id}/edit`) },
            { key: 'publish', label: 'Publish', icon: Send, visible: (row) => row.status !== 'PUBLISHED', onClick: handlePublish },
            { key: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive', onClick: handleDelete },
        ],
    };

    // =============================================
    // Tabs
    // =============================================

    const tabs: Array<ITableTab<ICourse>> = [
        { key: 'all', label: 'All', queryKey: ['courses', 'all'], queryFn: (params) => fetchCourses(params) },
        { key: 'draft', label: 'Drafts', queryKey: ['courses', 'draft'], queryFn: (params) => fetchCourses(params, 'DRAFT') },
        { key: 'published', label: 'Published', queryKey: ['courses', 'published'], queryFn: (params) => fetchCourses(params, 'PUBLISHED') },
    ];

    // =============================================
    // Filters
    // =============================================

    const filters: Array<ITableFilter> = [
        {
            key: 'difficulty',
            label: 'Difficulty',
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
                <PageHeader title='Courses' description='Manage structured learning courses' action={{ label: BUTTON_LABEL.CREATE, href: '/admin/courses/new' }} />
                <DataTable<ICourse>
                    config={config}
                    tabs={tabs}
                    defaultTab='all'
                    filters={filters}
                    searchPlaceholder='Search by title or slug...'
                    showSearch
                    showRefresh
                />
            </div>
            {DialogRenderer()}
        </>
    );
};
