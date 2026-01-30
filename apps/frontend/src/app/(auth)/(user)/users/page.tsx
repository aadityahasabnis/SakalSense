// =============================================
// Users Discovery Page - Browse and search users
// =============================================

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { UsersClient } from './UsersClient';

// =============================================
// Metadata
// =============================================

export const metadata = {
    title: 'Discover Users | SakalSense',
    description: 'Find and follow learners in the SakalSense community',
};

// =============================================
// Page Component
// =============================================

export default async function UsersPage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    return <UsersClient currentUserId={user?.userId ?? null} />;
}
