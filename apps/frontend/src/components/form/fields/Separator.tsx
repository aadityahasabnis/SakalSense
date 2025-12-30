// =============================================
// Separator Field Component
// =============================================

import { Separator as SeparatorUI } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type SeparatorField as SeparatorFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface SeparatorProps {
    field: SeparatorFieldType;
}

// =============================================
// Component
// =============================================

export function Separator({ field }: SeparatorProps) {
    return <SeparatorUI className={cn('my-4', field.className)} />;
}
