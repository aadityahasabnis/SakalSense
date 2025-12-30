'use client';

// =============================================
// Form - Main form renderer component
// =============================================

import { type FormEvent, useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { FieldRenderer } from './FieldRenderer';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    type FormConfig,
    type FormError,
    type FormField,
    type FormValues,
    type GridConfig,
    hasColSpan,
} from '@/types/form.types';

// =============================================
// Helpers
// =============================================

const getGridClasses = (layout: GridConfig): string => {
    const { cols, gap = 'md', responsive } = layout;

    const gapClasses = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };
    const colClasses = cols === 2 ? 'grid-cols-2' : 'grid-cols-3';

    let responsiveClasses = 'grid-cols-1';
    if (responsive) {
        if (responsive.sm) responsiveClasses += ` sm:grid-cols-${responsive.sm}`;
        if (responsive.md) responsiveClasses += ` md:grid-cols-${responsive.md}`;
        if (responsive.lg) responsiveClasses += ` lg:grid-cols-${responsive.lg}`;
    } else {
        responsiveClasses += ` md:${colClasses}`;
    }

    return cn('grid', responsiveClasses, gapClasses[gap]);
};

const getLayoutClasses = (layout: FormConfig['layout']): string => {
    if (!layout || layout === 'vertical') return 'flex flex-col gap-4';
    if (layout === 'inline') return 'flex flex-wrap items-end gap-4';
    return getGridClasses(layout);
};

const getColSpanClass = (colSpan: 1 | 2 | 3 | 'full' | undefined): string => {
    if (!colSpan) return '';
    if (colSpan === 'full') return 'col-span-full';
    return `col-span-${colSpan}`;
};

const getDefaultValues = (fields: Array<FormField>): FormValues => {
    const values: FormValues = {};
    for (const field of fields) {
        if ('name' in field && field.defaultValue !== undefined) {
            values[field.name] = field.defaultValue;
        }
    }
    return values;
};

const validateField = (field: FormField, value: unknown, allValues: FormValues): string | undefined => {
    // Skip validation for non-validatable fields
    if (field.type === 'separator' || field.type === 'heading' || field.type === 'hidden') {
        return undefined;
    }

    const stringValue = typeof value === 'string' ? value : '';
    const fieldLabel = 'label' in field ? (field.label ?? field.name) : field.name;

    // Required validation
    if ('required' in field && field.required && (!value || stringValue.trim() === '')) {
        return `${fieldLabel} is required`;
    }

    // Skip other validations if empty and not required
    if (!value && !('required' in field && field.required)) return undefined;

    // Min/Max length for strings
    if ('minLength' in field && field.minLength && stringValue.length < field.minLength) {
        return `${fieldLabel} must be at least ${field.minLength} characters`;
    }
    if ('maxLength' in field && field.maxLength && stringValue.length > field.maxLength) {
        return `${fieldLabel} must be at most ${field.maxLength} characters`;
    }

    // Min/Max for numbers
    if (field.type === 'number' && 'min' in field) {
        const numValue = Number(value);
        if (field.min !== undefined && numValue < field.min) {
            return `${fieldLabel} must be at least ${field.min}`;
        }
        if ('max' in field && field.max !== undefined && numValue > field.max) {
            return `${fieldLabel} must be at most ${field.max}`;
        }
    }

    // Pattern validation
    if ('pattern' in field && field.pattern && !field.pattern.test(stringValue)) {
        return `${fieldLabel} format is invalid`;
    }

    // Custom validation
    if ('validate' in field && field.validate) {
        return field.validate(value, allValues);
    }

    return undefined;
};

// =============================================
// Form Component
// =============================================

interface FormProps<TData = unknown> {
    config: FormConfig<TData>;
    initialValues?: FormValues;
    className?: string;
}

export function Form<TData = unknown>({ config, initialValues, className }: FormProps<TData>) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [values, setValues] = useState<FormValues>(() => ({
        ...getDefaultValues(config.fields),
        ...initialValues,
    }));
    const [errors, setErrors] = useState<Array<FormError>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | undefined>();

    const handleChange = useCallback((name: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field
        setErrors((prev) => prev.filter((e) => e.field !== name));
        setSubmitError(undefined);
    }, []);

    const validateAllFields = useCallback((): boolean => {
        const newErrors: Array<FormError> = [];

        for (const field of config.fields) {
            if (!('name' in field)) continue;

            // Skip hidden fields
            if ('showWhen' in field && field.showWhen && !field.showWhen(values)) continue;
            if ('hidden' in field && field.hidden) continue;

            const error = validateField(field, values[field.name], values);
            if (error) {
                newErrors.push({ field: field.name, message: error });
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    }, [config.fields, values]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateAllFields()) return;

        setIsSubmitting(true);
        setSubmitError(undefined);

        try {
            const response = await config.submit.action(values);

            if (response.success) {
                // Invalidate queries
                if (config.submit.invalidateQueries) {
                    for (const key of config.submit.invalidateQueries) {
                        await queryClient.invalidateQueries({ queryKey: [key] });
                    }
                }

                // Call success handler
                if (config.submit.onSuccess && response.data) {
                    config.submit.onSuccess(response.data as TData);
                }

                // Redirect
                if (config.submit.redirectOnSuccess) {
                    router.push(config.submit.redirectOnSuccess);
                }
            } else {
                const errorMessage = response.error ?? response.message ?? 'An error occurred';
                setSubmitError(errorMessage);
                config.submit.onError?.(errorMessage);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setSubmitError(errorMessage);
            config.submit.onError?.(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFieldError = (fieldName: string): string | undefined => {
        return errors.find((e) => e.field === fieldName)?.message;
    };

    const shouldShowField = (field: FormField): boolean => {
        if ('hidden' in field && field.hidden) return false;
        if ('showWhen' in field && field.showWhen) return field.showWhen(values);
        return true;
    };

    const isFieldDisabled = (field: FormField): boolean => {
        if ('disabled' in field && field.disabled) return true;
        if ('disableWhen' in field && field.disableWhen) return field.disableWhen(values);
        return false;
    };

    return (
        <form
            id={config.id}
            onSubmit={handleSubmit}
            className={cn(getLayoutClasses(config.layout), className, config.className)}
        >
            {config.fields.map((field, index) => {
                if (!shouldShowField(field)) return null;

                const colSpanClass = hasColSpan(field) ? getColSpanClass(field.colSpan) : '';

                return (
                    <div key={'name' in field ? field.name : `field-${index}`} className={colSpanClass}>
                        <FieldRenderer
                            field={field}
                            value={'name' in field ? values[field.name] : undefined}
                            onChange={handleChange}
                            error={'name' in field ? getFieldError(field.name) : undefined}
                            disabled={isFieldDisabled(field)}
                        />
                    </div>
                );
            })}

            {/* Submit Error */}
            {submitError && (
                <div className="col-span-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {submitError}
                </div>
            )}

            {/* Submit Button */}
            <div className="col-span-full">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn('w-full', config.submit.className)}
                >
                    {isSubmitting ? (config.submit.loadingLabel ?? 'Submitting...') : config.submit.label}
                </Button>
            </div>
        </form>
    );
}
