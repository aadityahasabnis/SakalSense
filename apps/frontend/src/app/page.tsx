import { type JSX } from 'react';

import { type Metadata } from 'next';
import Link from 'next/link';

import { ArrowRight, BookOpen, Code, FileText, Sparkles, TrendingUp } from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeaturedContent } from '@/server/actions/content/publicContentActions';

export const metadata: Metadata = {
    title: 'SakalSense - Learn, Practice, Grow',
    description: 'Your comprehensive learning platform for technology, academics, and professional development. Access tutorials, courses, practice problems, and more.',
    keywords: 'learning platform, tutorials, courses, practice problems, programming, education',
    openGraph: {
        title: 'SakalSense - Learn, Practice, Grow',
        description: 'Your comprehensive learning platform for technology, academics, and professional development.',
        type: 'website',
    },
};

const HomePage = async (): Promise<JSX.Element> => {
    // Fetch featured content for homepage
    const featuredResult = await getFeaturedContent(6);
    const featuredContent = featuredResult.success ? featuredResult.data : [];

    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className='relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background'>
                <div className='container mx-auto px-4 py-20 sm:py-32'>
                    <div className='mx-auto max-w-3xl text-center space-y-8'>
                        {/* Badge */}
                        <div className='inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-sm'>
                            <Sparkles className='h-4 w-4 text-primary' />
                            <span>Your journey to mastery starts here</span>
                        </div>

                        {/* Heading */}
                        <h1 className='text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
                            Learn. Practice.{' '}
                            <span className='bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
                                Grow.
                            </span>
                        </h1>

                        {/* Description */}
                        <p className='text-lg text-muted-foreground sm:text-xl'>
                            Access thousands of tutorials, hands-on practice problems, and structured courses.
                            Master technology, academics, and professional skills at your own pace.
                        </p>

                        {/* CTAs */}
                        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                            <Button size='lg' asChild>
                                <Link href='/explore'>
                                    Explore Content
                                    <ArrowRight className='ml-2 h-4 w-4' />
                                </Link>
                            </Button>
                            <Button size='lg' variant='outline' asChild>
                                <Link href='/courses'>
                                    Browse Courses
                                </Link>
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className='grid grid-cols-3 gap-8 pt-8'>
                            <div className='space-y-1'>
                                <p className='text-3xl font-bold'>1000+</p>
                                <p className='text-sm text-muted-foreground'>Articles & Tutorials</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-3xl font-bold'>50+</p>
                                <p className='text-sm text-muted-foreground'>Courses</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-3xl font-bold'>10K+</p>
                                <p className='text-sm text-muted-foreground'>Learners</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Content */}
            {featuredContent && featuredContent.length > 0 && (
                <section className='container mx-auto px-4 py-16'>
                    <div className='mb-8 flex items-center justify-between'>
                        <div className='space-y-2'>
                            <h2 className='text-3xl font-bold tracking-tight'>Featured Content</h2>
                            <p className='text-muted-foreground'>
                                Hand-picked articles, tutorials, and guides by our team
                            </p>
                        </div>
                        <Button variant='ghost' asChild>
                            <Link href='/explore?featured=true'>
                                View All
                                <ArrowRight className='ml-2 h-4 w-4' />
                            </Link>
                        </Button>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {featuredContent.map((content: unknown) => (
                            <ContentCard
                                key={(content as { id: string }).id}
                                content={content as never}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Learning Paths */}
            <section className='border-t bg-muted/30'>
                <div className='container mx-auto px-4 py-16'>
                    <div className='mb-12 text-center space-y-2'>
                        <h2 className='text-3xl font-bold tracking-tight'>What do you want to learn?</h2>
                        <p className='text-muted-foreground'>
                            Choose from our diverse range of topics and start your learning journey
                        </p>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                                    <FileText className='h-6 w-6' />
                                </div>
                                <CardTitle>Articles & Tutorials</CardTitle>
                                <CardDescription>
                                    In-depth guides and tutorials on various technologies and topics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/explore?type=ARTICLE,TUTORIAL'>
                                        Browse Articles
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                                    <BookOpen className='h-6 w-6' />
                                </div>
                                <CardTitle>Structured Courses</CardTitle>
                                <CardDescription>
                                    Comprehensive courses with lessons, quizzes, and certifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/courses'>
                                        View Courses
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                                    <Code className='h-6 w-6' />
                                </div>
                                <CardTitle>Practice Problems</CardTitle>
                                <CardDescription>
                                    Hands-on coding challenges to sharpen your programming skills
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/practice'>
                                        Start Practicing
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className='border-t'>
                <div className='container mx-auto px-4 py-16'>
                    <Card className='overflow-hidden border-primary/50 bg-gradient-to-br from-primary/10 to-background'>
                        <CardContent className='p-8 md:p-12'>
                            <div className='mx-auto max-w-2xl text-center space-y-6'>
                                <div className='inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm'>
                                    <TrendingUp className='h-4 w-4 text-primary' />
                                    <span>Join thousands of learners</span>
                                </div>

                                <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>
                                    Ready to start your learning journey?
                                </h2>

                                <p className='text-lg text-muted-foreground'>
                                    Create a free account and get access to all content. Track your progress,
                                    bookmark your favorites, and join our community.
                                </p>

                                <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
                                    <Button size='lg' asChild>
                                        <Link href='/register'>
                                            Get Started Free
                                            <ArrowRight className='ml-2 h-4 w-4' />
                                        </Link>
                                    </Button>
                                    <Button size='lg' variant='outline' asChild>
                                        <Link href='/register/admin'>
                                            Become a Creator
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </PublicLayout>
    );
};

export default HomePage;
