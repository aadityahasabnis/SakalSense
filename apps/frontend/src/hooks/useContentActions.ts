// useContentActions — Common hook for content CRUD operations

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { type ContentStatusType, type ContentType, type DifficultyType } from '@/constants/content.constants';
import { archiveContent, createContent, deleteContent, getContentById, getContentList, publishContent, updateContent } from '@/server/actions/content/contentActions';
import { type IContentInput, type IContentListItem, type IContentWithRelations } from '@/types/content.types';

interface IContentFilters { search?: string; type?: ContentType; status?: ContentStatusType; difficulty?: DifficultyType; page?: number; limit?: number; sortField?: string; sortDir?: 'asc' | 'desc' }

export const useContentList = () => {
    const [data, setData] = useState<Array<IContentListItem>>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchList = useCallback(async (filters: IContentFilters) => {
        setLoading(true);
        const result = await getContentList(filters);
        if (result.success && result.data) { 
            setData(result.data.contents); 
            setTotal(result.data.total); 
        }
        else toast.error(result.error ?? 'Failed to load content');
        setLoading(false);
    }, []);

    return { data, total, loading, fetchList };
};

export const useContentActions = () => {
    const [loading, setLoading] = useState(false);

    const create = useCallback(async (input: IContentInput, publish = false): Promise<boolean> => {
        setLoading(true);
        const result = await createContent(input);
        if (result.success && result.data?.id) {
            if (publish) await publishContent(result.data.id);
            toast.success(publish ? 'Content published' : 'Content created');
            setLoading(false);
            return true;
        }
        toast.error(result.error ?? 'Failed to create');
        setLoading(false);
        return false;
    }, []);

    const update = useCallback(async (id: string, input: Partial<IContentInput>): Promise<boolean> => {
        setLoading(true);
        const result = await updateContent(id, input);
        if (result.success) { toast.success('Content updated'); setLoading(false); return true; }
        toast.error(result.error ?? 'Failed to update');
        setLoading(false);
        return false;
    }, []);

    const remove = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await deleteContent(id);
        if (result.success) { toast.success('Content deleted'); onSuccess?.(); return true; }
        toast.error(result.error ?? 'Failed to delete');
        return false;
    }, []);

    const publish = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await publishContent(id);
        if (result.success) { toast.success('Content published'); onSuccess?.(); return true; }
        toast.error(result.error ?? 'Failed to publish');
        return false;
    }, []);

    const archive = useCallback(async (id: string, onSuccess?: () => void): Promise<boolean> => {
        const result = await archiveContent(id);
        if (result.success) { toast.success('Content archived'); onSuccess?.(); return true; }
        toast.error(result.error ?? 'Failed to archive');
        return false;
    }, []);

    return { create, update, remove, publish, archive, loading };
};

export const useContentDetail = (id: string) => {
    const [data, setData] = useState<IContentWithRelations | undefined>();
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const result = await getContentById(id);
        if (result.success && result.data) setData(result.data);
        else toast.error(result.error ?? 'Failed to load content');
        setLoading(false);
    }, [id]);

    return { data, loading, fetch };
};
