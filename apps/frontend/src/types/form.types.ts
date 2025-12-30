// =============================================
// Form Configuration Types
// =============================================

import { type ReactNode } from 'react';

import { type YooptaContentValue } from '@yoopta/editor';

import { type IApiResponse } from '@/lib/interfaces';

// =============================================
// Field Types
// =============================================

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'phone' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'date' | 'file' | 'hidden' | 'separator' | 'heading' | 'editor';

// =============================================
// Layout Types
// =============================================

export interface GridConfig {
    cols: 2 | 3;
    gap?: 'sm' | 'md' | 'lg';
    responsive?: {
        sm?: 1 | 2;
        md?: 2 | 3;
        lg?: 2 | 3;
    };
}

export type FormLayout = 'vertical' | 'inline' | GridConfig;

// =============================================
// Option Type (for select, radio, checkbox groups)
// =============================================

export interface FieldOption {
    value: string;
    label: string;
    disabled?: boolean;
}

// =============================================
// Base Field Properties
// =============================================

export interface BaseFieldProps {
    name: string;
    type: FieldType;
    label?: string;
    description?: string; // Helper text below field
    tooltip?: string; // Hover tooltip on label
    placeholder?: string;
    defaultValue?: unknown;
    // State
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    hidden?: boolean;
    autoFocus?: boolean;
    // Layout
    colSpan?: 1 | 2 | 3 | 'full';
    className?: string;
    // Validation
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    validate?: (value: unknown, allValues: FormValues) => string | undefined;
    // Conditional
    showWhen?: (values: FormValues) => boolean;
    disableWhen?: (values: FormValues) => boolean;
    // UI Enhancements
    prefix?: ReactNode;
    suffix?: ReactNode;
    icon?: ReactNode;
}

// =============================================
// Specific Field Types
// =============================================

export interface InputField extends BaseFieldProps {
    type: 'text' | 'email' | 'password' | 'number' | 'phone' | 'url' | 'date';
    autoComplete?: string;
}

export interface TextareaField extends BaseFieldProps {
    type: 'textarea';
    rows?: number;
}

export interface SelectField extends BaseFieldProps {
    type: 'select';
    options: Array<FieldOption>;
    multiple?: boolean;
}

export interface CheckboxField extends BaseFieldProps {
    type: 'checkbox' | 'radio';
    options?: Array<FieldOption>; // For checkbox/radio groups
}

export interface SwitchField extends BaseFieldProps {
    type: 'switch';
}

export interface FileField extends BaseFieldProps {
    type: 'file';
    accept?: string;
    multiple?: boolean;
}

export interface HiddenField {
    type: 'hidden';
    name: string;
    defaultValue: unknown;
}

export interface SeparatorField {
    type: 'separator';
    className?: string;
}

export interface HeadingField {
    type: 'heading';
    text: string;
    description?: string;
    className?: string;
}

export interface EditorField extends BaseFieldProps {
    type: 'editor';
    minHeight?: number;
}

// =============================================
// Field Union Type
// =============================================

export type FormField = InputField | TextareaField | SelectField | CheckboxField | SwitchField | FileField | HiddenField | SeparatorField | HeadingField | EditorField;

// Fields that support validation (have BaseFieldProps)
export type ValidatableField = InputField | TextareaField | SelectField | CheckboxField | SwitchField | FileField | EditorField;

// Type guard to check if field is validatable
export const isValidatableField = (field: FormField): field is ValidatableField => {
    return field.type !== 'separator' && field.type !== 'heading' && field.type !== 'hidden';
};

// Type guard to check if field has colSpan
export const hasColSpan = (field: FormField): field is FormField & { colSpan?: 1 | 2 | 3 | 'full' } => {
    return 'colSpan' in field;
};

// =============================================
// Form Values & State
// =============================================

export type FormValues = Record<string, unknown>;

export interface FormError {
    field: string;
    message: string;
}

export interface FormState {
    values: FormValues;
    errors: Array<FormError>;
    isSubmitting: boolean;
    isDirty: boolean;
}

// =============================================
// Submit Configuration
// =============================================

export interface SubmitConfig<TData = unknown> {
    label: string;
    loadingLabel?: string;
    className?: string;
    action: (values: FormValues) => Promise<IApiResponse<TData>>;
    redirectOnSuccess?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
    invalidateQueries?: Array<string>;
}

// =============================================
// Form Configuration
// =============================================

export interface FormConfig<TData = unknown> {
    fields: Array<FormField>;
    submit: SubmitConfig<TData>;
    layout?: FormLayout;
    className?: string;
    id?: string;
}

// =============================================
// Editor Field Value Type (re-export)
// =============================================

export type EditorValue = YooptaContentValue;
