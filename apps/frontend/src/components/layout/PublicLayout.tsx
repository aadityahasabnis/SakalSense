import { type JSX, type ReactNode } from 'react';

import { Footer } from '@/components/layout/PublicFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

interface IPublicLayoutProps {
    children: ReactNode;
}

export const PublicLayout = ({ children }: IPublicLayoutProps): JSX.Element => {
    return (
        <div className='flex min-h-screen flex-col'>
            <PublicNavbar />
            <main className='flex-1'>{children}</main>
            <Footer />
        </div>
    );
};
