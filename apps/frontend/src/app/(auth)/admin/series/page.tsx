import { SeriesListClient } from './SeriesListClient';

export const metadata = { title: 'Series Management | SakalSense Admin', description: 'Manage your content series - organize related content into collections' };

// Note: No Suspense needed - DataTable handles loading internally with TanStack Query
const AdminSeriesPage = () => <SeriesListClient />;

export default AdminSeriesPage;
