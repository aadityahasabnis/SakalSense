// =============================================
// Public User Profile Page - View any user's profile
// =============================================

import { notFound } from 'next/navigation';

import { getPublicUserProfile } from '@/server/actions/user/publicProfileActions';

import { PublicProfileClient } from './PublicProfileClient';

// =============================================
// Metadata
// =============================================

export const generateMetadata = async ({ params }: { params: Promise<{ username: string }> }) => {
    const { username } = await params;
    const result = await getPublicUserProfile(username);
    
    if (!result.success || !result.data) {
        return { title: 'User Not Found | SakalSense' };
    }

    return {
        title: `${result.data.fullName} | SakalSense`,
        description: result.data.bio ?? `View ${result.data.fullName}'s profile on SakalSense`,
    };
};

// =============================================
// Page Component
// =============================================

interface IPageProps {
    params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: IPageProps) {
    const { username } = await params;
    const result = await getPublicUserProfile(username);

    if (!result.success || !result.data) {
        notFound();
    }

    return <PublicProfileClient profile={result.data} />;
}
