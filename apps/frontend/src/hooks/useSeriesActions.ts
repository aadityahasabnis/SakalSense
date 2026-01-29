// useSeriesActions — Optimized hook for series CRUD operations

import { useCallback, useState } from 'react';

import { useAtom } from 'jotai';

import { type ContentStatusType, type ContentType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { createSeries, deleteSeries, getSeriesById, getSeriesList, updateSeries } from '@/server/actions/content/seriesActions';
import { type ISeries, type ISeriesWithItems } from '@/types/content.types';

interface ISeriesFilters { search?: string; contentType?: ContentType; status?: ContentStatusType; page?: number; limit?: number }
interface ISeriesInput { title: string; slug: string; description?: string; thumbnailUrl?: string; contentType: ContentType }

export const useSeriesList = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<Array<ISeries>>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchList = useCallback(async (filters: ISeriesFilters) => {
        setLoading(true);
        const result = await getSeriesList(filters);
        if (result.success && result.data) { setData(result.data); setTotal(result.total ?? 0); }
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load series' });
        setLoading(false);
    }, [addNotification]);

    return { data, total, loading, fetchList };
};

export const useSeriesActions = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [loading, setLoading] = useState(false);

    const create = useCallback(async (input: ISeriesInput): Promise<string | null> => {
        setLoading(true);
        const result = await createSeries(input);
        if (result.success && result.data?.id) {
            addNotification({ type: 'success', message: 'Series created successfully' });
            setLoading(false);
            return result.data.id;
        }
        addNotification({ type: 'error', message: result.error ?? 'Failed to create series' });
        setLoading(false);
        return null;
    }, [addNotification]);

    const update = useCallback(async (id: string, input: Partial<ISeriesInput>): Promise<boolean> => {
        setLoading(true);
        const result = await updateSeries(id, input);
        if (result.success) { addNotification({ type: 'success', message: 'Series updated successfully' }); setLoading(false); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to update series' });
        setLoading(false);
        return false;
    }, [addNotification]);

    const remove = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await deleteSeries(id);
        if (result.success) { addNotification({ type: 'success', message: 'Series deleted successfully' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to delete series' });
        return false;
    }, [addNotification]);

    return { create, update, remove, loading };
};

export const useSeriesDetail = (id: string) => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<ISeriesWithItems | undefined>();
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const result = await getSeriesById(id);
        if (result.success && result.data) setData(result.data);
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load series' });
        setLoading(false);
    }, [id, addNotification]);

    return { data, loading, fetch };
};
