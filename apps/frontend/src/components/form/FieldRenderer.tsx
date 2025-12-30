'use client';

// =============================================
// FieldRenderer - Dispatches to field components
// =============================================

import { Checkbox } from './fields/Checkbox';
import { DatePicker } from './fields/DatePicker';
import { Editor } from './fields/Editor';
import { File } from './fields/File';
import { Heading } from './fields/Heading';
import { Input } from './fields/Input';
import { Select } from './fields/Select';
import { Separator } from './fields/Separator';
import { Switch } from './fields/Switch';
import { Textarea } from './fields/Textarea';

import { type FormField } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface FieldRendererProps {
    field: FormField;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
    switch (field.type) {
        case 'text':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'email':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'password':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'number':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'phone':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'url':
            return <Input field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'date':
            return <DatePicker field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'textarea':
            return <Textarea field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'select':
            return <Select field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'checkbox':
            return <Checkbox field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'radio':
            return <Checkbox field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'switch':
            return <Switch field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'separator':
            return <Separator field={field} />;

        case 'heading':
            return <Heading field={field} />;

        case 'editor':
            return <Editor field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        case 'hidden':
            return <input type="hidden" name={field.name} value={String(field.defaultValue ?? '')} />;

        case 'file':
            return <File field={field} value={value} onChange={onChange} error={error} disabled={disabled} />;

        default:
            return null;
    }
}
