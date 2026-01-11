// =============================================
// Prisma Client - Singleton with Accelerate Extension
// =============================================

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

import { DATABASE_URL, IS_DEVELOPMENT } from '@/env';

// Create Prisma client with Accelerate extension
// DATABASE_URL (prisma://) is imported from env.ts for centralized config
// DIRECT_URL (postgresql://) is used for migrations in prisma.config.ts
const createPrismaClient = () =>
    new PrismaClient({
        accelerateUrl: DATABASE_URL,
    }).$extends(withAccelerate());

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

// Global singleton to prevent re-instantiating Prisma in dev
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClientExtended;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (IS_DEVELOPMENT) {
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
