// Content Types — Prisma Model Interfaces

import { type Prisma } from '.prisma/client';

import { type ContentStatusType, type ContentType, type DifficultyType } from '@/constants/content.constants';

// Base Content interface
export interface IContent {
    id: string;
    title: string;
    slug: string;
    description?: string;
    excerpt?: string;
    type: ContentType;
    status: ContentStatusType;
    difficulty: DifficultyType;
    body?: Prisma.InputJsonValue;
    thumbnailUrl?: string;
    coverImageUrl?: string;
    sourceCodeUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    creatorId: string;
    categoryId?: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isFeatured: boolean;
    featuredAt?: Date;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Content with relations
export interface IContentWithRelations extends IContent {
    creator: { id: string; fullName: string; avatarLink?: string };
    category?: { id: string; name: string; slug: string };
    topics: Array<{ id: string; name: string; slug: string }>;
}

// Content list item (for tables)
export interface IContentListItem {
    id: string;
    title: string;
    slug: string;
    type: ContentType;
    status: ContentStatusType;
    difficulty: DifficultyType;
    viewCount: number;
    likeCount: number;
    createdAt: Date;
    publishedAt?: Date;
    creator: { fullName: string };
}

// Content create/update input
export interface IContentInput {
    title: string;
    slug: string;
    description?: string;
    excerpt?: string;
    type: ContentType;
    difficulty: DifficultyType;
    body?: Prisma.InputJsonValue;
    thumbnailUrl?: string;
    coverImageUrl?: string;
    sourceCodeUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    categoryId?: string;
    topicIds?: Array<string>;
}

// Series
export interface ISeries {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    contentType: ContentType;
    creatorId: string;
    status: ContentStatusType;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISeriesWithItems extends ISeries {
    items: Array<{ id: string; order: number; content: IContentListItem }>;
    creator: { fullName: string; avatarLink?: string };
}

// Course
export interface ICourse {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    difficulty: DifficultyType;
    estimatedHours?: number;
    creatorId: string;
    status: ContentStatusType;
    isPublished: boolean;
    isFeatured: boolean;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICourseSection {
    id: string;
    courseId: string;
    title: string;
    description?: string;
    order: number;
}

export interface ILesson {
    id: string;
    sectionId: string;
    title: string;
    description?: string;
    order: number;
    body?: Prisma.InputJsonValue;
    isFree: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Quiz
export interface IQuiz {
    id: string;
    title: string;
    slug: string;
    description?: string;
    isStandalone: boolean;
    attachedToId?: string;
    creatorId: string;
    status: ContentStatusType;
    createdAt: Date;
    updatedAt: Date;
}

export interface IQuizSection { id: string; quizId: string; title: string; description?: string; order: number }
export interface IQuizQuestion { id: string; sectionId: string; question: string; type: string; options?: Prisma.InputJsonValue; answer?: string; explanation?: string; points: number; order: number }

// Domain & Category
export interface IDomain { id: string; name: string; slug: string; description?: string; icon?: string; order: number; isActive: boolean; createdAt: Date }
export interface ICategory { id: string; name: string; slug: string; description?: string; icon?: string; domainId: string; parentId?: string; order: number; createdAt: Date }
export interface ITopic { id: string; name: string; slug: string; description?: string; createdAt: Date }

// User engagement
export interface IContentProgress { id: string; userId: string; contentId: string; progress: number; lastPosition?: number; timeSpent: number; lastViewedAt: Date; startedAt: Date; completedAt?: Date }
export interface IBookmark { id: string; userId: string; contentId: string; createdAt: Date }
export interface IContentLike { id: string; userId: string; contentId: string; createdAt: Date }
export interface IComment { id: string; body: string; userId: string; contentId: string; parentId?: string; likeCount: number; isEdited: boolean; createdAt: Date; updatedAt: Date }
export interface ICourseEnrollment { id: string; userId: string; courseId: string; progress: number; currentLessonId?: string; enrolledAt: Date; completedAt?: Date }

// Analytics
export interface IContentView { id: string; contentId: string; userId?: string; ip?: string; userAgent?: string; referrer?: string; duration?: number; createdAt: Date }
export interface IUserStreak { id: string; userId: string; currentStreak: number; longestStreak: number; lastActiveAt: Date }
