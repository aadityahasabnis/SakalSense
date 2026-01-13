import { Suspense } from 'react';

import { ContentListClient } from './ContentListClient';
import { ContentListSkeleton } from './ContentListSkeleton';

export const metadata = { title: 'Content Management | SakalSense Admin', description: 'Manage your content - articles, tutorials, projects, and more' };

const AdminContentPage = () => <Suspense fallback={<ContentListSkeleton />}><ContentListClient /></Suspense>;

export default AdminContentPage;
