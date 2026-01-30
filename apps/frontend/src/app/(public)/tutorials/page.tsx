import { type Metadata } from 'next';

import { ContentListClient } from '@/components/content/ContentListClient';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
    title: 'Tutorials | SakalSense',
    description: 'Step-by-step tutorials to help you learn new skills. From beginner to advanced guides.',
    openGraph: {
        title: 'Tutorials | SakalSense',
        description: 'Step-by-step tutorials to help you learn new skills.',
    },
};

export default function TutorialsPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <ContentListClient
                    contentType="TUTORIAL"
                    title="Tutorials"
                    description="Step-by-step guides to help you learn new skills and technologies"
                />
            </div>
        </PublicLayout>
    );
}
