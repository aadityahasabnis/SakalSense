// =============================================
// User Dashboard Page - Server Component
// =============================================

import { redirect } from 'next/navigation';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { DashboardClient } from './DashboardClient';

export const metadata = {
    title: 'Dashboard | SakalSense',
    description: 'Your personalized learning dashboard',
};

export default async function DashboardPage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login');
    }

    return <DashboardClient userId={user.userId} />;
}
