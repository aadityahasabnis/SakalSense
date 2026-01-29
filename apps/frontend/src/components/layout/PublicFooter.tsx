import { type JSX } from 'react';

import Link from 'next/link';

import {
    Facebook,
    Github,
    Layers,
    Linkedin,
    Mail,
    Twitter,
} from 'lucide-react';

import { Separator } from '@/components/ui/separator';

export const Footer = (): JSX.Element => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className='border-t bg-muted/30'>
            <div className='container mx-auto px-4 py-12'>
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
                    {/* Brand */}
                    <div className='space-y-4'>
                        <Link href='/' className='flex items-center gap-2 font-semibold'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                                <Layers className='h-5 w-5' />
                            </div>
                            <span className='text-lg font-bold'>SakalSense</span>
                        </Link>
                        <p className='text-sm text-muted-foreground'>
                            Your comprehensive learning platform for technology, academics, and professional growth.
                        </p>
                        <div className='flex items-center gap-3'>
                            <Link
                                href='https://twitter.com'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground transition-colors hover:text-foreground'
                            >
                                <Twitter className='h-5 w-5' />
                            </Link>
                            <Link
                                href='https://github.com'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground transition-colors hover:text-foreground'
                            >
                                <Github className='h-5 w-5' />
                            </Link>
                            <Link
                                href='https://linkedin.com'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground transition-colors hover:text-foreground'
                            >
                                <Linkedin className='h-5 w-5' />
                            </Link>
                            <Link
                                href='https://facebook.com'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground transition-colors hover:text-foreground'
                            >
                                <Facebook className='h-5 w-5' />
                            </Link>
                        </div>
                    </div>

                    {/* Platform */}
                    <div className='space-y-4'>
                        <h3 className='text-sm font-semibold'>Platform</h3>
                        <ul className='space-y-2 text-sm'>
                            <li>
                                <Link href='/explore' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Browse Content
                                </Link>
                            </li>
                            <li>
                                <Link href='/courses' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Courses
                                </Link>
                            </li>
                            <li>
                                <Link href='/practice' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Practice Problems
                                </Link>
                            </li>
                            <li>
                                <Link href='/blog' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className='space-y-4'>
                        <h3 className='text-sm font-semibold'>Resources</h3>
                        <ul className='space-y-2 text-sm'>
                            <li>
                                <Link href='/about' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href='/contact' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href='/faq' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href='/register/admin' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Become a Creator
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className='space-y-4'>
                        <h3 className='text-sm font-semibold'>Legal</h3>
                        <ul className='space-y-2 text-sm'>
                            <li>
                                <Link href='/privacy' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href='/terms' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href='/cookies' className='text-muted-foreground transition-colors hover:text-foreground'>
                                    Cookie Policy
                                </Link>
                            </li>
                            <li>
                                <Link href='/mailto:support@sakalsense.com' className='flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground'>
                                    <Mail className='h-3.5 w-3.5' />
                                    Contact Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className='my-8' />

                <div className='flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row'>
                    <p>© {currentYear} SakalSense. All rights reserved.</p>
                    <p>Built with ❤️ for learners worldwide</p>
                </div>
            </div>
        </footer>
    );
};
