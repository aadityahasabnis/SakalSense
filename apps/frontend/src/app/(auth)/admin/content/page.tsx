import { ContentListClient } from './ContentListClient';

export const metadata = { title: 'Content Management | SakalSense Admin', description: 'Manage your content - articles, tutorials, projects, and more' };

// Note: No Suspense needed - DataTable handles loading internally with TanStack Query
const AdminContentPage = () => <ContentListClient />;

export default AdminContentPage;
