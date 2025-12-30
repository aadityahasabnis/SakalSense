'use client';

// =============================================
// Input Field Component (Enhanced for all types)
// Supports: text, email, password, number, phone, url
// =============================================

import { useState } from 'react';

import { AtSignIcon, EyeIcon, EyeOffIcon, HashIcon, LinkIcon, PhoneIcon, TextIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input as InputUI } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type InputField as InputFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface InputProps {
    field: InputFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Type-specific config
// =============================================

const getTypeConfig = (type: InputFieldType['type']) => {
    switch (type) {
        case 'email':
            return { inputMode: 'email' as const, icon: AtSignIcon, autoComplete: 'email' };
        case 'password':
            return { inputMode: 'text' as const, icon: undefined, autoComplete: 'current-password' };
        case 'number':
            return { inputMode: 'numeric' as const, icon: HashIcon, autoComplete: 'off' };
        case 'phone':
            return { inputMode: 'tel' as const, icon: PhoneIcon, autoComplete: 'tel' };
        case 'url':
            return { inputMode: 'url' as const, icon: LinkIcon, autoComplete: 'url' };
        default:
            return { inputMode: 'text' as const, icon: TextIcon, autoComplete: 'off' };
    }
};

// =============================================
// Component
// =============================================

export function Input({ field, value, onChange, error, disabled }: InputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const typeConfig = getTypeConfig(field.type);
    const isPassword = field.type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : field.type === 'phone' ? 'tel' : field.type;

    // Use field icon if provided, otherwise use type-specific icon
    const IconComponent = field.icon ? undefined : typeConfig.icon;
    const hasLeftIcon = field.icon ?? IconComponent;

    return (
        <div className={cn('space-y-2', field.className)}>
            {field.label && (
                <Label htmlFor={field.name} className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {field.tooltip && (
                        <span className="text-muted-foreground cursor-help" title={field.tooltip}>
                            ⓘ
                        </span>
                    )}
                </Label>
            )}

            <div className="relative">
            {/* Left icon/prefix */}
            {(hasLeftIcon ?? field.prefix) && (
                <span className="text-muted-foreground absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-sm">
                    {field.icon ?? field.prefix ?? (IconComponent && <IconComponent className="size-4" />)}
                </span>
            )}

                <InputUI
                    id={field.name}
                    name={field.name}
                    type={inputType}
                    inputMode={typeConfig.inputMode}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.name, field.type === 'number' ? e.target.valueAsNumber || e.target.value : e.target.value)}
                    placeholder={field.placeholder}
                    disabled={disabled ?? field.disabled}
                    readOnly={field.readOnly}
                    autoFocus={field.autoFocus}
                    autoComplete={field.autoComplete ?? typeConfig.autoComplete}
                    aria-invalid={!!error}
                    min={field.min}
                    max={field.max}
                    className={cn(
                        (hasLeftIcon ?? field.prefix) && 'pl-10',
                        (isPassword || field.suffix) && 'pr-10',
                        error && 'border-destructive'
                    )}
                />

                {/* Right side - password toggle or suffix */}
                {isPassword ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={disabled ?? field.disabled}
                    >
                        {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                ) : field.suffix ? (
                    <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        {field.suffix}
                    </span>
                ) : null}
            </div>

            {field.description && !error && (
                <p className="text-muted-foreground text-xs">{field.description}</p>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
