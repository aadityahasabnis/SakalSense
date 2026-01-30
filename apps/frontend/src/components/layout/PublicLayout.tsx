// =============================================
// PublicLayout - Server Component with Auth Check
// Unified layout for all public pages
// Checks auth and hydrates user state for navbar
// =============================================

import { type JSX, type ReactNode } from 'react';

import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { MainNavbar } from '@/components/layout/MainNavbar';
import { Footer } from '@/components/layout/PublicFooter';
import { UserProvider } from '@/components/providers/UserProvider';
import { STAKEHOLDER } from '@/constants/auth.constants';
import { getCurrentUser } from '@/lib/auth';

interface IPublicLayoutProps {
    children: ReactNode;
}

export const PublicLayout = async ({ children }: IPublicLayoutProps): Promise<JSX.Element> => {
    // Check if user is logged in (server-side)
    const currentUser = await getCurrentUser(STAKEHOLDER.USER);

    // Transform to the format expected by UserProvider
    const userState = currentUser
        ? {
              userId: currentUser.userId,
              fullName: currentUser.fullName,
              email: currentUser.email,
              avatarLink: currentUser.avatarLink,
              stakeholder: currentUser.stakeholder as 'USER' | 'ADMIN' | 'ADMINISTRATOR',
          }
        : null;

    return (
        <UserProvider user={userState}>
            <div className="flex min-h-screen flex-col">
                <MainNavbar />
                <GlobalSearch />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </UserProvider>
    );
};
