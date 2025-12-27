// =============================================
// useAPIAction - Hook for POST/PUT/DELETE mutations
// =============================================

'use client';

import { startTransition, useState } from 'react';

import { type FormDataType, type IApiResponse } from 'sakalsense-core';
import { useQueryClient } from '@tanstack/react-query';

import { apiCall, type IApiCallProps } from '@/lib/api';

// =============================================
// Types & Interfaces
// =============================================

export interface IInvalidateQueries {
    queryKeys?: Array<string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = Record<string, any> | undefined;

export type ServerActionConfig<TResponseData extends AnyData> = { customAction: () => Promise<IApiResponse<TResponseData>> } | IApiCallProps;

interface IHandleActionParams<TResponseData extends AnyData> {
    actionConfig: ServerActionConfig<TResponseData>;
    invalidate?: IInvalidateQueries;
    onSuccess?: (data: TResponseData) => void;
    onError?: (error: string) => void;
}

interface IUseAPIActionReturn {
    handleAction: <TResponseData extends AnyData = FormDataType>(params: IHandleActionParams<TResponseData>) => Promise<IApiResponse<TResponseData>>;
    pending: boolean;
}

// =============================================
// Hook Implementation
// =============================================

export const useAPIAction = (): IUseAPIActionReturn => {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState(false);

    const handleAction = async <TResponseData extends AnyData = FormDataType>({
        actionConfig,
        invalidate,
        onSuccess,
        onError,
    }: IHandleActionParams<TResponseData>): Promise<IApiResponse<TResponseData>> => {
        try {
            setPending(true);
            let response: IApiResponse<TResponseData> | undefined;

            // Handle custom action or standard API call
            if ('customAction' in actionConfig && actionConfig.customAction) {
                response = await actionConfig.customAction();
            } else {
                const apiCallConfig = actionConfig as IApiCallProps;
                response = await apiCall<TResponseData>(apiCallConfig);
            }

            // Handle successful response
            if (response?.success) {
                // Invalidate queries on success
                if (invalidate?.queryKeys) {
                    void Promise.all(invalidate.queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
                }

                // Call success callback
                if (onSuccess && response.data) {
                    onSuccess(response.data);
                }
            } else if (onError) {
                // Call error callback
                onError(response?.error ?? 'An error occurred');
            }

            return response ?? { success: false, status: 500, error: 'No response' };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            const errorResponse: IApiResponse<TResponseData> = {
                success: false,
                error: errorMessage,
                status: 500,
            };

            if (onError) {
                onError(errorMessage);
            }

            return errorResponse;
        } finally {
            startTransition(() => setPending(false));
        }
    };

    return { handleAction, pending };
};
