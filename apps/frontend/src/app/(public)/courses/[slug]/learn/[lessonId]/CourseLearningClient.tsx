'use client';

// =============================================
// Course Learning Client Component
// =============================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    GraduationCap,
    Home,
    Layers,
    List,
    Lock,
    Menu,
    Play,
    Trophy,
    X,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { completeLessonWithXP } from '@/server/actions/content/lessonActions';

// =============================================
// Types
// =============================================

interface ILinkedContent {
    id: string;
    title: string;
    slug: string;
    type: string;
}

interface ILesson {
    id: string;
    title: string;
    description?: string;
    body: unknown;
    order: number;
    isFree: boolean;
    section: {
        id: string;
        title: string;
        order: number;
    };
    quiz?: {
        id: string;
        title: string;
    };
    linkedContent?: ILinkedContent[];
}

interface ILessonNavItem {
    id: string;
    title: string;
    order: number;
    isFree: boolean;
    isCompleted: boolean;
}

interface ISection {
    id: string;
    title: string;
    order: number;
    lessons: ILessonNavItem[];
}

interface INavigation {
    sections: ISection[];
    currentLessonId: string;
    previousLesson?: { id: string; title: string };
    nextLesson?: { id: string; title: string };
    progress: number;
    completedLessons: number;
    totalLessons: number;
}

interface ICourse {
    id: string;
    title: string;
    slug: string;
    creator: {
        id: string;
        fullName: string;
        avatarLink?: string | null;
    };
}

interface ICourseLearningClientProps {
    lesson: ILesson;
    course: ICourse;
    navigation: INavigation;
    isLoggedIn: boolean;
    isEnrolled: boolean;
    isCompleted: boolean;
}

// =============================================
// Content Renderer Component
// =============================================

