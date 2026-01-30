'use client';
// =============================================
// UserNavbar - Main navigation for logged-in users
// =============================================

import { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAtom, useAtomValue } from 'jotai';
import {
    Bell,
    Bookmark,
    Compass,
    GraduationCap,
    History,
    Home,
    Menu,
    Search,
    Settings,
    User,
} from 'lucide-react';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { currentUserAtom, globalSearchOpenAtom } from '@/jotai/atoms';
import { cn } from '@/lib/utils';

// =============================================
// Navigation Links
// =============================================

const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/courses', label: 'Courses', icon: GraduationCap },
];

const userMenuLinks = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/profile?tab=bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/profile?tab=activity', label: 'Activity', icon: History },
    { href: '/profile?tab=settings', label: 'Settings', icon: Settings },
];

// =============================================
// Helper Functions
// =============================================

const getInitials = (name: string): string =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

// =============================================
// UserNavbar Component
// =============================================

export const UserNavbar = () => {
    const pathname = usePathname();
    const user = useAtomValue(currentUserAtom);
    const [, setSearchOpen] = useAtom(globalSearchOpenAtom);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='flex h-16 items-center justify-between'>
                    {/* Left: Logo + Nav */}
                    <div className='flex items-center gap-8'>
                        {/* Logo */}
                        <Link href='/' className='flex items-center gap-2'>
                            <span className='text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
                                SakalSense
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className='hidden md:flex items-center gap-1'>
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        )}
                                    >
                                        <link.icon className='h-4 w-4' />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right: Search + Actions + User */}
                    <div className='flex items-center gap-3'>
                        {/* Search (Desktop) */}
                        <Button
                            variant='outline'
                            className='relative hidden w-64 justify-start text-sm text-muted-foreground md:flex'
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className='mr-2 h-4 w-4' />
                            Search...
                            <kbd className='pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex'>
                                <span className='text-xs'>⌘</span>K
                            </kbd>
                        </Button>

                        {/* Search (Mobile) */}
                        <Button
                            variant='ghost'
                            size='icon'
                            className='md:hidden'
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className='h-5 w-5' />
                        </Button>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notifications */}
                        <Button variant='ghost' size='icon' className='relative'>
                            <Bell className='h-5 w-5' />
                            {/* Notification badge - show if there are unread */}
                            <span className='absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive' />
                        </Button>

                        {/* User Menu (Desktop) */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' className='relative h-9 w-9 rounded-full'>
                                        <Avatar className='h-9 w-9'>
                                            <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                                            <AvatarFallback className='text-sm'>
                                                {getInitials(user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='w-64' align='end' forceMount>
                                    <DropdownMenuLabel className='font-normal'>
                                        <div className='flex items-center gap-3'>
                                            <Avatar className='h-10 w-10'>
                                                <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div className='flex flex-col space-y-1'>
                                                <p className='text-sm font-medium leading-none'>{user.fullName}</p>
                                                {user.email && (
                                                    <p className='text-xs leading-none text-muted-foreground'>
                                                        {user.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {userMenuLinks.map((link) => (
                                        <DropdownMenuItem key={link.href} asChild>
                                            <Link href={link.href} className='flex items-center gap-2'>
                                                <link.icon className='h-4 w-4' />
                                                {link.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <LogoutButton 
                                            role='USER' 
                                            loginPath='/login' 
                                            className='w-full justify-start cursor-pointer bg-transparent hover:bg-destructive/10 text-destructive rounded-sm px-2 py-1.5 text-sm' 
                                        />
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className='hidden md:flex items-center gap-2'>
                                <Button variant='ghost' asChild>
                                    <Link href='/login'>Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link href='/register'>Sign Up</Link>
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant='ghost' size='icon' className='md:hidden'>
                                    <Menu className='h-5 w-5' />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side='right' className='w-80 p-0'>
                                <div className='flex h-full flex-col'>
                                    {/* Header */}
                                    <div className='border-b p-4'>
                                        {user ? (
                                            <div className='flex items-center gap-3'>
                                                <Avatar className='h-12 w-12'>
                                                    <AvatarImage src={user.avatarLink ?? undefined} alt={user.fullName} />
                                                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className='font-medium'>{user.fullName}</p>
                                                    {user.email && (
                                                        <p className='text-sm text-muted-foreground'>{user.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='space-y-2'>
                                                <Button asChild className='w-full'>
                                                    <Link href='/login'>Login</Link>
                                                </Button>
                                                <Button variant='outline' asChild className='w-full'>
                                                    <Link href='/register'>Sign Up</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    <nav className='flex-1 overflow-auto p-4'>
                                        <div className='space-y-1'>
                                            {navLinks.map((link) => {
                                                const isActive = pathname === link.href;
                                                return (
                                                    <Link
                                                        key={link.href}
                                                        href={link.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={cn(
                                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                            isActive
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        )}
                                                    >
                                                        <link.icon className='h-5 w-5' />
                                                        {link.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        {user && (
                                            <>
                                                <div className='my-4 border-t' />
                                                <div className='space-y-1'>
                                                    {userMenuLinks.map((link) => (
                                                        <Link
                                                            key={link.href}
                                                            href={link.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                                                        >
                                                            <link.icon className='h-5 w-5' />
                                                            {link.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </nav>

                                    {/* Footer */}
                                    {user && (
                                        <div className='border-t p-4'>
                                            <LogoutButton
                                                role='USER'
                                                loginPath='/login'
                                                className='w-full rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground'
                                            />
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};
