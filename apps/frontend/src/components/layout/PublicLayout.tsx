'use client';
// =============================================
// PublicLayout - Unified layout for all public pages
// Uses MainNavbar which adapts based on auth state
// =============================================

import { type JSX, type ReactNode } from 'react';

import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { MainNavbar } from '@/components/layout/MainNavbar';
import { Footer } from '@/components/layout/PublicFooter';

interface IPublicLayoutProps {
    children: ReactNode;
}

export const PublicLayout = ({ children }: IPublicLayoutProps): JSX.Element => {
    return (
        <div className="flex min-h-screen flex-col">
            <MainNavbar />
            <GlobalSearch />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
};
