'use client';

import { useAtom } from 'jotai';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTENT_STATUS, CONTENT_TYPE, DIFFICULTY_LEVEL } from '@/constants/content.constants';
import { resetTableFiltersAtom, tableFiltersAtom } from '@/jotai/atoms';

interface IFilterOption { value: string; label: string }
interface ITableFiltersProps { showTypeFilter?: boolean; showStatusFilter?: boolean; showDifficultyFilter?: boolean; customFilters?: Array<{ key: string; placeholder: string; options: Array<IFilterOption> }> }

const toOptions = (obj: Record<string, string>): Array<IFilterOption> => Object.entries(obj).map(([key, value]) => ({ value, label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ') }));

export const TableFilters = ({ showTypeFilter = true, showStatusFilter = true, showDifficultyFilter = false, customFilters = [] }: ITableFiltersProps) => {
    const [filters, setFilters] = useAtom(tableFiltersAtom);
    const [, resetFilters] = useAtom(resetTableFiltersAtom);
    const hasActiveFilters = Boolean(filters.search || filters.type || filters.status || filters.difficulty);

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} className="pl-9" />
            </div>

            {showTypeFilter && (
                <Select value={filters.type} onValueChange={(value) => setFilters((f) => ({ ...f, type: value }))}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>{toOptions(CONTENT_TYPE).map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            )}

            {showStatusFilter && (
                <Select value={filters.status} onValueChange={(value) => setFilters((f) => ({ ...f, status: value }))}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>{toOptions(CONTENT_STATUS).map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            )}

            {showDifficultyFilter && (
                <Select value={filters.difficulty} onValueChange={(value) => setFilters((f) => ({ ...f, difficulty: value }))}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                    <SelectContent>{toOptions(DIFFICULTY_LEVEL).map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            )}

            {customFilters.map((filter) => (
                <Select key={filter.key} value={(filters as unknown as Record<string, string>)[filter.key] ?? ''} onValueChange={(value) => setFilters((f) => ({ ...f, [filter.key]: value }))}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder={filter.placeholder} /></SelectTrigger>
                    <SelectContent>{filter.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            ))}

            {hasActiveFilters && <Button variant="ghost" size="sm" onClick={() => resetFilters()}><X className="mr-1 h-4 w-4" />Clear</Button>}
        </div>
    );
};
