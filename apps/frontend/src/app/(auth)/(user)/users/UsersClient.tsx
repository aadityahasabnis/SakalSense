'use client';
// =============================================
// Users Client - Browse and search users
// =============================================

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { SortAsc, Users } from 'lucide-react';

import {
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    UserCardSkeleton,
} from '@/components/common';
import { UserCard } from '@/components/social/UserCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounce, useUrlPage, useUrlParam } from '@/hooks';
import { searchUsers } from '@/server/actions/user/publicProfileActions';

// =============================================
// Types
// =============================================

type SortOption = 'followers' | 'xp' | 'recent';

interface IUsersClientProps {
    currentUserId: string | null;
}

interface IUserResult {
    id: string;
    fullName: string;
    username: string | null;
    avatarLink: string | null;
    bio: string | null;
    followersCount: number;
    level: number;
    isFollowing: boolean;
}

// =============================================
// Sort Options
// =============================================

const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'followers', label: 'Most Followers' },
    { value: 'xp', label: 'Highest Level' },
    { value: 'recent', label: 'Most Recent' },
];

// =============================================
// Constants
// =============================================

const USERS_PER_PAGE = 20;

// =============================================
// Main Component
// =============================================

export const UsersClient = ({ currentUserId }: IUsersClientProps) => {
    // URL State
    const [page, setPage] = useUrlPage(1, 'page');
    const [sortBy, setSortBy] = useUrlParam<SortOption>('sort', 'followers');

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Reset page when search or sort changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const handleSortChange = (value: SortOption) => {
        setSortBy(value);
        setPage(1);
    };

    // Fetch users
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['users', debouncedSearch, sortBy, page],
        queryFn: () =>
            searchUsers({
                query: debouncedSearch || undefined,
                sortBy,
                page,
                limit: USERS_PER_PAGE,
            }),
    });

    const users = (data?.data ?? []) as IUserResult[];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / USERS_PER_PAGE);

    return (
        <div className="container max-w-5xl py-6 space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Discover Users"
                description="Find and follow learners in the SakalSense community"
            />

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <SearchInput
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        loading={isFetching && !!searchQuery}
                    />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SortAsc className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Results Count */}
            {!isLoading && (
                <p className="text-sm text-muted-foreground">
                    {total === 0
                        ? 'No users found'
                        : `Showing ${(page - 1) * USERS_PER_PAGE + 1}-${Math.min(page * USERS_PER_PAGE, total)} of ${total} users`}
                </p>
            )}

            {/* Users Grid */}
            {isLoading ? (
                <UserCardSkeleton count={8} />
            ) : users.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={debouncedSearch ? 'No users found' : 'No users yet'}
                    description={
                        debouncedSearch
                            ? `No users match "${debouncedSearch}". Try a different search term.`
                            : 'Be the first to join the community!'
                    }
                    variant="card"
                    action={
                        debouncedSearch
                            ? {
                                  label: 'Clear search',
                                  onClick: () => handleSearchChange(''),
                              }
                            : undefined
                    }
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={{
                                id: user.id,
                                fullName: user.fullName,
                                username: user.username,
                                avatarLink: user.avatarLink,
                                bio: user.bio,
                                isFollowing: user.isFollowing,
                            }}
                            currentUserId={currentUserId ?? undefined}
                            showFollowButton={user.id !== currentUserId}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        showPageNumbers
                        showFirstLast
                    />
                </div>
            )}
        </div>
    );
};
