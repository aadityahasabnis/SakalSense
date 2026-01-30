'use client';

// =============================================
// Problem Solving Client Component
// =============================================

import Editor from '@monaco-editor/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Code2,
    History,
    Lightbulb,
    Loader2,
    Play,
    RotateCcw,
    Terminal,
    X,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { submitSolution } from '@/server/actions/content/practiceActions';

// =============================================
// Types
// =============================================

interface IProblem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    starterCode: string | null;
    hints: unknown;
    section: {
        title: string;
        practice: {
            title: string;
            slug: string;
        };
    };
}

interface ISubmission {
    id: string;
    status: string;
    passedTests: number;
    totalTests: number;
    submittedAt: Date;
}

interface IProblemSolvingClientProps {
    problem: IProblem;
    practiceSlug: string;
    submissions: ISubmission[];
    isSolved: boolean;
    isLoggedIn: boolean;
}

// =============================================
// Difficulty Styling
// =============================================

const difficultyConfig: Record<string, { bg: string; text: string; border: string; xp: number }> = {
    BEGINNER: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', xp: 10 },
    EASY: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', xp: 10 },
    INTERMEDIATE: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', xp: 25 },
    MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', xp: 25 },
    ADVANCED: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', xp: 50 },
    HARD: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', xp: 50 },
    EXPERT: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', xp: 50 },
};

const getDifficultyLabel = (difficulty: string): string => {
    const normalized = difficulty.toUpperCase();
    if (['BEGINNER', 'EASY'].includes(normalized)) return 'Easy';
    if (['INTERMEDIATE', 'MEDIUM'].includes(normalized)) return 'Medium';
    if (['ADVANCED', 'HARD', 'EXPERT'].includes(normalized)) return 'Hard';
    return difficulty;
};

// =============================================
// Theme options
// =============================================

type Theme = 'vs-dark' | 'light';

// =============================================
// Main Component
// =============================================

