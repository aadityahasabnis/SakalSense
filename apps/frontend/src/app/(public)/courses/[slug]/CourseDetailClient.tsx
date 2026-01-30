'use client';

// =============================================
// Course Detail Client Component
// =============================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    BookOpen,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    GraduationCap,
    Layers,
    Lock,
    Play,
    PlayCircle,
    Users,
    Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { enrollInCourse } from '@/server/actions/progress/progressActions';

// =============================================
// Types
// =============================================

interface ILesson {
    id: string;
    title: string;
    description?: string;
    order: number;
    isFree: boolean;
}

interface ISection {
    id: string;
    title: string;
    description?: string;
    order: number;
    lessons: ILesson[];
}

interface ICourse {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    difficulty: string;
    estimatedHours?: number;
    sections: ISection[];
    creator: {
        id: string;
        fullName: string;
        avatarLink?: string;
    };
    _count: {
        enrollments: number;
    };
}

interface ICourseDetailClientProps {
    course: ICourse;
    isEnrolled: boolean;
    progress: number;
    currentLessonId?: string;
    isLoggedIn: boolean;
    lessonCount: number;
}

// =============================================
// Difficulty Badge Colors
// =============================================

const difficultyColors: Record<string, string> = {
    BEGINNER: 'bg-green-500/10 text-green-600 border-green-500/20',
    INTERMEDIATE: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    ADVANCED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    EXPERT: 'bg-red-500/10 text-red-600 border-red-500/20',
};

// =============================================
// Course Detail Client
// =============================================

export const CourseDetailClient = ({
    course,
    isEnrolled: initialIsEnrolled,
    progress,
    currentLessonId,
    isLoggedIn,
    lessonCount,
}: ICourseDetailClientProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isEnrolled, setIsEnrolled] = useState(initialIsEnrolled);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([course.sections[0]?.id]));

    // Enrollment mutation
    const enrollMutation = useMutation({
        mutationFn: () => enrollInCourse(course.id),
        onSuccess: (result) => {
            if (result.success) {
                setIsEnrolled(true);
                queryClient.invalidateQueries({ queryKey: ['enrollments'] });
            }
        },
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleEnroll = () => {
        if (!isLoggedIn) {
            router.push('/login?redirect=/courses/' + course.slug);
            return;
        }
        enrollMutation.mutate();
    };

    const handleStartLearning = () => {
        const firstLesson = course.sections[0]?.lessons[0];
        if (firstLesson) {
            router.push(`/courses/${course.slug}/learn/${firstLesson.id}`);
        }
    };

    const handleContinueLearning = () => {
        if (currentLessonId) {
            router.push(`/courses/${course.slug}/learn/${currentLessonId}`);
        } else {
            handleStartLearning();
        }
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary/5 to-background border-b">
                <div className="container mx-auto max-w-6xl px-4 py-12">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Course Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Breadcrumb */}
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Link href="/courses" className="hover:text-foreground">
                                    Courses
                                </Link>
                                <ChevronRight className="h-4 w-4" />
                                <span className="text-foreground">{course.title}</span>
                            </div>

                            {/* Title & Description */}
                            <div>
                                <Badge
                                    variant="outline"
                                    className={cn('mb-3', difficultyColors[course.difficulty])}
                                >
                                    {course.difficulty}
                                </Badge>
                                <h1 className="mb-4 text-3xl font-bold lg:text-4xl">{course.title}</h1>
                                {course.description && (
                                    <p className="text-muted-foreground text-lg">{course.description}</p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Users className="text-muted-foreground h-5 w-5" />
                                    <span>{course._count.enrollments.toLocaleString()} enrolled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers className="text-muted-foreground h-5 w-5" />
                                    <span>{course.sections.length} sections</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="text-muted-foreground h-5 w-5" />
                                    <span>{lessonCount} lessons</span>
                                </div>
                                {course.estimatedHours && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="text-muted-foreground h-5 w-5" />
                                        <span>{course.estimatedHours} hours</span>
                                    </div>
                                )}
                            </div>

                            {/* Creator */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={course.creator.avatarLink} />
                                    <AvatarFallback>
                                        {course.creator.fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created by</p>
                                    <p className="font-medium">{course.creator.fullName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Card */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-20 shadow-lg">
                                {/* Thumbnail */}
                                {course.thumbnailUrl && (
                                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                                        <Image
                                            src={course.thumbnailUrl}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <PlayCircle className="h-16 w-16 text-white" />
                                        </div>
                                    </div>
                                )}

                                <CardContent className="space-y-4 p-6">
                                    {isEnrolled ? (
                                        <>
                                            {/* Progress */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">Your Progress</span>
                                                    <span className="text-muted-foreground">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                            </div>

                                            {/* Continue Button */}
                                            <Button
                                                className="w-full"
                                                size="lg"
                                                onClick={handleContinueLearning}
                                            >
                                                <Play className="mr-2 h-4 w-4" />
                                                {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                                            </Button>

                                            {/* XP Info */}
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                <Zap className="h-4 w-4 text-yellow-500" />
                                                Earn up to <strong className="text-foreground">100 XP</strong> on completion
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Enroll Button */}
                                            <Button
                                                className="w-full"
                                                size="lg"
                                                onClick={handleEnroll}
                                                disabled={enrollMutation.isPending}
                                            >
                                                <GraduationCap className="mr-2 h-4 w-4" />
                                                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll for Free'}
                                            </Button>

                                            <p className="text-center text-sm text-muted-foreground">
                                                Free access • Lifetime • Certificate
                                            </p>
                                        </>
                                    )}

                                    <Separator />

                                    {/* What you'll learn */}
                                    <div>
                                        <h3 className="mb-3 font-semibold">What you&apos;ll learn</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm">
                                                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                                                <span>Complete understanding of {course.title.toLowerCase()}</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                                                <span>Hands-on practice with real examples</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                                                <span>Certificate of completion</span>
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5" />
                                    Course Curriculum
                                </CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    {course.sections.length} sections • {lessonCount} lessons
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {course.sections.map((section) => (
                                    <div key={section.id} className="rounded-lg border">
                                        {/* Section Header */}
                                        <button
                                            className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedSections.has(section.id) ? (
                                                    <ChevronDown className="h-5 w-5" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5" />
                                                )}
                                                <div className="text-left">
                                                    <h3 className="font-medium">{section.title}</h3>
                                                    <p className="text-muted-foreground text-sm">
                                                        {section.lessons.length} lessons
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Lessons */}
                                        {expandedSections.has(section.id) && (
                                            <div className="border-t bg-muted/20">
                                                {section.lessons.map((lesson) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                            {lesson.isFree || isEnrolled ? (
                                                                <Play className="h-4 w-4" />
                                                            ) : (
                                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{lesson.title}</p>
                                                            {lesson.description && (
                                                                <p className="text-muted-foreground text-sm line-clamp-1">
                                                                    {lesson.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {lesson.isFree && !isEnrolled && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Free
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar for large screens */}
                    <div className="hidden lg:block">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Earn XP & Achievements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                                        <Zap className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">+100 XP</p>
                                        <p className="text-muted-foreground text-sm">Complete the course</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Certificate</p>
                                        <p className="text-muted-foreground text-sm">Earn upon completion</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                        <Award className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Achievement</p>
                                        <p className="text-muted-foreground text-sm">Unlock &quot;Course Graduate&quot;</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
