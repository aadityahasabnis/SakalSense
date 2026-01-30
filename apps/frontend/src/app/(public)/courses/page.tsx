// =============================================
// Courses Listing Page - Browse all published courses
// =============================================

import { type Metadata } from 'next';

import { CoursesClient } from '@/components/content/CoursesClient';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
    title: 'Courses | SakalSense',
    description: 'Browse structured learning paths to master new skills. Explore courses across various domains and difficulty levels.',
};

export default function CoursesPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <CoursesClient />
            </div>
        </PublicLayout>
    );
}
