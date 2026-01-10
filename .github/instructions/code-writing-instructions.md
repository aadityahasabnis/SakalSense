## Directory Structure Template

For any table-based page (e.g., `/questionnaires`, `/truth-statements`):

```
app/(authenticated)/<feature>/
├── page.tsx                          # Server component - auth & data fetching
├── loading.tsx                       # Loading skeleton
├── _components/
│   ├── PageClient.tsx                # Main client wrapper with tabs
│   ├── <Feature>Table.tsx            # Core table component
│   ├── <Feature>LoadingSkeleton.tsx  # Loading UI
│   ├── <Feature>Legend.tsx           # Help/legend dialog (if needed)
│   ├── <Feature>ExpandedRow.tsx      # Detailed row view
│   ├── Edit<Feature>Dialog.tsx       # Edit dialog (if needed)
│   └── _columns/                     # Column components
│       ├── Column1.tsx
│       ├── Column2.tsx
│       ├── Column3.tsx
│       └── Shared.tsx                # Shared column UI elements
```

---

## File-by-File Responsibilities

### 1. `page.tsx` (Server Component)

**Purpose**: Authentication, server-side data fetching, and passing data to client components.

**Key Patterns**:

```typescript
const page = async () => {
  // 1. Authentication
  const session = await auth();
  if (!session) redirect("/login");

  // 2. Parallel data fetching (users, groups, entities, etc.)
  const [users, groups, entities] = await Promise.all([
    getAllUsers(),
    getAllGroups(),
    getEntities(),
  ]);

  // 3. Extract current user
  const usersList = users.success && users.data ? users.data.users : [];
  const currentUser = usersList.find((u) => u.email === session.user?.email);

  // 4. Pass minimal, flattened props to client
  return (
    <PageClient
      users={usersList}
      groups={groups.success ? groups.data.groups : []}
      currentUser_id={currentUser?._id || ""}
      isAdmin={currentUser?.role === "Admin"}
    />
  );
};
```

**Rules**:

