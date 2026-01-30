// =============================================
// Seed Script for Achievements and Badges
// Run with: npx tsx prisma/seed.ts
// =============================================
//
// SEEDED DATA REFERENCE (for developers):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                           ACHIEVEMENTS (24 total)                           │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: READING (4 achievements)                                          │
// │   - first-read      : "First Steps"       - Complete 1st article (20 XP)    │
// │   - bookworm        : "Bookworm"          - Complete 10 articles (50 XP)    │
// │   - knowledge-seeker: "Knowledge Seeker"  - Complete 50 articles (100 XP)   │
// │   - scholar         : "Scholar"           - Complete 100 articles (200 XP)  │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: LEARNING (4 achievements)                                         │
// │   - first-tutorial  : "Tutorial Starter"  - Complete 1st tutorial (25 XP)   │
// │   - lesson-master   : "Lesson Master"     - Complete 25 lessons (75 XP)     │
// │   - first-course    : "Course Graduate"   - Complete 1st course (100 XP)    │
// │   - dedicated-learner: "Dedicated Learner"- Complete 5 courses (250 XP)     │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: PRACTICE (3 achievements)                                         │
// │   - first-solve     : "Problem Solver"    - Solve 1st problem (20 XP)       │
// │   - code-apprentice : "Code Apprentice"   - Solve 25 problems (75 XP)       │
// │   - code-ninja      : "Code Ninja"        - Solve 100 problems (200 XP)     │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: STREAK (4 achievements)                                           │
// │   - streak-3        : "On Fire"           - 3-day streak (30 XP)            │
// │   - streak-7        : "Week Warrior"      - 7-day streak (70 XP)            │
// │   - streak-30       : "Monthly Master"    - 30-day streak (300 XP)          │
// │   - streak-100      : "Centurion"         - 100-day streak (1000 XP)        │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: SOCIAL (3 achievements)                                           │
// │   - first-comment   : "Conversationalist" - Post 1st comment (10 XP)        │
// │   - active-commenter: "Active Commenter"  - Post 25 comments (50 XP)        │
// │   - bookmark-collector: "Bookmark Collector" - Bookmark 20 items (30 XP)    │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: MILESTONE (4 achievements)                                        │
// │   - xp-1000         : "XP Collector"      - Earn 1,000 XP (50 XP bonus)     │
// │   - xp-10000        : "XP Master"         - Earn 10,000 XP (200 XP bonus)   │
// │   - level-10        : "Rising Star"       - Reach level 10 (100 XP)         │
// │   - level-25        : "Expert"            - Reach level 25 (250 XP)         │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ CATEGORY: SECRET (2 achievements - hidden until unlocked)                   │
// │   - night-owl       : "Night Owl"         - Activity 12AM-4AM (25 XP)       │
// │   - early-bird      : "Early Bird"        - Activity 5AM-7AM (25 XP)        │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                             BADGES (12 total)                               │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ RARITY: COMMON (gray - #6B7280)                                             │
// │   - newcomer        : "Newcomer"          - Welcome badge for new users     │
// │   - active-learner  : "Active Learner"    - Consistently learning weekly    │
// │   - helper          : "Helpful Member"    - Helping through comments        │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ RARITY: RARE (blue - #3B82F6, etc.)                                         │
// │   - top-contributor : "Top Contributor"   - Made significant contributions  │
// │   - streak-master   : "Streak Master"     - Impressive learning streak      │
// │   - quick-learner   : "Quick Learner"     - Completed courses early         │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ RARITY: EPIC (pink/orange - #EC4899, etc.)                                  │
// │   - community-leader: "Community Leader"  - Respected community member      │
// │   - problem-crusher : "Problem Crusher"   - Solved 500+ problems            │
// │   - course-champion : "Course Champion"   - Completed 20+ courses           │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │ RARITY: LEGENDARY (gold/purple - #FBBF24, etc.)                             │
// │   - leaderboard-king: "Leaderboard King"  - Ranked #1 all-time              │
// │   - perfectionist   : "Perfectionist"     - 365-day streak                  │
// │   - founding-member : "Founding Member"   - First platform members          │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// CONDITION TYPES:
// - { type: 'first', metric: '...', target: 1 }  -> First-time action
// - { type: 'count', metric: '...', target: N }  -> Cumulative count
// - { type: 'streak', metric: 'current', target: N } -> Streak-based
// - { type: 'level', metric: 'level', target: N }    -> Level-based
//
// ICONS: Uses lucide-react icon names (book-open, flame, crown, etc.)
//
// =============================================

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