const ContentRenderer = ({ body }: { body: unknown }) => {
    // Handle various content formats
    if (!body) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No content available</h3>
                <p className="text-sm text-muted-foreground/70">This lesson doesn&apos;t have any content yet.</p>
            </div>
        );
    }

    // If it's a string (HTML or markdown)
    if (typeof body === 'string') {
        return (
            <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
            />
        );
    }

    // If it's a TipTap/ProseMirror-style JSON document
    if (typeof body === 'object' && body !== null && 'type' in body) {
        const doc = body as { type: string; content?: Array<{ type: string; content?: unknown[]; attrs?: Record<string, unknown> }> };
        
        if (doc.type === 'doc' && doc.content) {
            return (
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {doc.content.map((node, index) => {
                        switch (node.type) {
                            case 'paragraph':
                                return (
                                    <p key={index}>
                                        {renderInlineContent(node.content)}
                                    </p>
                                );
                            case 'heading':
                                const level = (node.attrs?.level as number) || 2;
                                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
                                return (
                                    <HeadingTag key={index}>
                                        {renderInlineContent(node.content)}
                                    </HeadingTag>
                                );
                            case 'bulletList':
                                return (
                                    <ul key={index}>
                                        {(node.content as Array<{ content?: unknown[] }>)?.map((item, i) => (
                                            <li key={i}>{renderInlineContent(item.content)}</li>
                                        ))}
                                    </ul>
                                );
                            case 'orderedList':
                                return (
                                    <ol key={index}>
                                        {(node.content as Array<{ content?: unknown[] }>)?.map((item, i) => (
                                            <li key={i}>{renderInlineContent(item.content)}</li>
                                        ))}
                                    </ol>
                                );
                            case 'codeBlock':
                                return (
                                    <pre key={index} className="bg-muted rounded-lg p-4 overflow-x-auto">
                                        <code>{renderInlineContent(node.content)}</code>
                                    </pre>
                                );
                            case 'blockquote':
                                return (
                                    <blockquote key={index} className="border-l-4 border-primary pl-4 italic">
                                        {renderInlineContent(node.content)}
                                    </blockquote>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            );
        }
    }

    // Fallback: display as formatted JSON (for debugging)
    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                {JSON.stringify(body, null, 2)}
            </pre>
        </div>
    );
};

// Helper to render inline content
const renderInlineContent = (content: unknown[] | undefined): React.ReactNode => {
    if (!content) return null;
    
    return content.map((node: { type?: string; text?: string; marks?: Array<{ type: string }> }, index) => {
        if (typeof node === 'string') return node;
        if (node.type === 'text') {
            let text: React.ReactNode = node.text || '';
            if (node.marks) {
                for (const mark of node.marks) {
                    switch (mark.type) {
                        case 'bold':
                            text = <strong key={index}>{text}</strong>;
                            break;
                        case 'italic':
                            text = <em key={index}>{text}</em>;
                            break;
                        case 'code':
                            text = <code key={index} className="bg-muted px-1 rounded">{text}</code>;
                            break;
                    }
                }
            }
            return <span key={index}>{text}</span>;
        }
        return null;
    });
};

// =============================================
// Course Sidebar Component
// =============================================

const CourseSidebar = ({
    course,
    navigation,
    isEnrolled,
    onLessonClick,
    className,
}: {
    course: ICourse;
    navigation: INavigation;
    isEnrolled: boolean;
    onLessonClick: (lessonId: string) => void;
    className?: string;
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        // Find section containing current lesson and expand it
        for (const section of navigation.sections) {
            if (section.lessons.some(l => l.id === navigation.currentLessonId)) {
                return new Set([section.id]);
            }
        }
        return new Set([navigation.sections[0]?.id]);
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

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Course Header */}
            <div className="p-4 border-b">
                <Link href={`/courses/${course.slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Course
                </Link>
                <h2 className="font-semibold line-clamp-2">{course.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={course.creator.avatarLink ?? undefined} />
                        <AvatarFallback className="text-xs">
                            {course.creator.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{course.creator.fullName}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Your Progress</span>
                    <span className="text-muted-foreground">
                        {navigation.completedLessons}/{navigation.totalLessons} lessons
                    </span>
                </div>
                <Progress value={navigation.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{navigation.progress}% complete</p>
            </div>

            {/* Sections & Lessons */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {navigation.sections.map((section) => {
                        const sectionCompleted = section.lessons.every(l => l.isCompleted);
                        const sectionProgress = section.lessons.filter(l => l.isCompleted).length;
                        
                        return (
                            <div key={section.id} className="mb-2">
                                {/* Section Header */}
                                <button
                                    className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedSections.has(section.id) ? (
                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 shrink-0" />
                                        )}
                                        <div className="text-left">
                                            <p className="text-sm font-medium line-clamp-1">{section.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {sectionProgress}/{section.lessons.length} completed
                                            </p>
                                        </div>
                                    </div>
                                    {sectionCompleted && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    )}
                                </button>

                                {/* Lessons */}
                                {expandedSections.has(section.id) && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {section.lessons.map((lesson) => {
                                            const isCurrent = lesson.id === navigation.currentLessonId;
                                            const canAccess = lesson.isFree || isEnrolled;
                                            
                                            return (
                                                <button
                                                    key={lesson.id}
                                                    className={cn(
                                                        'flex w-full items-center gap-2 p-2 rounded-lg text-sm transition-colors',
                                                        isCurrent
                                                            ? 'bg-primary/10 text-primary'
                                                            : canAccess
                                                            ? 'hover:bg-muted/50'
                                                            : 'opacity-50 cursor-not-allowed',
                                                    )}
                                                    onClick={() => canAccess && onLessonClick(lesson.id)}
                                                    disabled={!canAccess}
                                                >
                                                    <div className={cn(
                                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                                        lesson.isCompleted
                                                            ? 'bg-green-500/10'
                                                            : isCurrent
                                                            ? 'bg-primary/20'
                                                            : 'bg-muted',
                                                    )}>
                                                        {lesson.isCompleted ? (
                                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                                        ) : !canAccess ? (
                                                            <Lock className="h-3 w-3 text-muted-foreground" />
                                                        ) : isCurrent ? (
                                                            <Play className="h-3 w-3" />
                                                        ) : (
                                                            <span className="text-xs">{lesson.order}</span>
                                                        )}
                                                    </div>
                                                    <span className="line-clamp-1 text-left">{lesson.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

// =============================================
// XP Toast Component
// =============================================

const XPToast = ({
    xp,
    levelUp,
    sectionCompleted,
    courseCompleted,
    onClose,
}: {
    xp: number;
    levelUp: boolean;
    sectionCompleted: boolean;
    courseCompleted: boolean;
    onClose: () => void;
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                            {courseCompleted ? (
                                <Trophy className="h-6 w-6 text-yellow-500" />
                            ) : (
                                <Zap className="h-6 w-6 text-yellow-500" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                                +{xp} XP Earned!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {courseCompleted
                                    ? 'Course completed!'
                                    : sectionCompleted
                                    ? 'Section completed!'
                                    : 'Lesson completed!'}
                            </p>
                            {levelUp && (
                                <p className="text-sm font-medium text-primary">Level up!</p>
                            )}
                        </div>
                        <button onClick={onClose} className="ml-2">
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// =============================================
// Main Component
// =============================================

export const CourseLearningClient = ({
    lesson,
    course,
    navigation,
    isLoggedIn,
    isEnrolled,
    isCompleted: initialIsCompleted,
}: ICourseLearningClientProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
    const [xpToast, setXpToast] = useState<{
        xp: number;
        levelUp: boolean;
        sectionCompleted: boolean;
        courseCompleted: boolean;
    } | null>(null);

    // Complete lesson mutation
    const completeMutation = useMutation({
        mutationFn: () => completeLessonWithXP(course.id, lesson.id),
        onSuccess: (result) => {
            if (result.success && result.data) {
                setIsCompleted(true);
                if (result.data.xpAwarded > 0) {
                    setXpToast({
                        xp: result.data.xpAwarded,
                        levelUp: result.data.levelUp,
                        sectionCompleted: result.data.sectionCompleted,
                        courseCompleted: result.data.courseCompleted,
                    });
                }
                queryClient.invalidateQueries({ queryKey: ['enrollments'] });
                queryClient.invalidateQueries({ queryKey: ['user-xp'] });
            }
        },
    });

    const handleLessonClick = (lessonId: string) => {
        setSidebarOpen(false);
        router.push(`/courses/${course.slug}/learn/${lessonId}`);
    };

    const handleMarkComplete = () => {
        if (!isLoggedIn) {
            router.push(`/login?redirect=/courses/${course.slug}/learn/${lesson.id}`);
            return;
        }
        if (!isEnrolled) {
            router.push(`/courses/${course.slug}?enroll=true`);
            return;
        }
        completeMutation.mutate();
    };

    const handleNextLesson = () => {
        if (navigation.nextLesson) {
            // Auto-complete if not already
            if (!isCompleted && isEnrolled) {
                completeMutation.mutate();
            }
            router.push(`/courses/${course.slug}/learn/${navigation.nextLesson.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center gap-4 px-4">
                    {/* Mobile Menu */}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Course Navigation</SheetTitle>
                            </SheetHeader>
                            <CourseSidebar
                                course={course}
                                navigation={navigation}
                                isEnrolled={isEnrolled}
                                onLessonClick={handleLessonClick}
                            />
                        </SheetContent>
                    </Sheet>

                    {/* Breadcrumb */}
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                        <Link href="/" className="hover:text-foreground shrink-0">
                            <Home className="h-4 w-4" />
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <Link href="/courses" className="hover:text-foreground shrink-0">
                            Courses
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <Link href={`/courses/${course.slug}`} className="hover:text-foreground truncate max-w-[150px]">
                            {course.title}
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                        <span className="text-foreground truncate">{lesson.title}</span>
                    </div>

                    <div className="flex-1" />

                    {/* Progress indicator (mobile) */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <span className="text-xs text-muted-foreground">
                            {navigation.completedLessons}/{navigation.totalLessons}
                        </span>
                        <Progress value={navigation.progress} className="w-16 h-1.5" />
                    </div>

                    {/* Toggle sidebar button (desktop) */}
                    <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <List className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-80 shrink-0 border-r h-[calc(100vh-3.5rem)] sticky top-14">
                    <CourseSidebar
                        course={course}
                        navigation={navigation}
                        isEnrolled={isEnrolled}
                        onLessonClick={handleLessonClick}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
                        {/* Lesson Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Layers className="h-4 w-4" />
                                <span>Section {lesson.section.order}: {lesson.section.title}</span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold lg:text-3xl">{lesson.title}</h1>
                                    {lesson.description && (
                                        <p className="text-muted-foreground mt-2">{lesson.description}</p>
                                    )}
                                </div>
                                {isCompleted && (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        Completed
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator className="mb-8" />

                        {/* Lesson Content */}
                        <div className="mb-12">
                            <ContentRenderer body={lesson.body} />
                        </div>

                        {/* Linked Content */}
                        {lesson.linkedContent && lesson.linkedContent.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Related Content
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {lesson.linkedContent.map((content) => (
                                        <Link
                                            key={content.id}
                                            href={`/${content.type.toLowerCase()}/${content.slug}`}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium line-clamp-1">{content.title}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{content.type.toLowerCase()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quiz Link */}
                        {lesson.quiz && (
                            <div className="mb-12">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                                    <GraduationCap className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{lesson.quiz.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Test your knowledge with a quiz
                                                    </p>
                                                </div>
                                            </div>
                                            <Button>Take Quiz</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                            {/* Mark Complete Button */}
                            {!isCompleted && isEnrolled && (
                                <Button
                                    variant="outline"
                                    onClick={handleMarkComplete}
                                    disabled={completeMutation.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    {completeMutation.isPending ? 'Marking...' : 'Mark as Complete'}
                                </Button>
                            )}
                            {isCompleted && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">Lesson Completed</span>
                                </div>
                            )}
                            {!isEnrolled && (
                                <Button onClick={() => router.push(`/courses/${course.slug}?enroll=true`)} className="w-full sm:w-auto">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Enroll to Track Progress
                                </Button>
                            )}

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {/* Previous Lesson */}
                                <Button
                                    variant="outline"
                                    onClick={() => navigation.previousLesson && handleLessonClick(navigation.previousLesson.id)}
                                    disabled={!navigation.previousLesson}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                {/* Next Lesson */}
                                <Button
                                    onClick={handleNextLesson}
                                    disabled={!navigation.nextLesson}
                                    className="flex-1 sm:flex-initial"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Next Lesson Preview */}
                        {navigation.nextLesson && (
                            <Card className="mt-8 hover:bg-muted/50 transition-colors cursor-pointer" onClick={handleNextLesson}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <Play className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Up Next</p>
                                                <p className="font-medium">{navigation.nextLesson.title}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Course Completed Message */}
                        {!navigation.nextLesson && navigation.progress >= 100 && (
                            <Card className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                                <CardContent className="p-6 text-center">
                                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                                    <p className="text-muted-foreground mb-4">
                                        You&apos;ve completed the {course.title} course!
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        <Button variant="outline" onClick={() => router.push(`/courses/${course.slug}`)}>
                                            View Certificate
                                        </Button>
                                        <Button onClick={() => router.push('/courses')}>
                                            Browse More Courses
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* XP Toast */}
            {xpToast && (
                <XPToast
                    xp={xpToast.xp}
                    levelUp={xpToast.levelUp}
                    sectionCompleted={xpToast.sectionCompleted}
                    courseCompleted={xpToast.courseCompleted}
                    onClose={() => setXpToast(null)}
                />
            )}
        </div>
    );
};
