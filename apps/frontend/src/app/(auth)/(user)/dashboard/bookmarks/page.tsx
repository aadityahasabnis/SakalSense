// =============================================
// Bookmarks Page - Server Component
// =============================================

import { redirect } from 'next/navigation';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { BookmarksClient } from './BookmarksClient';

export default async function BookmarksPage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login');
    }

    return <BookmarksClient userId={user.userId} />;
}
