'use client';

// =============================================
// Select Field Component
// =============================================

import { Label } from '@/components/ui/label';
import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    Select as SelectUI,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type SelectField as SelectFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface SelectProps {
    field: SelectFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function Select({ field, value, onChange, error, disabled }: SelectProps) {
    return (
        <div className={cn('space-y-2', field.className)}>
            {field.label && (
                <Label htmlFor={field.name} className="flex items-center gap-1">
                    {field.icon && <span className="text-muted-foreground">{field.icon}</span>}
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {field.tooltip && (
                        <span className="text-muted-foreground cursor-help" title={field.tooltip}>
                            ⓘ
                        </span>
                    )}
                </Label>
            )}

            <SelectUI
                value={String(value ?? '')}
                onValueChange={(val) => onChange(field.name, val)}
                disabled={disabled ?? field.disabled}
            >
                <SelectTrigger id={field.name} aria-invalid={!!error} className={cn(error && 'border-destructive')}>
                    <SelectValue placeholder={field.placeholder ?? 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                    {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </SelectUI>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
