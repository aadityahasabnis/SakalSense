// =============================================
// Content Constants — Types, Statuses, Difficulties
// =============================================

// Base content types (stored in Content model)
export const CONTENT_TYPE = {
    ARTICLE: 'ARTICLE',
    BLOG: 'BLOG',
    TUTORIAL: 'TUTORIAL',
    CHEATSHEET: 'CHEATSHEET',
    NOTE: 'NOTE',
    PROJECT: 'PROJECT',
} as const;

export type ContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

// Content status workflow
export const CONTENT_STATUS = {
    DRAFT: 'DRAFT',
    REVIEW: 'REVIEW',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
} as const;

export type ContentStatusType = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

// Difficulty levels
export const DIFFICULTY_LEVEL = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
} as const;

export type DifficultyType = (typeof DIFFICULTY_LEVEL)[keyof typeof DIFFICULTY_LEVEL];

// Quiz question types
export const QUIZ_QUESTION_TYPE = {
    MCQ: 'MCQ',
    TRUE_FALSE: 'TRUE_FALSE',
    SHORT_ANSWER: 'SHORT_ANSWER',
} as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPE)[keyof typeof QUIZ_QUESTION_TYPE];

// Practice submission status
export const PRACTICE_STATUS = {
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    PARTIAL: 'PARTIAL',
} as const;

export type PracticeStatusType = (typeof PRACTICE_STATUS)[keyof typeof PRACTICE_STATUS];

// Content type labels (for UI display)
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    ARTICLE: 'Article',
    BLOG: 'Blog Post',
    TUTORIAL: 'Tutorial',
    CHEATSHEET: 'Cheatsheet',
    NOTE: 'Note',
    PROJECT: 'Project',
};

// Content type icons (Lucide icon names)
export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
    ARTICLE: 'FileText',
    BLOG: 'Newspaper',
    TUTORIAL: 'BookOpen',
    CHEATSHEET: 'Table',
    NOTE: 'StickyNote',
    PROJECT: 'Code',
};

// Difficulty labels
export const DIFFICULTY_LABELS: Record<DifficultyType, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
};

// Difficulty colors (Tailwind classes)
export const DIFFICULTY_COLORS: Record<DifficultyType, string> = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
};

// Status labels
export const CONTENT_STATUS_LABELS: Record<ContentStatusType, string> = {
    DRAFT: 'Draft',
    REVIEW: 'In Review',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
};

// Status colors
export const CONTENT_STATUS_COLORS: Record<ContentStatusType, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REVIEW: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800',
};
