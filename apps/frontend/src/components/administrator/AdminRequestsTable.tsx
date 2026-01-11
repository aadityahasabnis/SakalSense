'use client';
// =============================================
// Admin Requests Table - Professional table with caching and sorting
// =============================================

import { useCallback, useMemo, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, ChevronDown, ChevronUp, Clock, RefreshCw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { approveAdminRequest, getAdminRequestCounts, getAdminRequests, rejectAdminRequest } from '@/server/actions/auth/admin-request.actions';

// =============================================
// Types
// =============================================

type AdminRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type SortField = 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

interface IGetRequestCountsResponse {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

// =============================================
// Status Badge Component
// =============================================

const StatusBadge = ({ status }: { status: AdminRequestStatus }) => {
    const config = {
        PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock, label: 'Pending' },
        APPROVED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Check, label: 'Approved' },
        REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: X, label: 'Rejected' },
    }[status];

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
            <Icon className='h-3 w-3' />
            {config.label}
        </span>
    );
};

// =============================================
// Filter Tabs Component
// =============================================

interface FilterTabsProps {
    activeFilter: AdminRequestStatus | undefined;
    counts: IGetRequestCountsResponse | undefined;
    onFilterChange: (filter: AdminRequestStatus | undefined) => void;
}

const FilterTabs = ({ activeFilter, counts, onFilterChange }: FilterTabsProps) => {
    const tabs = [
        { key: undefined, label: 'All', count: counts?.total },
        { key: 'PENDING' as const, label: 'Pending', count: counts?.pending },
        { key: 'APPROVED' as const, label: 'Approved', count: counts?.approved },
        { key: 'REJECTED' as const, label: 'Rejected', count: counts?.rejected },
    ];

    return (
        <div className='flex gap-2'>
            {tabs.map((tab) => (
                <button
                    key={tab.label}
                    onClick={() => onFilterChange(tab.key)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeFilter === tab.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeFilter === tab.key ? 'bg-blue-500' : 'bg-slate-600'}`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

// =============================================
// Sort Button Component
// =============================================

interface SortButtonProps {
    label: string;
    field: SortField;
    currentField: SortField;
    currentOrder: SortOrder;
    onSort: (field: SortField) => void;
}

const SortButton = ({ label, field, currentField, currentOrder, onSort }: SortButtonProps) => {
    const isActive = field === currentField;
    const Icon = isActive && currentOrder === 'asc' ? ChevronUp : ChevronDown;

    return (
        <button
            onClick={() => onSort(field)}
            className={`inline-flex items-center gap-1 text-sm ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
            {label}
            <Icon className='h-4 w-4' />
        </button>
    );
};

// =============================================
// Main Component
// =============================================

export const AdminRequestsTable = () => {
    const queryClient = useQueryClient();

    // Filters and sorting state
    const [statusFilter, setStatusFilter] = useState<AdminRequestStatus | undefined>('PENDING');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch requests with caching (staleTime: 30s, gcTime: 5m)
    const { data: requestsResponse, isLoading, refetch } = useQuery({
        queryKey: ['admin-requests', statusFilter, page, sortField, sortOrder],
        queryFn: () => getAdminRequests({ status: statusFilter, page, limit: 20, sortBy: sortField, sortOrder }),
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    });
    const requestsData = requestsResponse?.success ? requestsResponse.data : undefined;

    // Fetch counts for filter badges
    const { data: countsResponse } = useQuery({
        queryKey: ['admin-request-counts'],
        queryFn: getAdminRequestCounts,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
    const countsData = countsResponse?.success ? countsResponse.data : undefined;

    // Filter by search query
    const filteredRequests = useMemo(() => {
        if (!requestsData?.requests || !searchQuery) return requestsData?.requests ?? [];
        const q = searchQuery.toLowerCase();
        return requestsData.requests.filter(
            (r) => r.email.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q)
        );
    }, [requestsData?.requests, searchQuery]);

    // Handle sort
    const handleSort = useCallback((field: SortField) => {
        setSortField((prev) => {
            if (prev === field) {
                setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortOrder('desc');
            return field;
        });
    }, []);

    // Handle approve
    const handleApprove = useCallback(async (requestId: string) => {
        if (!confirm('Are you sure you want to approve this request? This will create an admin account and send login credentials via email.')) return;

        setProcessingId(requestId);
        try {
            const result = await approveAdminRequest({ requestId });
            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
                await queryClient.invalidateQueries({ queryKey: ['admin-request-counts'] });
            } else {
                alert(result.error ?? 'Failed to approve request');
            }
        } finally {
            setProcessingId(null);
        }
    }, [queryClient]);

    // Handle reject
    const handleReject = useCallback(async (requestId: string) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // Cancelled

        setProcessingId(requestId);
        try {
            const result = await rejectAdminRequest({ requestId, reason: reason || undefined });
            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
                await queryClient.invalidateQueries({ queryKey: ['admin-request-counts'] });
            } else {
                alert(result.error ?? 'Failed to reject request');
            }
        } finally {
            setProcessingId(null);
        }
    }, [queryClient]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        void refetch();
        void queryClient.invalidateQueries({ queryKey: ['admin-request-counts'] });
    }, [refetch, queryClient]);

    // Format date with detailed info
    const formatDate = (date: Date) => format(new Date(date), 'MMM dd, yyyy HH:mm');

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-white'>Admin Requests</h1>
                    <p className='text-slate-400'>Manage admin access requests</p>
                </div>
                <Button onClick={handleRefresh} variant='outline' className='gap-2'>
                    <RefreshCw className='h-4 w-4' />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className='flex flex-wrap items-center gap-4'>
                <FilterTabs
                    activeFilter={statusFilter}
                    counts={countsData ?? undefined}
                    onFilterChange={(filter) => {
                        setStatusFilter(filter);
                        setPage(1);
                    }}
                />
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                    <input
                        type='text'
                        placeholder='Search by name or email...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none'
                    />
                </div>
            </div>

            {/* Table */}
            <div className='overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50'>
                <table className='w-full'>
                    <thead className='border-b border-slate-700 bg-slate-800'>
                        <tr>
                            <th className='px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400'>Name</th>
                            <th className='px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400'>Email</th>
                            <th className='px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400'>Status</th>
                            <th className='px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400'>
                                <SortButton label='Requested' field='createdAt' currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400'>
                                <SortButton label='Updated' field='updatedAt' currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                            </th>
                            <th className='px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400'>Actions</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-700'>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className='px-6 py-12 text-center text-slate-400'>Loading...</td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className='px-6 py-12 text-center text-slate-400'>No requests found</td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className='hover:bg-slate-700/30 transition-colors'>
                                    <td className='px-6 py-4'>
                                        <div className='font-medium text-white'>{request.fullName}</div>
                                        {request.reason && (
                                            <div className='mt-1 text-xs text-slate-400 max-w-xs truncate' title={request.reason}>
                                                {request.reason}
                                            </div>
                                        )}
                                    </td>
                                    <td className='px-6 py-4 text-slate-300'>{request.email}</td>
                                    <td className='px-6 py-4'><StatusBadge status={request.status} /></td>
                                    <td className='px-6 py-4 text-sm text-slate-400'>{formatDate(request.createdAt)}</td>
                                    <td className='px-6 py-4 text-sm text-slate-400'>{formatDate(request.updatedAt)}</td>
                                    <td className='px-6 py-4 text-right'>
                                        {request.status === 'PENDING' && (
                                            <div className='flex justify-end gap-2'>
                                                <Button
                                                    size='sm'
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={processingId === request.id}
                                                    className='bg-green-600 hover:bg-green-500'
                                                >
                                                    {processingId === request.id ? '...' : 'Approve'}
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={processingId === request.id}
                                                    className='border-red-500 text-red-400 hover:bg-red-500/10'
                                                >
                                                    {processingId === request.id ? '...' : 'Reject'}
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {requestsData && requestsData.totalPages > 1 && (
                    <div className='flex items-center justify-between border-t border-slate-700 px-6 py-4'>
                        <div className='text-sm text-slate-400'>
                            Page {requestsData.page} of {requestsData.totalPages} ({requestsData.total} total)
                        </div>
                        <div className='flex gap-2'>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= requestsData.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
