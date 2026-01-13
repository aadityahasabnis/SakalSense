// useContentActions — Common hook for content CRUD operations

import { useCallback, useState } from 'react';

import { useAtom } from 'jotai';

import { type ContentStatusType, type ContentType, type DifficultyType } from '@/constants/content.constants';
import { addNotificationAtom } from '@/jotai/atoms';
import { archiveContent, createContent, deleteContent, getContentById, getContentList, publishContent, updateContent } from '@/server/actions/content/contentActions';
import { type IContentInput, type IContentListItem, type IContentWithRelations } from '@/types/content.types';

interface IContentFilters { search?: string; type?: ContentType; status?: ContentStatusType; difficulty?: DifficultyType; page?: number; limit?: number; sortField?: string; sortDir?: 'asc' | 'desc' }

export const useContentList = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<Array<IContentListItem>>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchList = useCallback(async (filters: IContentFilters) => {
        setLoading(true);
        const result = await getContentList(filters);
        if (result.success && result.data) { setData(result.data); setTotal(result.total ?? 0); }
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load content' });
        setLoading(false);
    }, [addNotification]);

    return { data, total, loading, fetchList };
};

export const useContentActions = () => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [loading, setLoading] = useState(false);

    const create = useCallback(async (input: IContentInput, publish = false): Promise<boolean> => {
        setLoading(true);
        const result = await createContent(input);
        if (result.success && result.data?.id) {
            if (publish) await publishContent(result.data.id);
            addNotification({ type: 'success', message: publish ? 'Content published' : 'Content created' });
            setLoading(false);
            return true;
        }
        addNotification({ type: 'error', message: result.error ?? 'Failed to create' });
        setLoading(false);
        return false;
    }, [addNotification]);

    const update = useCallback(async (id: string, input: Partial<IContentInput>): Promise<boolean> => {
        setLoading(true);
        const result = await updateContent(id, input);
        if (result.success) { addNotification({ type: 'success', message: 'Content updated' }); setLoading(false); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to update' });
        setLoading(false);
        return false;
    }, [addNotification]);

    const remove = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await deleteContent(id);
        if (result.success) { addNotification({ type: 'success', message: 'Content deleted' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to delete' });
        return false;
    }, [addNotification]);

    const publish = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await publishContent(id);
        if (result.success) { addNotification({ type: 'success', message: 'Content published' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to publish' });
        return false;
    }, [addNotification]);

    const archive = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await archiveContent(id);
        if (result.success) { addNotification({ type: 'success', message: 'Content archived' }); onSuccess?.(); return true; }
        addNotification({ type: 'error', message: result.error ?? 'Failed to archive' });
        return false;
    }, [addNotification]);

    return { create, update, remove, publish, archive, loading };
};

export const useContentDetail = (id: string) => {
    const [, addNotification] = useAtom(addNotificationAtom);
    const [data, setData] = useState<IContentWithRelations | undefined>();
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const result = await getContentById(id);
        if (result.success && result.data) setData(result.data);
        else addNotification({ type: 'error', message: result.error ?? 'Failed to load content' });
        setLoading(false);
    }, [id, addNotification]);

    return { data, loading, fetch };
};
