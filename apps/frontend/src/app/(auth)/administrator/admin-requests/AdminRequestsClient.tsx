'use client';
// =============================================
// AdminRequestsClient - Admin requests table using new DataTable system
// =============================================

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Clock, ShieldCheck, X } from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable } from '@/components/table/DataTable';
import { useDialog } from '@/hooks/useDialog';
import { approveAdminRequest, getAdminRequests, rejectAdminRequest } from '@/server/actions/auth/admin-request.actions';
import { type IRowAction, type ITableColumn, type ITableConfig, type ITableQueryParams, type ITableQueryResult, type ITableTab } from '@/types/table.types';

// =============================================
// Types
// =============================================

type AdminRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface IAdminRequest {
    id: string;
    email: string;
    fullName: string;
    reason: string | undefined;
    status: AdminRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================
// Status Badge Component
// =============================================

const STATUS_CONFIG = {
    PENDING: { bg: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: 'Pending' },
    APPROVED: { bg: 'bg-green-500/20 text-green-400', icon: Check, label: 'Approved' },
    REJECTED: { bg: 'bg-red-500/20 text-red-400', icon: X, label: 'Rejected' },
} as const;

const StatusBadge = ({ status }: { status: AdminRequestStatus }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg}`}>
            <Icon className='h-3 w-3' />
            {config.label}
        </span>
    );
};

// =============================================
// Query Function Adapter
// =============================================

const fetchAdminRequests = async (params: ITableQueryParams, statusFilter?: AdminRequestStatus): Promise<ITableQueryResult<IAdminRequest>> => {
    const result = await getAdminRequests({
        status: statusFilter,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy as 'createdAt' | 'updatedAt',
        sortOrder: params.sortOrder,
    });

    if (!result.success || !result.data) {
        return { data: [], total: 0, page: params.page, totalPages: 0 };
    }

    return {
        data: result.data.requests as Array<IAdminRequest>,
        total: result.data.total,
        page: result.data.page,
        totalPages: result.data.totalPages,
    };
};

// =============================================
// Main Component
// =============================================

export const AdminRequestsClient = () => {
    const queryClient = useQueryClient();
    const { openDialog, DialogRenderer } = useDialog();

    const invalidateQueries = () => void queryClient.invalidateQueries({ queryKey: ['admin-requests'] });

    // =============================================
    // Actions with useDialog
    // =============================================

    const handleApprove = (row: IAdminRequest) => {
        openDialog({
            type: 'confirm',
            title: 'Approve Admin Request?',
            description: `This will create an admin account for "${row.fullName}" (${row.email}) and send login credentials via email.`,
            confirmLabel: 'Approve',
            variant: 'default',
            onConfirm: async () => {
                await approveAdminRequest({ requestId: row.id });
                invalidateQueries();
            },
        });
    };

    const handleReject = (row: IAdminRequest) => {
        openDialog({
            type: 'form',
            title: 'Reject Admin Request',
            description: `Rejecting request from "${row.fullName}". Optionally provide a reason.`,
            fields: [{ name: 'reason', type: 'textarea', label: 'Rejection Reason', placeholder: 'Enter reason (optional)...' }],
            submitLabel: 'Reject',
            onSubmit: async (data) => {
                await rejectAdminRequest({ requestId: row.id, reason: (data.reason as string) || undefined });
                invalidateQueries();
            },
        });
    };

    // =============================================
    // Table Configuration
    // =============================================

    const columns: Array<ITableColumn<IAdminRequest>> = [
        {
            key: 'fullName',
            header: 'Applicant',
            sortable: true,
            render: (row) => (
                <div>
                    <p className='font-medium'>{row.fullName}</p>
                    <p className='text-sm text-muted-foreground'>{row.email}</p>
                </div>
            ),
        },
        {
            key: 'reason',
            header: 'Reason',
            render: (row) => (
                <p className='max-w-xs truncate text-sm text-muted-foreground'>
                    {row.reason ?? '-'}
                </p>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'createdAt',
            header: 'Requested',
            sortable: true,
            render: (row) => (
                <span className='text-sm text-muted-foreground'>
                    {format(new Date(row.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
            ),
        },
        {
            key: 'updatedAt',
            header: 'Updated',
            sortable: true,
            render: (row) => (
                <span className='text-sm text-muted-foreground'>
                    {format(new Date(row.updatedAt), 'MMM dd, yyyy HH:mm')}
                </span>
            ),
        },
    ];

    const rowActions: Array<IRowAction<IAdminRequest>> = [
        {
            key: 'approve',
            label: 'Approve',
            icon: Check,
            visible: (row) => row.status === 'PENDING',
            onClick: handleApprove,
        },
        {
            key: 'reject',
            label: 'Reject',
            icon: X,
            variant: 'destructive',
            visible: (row) => row.status === 'PENDING',
            onClick: handleReject,
        },
    ];

    const config: ITableConfig<IAdminRequest> = {
        rowKey: 'id',
        columns,
        rowActions,
        pageSize: 20,
        emptyIcon: ShieldCheck,
        emptyTitle: 'No admin requests',
        emptyMessage: 'No pending admin access requests at this time.',
    };

    // =============================================
    // Tabs - Status-based filtering
    // =============================================

    const tabs: Array<ITableTab<IAdminRequest>> = [
        { key: 'pending', label: 'Pending', queryKey: ['admin-requests', 'pending'], queryFn: (params) => fetchAdminRequests(params, 'PENDING') },
        { key: 'all', label: 'All', queryKey: ['admin-requests', 'all'], queryFn: (params) => fetchAdminRequests(params) },
        { key: 'approved', label: 'Approved', queryKey: ['admin-requests', 'approved'], queryFn: (params) => fetchAdminRequests(params, 'APPROVED') },
        { key: 'rejected', label: 'Rejected', queryKey: ['admin-requests', 'rejected'], queryFn: (params) => fetchAdminRequests(params, 'REJECTED') },
    ];

    // =============================================
    // Render
    // =============================================

    return (
        <>
            <div className='space-y-6'>
                <PageHeader
                    title='Admin Requests'
                    description='Review and manage admin access requests'
                />
                <DataTable<IAdminRequest>
                    config={config}
                    tabs={tabs}
                    defaultTab='pending'
                    searchPlaceholder='Search by name or email...'
                    showSearch
                    showRefresh
                />
            </div>
            {DialogRenderer()}
        </>
    );
};
