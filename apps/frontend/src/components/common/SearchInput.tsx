// =============================================
// SearchInput Component - Search with debounce
// =============================================

'use client';

import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';

import { Search, X, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';

// =============================================
// Types
// =============================================

interface ISearchInputProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    loading?: boolean;
    autoFocus?: boolean;
    clearable?: boolean;
    onSubmit?: (value: string) => void;
    className?: string;
    inputClassName?: string;
    size?: 'sm' | 'md' | 'lg';
}

// =============================================
// SearchInput Component
// =============================================

export const SearchInput = ({
    value: controlledValue,
    onChange,
    placeholder = 'Search...',
    debounceMs = 300,
    loading = false,
    autoFocus = false,
    clearable = true,
    onSubmit,
    className,
    inputClassName,
    size = 'md',
}: ISearchInputProps) => {
    const [localValue, setLocalValue] = useState(controlledValue ?? '');
    const debouncedValue = useDebounce(localValue, debounceMs);

    // Sync with controlled value
    useEffect(() => {
        if (controlledValue !== undefined && controlledValue !== localValue) {
            setLocalValue(controlledValue);
        }
    }, [controlledValue]);

    // Emit debounced value
    useEffect(() => {
        if (debouncedValue !== controlledValue) {
            onChange(debouncedValue);
        }
    }, [debouncedValue, onChange, controlledValue]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSubmit) {
            onSubmit(localValue);
        }
        if (e.key === 'Escape' && clearable) {
            handleClear();
        }
    };

    const sizeClasses = {
        sm: 'h-8 text-sm pl-8 pr-8',
        md: 'h-10 text-sm pl-10 pr-10',
        lg: 'h-12 text-base pl-12 pr-12',
    };

    const iconSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    const iconPositions = {
        sm: 'left-2.5',
        md: 'left-3',
        lg: 'left-4',
    };

    const clearPositions = {
        sm: 'right-1',
        md: 'right-1',
        lg: 'right-2',
    };

    return (
        <div className={cn('relative', className)}>
            <Search
                className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
                    iconSizes[size],
                    iconPositions[size]
                )}
            />
            <Input
                type="text"
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={cn(sizeClasses[size], inputClassName)}
            />
            {(loading || (clearable && localValue)) && (
                <div className={cn('absolute top-1/2 -translate-y-1/2', clearPositions[size])}>
                    {loading ? (
                        <Loader2 className={cn('animate-spin text-muted-foreground', iconSizes[size])} />
                    ) : clearable && localValue ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleClear}
                        >
                            <X className={iconSizes[size]} />
                            <span className="sr-only">Clear search</span>
                        </Button>
                    ) : null}
                </div>
            )}
        </div>
    );
};

// =============================================
// SearchInput with Suggestions
// =============================================

interface ISearchSuggestion {
    id: string;
    label: string;
    description?: string;
}

interface ISearchInputWithSuggestionsProps extends Omit<ISearchInputProps, 'onSubmit'> {
    suggestions?: ISearchSuggestion[];
    onSelect?: (suggestion: ISearchSuggestion) => void;
    showSuggestions?: boolean;
}

export const SearchInputWithSuggestions = ({
    suggestions = [],
    onSelect,
    showSuggestions = true,
    ...props
}: ISearchInputWithSuggestionsProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (suggestion: ISearchSuggestion) => {
        onSelect?.(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <SearchInput
                {...props}
                onSubmit={() => setIsOpen(false)}
            />
            {showSuggestions && isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
                    <ul className="max-h-64 overflow-auto py-1">
                        {suggestions.map((suggestion) => (
                            <li key={suggestion.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                                    onClick={() => handleSelect(suggestion)}
                                >
                                    <span className="font-medium">{suggestion.label}</span>
                                    {suggestion.description && (
                                        <span className="text-sm text-muted-foreground">
                                            {suggestion.description}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
