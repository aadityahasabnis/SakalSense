import { type Metadata } from 'next';

import { ContentListClient } from '@/components/content/ContentListClient';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
    title: 'Articles | SakalSense',
    description: 'Browse in-depth articles on technology, programming, and more. Learn from our community of expert writers.',
    openGraph: {
        title: 'Articles | SakalSense',
        description: 'Browse in-depth articles on technology, programming, and more.',
    },
};

export default function ArticlesPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <ContentListClient
                    contentType="ARTICLE"
                    title="Articles"
                    description="In-depth articles on technology, programming, and professional development"
                />
            </div>
        </PublicLayout>
    );
}
