// =============================================
// Administrator Admin Requests Page
// =============================================

import { AdminRequestsClient } from './AdminRequestsClient';

export const metadata = { title: 'Admin Requests | SakalSense Administrator', description: 'Review and manage admin access requests' };

// Note: No Suspense needed - DataTable handles loading internally with TanStack Query
const AdminRequestsPage = () => <AdminRequestsClient />;

export default AdminRequestsPage;
