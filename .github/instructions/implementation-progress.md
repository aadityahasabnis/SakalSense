# Implementation Progress — Component Refactoring

Content Form Enhancements (add domain/category fields)
Another feature

> Tracking document for reusable component development

---

## Status Legend

- `[ ]` Not started
- `[/]` In progress
- `[x]` Completed
- `[!]` Blocked

---

## Priority 1: Button Loading Enhancement

### Goal

Add `loading` prop to shadcn Button component. Shows spinner on the **right** of text, button disabled.

### Tasks

- [x] Modify `components/ui/button.tsx`
- [x] Add `loading?: boolean` prop
- [x] Import `Loader2` from lucide-react
- [x] Show spinner on right: `{loading && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}`
- [x] Disable button when loading: `disabled={Boolean(disabled) || loading}`
- [x] Update Form.tsx to use `loading` prop instead of text replacement

---

## Priority 2: Dialog System

### Goal

Hook-based dialog system with three types: **ConfirmDialog**, **FormDialog**, **ViewDialog**.

### Architecture

```typescript
const { openDialog, closeDialog, DialogRenderer } = useDialog();

// Confirm Dialog
openDialog({
  type: 'confirm',
  title: 'Delete Content?',
  description: 'This action cannot be undone.',
  variant: 'destructive',
  onConfirm: async () => { await deleteContent(id); },
});

// Form Dialog
openDialog({
  type: 'form',
  title: 'Reject Request',
  fields: [{ name: 'reason', type: 'textarea', label: 'Reason' }],
  onSubmit: async (data) => { await rejectRequest(id, data.reason); },
});

// View Dialog
openDialog({
  type: 'view',
  title: 'Content Preview',
  content: <ContentPreview data={content} />,
});
```

### Tasks

- [x] Create `hooks/useDialog.tsx`
- [x] DialogRenderer is built into the hook (no separate component needed)
- [x] Support confirm, form, view types
- [x] Use existing `Dialog` from `components/ui/dialog.tsx`
- [x] Basic form rendering for form dialogs (text, email, textarea)
- [x] Integrated with AdminRequestsTable (approve/reject actions)
- [x] Integrated with DomainsClient (delete confirmations)

---

## Priority 3: Reusable DataTable

### Goal

Config-driven table with TanStack Query caching, tabs, inline actions, and internal skeleton.

### Architecture

```
DataTable<TData>
├── config: ITableConfig<TData>
├── tabs?: ITabConfig[] (lazy-load per tab)
├── rowActions?: IRowAction[] (dropdown menu)
├── inlineActions?: IInlineAction[] (column-level, e.g., toggle)
└── Internal Features:
    ├── Skeleton (10 rows, column-based, responsive)
    ├── Tab caching (fetch once, refresh on button)
    ├── Search + Filters
    └── Pagination
```

### Key Behaviors

**Skeleton Loading:**

- Internal to table, not passed from outside
- Header row static (column names)
- Data rows: 10 fixed skeleton rows
- **No external skeleton files needed** (ContentListSkeleton.tsx removed)
- **No Suspense wrapper needed** — TanStack Query manages loading state

**Tab Caching:**

- Fetch on first tab visit
- Cache with TanStack Query (staleTime: 30s, gcTime: 5min)
- Return to tab = use cached data (no refetch)
- Refresh button = invalidate + refetch

**Row Actions:**

- Dropdown (3 dots menu) for CRUD operations
- Inline actions for in-column controls (e.g., status toggle)

### Tasks

- [x] Create `types/table.types.ts`
- [x] Refactor `components/table/DataTable.tsx`
- [x] Add internal skeleton loader (10 rows, static headers)
- [x] Add tab support with lazy loading
- [x] Add dropdown row actions
- [ ] Add inline column actions (toggle, etc.) — pending
- [x] Use only shadcn components (Button, DropdownMenu, Input, Skeleton, Table)
- [x] Migrate Content table (ContentListClient rewritten)
- [x] Migrate AdminRequests table (AdminRequestsClient.tsx created)
- [ ] Migrate Domains table

---

## Priority 4: Content Form Enhancements

### Goal

Add missing fields to content creation/editing form.

### Missing Fields

| Field            | Type         | Notes               |
| ---------------- | ------------ | ------------------- |
| Domain           | Select       | Fetch from taxonomy |
| Category         | Select       | Filtered by domain  |
| Topics           | Multi-select | Tag-style           |
| Featured         | Switch       | Boolean toggle      |
| Meta Title       | Input        | SEO                 |
| Meta Description | Textarea     | SEO                 |

### Tasks

- [x] Update `ContentFormClient.tsx`
- [x] Add domain/category dropdowns (already existed)
- [x] Add topic multi-select (already existed)
- [x] Add featured toggle (Switch component)
- [x] Add SEO fields (already existed)
- [x] Add Thumbnail/Cover Image URL fields
- [x] Update buttons to use `loading` prop
- [ ] Test create flow
- [ ] Test edit flow

---

## Priority 5: Series/Course Management UI

### Goal

Create management pages for Series and Courses using new components.

### Pages Needed

- [ ] `/admin/series` — List with DataTable
- [ ] `/admin/series/new` — Create form with content picker
- [ ] `/admin/series/[id]` — View with linked content
- [ ] `/admin/series/[id]/edit` — Edit form
- [ ] `/admin/courses` — List with DataTable
- [ ] `/admin/courses/new` — Create with section builder
- [ ] `/admin/courses/[id]` — View with sections/lessons
- [ ] `/admin/courses/[id]/edit` — Edit form

---

## Components Used (shadcn only)

- `components/ui/button.tsx`
- `components/ui/dialog.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/badge.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/table.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/tabs.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/ui/switch.tsx`
- `components/ui/textarea.tsx`

---

## Rules

1. **No browser confirms** — Use Dialog system
2. **No custom UI components** — Use shadcn only
3. **Skeleton internal** — Tables generate their own skeleton
4. **Tab caching** — Fetch once, refresh on explicit action
5. **Constants everywhere** — No hardcoded strings
6. **Optimistic updates** — Row-level loading indicators

---

## Notes

- Form dialogs use existing `Form` + `FieldRenderer` components
- All server actions in `server/actions/` folder
- TanStack Query for all data fetching
- Jotai atoms for filter/sort state
