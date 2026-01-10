// =============================================
// Prisma Client - Singleton with Accelerate Extension
// =============================================

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create Prisma client with Accelerate (Prisma 7 pattern)
const createPrismaClient = () =>
    new PrismaClient({
        accelerateUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

// Global singleton to prevent re-instantiating Prisma in dev
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClientExtended;
};

export const prisma =
    globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// =============================================
// Stakeholder Model Mapping for reuse
// =============================================

export const STAKEHOLDER_MODELS = {
    USER: prisma.user,
    ADMIN: prisma.admin,
    ADMINISTRATOR: prisma.administrator,
} as const;

export type StakeholderModelType = keyof typeof STAKEHOLDER_MODELS;
