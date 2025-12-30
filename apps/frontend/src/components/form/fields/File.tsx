'use client';

// =============================================
// File Field Component
// =============================================

import { type ChangeEvent, useRef } from 'react';

import { UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type FileField as FileFieldType } from '@/types/form.types';

// =============================================
// Types
// =============================================

interface FileProps {
    field: FileFieldType;
    value: unknown;
    onChange: (name: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
}

// =============================================
// Component
// =============================================

export function File({ field, value, onChange, error, disabled }: FileProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const files = value as FileList | Array<File> | undefined;

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            onChange(field.name, field.multiple ? Array.from(selectedFiles) : selectedFiles[0]);
        }
    };

    const fileName = files
        ? Array.isArray(files)
            ? files.map((f) => f.name).join(', ')
            : files instanceof FileList
              ? Array.from(files)
                    .map((f) => f.name)
                    .join(', ')
              : (files as File).name
        : undefined;

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

            <input
                ref={inputRef}
                type="file"
                name={field.name}
                accept={field.accept}
                multiple={field.multiple}
                onChange={handleChange}
                disabled={disabled ?? field.disabled}
                className="sr-only"
            />

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClick}
                    disabled={disabled ?? field.disabled}
                    className={cn(error && 'border-destructive')}
                >
                    <UploadIcon className="mr-2 size-4" />
                    {fileName ? 'Change File' : 'Upload File'}
                </Button>

                {fileName && <span className="text-muted-foreground truncate text-sm">{fileName}</span>}
            </div>

            {field.description && !error && <p className="text-muted-foreground text-xs">{field.description}</p>}

            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
