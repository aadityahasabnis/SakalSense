'use server';

// =============================================
// Content Actions - Re-export all content actions for backwards compatibility
// =============================================
// This file was split into smaller modules:
// - contentQueryActions.ts (List, Get)
// - contentCrudActions.ts (Create, Update, Delete)
// - contentStatusActions.ts (Publish, Archive, Unpublish)
// =============================================

// Query Actions
export { getContentList, getContentById } from './contentQueryActions';
export type { IContentListFilters, IContentListResponse } from './contentQueryActions';

// CRUD Actions
export { createContent, updateContent, deleteContent } from './contentCrudActions';

// Status Actions
export { publishContent, archiveContent, unpublishContent } from './contentStatusActions';
