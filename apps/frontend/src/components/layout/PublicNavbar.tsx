import { type JSX } from 'react';

import Link from 'next/link';

import {
    BookOpen,
    Code,
    FileText,
    Home,
    Layers,
    Search,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';

export const PublicNavbar = (): JSX.Element => {
    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container mx-auto flex h-16 items-center justify-between px-4'>
                {/* Logo */}
                <Link href='/' className='flex items-center gap-2 font-semibold'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                        <Layers className='h-5 w-5' />
                    </div>
                    <span className='text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
                        SakalSense
                    </span>
                </Link>

                {/* Navigation */}
                <nav className='hidden md:flex items-center gap-6'>
                    <Link
                        href='/'
                        className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <Home className='h-4 w-4' />
                        Home
                    </Link>
                    <Link
                        href='/explore'
                        className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <Search className='h-4 w-4' />
                        Explore
                    </Link>
                    <Link
                        href='/courses'
                        className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <BookOpen className='h-4 w-4' />
                        Courses
                    </Link>
                    <Link
                        href='/practice'
                        className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <Code className='h-4 w-4' />
                        Practice
                    </Link>
                    <Link
                        href='/blog'
                        className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <FileText className='h-4 w-4' />
                        Blog
                    </Link>
                </nav>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                    <ThemeToggle />
                    <Button variant='ghost' size='sm' asChild>
                        <Link href='/login'>Sign In</Link>
                    </Button>
                    <Button size='sm' asChild>
                        <Link href='/register'>Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};
