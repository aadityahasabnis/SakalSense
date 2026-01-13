'use client';
// =============================================
// useDialog - Hook-based dialog system for confirm, form, and view dialogs
// =============================================

import { type FormEvent, type ReactNode, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type FormField, type FormValues } from '@/types/form.types';

// =============================================
// Types
// =============================================

export type DialogType = 'confirm' | 'form' | 'view';
export type DialogVariant = 'default' | 'destructive';

interface IBaseDialogConfig {
    title: string;
    description?: string;
}

export interface IConfirmDialogConfig extends IBaseDialogConfig {
    type: 'confirm';
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: DialogVariant;
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
}

export interface IFormDialogConfig extends IBaseDialogConfig {
    type: 'form';
    fields: Array<FormField>;
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit: (data: FormValues) => Promise<void> | void;
    onCancel?: () => void;
}

export interface IViewDialogConfig extends IBaseDialogConfig {
    type: 'view';
    content: ReactNode;
    closeLabel?: string;
}

export type DialogConfig = IConfirmDialogConfig | IFormDialogConfig | IViewDialogConfig;

interface IDialogState {
    isOpen: boolean;
    isLoading: boolean;
    config: DialogConfig | undefined;
}

interface IUseDialogReturn {
    openDialog: (config: DialogConfig) => void;
    closeDialog: () => void;
    DialogRenderer: () => ReactNode;
}

// =============================================
// Mini Form Component for Form Dialogs
// =============================================

const DialogForm = ({
    fields,
    onSubmit,
    onCancel,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    isLoading,
}: {
    fields: Array<FormField>;
    onSubmit: (data: FormValues) => void;
    onCancel: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    isLoading: boolean;
}) => {
    const [values, setValues] = useState<FormValues>(() => {
        const initial: FormValues = {};
        for (const field of fields) {
            if ('name' in field && 'defaultValue' in field) {
                initial[field.name] = field.defaultValue;
            }
        }
        return initial;
    });

    const handleChange = (name: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {fields.map((field) => {
                if (!('name' in field)) return null;

                switch (field.type) {
                    case 'text':
                    case 'email':
                        return (
                            <div key={field.name} className='flex flex-col gap-1.5'>
                                {field.label && <label className='text-sm font-medium'>{field.label}</label>}
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={String(values[field.name] ?? '')}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    disabled={isLoading}
                                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                                />
                            </div>
                        );
                    case 'textarea':
                        return (
                            <div key={field.name} className='flex flex-col gap-1.5'>
                                {field.label && <label className='text-sm font-medium'>{field.label}</label>}
                                <textarea
                                    name={field.name}
                                    value={String(values[field.name] ?? '')}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    disabled={isLoading}
                                    rows={field.rows ?? 3}
                                    className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                                />
                            </div>
                        );
                    default:
                        return null;
                }
            })}
            <DialogFooter>
                <Button type='button' variant='outline' onClick={onCancel} disabled={isLoading}>
                    {cancelLabel}
                </Button>
                <Button type='submit' loading={isLoading}>
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
};

// =============================================
// Hook Implementation
// =============================================

export const useDialog = (): IUseDialogReturn => {
    const [state, setState] = useState<IDialogState>({
        isOpen: false,
        isLoading: false,
        config: undefined,
    });

    const openDialog = useCallback((config: DialogConfig) => {
        setState({ isOpen: true, isLoading: false, config });
    }, []);

    const closeDialog = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
        // Delay clearing config to allow close animation
        setTimeout(() => {
            setState((prev) => ({ ...prev, config: undefined }));
        }, 200);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (state.config?.type !== 'confirm') return;

        setState((prev) => ({ ...prev, isLoading: true }));
        try {
            await state.config.onConfirm();
            closeDialog();
        } catch (error) {
            console.error('Dialog confirm error:', error);
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [state.config, closeDialog]);

    const handleFormSubmit = useCallback(
        async (data: FormValues) => {
            if (state.config?.type !== 'form') return;

            setState((prev) => ({ ...prev, isLoading: true }));
            try {
                await state.config.onSubmit(data);
                closeDialog();
            } catch (error) {
                console.error('Dialog form error:', error);
            } finally {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        },
        [state.config, closeDialog],
    );

    const handleCancel = useCallback(() => {
        if (state.config && 'onCancel' in state.config && state.config.onCancel) {
            state.config.onCancel();
        }
        closeDialog();
    }, [state.config, closeDialog]);

    const DialogRenderer = useCallback(() => {
        const { isOpen, isLoading, config } = state;
        if (!config) return null;

        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent showCloseButton={config.type === 'view'}>
                    <DialogHeader>
                        <DialogTitle>{config.title}</DialogTitle>
                        {config.description && <DialogDescription>{config.description}</DialogDescription>}
                    </DialogHeader>

                    {/* Confirm Dialog */}
                    {config.type === 'confirm' && (
                        <DialogFooter>
                            <Button variant='outline' onClick={handleCancel} disabled={isLoading}>
                                {config.cancelLabel ?? 'Cancel'}
                            </Button>
                            <Button
                                variant={config.variant === 'destructive' ? 'destructive' : 'default'}
                                onClick={() => void handleConfirm()}
                                loading={isLoading}
                            >
                                {config.confirmLabel ?? 'Confirm'}
                            </Button>
                        </DialogFooter>
                    )}

                    {/* Form Dialog */}
                    {config.type === 'form' && (
                        <DialogForm
                            fields={config.fields}
                            onSubmit={(data) => void handleFormSubmit(data)}
                            onCancel={handleCancel}
                            submitLabel={config.submitLabel}
                            cancelLabel={config.cancelLabel}
                            isLoading={isLoading}
                        />
                    )}

                    {/* View Dialog */}
                    {config.type === 'view' && (
                        <>
                            <div className='py-4'>{config.content}</div>
                            <DialogFooter>
                                <Button onClick={closeDialog}>{config.closeLabel ?? 'Close'}</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        );
    }, [state, handleCancel, handleConfirm, handleFormSubmit, closeDialog]);

    return { openDialog, closeDialog, DialogRenderer };
};
