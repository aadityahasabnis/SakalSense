import { redirect } from 'next/navigation';

import { ProfileClient } from './ProfileClient';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
    title: 'Profile | Admin Dashboard | SakalSense',
    description: 'Manage your admin profile and view your content statistics',
};

export default async function AdminProfilePage() {
    const user = await getCurrentUser(STAKEHOLDER.ADMIN);
    if (!user) {
        redirect('/login/admin');
    }

    return <ProfileClient adminId={user.userId} />;
}