- Keep this file under 30 lines
- Use `Promise.all()` for parallel fetching
- Handle error states gracefully with fallback empty arrays
- Only pass necessary data as props (don't pass entire session)
- Use camelCase for function name, export from bottom

---

### 2. `PageClient.tsx` (Client Wrapper)

**Purpose**: Tab navigation, inline editor toggle, refresh orchestration, and table wrapper.

**Key Patterns**:

```typescript
"use client";

const PageClient = ({ users, groups, currentUser_id, isAdmin }: Props) => {
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  // Import configuration hooks
  const filters = useTableFilters();
  const headerOperations = useTableHeaderOperations(
    legendOpen,
    setLegendOpen,
    () => setAdding((prev) => !prev),
    adding
  );

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-100">
        {TABS.map((tab) => (
          <Link key={tab.key} href={tab.href} prefetch={false}>
            {/* Tab styling */}
          </Link>
        ))}
      </div>

      {/* Inline Editor (if applicable) */}
      {adding && (
        <InlineEditor
          onClose={() => setAdding(false)}
          onSuccess={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      {/* Main Table */}
      <Table
        users={users}
        groups={groups}
        currentUser_id={currentUser_id}
        isAdmin={isAdmin}
        filters={filters}
        headerOperations={headerOperations}
        refreshKey={refreshKey}
      />
    </div>
  );
};
```

**Rules**:

- Keep under 50 lines (excluding imports)
- Handle refresh orchestration at this level
- Pass configuration (filters, operations) from hooks
- Keep styling minimal - mostly layout structure
- Use consistent tab styling pattern

---

### 3. `<Feature>Table.tsx` (Core Table Component)

**Purpose**: Main table logic, data fetching, CRUD operations, state management.

**Key Patterns**:

```typescript
"use client";

export const Table = ({
  users,
  groups,
  currentUser_id,
  isAdmin,
  filters,
  headerOperations,
  refreshKey,
}: Props) => {
  // State
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("default");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Combine refresh keys
  const combinedRefreshKey = (refreshKey ?? 0) + localRefreshKey;
  const triggerRefresh = () => setLocalRefreshKey((k) => k + 1);

  // Configuration hooks
  const dataTabs = useDataTabs(currentUser_id);
  const statsFetcher = useStatsFetcher(currentUser_id);

  // Dialogs
  const { confirmDialog, formDialog } = useDialog();

  // Table query setup
  const [, setTableQuery] = useAtom(tableQueryAtom);
  useEffect(() => {
    setTableQuery({
      search: "",
      filters: {},
      sort: { field: "", direction: "" },
    });
    return () =>
      setTableQuery({
        search: "",
        filters: {},
        sort: { field: "", direction: "" },
      });
  }, [setTableQuery]);

  // Helper functions (memoize if needed)
  const getUserName = (id: string) =>
    users.find((u) => u._id === id)?.name ?? "Unknown";
  const getUserColor = (id: string) =>
    users.find((u) => u._id === id)?.avatarColor ?? "#3B82F6";
  const getEntityName = (type: EntityType, id: string) => {
    return entities.find((e) => e._id === id)?.name ?? "Unknown";
  };

  // Action handlers
  const handleAction = async (
    action: () => Promise<ActionResult>,
    successMsg: string
  ) => {
    try {
      const result = await action();
      if (!result.success) throw new Error(getAPIErrorMessage(result));
      toast.success(successMsg);
      triggerRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleDelete = (item: Item) => {
    confirmDialog({
      title: "Delete Item?",
      variant: "destructive",
      onConfirm: () =>
        handleAction(
          () => deleteItem({ _id: item._id, user_id: currentUser_id }),
          "Deleted successfully"
        ),
    });
  };

  // Handlers object for columns
  const handlers: IHandlers = {
    onEdit: handleEdit,
    onDelete: handleDelete,
    // ... other handlers
  };

  // Columns configuration
  const columns = useTableColumns(
    activeTab,
    currentUser_id,
    isAdmin,
    getUserName,
    getEntityName,
    handlers
  );

  // Tab configuration
  const TAB_CONFIG: Record<TabType, { title: string; empty: string }> = {
    tab1: { title: "Tab 1 Title", empty: "No items yet." },
    tab2: { title: "Tab 2 Title", empty: "All caught up!" },
  };

  const { title, empty } = TAB_CONFIG[activeTab];

  return (
    <>
      <CustomTable<Item>
        dataTabs={dataTabs}
        activeDataTab={activeTab}
        onDataTabChange={setActiveTab}
        statsFetcher={statsFetcher}
        columns={columns}
        filters={filters}
        headerOperations={headerOperations}
        expandedRow={(item) => (
          <ExpandedRow
            item={item}
            currentUser_id={currentUser_id}
            getUserName={getUserName}
            getUserColor={getUserColor}
            onAction={handleInlineAction}
          />
        )}
        noDataState={{ title, description: empty }}
        refreshKey={combinedRefreshKey}
      />

      {/* Edit Dialog */}
      {editDialogOpen && editingItem && (
        <EditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          item={editingItem}
          onSuccess={triggerRefresh}
        />
      )}
    </>
  );
};
```

**Rules**:

- Maximum 300 lines per file
- Combine external and local refresh keys
- Use `handleAction` wrapper for consistent error handling
- Extract all configuration to separate Config file
- Pass helper functions (getUserName, etc.) to columns
- Use handlers object pattern for column callbacks
- Keep dialog state and rendering in this file
- Always use `confirmDialog` for destructive actions

---

### 4. `<Feature>TableConfig.tsx` (Configuration)

**Purpose**: Centralize all table configuration (filters, tabs, columns, operations).

**Key Patterns**:

```typescript
// Types
export type TabType = "tab1" | "tab2" | "tab3";

export interface IHandlers {
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onAction: (item: Item) => void;
}

// Wrapper for server actions
const wrapFetcher =
  (
    action: (params: { user_id: string }) => Promise<ActionResult>,
    user_id: string
  ): TabFetcher<Item> =>
  async () => {
    const result = await action({ user_id });
    return result.success && result.data ? result.data.items : [];
  };

// Stats fetcher
export const useStatsFetcher =
  (currentUser_id: string): StatsFetcher =>
  async () => {
    const result = await getStats({ user_id: currentUser_id });
    return result.success && result.data ? result.data.stats : [];
  };

// Data tabs
export const useDataTabs = (currentUser_id: string): IDataTabConfig<Item>[] =>
  useMemo(
    () => [
      {
        key: "tab1",
        label: "Tab 1",
        fetcher: wrapFetcher(getTab1Data, currentUser_id),
      },
      {
        key: "tab2",
        label: "Tab 2",
        fetcher: wrapFetcher(getTab2Data, currentUser_id),
      },
      {
        key: "tab3",
        label: "Tab 3",
        fetcher: wrapFetcher(getTab3Data, currentUser_id),
      },
    ],
    [currentUser_id]
  );

// Filters
export const useTableFilters = (): IFilterField[] =>
  useMemo(
    () => [
      {
        name: "status",
        type: "select",
        placeholder: "All Status",
        options: STATUS_OPTIONS.map((v) => ({ value: v, label: v })),
      },
      {
        name: "priority",
        type: "select",
        placeholder: "All Priority",
        options: PRIORITY_OPTIONS_MAP_WITH_ICON,
      },
      {
        name: "entity",
        type: "custom",
        render: ({ value, onChange }) => (
          <EntitiesSelectField
            value={value as string}
            onChange={onChange}
            placeholder="All Entities"
            className="h-11"
          />
        ),
      },
    ],
    []
  );

// Header operations
export const useTableHeaderOperations = (
  legendOpen: boolean,
  onLegendChange: (open: boolean) => void,
  onAddClick: () => void,
  isAdding: boolean
): ITableOperation[] =>
  useMemo(
    () => [
      {
        type: "custom",
        render: () => (
          <Legend open={legendOpen} onOpenChange={onLegendChange} />
        ),
      },
      {
        type: "button",
        icon: "add",
        description: isAdding ? "Cancel Adding" : "Add New",
        onClick: onAddClick,
      },
    ],
    [legendOpen, onLegendChange, onAddClick, isAdding]
  );

// Columns
export const useTableColumns = (
  activeTab: TabType,
  currentUser_id: string,
  isAdmin: boolean,
  getUserName: (id: string) => string,
  getEntityName: (type: EntityType, id: string) => string,
  handlers: IHandlers
): ITableColumn<Item>[] =>
  useMemo(
    () => [
      {
        id: "icon",
        label: "",
        width: "50px",
        render: (item) => (
          <StatusIconColumn
            item={item}
            currentUser_id={currentUser_id}
            activeTab={activeTab}
          />
        ),
      },
      {
        id: "content",
        label: "Content",
        sortable: true,
        searchable: true,
        render: (item) => (
          <ContentColumn item={item} getEntityName={getEntityName} />
        ),
      },
      {
        id: "creator",
        label: "Creator",
        width: "120px",
        render: (item) => (
          <CreatorColumn item={item} getUserName={getUserName} />
        ),
      },
      {
        id: "actions",
        label: "",
        width: "100px",
        render: (item) => (
          <ActionsColumn
            item={item}
            currentUser_id={currentUser_id}
            isAdmin={isAdmin}
            onEdit={handlers.onEdit}
            onDelete={handlers.onDelete}
          />
        ),
      },
    ],
    [activeTab, currentUser_id, isAdmin, getUserName, getEntityName, handlers]
  );
```

**Rules**:

- All configuration must use `useMemo` for performance
- Always include dependencies array (e.g., `[currentUser_id]`)
- Extract types to top of file
- Use `wrapFetcher` pattern for consistency
- Keep handlers interface explicit
- Column definitions should be comprehensive (width, sortable, searchable)

---

### 5. `_columns/` Components

**Purpose**: Isolated, reusable column rendering components.

**Structure**:

```typescript
// Simple column (no logic)
export const CreatorColumn = ({ item, getUserName }: Props) => (
  <span className="text-xs text-gray-600 font-medium">
    {getUserName(item.creator_id)}
  </span>
);

// Complex column (with logic)
export const StatusColumn = ({ item, currentUser_id }: Props) => {
  const isOwner = item.creator_id === currentUser_id;
  const status = calculateStatus(item);
  const config = STATUS_CONFIG[status];

  return <Badge {...buildBadgeProps(config, isOwner)} />;
};

// Column with tooltip
export const LastActionColumn = ({ item }: Props) => {
  const date = new Date(item.updatedAt);
  return (
    <Tooltip description={date.toLocaleString()} side="top">
      <span className="text-xs text-gray-500 cursor-help">
        {formatTimeAgo(date)}
      </span>
    </Tooltip>
  );
};
```

**Rules**:

- Each column is a separate file
- Export arrow function from bottom
- Keep columns under 100 lines
- Extract shared UI to `Shared.tsx`
- Use helper functions passed as props
- No direct state management in columns
- Props should be explicit (no destructuring complex objects)

**`Shared.tsx` Pattern**:

```typescript
// Reusable badge component
export const Badge = ({
  icon: Icon,
  label,
  tooltip,
  bg,
  text,
  ring,
}: IBadgeProps) => {
  const element = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm ring-1 cursor-help",
        bg,
        text,
        ring
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label && <span className="truncate">{label}</span>}
    </div>
  );
  return tooltip ? (
    <Tooltip description={tooltip} side="top">
      {element}
    </Tooltip>
  ) : (
    element
  );
};

// Reusable user badge
export const UserBadge = ({
  icon: Icon,
  name,
  isCurrentUser,
  tooltip,
}: IUserBadgeProps) => {
  const element = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg cursor-help shrink-0",
        isCurrentUser
          ? "bg-blue-500 text-white shadow-sm"
          : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {isCurrentUser ? "You" : name}
    </div>
  );
  return tooltip ? (
    <Tooltip description={tooltip} side="top">
      {element}
    </Tooltip>
  ) : (
    element
  );
};
```

---

### 6. `<Feature>ExpandedRow.tsx` (Detailed View)

**Purpose**: Render detailed information when a table row is expanded.

**Key Patterns**:

```typescript
export const ExpandedRow = ({
  item,
  currentUser_id,
  isAdmin,
  getUserName,
  getUserColor,
  onAction,
  canEdit,
}: Props) => {
  const [showInput, setShowInput] = useState(false);

  // Derived state
  const isOwner = item.creator_id === currentUser_id;
  const entries = item.entries ?? [];

  return (
    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
      {/* Header with metadata */}
      <div className="flex items-center justify-between mb-4">
        <UserInfo name={getUserName(item.creator_id)} date={item.createdAt} />
        {canEdit && <EditButton onClick={() => {}} />}
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <EntryCard
            key={entry._id}
            entry={entry}
            getUserName={getUserName}
            getUserColor={getUserColor}
          />
        ))}
      </div>

      {/* Actions */}
      {!item.isClosed && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setShowInput(true)}>Add Response</Button>
        </div>
      )}

      {/* Inline input */}
      {showInput && (
        <InlineInput
          onSubmit={async (text) => {
            await onAction(item._id, text);
            setShowInput(false);
          }}
          onCancel={() => setShowInput(false)}
        />
      )}
    </div>
  );
};
```

**Rules**:

- Keep under 250 lines
- Extract complex sub-components (cards, inputs)
- Use conditional rendering for permissions
- Handle inline actions within expanded row
- Pass all callbacks from parent (don't call server actions directly)
- Show appropriate loading states for inline actions

---

### 7. `loading.tsx` (Loading Skeleton)

**Purpose**: Show loading state while data is being fetched.

**Pattern**:

```typescript
import LoadingSkeleton from "./_components/LoadingSkeleton";

const loading = () => (
  <div className="py-6">
    <LoadingSkeleton activeTab="default" />
  </div>
);

export default loading;
```

**LoadingSkeleton Component**:

```typescript
const LoadingSkeleton = ({ activeTab }: { activeTab: string }) => {
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-100">
        {TABS.map((tab) => (
          <Link key={tab.key} href={tab.href} prefetch={false}>
            {/* Tab styling with active state */}
          </Link>
        ))}
      </div>

      {/* Table Content */}
      <div className="p-6">
        {/* Header with stats tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-32" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Table rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Rules**:

- Match exact layout of actual page
- Keep tabs interactive (not skeleton) - they should work during loading
- Use appropriate skeleton sizes and shapes
- Show 5 rows by default
- Match spacing and padding exactly

---

## Common Patterns & Best Practices

### Refresh Pattern

**Two-level refresh system**:

```typescript
// In PageClient (external refresh)
const [refreshKey, setRefreshKey] = useState(0);
const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

// In Table (local refresh)
const [localRefreshKey, setLocalRefreshKey] = useState(0);
const triggerRefresh = () => setLocalRefreshKey((k) => k + 1);

// Combined
const combinedRefreshKey = (refreshKey ?? 0) + localRefreshKey;

// Pass to CustomTable
<CustomTable refreshKey={combinedRefreshKey} />;
```

**Use cases**:

- External refresh: After inline editor success
- Local refresh: After CRUD operations within table

---

### Helper Functions Pattern

**Memoization considerations**:

```typescript
// Simple lookups - no need to memoize (fast enough)
const getUserName = (id: string) =>
  users.find((u) => u._id === id)?.name ?? "Unknown";
const getUserColor = (id: string) =>
  users.find((u) => u._id === id)?.avatarColor ?? "#3B82F6";

// Complex calculations - consider useMemo
const getEntityName = useMemo(
  () => (type: EntityType, id: string) => {
    // Complex logic here
  },
  [entities]
);

// If used in column definitions with useMemo, no need to memoize individually
// The column definition useMemo will handle it
```

**Passing to columns**:

```typescript
// Always pass as explicit props, not in object
const columns = useTableColumns(
  activeTab,
  currentUser_id,
  isAdmin,
  getUserName, // ✅ Correct
  getEntityName // ✅ Correct
);

// NOT like this:
const helpers = { getUserName, getEntityName };
const columns = useTableColumns(activeTab, currentUser_id, isAdmin, helpers); // ❌ Wrong
```

---

### Dialog Patterns

**Confirm Dialog**:

```typescript
confirmDialog({
  title: "Delete Question?",
  description: "This action cannot be undone.",
  variant: "destructive",
  onConfirm: () =>
    handleAction(
      () => deleteItem({ _id: item._id, user_id: currentUser_id }),
      "Deleted successfully"
    ),
});
```

**Form Dialog** (for simple edits):

```typescript
formDialog({
  title: "Edit Priority",
  fields: [
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: PRIORITY_OPTIONS,
    },
  ],
  initialValues: { priority: item.priority },
  onSubmit: async (data) => {
    await handleAction(
      () => updateItem({ _id: item._id, updates: data }),
      "Updated successfully"
    );
  },
});
```

**Custom Dialog** (for complex edits):

```typescript
// Use separate dialog component (EditDialog.tsx)
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

const handleEdit = (item: Item) => {
  setEditingItem(item);
  setEditDialogOpen(true);
};

// In JSX
{
  editDialogOpen && editingItem && (
    <EditDialog
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      item={editingItem}
      onSuccess={triggerRefresh}
    />
  );
}
```

---

### Action Handler Pattern

**Centralized error handling**:

```typescript
const handleAction = async (
  action: () => Promise<{ success: boolean; message?: string; error?: string }>,
  successMsg: string
) => {
  try {
    const result = await action();
    if (!result.success) {
      throw new Error(getAPIErrorMessage(result) || "Operation failed");
    }
    toast.success(successMsg);
    triggerRefresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Operation failed");
  }
};

// Usage
handleAction(
  () => deleteItem({ _id: item._id, user_id: currentUser_id }),
  "Item deleted successfully"
);
```

**With loading state** (for specific actions):

```typescript
const handleSpecialAction = async (item: Item) => {
  setLoading(true);
  try {
    const result = await specialAction({ _id: item._id });
    if (!result.success) throw new Error(getAPIErrorMessage(result));
    toast.success("Success!");
    triggerRefresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed");
  } finally {
    setLoading(false);
  }
};
```

---

### Type Safety

**Column render function types**:

```typescript
export const useTableColumns = (): // ... params
ITableColumn<Item>[] => // ⬅️ Explicit return type
  useMemo(
    () => [
      {
        id: "content",
        render: (
          item // ⬅️ 'item' is typed as Item
        ) => <ContentColumn item={item} />,
      },
    ],
    [dependencies]
  );
```

**Handler interface**:

```typescript
export interface IHandlers {
    onEdit: (item: Item) => void;
    onDelete: (item: Item) => void;
    onResolve: (item: Item) => void;
    onDiscontinue: (item: Item) => void;
}

// Usage in columns
const columns = useTableColumns(
    // ... other params
    handlers: IHandlers // ⬅️ Type ensures all required handlers exist
);
```

**TabType union**:

```typescript
export type TabType = "my-items" | "to-review" | "observing" | "all";

// Used in component state
const [activeTab, setActiveTab] = useState<TabType>("my-items");

// Used in config
const TAB_CONFIG: Record<TabType, { title: string; empty: string }> = {
  "my-items": { title: "My Items", empty: "No items" },
  // ... all tabs must be defined
};
```

---

### Entity Fetching Pattern

**Fetch entities on mount** (for dropdowns/lookups):

```typescript
const [clients, setClients] = useState<ClientSchema[]>([]);
const [products, setProducts] = useState<ProductSchema[]>([]);

useEffect(() => {
  const fetchEntities = async () => {
    const [clientsRes, productsRes] = await Promise.all([
      getAllClients(),
      getAllProducts(),
    ]);
    if (clientsRes.success && clientsRes.data) {
      setClients(clientsRes.data.clients);
    }
    if (productsRes.success && productsRes.data) {
      setProducts(productsRes.data.products);
    }
  };
  fetchEntities();
}, []);

// Helper function
const getEntityName = (type: EntityType, id: string) => {
  const entities = type === "Client" ? clients : products;
  return entities.find((e) => e._id === id)?.name ?? "Unknown";
};
```

**Why not fetch in page.tsx?**

- Only needed for table, not other parts of page
- Avoids passing large entity arrays as props
- Fetched client-side when table mounts

---

### Performance Considerations

**UseMemo for expensive computations**:

```typescript
// ✅ Configuration with dependencies
const dataTabs = useDataTabs(currentUser_id);
const statsFetcher = useStatsFetcher(currentUser_id);
const columns = useTableColumns(
  activeTab,
  currentUser_id,
  isAdmin,
  getUserName,
  getEntityName,
  handlers
);

// ✅ Derived state from props (no memo needed)
const isOwner = item.creator_id === currentUser_id;

// ❌ Don't memoize simple lookups
const getUserName = useMemo(
  () => (id: string) => users.find((u) => u._id === id)?.name,
  [users]
); // Overkill - array.find is fast enough
```

**UseCallback for event handlers**:

```typescript
// ✅ For props passed to children that might re-render frequently
const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

// ❌ Don't use for simple event handlers in same component
const handleClick = useCallback(() => {
  setOpen(true);
}, []); // Unnecessary - not passed to child
```

---

## Checklist for New Table-Based Pages

When creating a new table-based page (e.g., `/truth-statements`, `/tasks`), use this checklist:

### Structure

- [ ] Created `page.tsx` with auth + data fetching (under 30 lines)
- [ ] Created `loading.tsx` with skeleton component
- [ ] Created `PageClient.tsx` with tabs + inline editor + refresh
- [ ] Created `<Feature>Table.tsx` (under 300 lines)
- [ ] Created `<Feature>TableConfig.tsx` with all configuration
- [ ] Created `<Feature>ExpandedRow.tsx` for detailed view
- [ ] Created `_columns/` folder with individual column components
- [ ] Created `_columns/Shared.tsx` for reusable UI elements
- [ ] Created `<Feature>LoadingSkeleton.tsx` matching exact layout

### Configuration (in TableConfig.tsx)

- [ ] Defined `TabType` union type
- [ ] Defined `IHandlers` interface
- [ ] Created `useStatsFetcher` hook
- [ ] Created `useDataTabs` hook (with wrapFetcher pattern)
- [ ] Created `useTableFilters` hook
- [ ] Created `useTableHeaderOperations` hook
- [ ] Created `useTableColumns` hook
- [ ] All hooks use `useMemo` with proper dependencies

### Table Component

- [ ] Implemented two-level refresh pattern (external + local)
- [ ] Added `useDialog` for confirm/form dialogs
- [ ] Created helper functions (getUserName, getEntityName, etc.)
- [ ] Implemented `handleAction` wrapper for error handling
- [ ] Created specific action handlers (edit, delete, etc.)
- [ ] Assembled `handlers` object for columns
- [ ] Defined `TAB_CONFIG` for titles and empty states
- [ ] Passed all props to `CustomTable`
- [ ] Added custom dialog components if needed

### Columns

- [ ] Each column is a separate file (under 100 lines)
- [ ] Columns export arrow function from bottom
- [ ] Shared UI components extracted to `Shared.tsx`
- [ ] Columns receive helper functions as props
- [ ] No direct state management in columns
- [ ] Props are explicitly typed (no complex destructuring)
- [ ] Tooltips added where needed
- [ ] Responsive styling applied

### Expanded Row

- [ ] Shows comprehensive item details
- [ ] Handles inline actions (add, edit)
- [ ] Shows appropriate UI for permissions
- [ ] Uses passed callbacks (doesn't call server actions directly)
- [ ] Extracts complex sub-components
- [ ] Shows loading states for inline actions

### Type Safety

- [ ] All interfaces/types defined at top of files
- [ ] Server action request/response interfaces
- [ ] Column render functions explicitly typed
- [ ] Handler interfaces complete
- [ ] TabType used consistently
- [ ] No `any` types anywhere

### Performance

- [ ] Configuration hooks use `useMemo`
- [ ] Callbacks use `useCallback` only when needed
- [ ] No unnecessary memoization of simple functions
- [ ] Entity fetching optimized (client-side if needed)

### UX

- [ ] Loading skeleton matches exact layout
- [ ] Tabs work during loading
- [ ] Error messages are user-friendly
- [ ] Success toasts confirm actions
- [ ] Destructive actions require confirmation
- [ ] Empty states are informative
- [ ] Inline editors close on success
- [ ] Refresh happens after mutations

### Code Quality

- [ ] Files under 300 lines
- [ ] Arrow functions everywhere
- [ ] Exports from bottom (JSX components)
- [ ] No barrel exports
- [ ] No `@ts-ignore` or `eslint-disable`
- [ ] Consistent styling patterns
- [ ] Proper error handling
- [ ] All deps included in useEffect/useMemo/useCallback

---

## Common Pitfalls to Avoid

### ❌ Don't: Pass entire objects to columns

```typescript
// Bad
<Column item={item} users={users} groups={groups} />

// Good
<Column item={item} getUserName={getUserName} />
```

### ❌ Don't: Call server actions directly in columns

```typescript
// Bad
const Column = ({ item }) => {
  const handleClick = async () => {
    await deleteItem({ _id: item._id });
  };
  return <button onClick={handleClick}>Delete</button>;
};

// Good
const Column = ({ item, onDelete }) => {
  return <button onClick={() => onDelete(item)}>Delete</button>;
};
```

### ❌ Don't: Forget to handle loading/error states

```typescript
// Bad
const result = await action();
toast.success("Done!");

// Good
try {
  const result = await action();
  if (!result.success) throw new Error(getAPIErrorMessage(result));
  toast.success("Done!");
  triggerRefresh();
} catch (err) {
  toast.error(err instanceof Error ? err.message : "Failed");
}
```

### ❌ Don't: Memoize everything

```typescript
// Bad (over-optimization)
const getUserName = useMemo(
  () => (id: string) => users.find((u) => u._id === id)?.name ?? "Unknown",
  [users]
);

// Good (simple lookup is fast enough)
const getUserName = (id: string) =>
  users.find((u) => u._id === id)?.name ?? "Unknown";
```

### ❌ Don't: Define configuration inline

```typescript
// Bad
<CustomTable
    dataTabs={[
        { key: "tab1", label: "Tab 1", fetcher: async () => { ... } },
        { key: "tab2", label: "Tab 2", fetcher: async () => { ... } },
    ]}
    columns={[
        { id: "col1", label: "Column 1", render: (item) => <div>{item.name}</div> },
    ]}
/>

// Good
const dataTabs = useDataTabs(currentUser_id);
const columns = useTableColumns(activeTab, currentUser_id, isAdmin, getUserName, handlers);

<CustomTable dataTabs={dataTabs} columns={columns} />
```

### ❌ Don't: Forget combined refresh key

```typescript
// Bad
<CustomTable refreshKey={localRefreshKey} />;

// Good
const combinedRefreshKey = (refreshKey ?? 0) + localRefreshKey;
<CustomTable refreshKey={combinedRefreshKey} />;
```

---

## Summary

Following these patterns ensures:

1. **Consistency**: All table-based pages look and behave the same way
2. **Maintainability**: Clear separation of concerns, easy to locate code
3. **Performance**: Optimized rendering with proper memoization
4. **Type Safety**: No runtime errors from type mismatches
5. **Scalability**: Easy to add new features without refactoring
6. **Developer Experience**: Clear patterns to follow, less decision-making

When in doubt, reference the `/questionnaires` implementation as the gold standard for table-based pages in BytesHub.
