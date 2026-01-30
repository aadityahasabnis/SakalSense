import { type JSX } from 'react';

import { type Metadata } from 'next';
import Link from 'next/link';

import { 
    ArrowRight, 
    BookOpen, 
    Code, 
    FileText, 
    Flame, 
    GraduationCap,
    Sparkles, 
    TrendingUp,
    Users 
} from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeaturedContent, getTrendingContent } from '@/server/actions/content/publicContentActions';
import { getDomains } from '@/server/actions/content/taxonomyActions';
import { type IContentListItem } from '@/types/content.types';

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
    // Fetch data in parallel
    const [featuredResult, trendingResult, domainsResult] = await Promise.all([
        getFeaturedContent(6),
        getTrendingContent(4),
        getDomains(),
    ]);

    const featuredContent = featuredResult.success ? (featuredResult.data as IContentListItem[]) : [];
    const trendingContent = trendingResult.success ? (trendingResult.data as IContentListItem[]) : [];
    const domains = domainsResult.success ? domainsResult.data : [];

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
                                <Link href='/register'>
                                    Get Started Free
                                    <ArrowRight className='ml-2 h-4 w-4' />
                                </Link>
                            </Button>
                            <Button size='lg' variant='outline' asChild>
                                <Link href='/explore'>
                                    Explore Content
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

                {/* Background decoration */}
                <div className='absolute inset-0 -z-10 overflow-hidden'>
                    <div className='absolute left-1/2 top-0 -translate-x-1/2 w-[200%] aspect-[1/0.7] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl' />
                </div>
            </section>

            {/* Trending Content */}
            {trendingContent && trendingContent.length > 0 && (
                <section className='container mx-auto px-4 py-16'>
                    <div className='mb-8 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <div className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500'>
                                <Flame className='h-5 w-5' />
                            </div>
                            <div>
                                <h2 className='text-2xl font-bold tracking-tight'>Trending Now</h2>
                                <p className='text-sm text-muted-foreground'>
                                    Most popular content this week
                                </p>
                            </div>
                        </div>
                        <Button variant='ghost' asChild>
                            <Link href='/explore'>
                                View All
                                <ArrowRight className='ml-2 h-4 w-4' />
                            </Link>
                        </Button>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                        {trendingContent.map((content) => (
                            <ContentCard key={content.id} content={content} />
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Content */}
            {featuredContent && featuredContent.length > 0 && (
                <section className='border-t bg-muted/30'>
                    <div className='container mx-auto px-4 py-16'>
                        <div className='mb-8 flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                                    <Sparkles className='h-5 w-5' />
                                </div>
                                <div>
                                    <h2 className='text-2xl font-bold tracking-tight'>Featured Content</h2>
                                    <p className='text-sm text-muted-foreground'>
                                        Hand-picked articles and guides by our team
                                    </p>
                                </div>
                            </div>
                            <Button variant='ghost' asChild>
                                <Link href='/explore'>
                                    View All
                                    <ArrowRight className='ml-2 h-4 w-4' />
                                </Link>
                            </Button>
                        </div>

                        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                            {featuredContent.map((content) => (
                                <ContentCard key={content.id} content={content} variant='featured' />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Browse by Domain */}
            {domains && domains.length > 0 && (
                <section className='container mx-auto px-4 py-16'>
                    <div className='mb-8 text-center space-y-2'>
                        <h2 className='text-3xl font-bold tracking-tight'>Browse by Domain</h2>
                        <p className='text-muted-foreground'>
                            Explore content organized by subject area
                        </p>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                        {domains.map((domain) => (
                            <Link
                                key={domain.id}
                                href={`/domain/${domain.slug}`}
                                className='group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50'
                            >
                                <div className='flex items-start justify-between'>
                                    <div>
                                        <h3 className='font-semibold group-hover:text-primary transition-colors'>
                                            {domain.name}
                                        </h3>
                                        {domain.description && (
                                            <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>
                                                {domain.description}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight className='h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors' />
                                </div>
                            </Link>
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
                            Choose from our diverse range of content types
                        </p>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500'>
                                    <FileText className='h-6 w-6' />
                                </div>
                                <CardTitle>Articles</CardTitle>
                                <CardDescription>
                                    In-depth guides on various topics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/articles'>
                                        Browse Articles
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500'>
                                    <BookOpen className='h-6 w-6' />
                                </div>
                                <CardTitle>Tutorials</CardTitle>
                                <CardDescription>
                                    Step-by-step learning guides
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/tutorials'>
                                        View Tutorials
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className='group transition-all hover:shadow-lg hover:border-primary/50'>
                            <CardHeader>
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500'>
                                    <GraduationCap className='h-6 w-6' />
                                </div>
                                <CardTitle>Courses</CardTitle>
                                <CardDescription>
                                    Structured learning paths
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
                                <div className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500'>
                                    <Code className='h-6 w-6' />
                                </div>
                                <CardTitle>Practice</CardTitle>
                                <CardDescription>
                                    Hands-on coding challenges
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant='ghost' className='w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground' asChild>
                                    <Link href='/practice'>
                                        Start Practice
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Why SakalSense */}
            <section className='container mx-auto px-4 py-16'>
                <div className='mb-12 text-center space-y-2'>
                    <Badge variant='secondary' className='mb-4'>Why SakalSense</Badge>
                    <h2 className='text-3xl font-bold tracking-tight'>Built for Serious Learners</h2>
                    <p className='mx-auto max-w-2xl text-muted-foreground'>
                        We combine the best of Wikipedia, Medium, Coursera, and GeeksForGeeks 
                        into one unified learning platform
                    </p>
                </div>

                <div className='grid gap-8 md:grid-cols-3'>
                    <div className='text-center space-y-4'>
                        <div className='mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <FileText className='h-8 w-8' />
                        </div>
                        <h3 className='text-xl font-semibold'>Quality Content</h3>
                        <p className='text-muted-foreground'>
                            All content is reviewed and curated by experts. 
                            No fluff, just practical knowledge you can apply.
                        </p>
                    </div>

                    <div className='text-center space-y-4'>
                        <div className='mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <TrendingUp className='h-8 w-8' />
                        </div>
                        <h3 className='text-xl font-semibold'>Track Your Progress</h3>
                        <p className='text-muted-foreground'>
                            Build streaks, earn badges, and see how far you&apos;ve come. 
                            Learning is more fun with visible progress.
                        </p>
                    </div>

                    <div className='text-center space-y-4'>
                        <div className='mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <Users className='h-8 w-8' />
                        </div>
                        <h3 className='text-xl font-semibold'>Community Driven</h3>
                        <p className='text-muted-foreground'>
                            Join discussions, share insights, and learn together with 
                            a community of like-minded learners.
                        </p>
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
