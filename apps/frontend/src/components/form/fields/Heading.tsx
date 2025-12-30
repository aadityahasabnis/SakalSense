// =============================================
// Heading Field Component
// =============================================

import { cn } from '@/lib/utils';
import { type HeadingField as HeadingFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface HeadingProps {
    field: HeadingFieldType;
}

// =============================================
// Component
// =============================================

export function Heading({ field }: HeadingProps) {
    return (
        <div className={cn('space-y-1', field.className)}>
            <h3 className="text-lg font-semibold">{field.text}</h3>
            {field.description && <p className="text-muted-foreground text-sm">{field.description}</p>}
        </div>
    );
}
