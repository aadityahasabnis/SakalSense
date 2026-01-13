'use client';

import { type ReactNode } from 'react';

import { useAtom } from 'jotai';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tablePaginationAtom, tableSortAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';

export interface ITableColumn<TData> { key: keyof TData | string; header: string; sortable?: boolean; className?: string; render?: (row: TData) => ReactNode }
export interface IDataTableProps<TData> { columns: Array<ITableColumn<TData>>; data: Array<TData>; loading?: boolean; emptyMessage?: string; rowKey: keyof TData; onRowClick?: (row: TData) => void }

const getCellValue = <TData,>(row: TData, key: string): ReactNode => {
    const value = (row as Record<string, unknown>)[key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
};

export const DataTable = <TData,>({ columns, data, loading = false, emptyMessage = 'No data available', rowKey, onRowClick }: IDataTableProps<TData>) => {
    const [sort, setSort] = useAtom(tableSortAtom);
    const [pagination, setPagination] = useAtom(tablePaginationAtom);
    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

    const handleSort = (key: string) => setSort((prev) => ({ field: key, direction: prev.field === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const getSortIcon = (key: string) => sort.field !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> : sort.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;

    if (loading) return (
        <div className="rounded-md border">
            <Table>
                <TableHeader><TableRow>{columns.map((col) => <TableHead key={String(col.key)} className={col.className}><Skeleton className="h-4 w-24" /></TableHead>)}</TableRow></TableHeader>
                <TableBody>{Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{columns.map((col) => <TableCell key={String(col.key)}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)}</TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={String(col.key)} className={col.className}>
                                    {col.sortable ? <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort(String(col.key))}>{col.header}{getSortIcon(String(col.key))}</Button> : col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">{emptyMessage}</TableCell></TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow key={String((row as Record<string, unknown>)[rowKey as string])} className={cn(onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(row)}>
                                    {columns.map((col) => <TableCell key={String(col.key)} className={col.className}>{col.render ? col.render(row) : getCellValue(row, String(col.key))}</TableCell>)}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
                        <span className="text-sm">Page {pagination.page} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </div>
    );
};
