// =============================================
// UI Utilities - Class name helper for Shadcn
// =============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// cn: Merge class names with Tailwind CSS conflict resolution
export const cn = (...inputs: Array<ClassValue>): string => twMerge(clsx(inputs));
