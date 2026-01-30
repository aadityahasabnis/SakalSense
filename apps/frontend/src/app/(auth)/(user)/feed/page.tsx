// =============================================
// Activity Feed Page - Server Component
// =============================================

import { redirect } from 'next/navigation';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { FeedClient } from './FeedClient';

// =============================================
// Metadata
// =============================================

export const metadata = {
    title: 'Activity Feed | SakalSense',
    description: 'See what the community is learning and achieving',
};

// =============================================
// Page Component
// =============================================

export default async function FeedPage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login?redirect=/feed');
    }

    return <FeedClient currentUserId={user.userId} />;
}
