// =============================================
// Practice Listing Page - Browse all practice sets
// =============================================

import { type Metadata } from 'next';

import { PracticeClient } from '@/components/content/PracticeClient';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
    title: 'Practice | SakalSense',
    description: 'Sharpen your skills with hands-on coding challenges and practice problems.',
};

export default function PracticePage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <PracticeClient />
            </div>
        </PublicLayout>
    );
}