// =============================================
// Achievement Data
// =============================================
//
// Achievements are unlocked based on user actions.
// Each achievement has:
// - slug: unique identifier
// - name: display name
// - description: user-facing description
// - icon: lucide-react icon name
// - category: grouping for UI
// - xpReward: XP bonus when unlocked
// - condition: JSON with unlock criteria
// - isSecret: hidden until unlocked
// - order: sort order within category
//

const achievements = [
    // Reading Achievements
    {
        slug: 'first-read',
        name: 'First Steps',
        description: 'Complete your first article',
        icon: 'book-open',
        category: 'READING',
        xpReward: 20,
        condition: { type: 'first', metric: 'articles_read', target: 1 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'bookworm',
        name: 'Bookworm',
        description: 'Complete 10 articles',
        icon: 'book',
        category: 'READING',
        xpReward: 50,
        condition: { type: 'count', metric: 'articles_read', target: 10 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'knowledge-seeker',
        name: 'Knowledge Seeker',
        description: 'Complete 50 articles',
        icon: 'graduation-cap',
        category: 'READING',
        xpReward: 100,
        condition: { type: 'count', metric: 'articles_read', target: 50 },
        isSecret: false,
        order: 3,
    },
    {
        slug: 'scholar',
        name: 'Scholar',
        description: 'Complete 100 articles',
        icon: 'award',
        category: 'READING',
        xpReward: 200,
        condition: { type: 'count', metric: 'articles_read', target: 100 },
        isSecret: false,
        order: 4,
    },

    // Learning Achievements
    {
        slug: 'first-tutorial',
        name: 'Tutorial Starter',
        description: 'Complete your first tutorial',
        icon: 'play-circle',
        category: 'LEARNING',
        xpReward: 25,
        condition: { type: 'first', metric: 'tutorials_completed', target: 1 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'lesson-master',
        name: 'Lesson Master',
        description: 'Complete 25 lessons',
        icon: 'layers',
        category: 'LEARNING',
        xpReward: 75,
        condition: { type: 'count', metric: 'lessons_completed', target: 25 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'first-course',
        name: 'Course Graduate',
        description: 'Complete your first course',
        icon: 'check-circle',
        category: 'LEARNING',
        xpReward: 100,
        condition: { type: 'first', metric: 'courses_completed', target: 1 },
        isSecret: false,
        order: 3,
    },
    {
        slug: 'dedicated-learner',
        name: 'Dedicated Learner',
        description: 'Complete 5 courses',
        icon: 'star',
        category: 'LEARNING',
        xpReward: 250,
        condition: { type: 'count', metric: 'courses_completed', target: 5 },
        isSecret: false,
        order: 4,
    },

    // Practice Achievements
    {
        slug: 'first-solve',
        name: 'Problem Solver',
        description: 'Solve your first problem',
        icon: 'code',
        category: 'PRACTICE',
        xpReward: 20,
        condition: { type: 'first', metric: 'problems_solved', target: 1 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'code-apprentice',
        name: 'Code Apprentice',
        description: 'Solve 25 problems',
        icon: 'terminal',
        category: 'PRACTICE',
        xpReward: 75,
        condition: { type: 'count', metric: 'problems_solved', target: 25 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'code-ninja',
        name: 'Code Ninja',
        description: 'Solve 100 problems',
        icon: 'zap',
        category: 'PRACTICE',
        xpReward: 200,
        condition: { type: 'count', metric: 'problems_solved', target: 100 },
        isSecret: false,
        order: 3,
    },

    // Streak Achievements
    {
        slug: 'streak-3',
        name: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: 'flame',
        category: 'STREAK',
        xpReward: 30,
        condition: { type: 'streak', metric: 'current', target: 3 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'flame',
        category: 'STREAK',
        xpReward: 70,
        condition: { type: 'streak', metric: 'current', target: 7 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: 'flame',
        category: 'STREAK',
        xpReward: 300,
        condition: { type: 'streak', metric: 'current', target: 30 },
        isSecret: false,
        order: 3,
    },
    {
        slug: 'streak-100',
        name: 'Centurion',
        description: 'Maintain a 100-day streak',
        icon: 'crown',
        category: 'STREAK',
        xpReward: 1000,
        condition: { type: 'streak', metric: 'current', target: 100 },
        isSecret: false,
        order: 4,
    },

    // Social Achievements
    {
        slug: 'first-comment',
        name: 'Conversationalist',
        description: 'Post your first comment',
        icon: 'message-circle',
        category: 'SOCIAL',
        xpReward: 10,
        condition: { type: 'first', metric: 'comments_posted', target: 1 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'active-commenter',
        name: 'Active Commenter',
        description: 'Post 25 comments',
        icon: 'messages-square',
        category: 'SOCIAL',
        xpReward: 50,
        condition: { type: 'count', metric: 'comments_posted', target: 25 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'bookmark-collector',
        name: 'Bookmark Collector',
        description: 'Bookmark 20 pieces of content',
        icon: 'bookmark',
        category: 'SOCIAL',
        xpReward: 30,
        condition: { type: 'count', metric: 'bookmarks_created', target: 20 },
        isSecret: false,
        order: 3,
    },

    // Milestone Achievements
    {
        slug: 'xp-1000',
        name: 'XP Collector',
        description: 'Earn 1,000 total XP',
        icon: 'zap',
        category: 'MILESTONE',
        xpReward: 50,
        condition: { type: 'count', metric: 'total_xp', target: 1000 },
        isSecret: false,
        order: 1,
    },
    {
        slug: 'xp-10000',
        name: 'XP Master',
        description: 'Earn 10,000 total XP',
        icon: 'star',
        category: 'MILESTONE',
        xpReward: 200,
        condition: { type: 'count', metric: 'total_xp', target: 10000 },
        isSecret: false,
        order: 2,
    },
    {
        slug: 'level-10',
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: 'trending-up',
        category: 'MILESTONE',
        xpReward: 100,
        condition: { type: 'level', metric: 'level', target: 10 },
        isSecret: false,
        order: 3,
    },
    {
        slug: 'level-25',
        name: 'Expert',
        description: 'Reach level 25',
        icon: 'award',
        category: 'MILESTONE',
        xpReward: 250,
        condition: { type: 'level', metric: 'level', target: 25 },
        isSecret: false,
        order: 4,
    },

    // Secret Achievements
    {
        slug: 'night-owl',
        name: 'Night Owl',
        description: 'Complete content between midnight and 4 AM',
        icon: 'moon',
        category: 'SECRET',
        xpReward: 25,
        condition: { type: 'first', metric: 'night_activity', target: 1 },
        isSecret: true,
        order: 1,
    },
    {
        slug: 'early-bird',
        name: 'Early Bird',
        description: 'Complete content between 5 AM and 7 AM',
        icon: 'sunrise',
        category: 'SECRET',
        xpReward: 25,
        condition: { type: 'first', metric: 'early_activity', target: 1 },
        isSecret: true,
        order: 2,
    },
];

// =============================================
// Badge Data
// =============================================
//
// Badges are special recognition awarded manually or automatically.
// Unlike achievements (unlocked once), badges represent status/tier.
// Each badge has:
// - slug: unique identifier
// - name: display name
// - description: user-facing description
// - icon: lucide-react icon name
// - color: hex color for badge display
// - rarity: COMMON | RARE | EPIC | LEGENDARY
//

const badges = [
    // ========================================
    // COMMON BADGES (Gray tones - Easy to get)
    // ========================================
    {
        slug: 'newcomer',
        name: 'Newcomer',
        description: 'Welcome to SakalSense!',
        icon: 'user-plus',
        color: '#6B7280', // Gray
        rarity: 'COMMON',
    },
    {
        slug: 'active-learner',
        name: 'Active Learner',
        description: 'Consistently learning every week',
        icon: 'activity',
        color: '#10B981', // Green
        rarity: 'COMMON',
    },
    {
        slug: 'helper',
        name: 'Helpful Member',
        description: 'Helping others through comments',
        icon: 'heart',
        color: '#F59E0B', // Amber
        rarity: 'COMMON',
    },

    // ========================================
    // RARE BADGES (Blue tones - Harder to get)
    // ========================================
    {
        slug: 'top-contributor',
        name: 'Top Contributor',
        description: 'Made significant contributions',
        icon: 'git-pull-request',
        color: '#3B82F6', // Blue
        rarity: 'RARE',
    },
    {
        slug: 'streak-master',
        name: 'Streak Master',
        description: 'Maintained an impressive learning streak',
        icon: 'flame',
        color: '#EF4444', // Red
        rarity: 'RARE',
    },
    {
        slug: 'quick-learner',
        name: 'Quick Learner',
        description: 'Completed courses ahead of schedule',
        icon: 'rocket',
        color: '#8B5CF6', // Purple
        rarity: 'RARE',
    },

    // ========================================
    // EPIC BADGES (Vibrant colors - Elite tier)
    // ========================================
    {
        slug: 'community-leader',
        name: 'Community Leader',
        description: 'A respected member of the community',
        icon: 'users',
        color: '#EC4899', // Pink
        rarity: 'EPIC',
    },
    {
        slug: 'problem-crusher',
        name: 'Problem Crusher',
        description: 'Solved 500+ problems',
        icon: 'target',
        color: '#F97316', // Orange
        rarity: 'EPIC',
    },
    {
        slug: 'course-champion',
        name: 'Course Champion',
        description: 'Completed 20+ courses',
        icon: 'trophy',
        color: '#14B8A6', // Teal
        rarity: 'EPIC',
    },

    // ========================================
    // LEGENDARY BADGES (Gold/Special - Extremely rare)
    // ========================================
    {
        slug: 'leaderboard-king',
        name: 'Leaderboard King',
        description: 'Ranked #1 on the all-time leaderboard',
        icon: 'crown',
        color: '#FBBF24', // Gold
        rarity: 'LEGENDARY',
    },
    {
        slug: 'perfectionist',
        name: 'Perfectionist',
        description: 'Maintained 365-day streak',
        icon: 'award',
        color: '#A855F7', // Purple
        rarity: 'LEGENDARY',
    },
    {
        slug: 'founding-member',
        name: 'Founding Member',
        description: 'One of the first members of SakalSense',
        icon: 'star',
        color: '#6366F1', // Indigo
        rarity: 'LEGENDARY',
    },
];

// =============================================
// Seed Function
// =============================================

async function main() {
    console.log('🌱 Seeding achievements and badges...');

    // Seed Achievements
    console.log('📚 Seeding achievements...');
    for (const achievement of achievements) {
        await prisma.achievement.upsert({
            where: { slug: achievement.slug },
            update: {
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category,
                xpReward: achievement.xpReward,
                condition: achievement.condition,
                isSecret: achievement.isSecret,
                order: achievement.order,
            },
            create: achievement,
        });
    }
    console.log(`✅ Seeded ${achievements.length} achievements`);

    // Seed Badges
    console.log('🏅 Seeding badges...');
    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { slug: badge.slug },
            update: {
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                color: badge.color,
                rarity: badge.rarity,
            },
            create: badge,
        });
    }
    console.log(`✅ Seeded ${badges.length} badges`);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
