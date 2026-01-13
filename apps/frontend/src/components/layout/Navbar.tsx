'use client';

import Link from 'next/link';

import { useAtom } from 'jotai';
import { Bell, Menu, Search, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { globalSearchOpenAtom, sidebarOpenAtom } from '@/jotai/atoms';

interface INavbarProps {
    user?: { name: string; email: string; avatarUrl?: string };
    stakeholder: 'user' | 'admin' | 'administrator';
}

const getInitials = (name: string): string => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getDashboardPath = (stakeholder: string): string => stakeholder === 'administrator' ? '/administrator/dashboard' : stakeholder === 'admin' ? '/admin/dashboard' : '/dashboard';

export const Navbar = ({ user, stakeholder }: INavbarProps) => {
    const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
    const [, setSearchOpen] = useAtom(globalSearchOpenAtom);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                <Link href={getDashboardPath(stakeholder)} className="flex items-center gap-2 font-semibold">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">SakalSense</span>
                </Link>

                <div className="flex-1" />

                <Button variant="outline" className="relative w-60 justify-start text-sm text-muted-foreground hidden md:flex" onClick={() => setSearchOpen(true)}>
                    <Search className="mr-2 h-4 w-4" />Search...<kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex"><span className="text-xs">⌘</span>K</kbd>
                </Button>

                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}><Search className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /><span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" /></Button>

                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.name} /><AvatarFallback>{getInitials(user.name)}</AvatarFallback></Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user.name}</p><p className="text-xs leading-none text-muted-foreground">{user.email}</p></div></DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button size="sm">{BUTTON_LABEL.GET_STARTED}</Button>
                )}
            </div>
        </header>
    );
};
