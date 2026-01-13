import { Suspense } from 'react';

import { DashboardClient } from './DashboardClient';
import { DashboardSkeleton } from './DashboardSkeleton';

export const metadata = { title: 'Dashboard | SakalSense Admin', description: 'Admin dashboard - overview of your content and analytics' };

const AdminDashboardPage = () => <Suspense fallback={<DashboardSkeleton />}><DashboardClient /></Suspense>;

export default AdminDashboardPage;
