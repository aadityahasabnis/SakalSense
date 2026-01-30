// =============================================
// Hooks Barrel Export - Custom React hooks
// =============================================

export { useAPIQuery } from './useAPIQuery';
export { useAPIAction, useLegacyAPIAction } from './useAPIAction';
export { useDialog, type DialogConfig, type IConfirmDialogConfig, type IFormDialogConfig, type IViewDialogConfig } from './useDialog';

// Engagement Hooks
export {
    useBookmarkStatus,
    useToggleBookmark,
    useUserBookmarks,
    useRemoveBookmarks,
} from './useBookmarks';

export {
    useLikeStatus,
    useToggleLike,
    useUserLikes,
    useContentEngagement,
} from './useLikes';

export {
    useContentComments,
    useCreateComment,
    useUpdateComment,
    useDeleteComment,
    useToggleCommentLike,
    useCommentActions,
} from './useComments';

// Progress Tracking Hooks
export {
    useContentProgress,
    useScrollProgress,
    useReadingProgress,
    formatReadingTime,
} from './useProgress';

// Utility Hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useUrlTabs, useUrlPage, useUrlParam, useUrlParams } from './useUrlState';
export { usePagination, useInfiniteScroll } from './usePagination';
