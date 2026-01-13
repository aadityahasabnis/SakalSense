'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAtom } from 'jotai';
import { BarChart3, Bookmark, BookOpen, FileText, GraduationCap, LayoutDashboard, type LucideIcon, Settings, Users } from 'lucide-react';

import { sidebarOpenAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';

interface INavItem { title: string; href: string; icon: LucideIcon; badge?: string }
interface ISidebarProps { stakeholder: 'user' | 'admin' | 'administrator' }

const USER_NAV: Array<INavItem> = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Browse', href: '/browse', icon: BookOpen },
    { title: 'My Courses', href: '/courses', icon: GraduationCap },
    { title: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { title: 'Progress', href: '/progress', icon: BarChart3 },
    { title: 'Settings', href: '/settings', icon: Settings },
];

const ADMIN_NAV: Array<INavItem> = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Content', href: '/admin/content', icon: FileText },
    { title: 'Courses', href: '/admin/courses', icon: GraduationCap },
    { title: 'Series', href: '/admin/series', icon: BookOpen },
    { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
];

const ADMINISTRATOR_NAV: Array<INavItem> = [
    { title: 'Dashboard', href: '/administrator/dashboard', icon: LayoutDashboard },
    { title: 'Admins', href: '/administrator/admins', icon: Users },
    { title: 'Users', href: '/administrator/users', icon: Users },
    { title: 'Content', href: '/administrator/content', icon: FileText },
    { title: 'Analytics', href: '/administrator/analytics', icon: BarChart3 },
    { title: 'Settings', href: '/administrator/settings', icon: Settings },
];

const getNavItems = (stakeholder: string): Array<INavItem> => stakeholder === 'administrator' ? ADMINISTRATOR_NAV : stakeholder === 'admin' ? ADMIN_NAV : USER_NAV;

export const Sidebar = ({ stakeholder }: ISidebarProps) => {
    const [sidebarOpen] = useAtom(sidebarOpenAtom);
    const pathname = usePathname();
    const navItems = getNavItems(stakeholder);
    const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <aside className={cn('fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300', sidebarOpen ? 'w-64' : 'w-16')}>
            <nav className="flex flex-col gap-1 p-2">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground', !sidebarOpen && 'justify-center px-2')}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.title}</span>}
                        {sidebarOpen && item.badge && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">{item.badge}</span>}
                    </Link>
                ))}
            </nav>
        </aside>
    );
};
