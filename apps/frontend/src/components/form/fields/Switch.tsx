'use client';

// =============================================
// Switch Field Component
// =============================================

import { Label } from '@/components/ui/label';
import { Switch as SwitchUI } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { type SwitchField as SwitchFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface SwitchProps {
    field: SwitchFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function Switch({ field, value, onChange, error, disabled }: SwitchProps) {
    const isChecked = Boolean(value);

    return (
        <div className={cn('space-y-2', field.className)}>
            <div className="flex items-center gap-3">
                <SwitchUI
                    id={field.name}
                    checked={isChecked}
                    onCheckedChange={(checked) => onChange(field.name, checked)}
                    disabled={disabled ?? field.disabled}
                    aria-invalid={!!error}
                />
                {field.label && (
                    <Label htmlFor={field.name} className="cursor-pointer">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                )}
            </div>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
