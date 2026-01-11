// =============================================
// Administrator Admin Requests Page
// =============================================

import { AdminRequestsTable } from '@/components/administrator/AdminRequestsTable';

const AdminRequestsPage = () => {
    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
            <div className='container mx-auto py-8 px-4'>
                <AdminRequestsTable />
            </div>
        </div>
    );
};

export default AdminRequestsPage;
