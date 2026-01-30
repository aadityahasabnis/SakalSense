// =============================================
// Domain Page - Browse content within a specific domain
// =============================================

import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DomainClient } from '@/components/content/DomainClient';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { getDomainBySlug } from '@/server/actions/content/taxonomyActions';

interface IDomainPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: IDomainPageProps): Promise<Metadata> {
    const { slug } = await params;
    const response = await getDomainBySlug(slug);

    if (!response.success || !response.data) {
        return {
            title: 'Domain Not Found | SakalSense',
        };
    }

    return {
        title: `${response.data.name} | SakalSense`,
        description: response.data.description ?? `Explore ${response.data.name} content on SakalSense`,
    };
}

export default async function DomainPage({ params }: IDomainPageProps) {
    const { slug } = await params;
    const response = await getDomainBySlug(slug);

    if (!response.success || !response.data) {
        notFound();
    }

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <DomainClient domain={response.data as Parameters<typeof DomainClient>[0]['domain']} />
            </div>
        </PublicLayout>
    );
}
