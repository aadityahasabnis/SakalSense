// =============================================
// Domain Constants — Top-level Categories
// =============================================

export const DOMAIN = {
    TECHNOLOGY: 'TECHNOLOGY',
    ACADEMICS: 'ACADEMICS',
    BUSINESS: 'BUSINESS',
    DESIGN: 'DESIGN',
    PERSONAL_GROWTH: 'PERSONAL_GROWTH',
    FINANCE: 'FINANCE',
    HEALTH: 'HEALTH',
    CREATIVE: 'CREATIVE',
    CAREER: 'CAREER',
} as const;

export type DomainType = (typeof DOMAIN)[keyof typeof DOMAIN];

// Domain display labels
export const DOMAIN_LABELS: Record<DomainType, string> = {
    TECHNOLOGY: 'Technology',
    ACADEMICS: 'Academics',
    BUSINESS: 'Business',
    DESIGN: 'Design',
    PERSONAL_GROWTH: 'Personal Growth',
    FINANCE: 'Finance',
    HEALTH: 'Health & Fitness',
    CREATIVE: 'Creative Skills',
    CAREER: 'Career Development',
};

// Domain icons (Lucide icon names)
export const DOMAIN_ICONS: Record<DomainType, string> = {
    TECHNOLOGY: 'Code',
    ACADEMICS: 'GraduationCap',
    BUSINESS: 'Briefcase',
    DESIGN: 'Palette',
    PERSONAL_GROWTH: 'Lightbulb',
    FINANCE: 'Wallet',
    HEALTH: 'Heart',
    CREATIVE: 'Sparkles',
    CAREER: 'TrendingUp',
};

// Domain descriptions
export const DOMAIN_DESCRIPTIONS: Record<DomainType, string> = {
    TECHNOLOGY: 'Programming, web development, data science, and more',
    ACADEMICS: 'Mathematics, science, humanities, and research',
    BUSINESS: 'Entrepreneurship, management, and strategy',
    DESIGN: 'UI/UX, graphic design, and visual arts',
    PERSONAL_GROWTH: 'Productivity, mindset, and self-improvement',
    FINANCE: 'Investing, budgeting, and financial literacy',
    HEALTH: 'Fitness, nutrition, and mental wellness',
    CREATIVE: 'Writing, music, photography, and art',
    CAREER: 'Job search, networking, and professional skills',
};

// Domain colors (Tailwind classes)
export const DOMAIN_COLORS: Record<DomainType, string> = {
    TECHNOLOGY: 'bg-blue-100 text-blue-800',
    ACADEMICS: 'bg-purple-100 text-purple-800',
    BUSINESS: 'bg-amber-100 text-amber-800',
    DESIGN: 'bg-pink-100 text-pink-800',
    PERSONAL_GROWTH: 'bg-yellow-100 text-yellow-800',
    FINANCE: 'bg-emerald-100 text-emerald-800',
    HEALTH: 'bg-red-100 text-red-800',
    CREATIVE: 'bg-indigo-100 text-indigo-800',
    CAREER: 'bg-teal-100 text-teal-800',
};
