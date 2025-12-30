'use client';

// =============================================
// Textarea Field Component
// =============================================

import { Label } from '@/components/ui/label';
import { Textarea as TextareaUI } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type TextareaField as TextareaFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface TextareaProps {
    field: TextareaFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function Textarea({ field, value, onChange, error, disabled }: TextareaProps) {
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

            <TextareaUI
                id={field.name}
                name={field.name}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled ?? field.disabled}
                readOnly={field.readOnly}
                autoFocus={field.autoFocus}
                rows={field.rows ?? 4}
                aria-invalid={!!error}
                className={cn(error && 'border-destructive')}
            />

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
