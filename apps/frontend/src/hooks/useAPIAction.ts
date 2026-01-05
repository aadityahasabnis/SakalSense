// =============================================
// useAPIAction - Hook for POST/PUT/DELETE mutations using TanStack Query
// =============================================

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiCall, type IApiCallProps } from '@/lib/api';
import { type IApiResponse } from '@/lib/interfaces';
import { type IFormData } from '@/types/common.types';

// =============================================
// Types & Interfaces
// =============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any> | undefined;

export type ServerActionConfig<TResponseData extends AnyData> = { customAction: () => Promise<IApiResponse<TResponseData>> } | IApiCallProps;

export interface IMutationOptions<TResponseData extends AnyData> {
    actionConfig: ServerActionConfig<TResponseData>;
    invalidateKeys?: Array<string>;
    onSuccess?: (data: TResponseData) => void;
    onError?: (error: string) => void;
}

interface IUseAPIActionReturn<TResponseData extends AnyData> {
    mutate: (options: IMutationOptions<TResponseData>) => void;
    mutateAsync: (options: IMutationOptions<TResponseData>) => Promise<IApiResponse<TResponseData>>;
    pending: boolean;
    error: string | undefined;
    reset: () => void;
}

// =============================================
// Mutation Function
// =============================================

const executeMutation = async <TResponseData extends AnyData>(
    actionConfig: ServerActionConfig<TResponseData>,
): Promise<IApiResponse<TResponseData>> => {
    if ('customAction' in actionConfig && actionConfig.customAction) {
        return actionConfig.customAction();
    }
    return apiCall<TResponseData>(actionConfig as IApiCallProps);
};

// =============================================
// Hook Implementation
// =============================================

export const useAPIAction = <TResponseData extends AnyData = IFormData>(): IUseAPIActionReturn<TResponseData> => {
    const queryClient = useQueryClient();

    const mutation = useMutation<IApiResponse<TResponseData>, Error, IMutationOptions<TResponseData>>({
        mutationFn: async (options) => {
            const response = await executeMutation<TResponseData>(options.actionConfig);

            // Throw error to trigger onError if response is unsuccessful
            if (!response.success) {
                throw new Error(response.error ?? response.message ?? 'An error occurred');
            }

            return response;
        },
        onSuccess: (response, options) => {
            // Invalidate queries on success
            if (options.invalidateKeys?.length) {
                options.invalidateKeys.forEach((key) => {
                    void queryClient.invalidateQueries({ queryKey: [key] });
                });
            }

            // Call success callback with data
            if (options.onSuccess && response.data) {
                options.onSuccess(response.data);
            }
        },
        onError: (error, options) => {
            options.onError?.(error.message);
        },
    });

    // Wrapper for mutateAsync that handles errors gracefully
    const mutateAsync = async (options: IMutationOptions<TResponseData>): Promise<IApiResponse<TResponseData>> => {
        try {
            return await mutation.mutateAsync(options);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            return { success: false, error: errorMessage, status: 500 };
        }
    };

    return {
        mutate: mutation.mutate,
        mutateAsync,
        pending: mutation.isPending,
        error: mutation.error?.message,
        reset: mutation.reset,
    };
};

// =============================================
// Legacy Hook (Backwards Compatibility)
// =============================================

interface ILegacyHandleActionParams<TResponseData extends AnyData> {
    actionConfig: ServerActionConfig<TResponseData>;
    invalidate?: { queryKeys?: Array<string> };
    onSuccess?: (data: TResponseData) => void;
    onError?: (error: string) => void;
}

interface ILegacyAPIActionReturn {
    handleAction: <TResponseData extends AnyData = IFormData>(params: ILegacyHandleActionParams<TResponseData>) => Promise<IApiResponse<TResponseData>>;
    pending: boolean;
}

export const useLegacyAPIAction = (): ILegacyAPIActionReturn => {
    const queryClient = useQueryClient();
    const { mutateAsync, pending } = useAPIAction();

    const handleAction = async <TResponseData extends AnyData = IFormData>({
        actionConfig,
        invalidate,
        onSuccess,
        onError,
    }: ILegacyHandleActionParams<TResponseData>): Promise<IApiResponse<TResponseData>> => {
        // Use the new mutation-based approach
        const typedMutateAsync = mutateAsync as (options: IMutationOptions<TResponseData>) => Promise<IApiResponse<TResponseData>>;

        const response = await typedMutateAsync({
            actionConfig,
            invalidateKeys: invalidate?.queryKeys,
            onSuccess,
            onError,
        });

        // Also invalidate using queryClient for legacy support
        if (response.success && invalidate?.queryKeys) {
            await Promise.all(invalidate.queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
        }

        return response;
    };

    return { handleAction, pending };
};
