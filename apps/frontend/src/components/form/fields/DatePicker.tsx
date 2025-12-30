'use client';

// =============================================
// DatePicker Field Component (shadcn Calendar)
// =============================================

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type InputField as InputFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface DatePickerProps {
    field: InputFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function DatePicker({ field, value, onChange, error, disabled }: DatePickerProps) {
    const dateValue = value ? new Date(value as string | number | Date) : undefined;

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange(field.name, date.toISOString());
        } else {
            onChange(field.name, undefined);
        }
    };

    return (
        <div className={cn('space-y-2', field.className)}>
            {field.label && (
                <Label className="flex items-center gap-1">
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

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled ?? field.disabled}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !dateValue && 'text-muted-foreground',
                            error && 'border-destructive'
                        )}
                    >
                        <CalendarIcon className="mr-2 size-4" />
                        {dateValue ? format(dateValue, 'PPP') : field.placeholder ?? 'Pick a date'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={handleSelect}
                        disabled={disabled ?? field.disabled}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
