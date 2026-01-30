// =============================================
// User Layout - Wraps all authenticated user routes
// Uses unified MainNavbar and GlobalSearch
// =============================================

import { redirect } from 'next/navigation';

import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { MainNavbar } from '@/components/layout/MainNavbar';
import { Footer } from '@/components/layout/PublicFooter';
import { UserProvider } from '@/components/providers/UserProvider';
import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

interface IUserLayoutProps {
    children: React.ReactNode;
}

export default async function UserLayout({ children }: IUserLayoutProps) {
    const user = await getCurrentUser(STAKEHOLDER.USER);

    if (!user) {
        redirect('/login');
    }

    return (
        <UserProvider
            user={{
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                avatarLink: user.avatarLink ?? null,
                stakeholder: 'USER',
            }}
        >
            <div className="flex min-h-screen flex-col bg-background">
                <MainNavbar />
                <GlobalSearch />
                <main className="flex-1">
                    <div className="container mx-auto px-4 py-6">
                        {children}
                    </div>
                </main>
                <Footer />
            </div>
        </UserProvider>
    );
}
