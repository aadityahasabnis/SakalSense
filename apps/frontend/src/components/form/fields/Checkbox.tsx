'use client';

// =============================================
// Checkbox Field Component
// =============================================

import { Checkbox as CheckboxUI } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type CheckboxField as CheckboxFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface CheckboxProps {
    field: CheckboxFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function Checkbox({ field, value, onChange, error, disabled }: CheckboxProps) {
    // Single checkbox
    if (!field.options || field.options.length === 0) {
        const isChecked = Boolean(value);

        return (
            <div className={cn('space-y-2', field.className)}>
                <div className="flex items-center gap-2">
                    <CheckboxUI
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
                    <p className="text-muted-foreground ml-6 text-xs">{field.description}</p>
                )}

                {error && <p className="text-destructive ml-6 text-xs">{error}</p>}
            </div>
        );
    }

    // Checkbox group (multiple options)
    const selectedValues = Array.isArray(value) ? (value as Array<string>) : [];

    const handleGroupChange = (optionValue: string, checked: boolean) => {
        const newValues = checked
            ? [...selectedValues, optionValue]
            : selectedValues.filter((v) => v !== optionValue);
        onChange(field.name, newValues);
    };

    return (
        <div className={cn('space-y-3', field.className)}>
            {field.label && (
                <Label className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {field.tooltip && (
                        <span className="text-muted-foreground cursor-help" title={field.tooltip}>
                            ⓘ
                        </span>
                    )}
                </Label>
            )}

            <div className="flex flex-col gap-2">
                {field.options.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                        <CheckboxUI
                            id={`${field.name}-${option.value}`}
                            checked={selectedValues.includes(option.value)}
                            onCheckedChange={(checked) => handleGroupChange(option.value, !!checked)}
                            disabled={disabled ?? field.disabled ?? option.disabled}
                        />
                        <Label htmlFor={`${field.name}-${option.value}`} className="cursor-pointer">
                            {option.label}
                        </Label>
                    </div>
                ))}
            </div>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
