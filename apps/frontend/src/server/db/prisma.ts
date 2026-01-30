// =============================================
// Prisma Client - Singleton with Prisma Accelerate
// =============================================

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

import { IS_DEVELOPMENT } from '@/env';

// Create Prisma client with Accelerate extension
// Prisma 7+ requires accelerateUrl when using prisma:// connection strings
const createPrismaClient = () => {
    const logLevel = IS_DEVELOPMENT ? ['warn', 'error'] as const : ['error'] as const;
    return new PrismaClient({
        log: [...logLevel],
        // Required for Prisma 7 with Accelerate (prisma:// URLs)
        accelerateUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());
};

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

// Global singleton to prevent re-instantiating Prisma in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientExtended };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (IS_DEVELOPMENT) globalForPrisma.prisma = prisma;

// Stakeholder Model Mapping for reuse
export const STAKEHOLDER_MODELS = { USER: prisma.user, ADMIN: prisma.admin, ADMINISTRATOR: prisma.administrator } as const;
export type StakeholderModelType = keyof typeof STAKEHOLDER_MODELS;
