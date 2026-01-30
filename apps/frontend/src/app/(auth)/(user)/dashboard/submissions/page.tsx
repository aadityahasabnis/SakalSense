// =============================================
// Submissions History Page - Server Component
// =============================================

import { redirect } from 'next/navigation';

import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

import { SubmissionsClient } from './SubmissionsClient';

export const metadata = {
    title: 'Submissions | SakalSense',
    description: 'View your practice problem submission history and stats',
};

export default async function SubmissionsPage() {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login');
    }

    return <SubmissionsClient />;
}