export const ProblemSolvingClient = ({
    problem,
    practiceSlug,
    submissions,
    isSolved,
    isLoggedIn,
}: IProblemSolvingClientProps) => {
    const router = useRouter();
    const [code, setCode] = useState(problem.starterCode ?? '// Write your solution here\n');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [output, setOutput] = useState<{
        status: 'idle' | 'running' | 'passed' | 'failed' | 'partial';
        message?: string;
        passedTests?: number;
        totalTests?: number;
    }>({ status: 'idle' });
    const [editorTheme, setEditorTheme] = useState<Theme>('vs-dark');
    const [showHints, setShowHints] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');

    const diffConfig = difficultyConfig[problem.difficulty.toUpperCase()] ?? difficultyConfig.MEDIUM;
    const hints = (problem.hints as string[] | null) ?? [];

    // Reset code to starter
    const handleReset = useCallback(() => {
        setCode(problem.starterCode ?? '// Write your solution here\n');
        setOutput({ status: 'idle' });
        toast.success('Code reset to starter template');
    }, [problem.starterCode]);

    // Submit solution
    const handleSubmit = useCallback(async () => {
        if (!isLoggedIn) {
            toast.error('Please log in to submit solutions');
            router.push(`/login?redirect=/practice/${practiceSlug}/problem/${problem.id}`);
            return;
        }

        if (!code.trim()) {
            toast.error('Please write some code before submitting');
            return;
        }

        setIsSubmitting(true);
        setOutput({ status: 'running' });

        try {
            const result = await submitSolution(problem.id, code);

            if (result.success && result.data) {
                const { status, passedTests, totalTests, xpAwarded } = result.data;

                if (status === 'PASSED') {
                    setOutput({
                        status: 'passed',
                        message: 'All tests passed! Great job!',
                        passedTests,
                        totalTests,
                    });
                    
                    // Show XP toast if awarded
                    if (xpAwarded && xpAwarded > 0) {
                        toast.success(
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                <span>+{xpAwarded} XP earned!</span>
                            </div>
                        );
                    }
                } else if (status === 'PARTIAL') {
                    setOutput({
                        status: 'partial',
                        message: `Partial success: ${passedTests}/${totalTests} tests passed`,
                        passedTests,
                        totalTests,
                    });
                    toast.warning(`${passedTests}/${totalTests} tests passed`);
                } else {
                    setOutput({
                        status: 'failed',
                        message: `Tests failed: ${passedTests}/${totalTests} passed`,
                        passedTests,
                        totalTests,
                    });
                    toast.error('Some tests failed. Keep trying!');
                }
            } else {
                setOutput({
                    status: 'failed',
                    message: result.error ?? 'Submission failed',
                });
                toast.error(result.error ?? 'Failed to submit solution');
            }
        } catch {
            setOutput({
                status: 'failed',
                message: 'An error occurred while submitting',
            });
            toast.error('An error occurred while submitting');
        } finally {
            setIsSubmitting(false);
        }
    }, [code, isLoggedIn, problem.id, practiceSlug, router]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col">
            {/* Top Bar */}
            <div className="bg-background border-b px-4 py-2">
                <div className="flex items-center justify-between">
                    {/* Breadcrumb & Title */}
                    <div className="flex items-center gap-2 text-sm">
                        <Link
                            href={`/practice/${practiceSlug}`}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {problem.section.practice.title}
                        </Link>
                        <ChevronRight className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">{problem.title}</span>
                        <Badge
                            variant="outline"
                            className={cn('ml-2', diffConfig.bg, diffConfig.text, diffConfig.border)}
                        >
                            {getDifficultyLabel(problem.difficulty)}
                        </Badge>
                        {isSolved && (
                            <Badge variant="outline" className="ml-1 bg-green-500/10 text-green-600 border-green-500/20">
                                <Check className="mr-1 h-3 w-3" />
                                Solved
                            </Badge>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>+{diffConfig.xp} XP</span>
                        </div>
                        <Separator orientation="vertical" className="h-6" />
                        <Select
                            value={editorTheme}
                            onValueChange={(v) => setEditorTheme(v as Theme)}
                        >
                            <SelectTrigger className="w-[100px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vs-dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content - Split Panel */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div className="w-[45%] border-r overflow-hidden flex flex-col min-w-[300px]">
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as 'description' | 'submissions')}
                        className="flex flex-col h-full"
                    >
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                <Code2 className="mr-2 h-4 w-4" />
                                Description
                            </TabsTrigger>
                            <TabsTrigger value="submissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                                <History className="mr-2 h-4 w-4" />
                                Submissions ({submissions.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="description" className="flex-1 overflow-auto p-4 mt-0">
                            {/* Problem Title & Description */}
                            <div className="space-y-4">
                                <h1 className="text-xl font-bold">{problem.title}</h1>
                                
                                {/* Description */}
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: problem.description }}
                                />

                                {/* Hints Section */}
                                {hints.length > 0 && (
                                    <Card className="mt-6">
                                        <CardHeader className="pb-3">
                                            <button
                                                className="flex w-full items-center justify-between"
                                                onClick={() => setShowHints(!showHints)}
                                            >
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                    Hints ({hints.length})
                                                </CardTitle>
                                                <ChevronRight
                                                    className={cn(
                                                        'h-4 w-4 transition-transform',
                                                        showHints && 'rotate-90'
                                                    )}
                                                />
                                            </button>
                                        </CardHeader>
                                        {showHints && (
                                            <CardContent className="pt-0">
                                                <ul className="space-y-2">
                                                    {hints.map((hint, index) => (
                                                        <li
                                                            key={index}
                                                            className="text-muted-foreground flex items-start gap-2 text-sm"
                                                        >
                                                            <span className="text-primary font-medium">
                                                                {index + 1}.
                                                            </span>
                                                            <span>{hint}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        )}
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="submissions" className="flex-1 overflow-auto p-4 mt-0">
                            {!isLoggedIn ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <History className="text-muted-foreground/30 mb-4 h-12 w-12" />
                                    <h3 className="font-medium">Track Your Submissions</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Log in to view your submission history
                                    </p>
                                    <Button
                                        className="mt-4"
                                        onClick={() =>
                                            router.push(
                                                `/login?redirect=/practice/${practiceSlug}/problem/${problem.id}`
                                            )
                                        }
                                    >
                                        Log In
                                    </Button>
                                </div>
                            ) : submissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Terminal className="text-muted-foreground/30 mb-4 h-12 w-12" />
                                    <h3 className="font-medium">No Submissions Yet</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Submit your first solution to see it here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {submissions.map((submission) => (
                                        <div
                                            key={submission.id}
                                            className={cn(
                                                'flex items-center justify-between rounded-lg border p-3',
                                                submission.status === 'PASSED' && 'border-green-500/30 bg-green-500/5',
                                                submission.status === 'FAILED' && 'border-red-500/30 bg-red-500/5',
                                                submission.status === 'PARTIAL' && 'border-yellow-500/30 bg-yellow-500/5'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {submission.status === 'PASSED' ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : submission.status === 'PARTIAL' ? (
                                                    <Clock className="h-5 w-5 text-yellow-500" />
                                                ) : (
                                                    <X className="h-5 w-5 text-red-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {submission.status === 'PASSED'
                                                            ? 'Accepted'
                                                            : submission.status === 'PARTIAL'
                                                            ? 'Partial'
                                                            : 'Failed'}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatDate(submission.submittedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {submission.passedTests}/{submission.totalTests}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    tests passed
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Panel - Code Editor & Output */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Code Editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            theme={editorTheme}
                            value={code}
                            onChange={(value) => setCode(value ?? '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                                padding: { top: 16 },
                            }}
                        />
                    </div>

                    {/* Output Panel */}
                    <div className="border-t bg-muted/30">
                        <div className="flex items-center justify-between border-b px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                <span className="text-sm font-medium">Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={isSubmitting}
                                >
                                    <RotateCcw className="mr-1 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="min-w-[100px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-1 h-4 w-4" />
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Output Content */}
                        <div className="min-h-[100px] max-h-[150px] overflow-auto p-4">
                            {output.status === 'idle' && (
                                <p className="text-muted-foreground text-sm">
                                    Click &ldquo;Submit&rdquo; to run your code against the test cases.
                                </p>
                            )}
                            {output.status === 'running' && (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running tests...
                                </div>
                            )}
                            {output.status === 'passed' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-medium">{output.message}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {output.passedTests}/{output.totalTests} tests passed
                                    </p>
                                </div>
                            )}
                            {output.status === 'partial' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-yellow-600">
                                        <Clock className="h-5 w-5" />
                                        <span className="font-medium">{output.message}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Keep working on it - you&apos;re getting close!
                                    </p>
                                </div>
                            )}
                            {output.status === 'failed' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <X className="h-5 w-5" />
                                        <span className="font-medium">{output.message}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Review the problem description and try again.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
