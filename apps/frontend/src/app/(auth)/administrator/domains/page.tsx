import { DomainsClient } from './DomainsClient';

import { PageHeader } from '@/components/common/PageElements';
import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

const AdministratorDomainsPage = async () => {
    const user = await getCurrentUser(STAKEHOLDER.ADMINISTRATOR);
    if (!user) return null;

    return (
        <div className='min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6'>
            <div className='mx-auto max-w-7xl'>
                <PageHeader title='Content Organization' description='Manage domains, categories, and topics for content classification' />
                <DomainsClient />
            </div>
        </div>
    );
};

export default AdministratorDomainsPage;
