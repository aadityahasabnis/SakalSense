// =============================================
// User Profile Page - Server Component
// =============================================

import { redirect } from 'next/navigation';

import { ProfileClient } from './ProfileClient';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
    title: 'My Profile | SakalSense',
    description: 'View and manage your SakalSense profile and settings',
};

export default async function ProfilePage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login');
    }

    return <ProfileClient userId={user.userId} />;
}
