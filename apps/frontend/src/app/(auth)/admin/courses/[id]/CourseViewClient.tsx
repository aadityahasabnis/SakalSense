'use client';
// =============================================
// CourseViewClient - View course with sections and lessons
// =============================================

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    ChevronRight,
    Clock,
    Edit,
    GraduationCap,
    MoreHorizontal,
    Plus,
    Trash2
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { CONTENT_STATUS_LABELS, DIFFICULTY_LABELS } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import {
    addCourseSection,
    addLesson,
    deleteCourse,
    getCourseById,
    publishCourse
} from '@/server/actions/content/courseActions';
import { type ICourseSection, type ILesson } from '@/types/content.types';

interface ICourseViewClientProps {
    courseId: string;
}

export const CourseViewClient = ({ courseId }: ICourseViewClientProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    // Section management
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionDesc, setNewSectionDesc] = useState('');

    // Lesson management
    const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDesc, setNewLessonDesc] = useState('');

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Expanded sections
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // =============================================
    // Data Fetching
    // =============================================

    const { data: courseData, isLoading } = useQuery({
        queryKey: ['admin-course', courseId],
        queryFn: () => getCourseById(courseId),
        staleTime: 30000,
    });

    const course = courseData?.data;

    // =============================================
    // Mutations
    // =============================================

    const addSectionMutation = useMutation({
        mutationFn: async () => {
            const sections = course?.sections ?? [];
            return addCourseSection(courseId, {
                title: newSectionTitle.trim(),
                description: newSectionDesc.trim() || undefined,
                order: sections.length + 1,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: 'Section added successfully' });
                void queryClient.invalidateQueries({ queryKey: ['admin-course', courseId] });
                setShowAddSection(false);
                setNewSectionTitle('');
                setNewSectionDesc('');
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to add section' });
            }
        },
    });

    const addLessonMutation = useMutation({
        mutationFn: async (sectionId: string) => {
            const section = course?.sections.find(s => s.id === sectionId);
            const lessons = section?.lessons ?? [];
            return addLesson(sectionId, {
                title: newLessonTitle.trim(),
                description: newLessonDesc.trim() || undefined,
                order: lessons.length + 1,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: 'Lesson added successfully' });
                void queryClient.invalidateQueries({ queryKey: ['admin-course', courseId] });
                setShowAddLesson(null);
                setNewLessonTitle('');
                setNewLessonDesc('');
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to add lesson' });
            }
        },
    });

    const publishMutation = useMutation({
        mutationFn: () => publishCourse(courseId),
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: 'Course published successfully' });
                void queryClient.invalidateQueries({ queryKey: ['admin-course', courseId] });
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to publish course' });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteCourse(courseId),
        onSuccess: (result) => {
            if (result.success) {
                addNotification({ type: 'success', message: 'Course deleted successfully' });
                router.push('/admin/courses');
            } else {
                addNotification({ type: 'error', message: result.error ?? 'Failed to delete course' });
            }
        },
    });

    // =============================================
    // Handlers
    // =============================================

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const handleAddSection = () => {
        if (!newSectionTitle.trim()) {
            addNotification({ type: 'error', message: 'Section title is required' });
            return;
        }
        addSectionMutation.mutate();
    };

    const handleAddLesson = (sectionId: string) => {
        if (!newLessonTitle.trim()) {
            addNotification({ type: 'error', message: 'Lesson title is required' });
            return;
        }
        addLessonMutation.mutate(sectionId);
    };

    // =============================================
    // Loading State
    // =============================================

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-64 flex-col items-center justify-center">
                <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="mb-2 text-xl font-semibold">Course Not Found</h2>
                <p className="mb-4 text-muted-foreground">The course you're looking for doesn't exist.</p>
                <Button asChild>
                    <Link href="/admin/courses">Back to Courses</Link>
                </Button>
            </div>
        );
    }

    const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/courses">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{course.title}</h1>
                            <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                {CONTENT_STATUS_LABELS[course.status]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {course.sections.length} sections · {totalLessons} lessons
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {course.status !== 'PUBLISHED' && (
                        <Button
                            variant="outline"
                            onClick={() => publishMutation.mutate()}
                            disabled={publishMutation.isPending}
                        >
                            Publish
                        </Button>
                    )}
                    <Button asChild>
                        <Link href={`/admin/courses/${courseId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Course
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Course Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Difficulty</p>
                                <p className="font-medium">{DIFFICULTY_LABELS[course.difficulty]}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="font-medium">{course.estimatedHours || 'N/A'} hours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sections</p>
                                <p className="font-medium">{course.sections.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Lessons</p>
                                <p className="font-medium">{totalLessons}</p>
                            </div>
                        </div>
                    </div>
                    {course.description && (
                        <>
                            <Separator className="my-4" />
                            <p className="text-muted-foreground">{course.description}</p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Sections & Lessons */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Course Content</CardTitle>
                    <Button size="sm" onClick={() => setShowAddSection(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                    </Button>
                </CardHeader>
                <CardContent>
                    {course.sections.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                            <h3 className="mb-2 font-semibold">No sections yet</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Add sections to organize your course content
                            </p>
                            <Button onClick={() => setShowAddSection(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Section
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {course.sections.map((section, sectionIndex) => (
                                <SectionItem
                                    key={section.id}
                                    section={section}
                                    sectionIndex={sectionIndex}
                                    isExpanded={expandedSections.has(section.id)}
                                    onToggle={() => toggleSection(section.id)}
                                    onAddLesson={() => setShowAddLesson(section.id)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Section Dialog */}
            <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Section</DialogTitle>
                        <DialogDescription>
                            Add a new section to organize your course content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="sectionTitle">Title *</Label>
                            <Input
                                id="sectionTitle"
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                placeholder="Section title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sectionDesc">Description</Label>
                            <Textarea
                                id="sectionDesc"
                                value={newSectionDesc}
                                onChange={(e) => setNewSectionDesc(e.target.value)}
                                placeholder="Brief description (optional)"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddSection(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddSection}
                            disabled={addSectionMutation.isPending}
                        >
                            {addSectionMutation.isPending ? 'Adding...' : 'Add Section'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Lesson Dialog */}
            <Dialog open={!!showAddLesson} onOpenChange={(open) => !open && setShowAddLesson(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Lesson</DialogTitle>
                        <DialogDescription>
                            Add a new lesson to this section.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="lessonTitle">Title *</Label>
                            <Input
                                id="lessonTitle"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                placeholder="Lesson title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lessonDesc">Description</Label>
                            <Textarea
                                id="lessonDesc"
                                value={newLessonDesc}
                                onChange={(e) => setNewLessonDesc(e.target.value)}
                                placeholder="Brief description (optional)"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddLesson(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => showAddLesson && handleAddLesson(showAddLesson)}
                            disabled={addLessonMutation.isPending}
                        >
                            {addLessonMutation.isPending ? 'Adding...' : 'Add Lesson'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Course</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this course? This action cannot be undone.
                            All sections and lessons will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Course'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// =============================================
// Section Component
// =============================================

interface ISectionItemProps {
    section: ICourseSection & { lessons: Array<ILesson> };
    sectionIndex: number;
    isExpanded: boolean;
    onToggle: () => void;
    onAddLesson: () => void;
}

const SectionItem = ({ section, sectionIndex, isExpanded, onToggle, onAddLesson }: ISectionItemProps) => {
    return (
        <div className="rounded-lg border">
            {/* Section Header */}
            <div
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                        <p className="font-medium">
                            Section {sectionIndex + 1}: {section.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddLesson();
                    }}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Lesson
                </Button>
            </div>

            {/* Lessons */}
            {isExpanded && section.lessons.length > 0 && (
                <div className="border-t bg-muted/25 px-4 py-2">
                    {section.lessons.map((lesson, lessonIndex) => (
                        <div
                            key={lesson.id}
                            className="flex items-center gap-3 rounded px-3 py-2 hover:bg-muted/50"
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                                {lessonIndex + 1}
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{lesson.title}</p>
                                {lesson.description && (
                                    <p className="text-xs text-muted-foreground">{lesson.description}</p>
                                )}
                            </div>
                            {lesson.isFree && (
                                <Badge variant="outline" className="text-xs">Free</Badge>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isExpanded && section.lessons.length === 0 && (
                <div className="border-t bg-muted/25 p-4 text-center text-sm text-muted-foreground">
                    No lessons yet. Click &quot;Lesson&quot; to add one.
                </div>
            )}
        </div>
    );
};
