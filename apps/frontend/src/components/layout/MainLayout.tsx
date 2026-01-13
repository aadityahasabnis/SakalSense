'use client';

import { type ReactNode } from 'react';

import { useAtom } from 'jotai';

import { Navbar } from './Navbar';
import { SearchDialog } from './SearchDialog';
import { Sidebar } from './Sidebar';

import { sidebarOpenAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';

interface IMainLayoutProps {
    children: ReactNode;
    user?: { name: string; email: string; avatarUrl?: string };
    stakeholder: 'user' | 'admin' | 'administrator';
    showSidebar?: boolean;
}

export const MainLayout = ({ children, user, stakeholder, showSidebar = true }: IMainLayoutProps) => {
    const [sidebarOpen] = useAtom(sidebarOpenAtom);

    return (
        <div className="min-h-screen bg-background">
            <Navbar user={user} stakeholder={stakeholder} />
            {showSidebar && <Sidebar stakeholder={stakeholder} />}
            <SearchDialog />
            <main className={cn('min-h-[calc(100vh-3.5rem)] transition-all duration-300', showSidebar && (sidebarOpen ? 'ml-64' : 'ml-16'))}>
                <div className="container py-6">{children}</div>
            </main>
        </div>
    );
};
