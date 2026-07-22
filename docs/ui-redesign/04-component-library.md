# Enterprise UI/UX Design Blueprint
## PHASE U0: Component Library Specification

**Document Version:** 1.0  
**Date:** 2026-07-22  
**Status:** DEFINITION ONLY - NOT IMPLEMENTED

---

## 1. Overview

This document defines the standard component library for the Saven InfraOps Enterprise application. Each component specification includes purpose, variants, usage guidelines, and anti-patterns.

**Important:** This document is for specification only. Implementation should follow the migration plan in `08-migration-plan.md`.

---

## 2. Page Header Component

### Purpose
Provides consistent page-level headers with breadcrumbs, title, and actions.

### Variants

| Variant | Use Case |
|---------|----------|
| Default | Standard list pages |
| With Back Button | Detail pages |
| With Tabs | Pages with tabbed navigation |
| Minimal | Settings, simple pages |

### Specification

```tsx
interface PageHeaderProps {
  // Title Content
  title: string;
  subtitle?: string;
  
  // Navigation
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  
  // Actions
  actions?: React.ReactNode;  // Buttons, dropdowns
  
  // Variants
  variant?: 'default' | 'minimal' | 'tabs';
  
  // Optional elements
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  
  // Styling
  background?: 'gradient' | 'solid' | 'transparent';
  className?: string;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb] > [Breadcrumb]                    [Actions...] │
│                                                             │
│  [Icon]  Title                              [Btn] [Btn]    │
│          Subtitle (optional)                                │
│                                                             │
│  [Tab 1] [Tab 2] [Tab 3]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Usage

```tsx
// List Page
<PageHeader
  title="Service Requests"
  subtitle="42 open tickets"
  breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Service Requests' }]}
  actions={<Button variant="primary" icon={Plus}>New Request</Button>}
/>

// Detail Page
<PageHeader
  title="SR-2024-001"
  subtitle="Network connectivity issue"
  breadcrumbs={[
    { label: 'Service Requests', href: '/service-requests' },
    { label: 'SR-2024-001' }
  ]}
  actions={
    <>
      <Button variant="secondary" icon={Edit}>Edit</Button>
      <Button variant="danger" icon={Trash}>Delete</Button>
    </>
  }
/>
```

### Anti-patterns
- ❌ Do not add decorative icons unrelated to content
- ❌ Do not place forms in the header
- ❌ Do not use multiple lines of actions (max 2 buttons)
- ❌ Do not use gradients on non-hero pages

---

## 3. Breadcrumb Component

### Purpose
Shows user's location in the navigation hierarchy and enables quick navigation.

### Variants

| Variant | Use Case |
|---------|----------|
| Standard | Most pages |
| With Icons | Dashboard sections |
| Truncated | Deep hierarchies |

### Specification

```tsx
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    icon?: LucideIcon;
    onClick?: () => void;
  }>;
  separator?: '/' | '>' | '→' | React.ReactNode;
  maxItems?: number;  // For truncation
  className?: string;
}
```

### Visual Design

```
Home / Service Requests / SR-2024-001
         ↑           ↑
      clickable   current (not clickable)
```

### Usage

```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Service Requests', href: '/service-requests' },
    { label: 'SR-2024-001' }
  ]}
/>
```

### Anti-patterns
- ❌ Do not use for single-level pages
- ❌ Do not make current page clickable
- ❌ Do not use too many levels (max 4-5)

---

## 4. Toolbar Component

### Purpose
Provides consistent action bar for search, filters, and bulk actions.

### Specification

```tsx
interface ToolbarProps {
  // Search
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
  };
  
  // Filters
  filters?: React.ReactNode;  // Filter dropdowns, chips
  
  // Bulk Actions
  bulkActions?: React.ReactNode;  // Shown when items selected
  
  // Actions
  actions?: React.ReactNode;  // Right-aligned buttons
  
  // Layout
  layout?: 'horizontal' | 'vertical';
  sticky?: boolean;
  
  className?: string;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search...        ] [Filter ▼] [Filter ▼]    [+ New] [⋮] │
├─────────────────────────────────────────────────────────────┤
│ ✓ 3 selected  [Delete] [Assign] [Export]                   │
└─────────────────────────────────────────────────────────────┘
```

### Usage

```tsx
<Toolbar
  search={{
    placeholder: 'Search tickets...',
    value: searchQuery,
    onChange: setSearchQuery
  }}
  filters={
    <>
      <FilterDropdown options={statusOptions} value={status} onChange={setStatus} />
      <FilterDropdown options={priorityOptions} value={priority} onChange={setPriority} />
    </>
  }
  actions={
    <Button variant="primary" icon={Plus}>New</Button>
  }
/>
```

---

## 5. Summary Cards Component

### Purpose
Displays key metrics and statistics at a glance.

### Variants

| Variant | Use Case |
|---------|----------|
| Stat | Single value with label |
| Trend | Value with change indicator |
| Sparkline | Value with mini chart |

### Specification

```tsx
interface SummaryCardProps {
  // Content
  title: string;
  value: number | string;
  subtitle?: string;
  
  // Trend (optional)
  trend?: {
    value: number;  // Percentage
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  
  // Icon
  icon?: LucideIcon;
  iconColor?: string;
  
  // Styling
  variant?: 'default' | 'compact' | 'bordered';
  className?: string;
}

interface SummaryCardsProps {
  cards: SummaryCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}
```

### Visual Design

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  📊          │ │  🔴          │ │  🟡          │ │  ✅          │
│  1,234       │ │  89          │ │  42          │ │  892         │
│  Total       │ │  Critical    │ │  High        │ │  Resolved    │
│  ↑ 12%       │ │  ↓ 3%        │ │  ↑ 8%        │ │  ↑ 15%       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Usage

```tsx
<SummaryCards
  columns={4}
  cards={[
    { title: 'Total', value: stats.total, icon: FileText, trend: { value: 12, direction: 'up' } },
    { title: 'Open', value: stats.open, icon: Circle, iconColor: 'blue' },
    { title: 'Critical', value: stats.critical, icon: AlertTriangle, iconColor: 'red' },
    { title: 'Resolved', value: stats.resolved, icon: CheckCircle, iconColor: 'green' }
  ]}
/>
```

### Anti-patterns
- ❌ Do not use more than 6 cards in a row
- ❌ Do not use icons that don't represent the data
- ❌ Do not show trends for non-comparable metrics

---

## 6. Data Table Component

### Purpose
Displays structured data with sorting, selection, and actions.

### Specification

```tsx
interface DataTableProps<T> {
  // Data
  columns: ColumnDef<T>[];
  data: T[];
  
  // Features
  selectable?: boolean;
  sortable?: boolean;
  pagination?: PaginationConfig;
  
  // States
  loading?: boolean;
  empty?: EmptyStateConfig;
  
  // Handlers
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  
  // Styling
  variant?: 'default' | 'compact' | 'bordered';
  className?: string;
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}
```

### Visual Design

```
┌────┬─────────────┬────────────┬─────────┬────────┬────────┐
│ ☑  │ Ticket      │ Status     │ Priority│ Assign │ Age    │ Actions
├────┼─────────────┼────────────┼─────────┼────────┼────────┤
│ ☑  │ SR-001     │ 🟢 Open    │ 🔴 High │ John   │ 2d     │ ⋮
│ ☑  │ SR-002     │ 🔵 New     │ 🟡 Med  │ Sarah  │ 1d     │ ⋮
│    │ SR-003     │ 🟠 Pending  │ ⚪ Low  │ Mike   │ 5d     │ ⋮
└────┴─────────────┴────────────┴─────────┴────────┴────────┘

Showing 1-10 of 42     [<] [1] [2] [3] [4] [5] [>]
```

### Usage

```tsx
<DataTable
  columns={[
    { id: 'ticket', header: 'Ticket', accessor: 'ticketNo', sortable: true },
    { id: 'status', header: 'Status', accessor: 'status', render: (s) => <StatusBadge status={s} /> },
    { id: 'priority', header: 'Priority', accessor: 'priority', render: (p) => <PriorityBadge priority={p} /> },
    { id: 'actions', header: '', accessor: (row) => <RowActions row={row} /> }
  ]}
  data={tickets}
  selectable
  pagination={{ page, pageSize, total, onPageChange }}
  onRowClick={(row) => navigate(`/tickets/${row.id}`)}
/>
```

### Anti-patterns
- ❌ Do not use for non-tabular data
- ❌ Do not allow unlimited columns
- ❌ Do not hide critical columns by default

---

## 7. Status Badge Component

### Purpose
Displays status information with consistent color coding.

### Variants

| Variant | Use Case |
|---------|----------|
| Default | Standard status display |
| Light | On dark backgrounds |
| Outline | Subtle emphasis |
| Dot | Compact inline display |

### Specification

```tsx
interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'outline' | 'dot';
  showIcon?: boolean;
  className?: string;
}
```

### Status Color Mapping

| Status | Background | Text | Border |
|--------|------------|------|--------|
| New/Open | blue-50 | blue-700 | blue-200 |
| Assigned | purple-50 | purple-700 | purple-200 |
| In Progress | amber-50 | amber-700 | amber-200 |
| Waiting | orange-50 | orange-700 | orange-200 |
| Resolved | green-50 | green-700 | green-200 |
| Closed | slate-100 | slate-600 | slate-200 |
| Cancelled | red-50 | red-700 | red-200 |

### Visual Design

```
[ ● New ]  [ 🟢 Resolved ]  [ ○ Assigned ]  [ 🔴 Cancelled ]
   sm         md               lg           outline
```

### Usage

```tsx
// Default
<StatusBadge status="OPEN" />

// Light variant for dark backgrounds
<StatusBadge status="RESOLVED" variant="light" />

// With dot indicator
<StatusBadge status="IN_PROGRESS" variant="dot" />
```

### Anti-patterns
- ❌ Do not invent new colors for existing statuses
- ❌ Do not use decorative icons
- ❌ Do not change colors based on user preference

---

## 8. Priority Badge Component

### Purpose
Displays priority levels with consistent visual hierarchy.

### Specification

```tsx
interface PriorityBadgeProps {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'icon';
  showLabel?: boolean;
  className?: string;
}
```

### Priority Visual Design

| Priority | Icon | Background | Text |
|----------|------|------------|------|
| Critical | ⬆️ | red-50 | red-700 |
| High | ↑ | orange-50 | orange-700 |
| Medium | → | amber-50 | amber-700 |
| Low | ↓ | slate-100 | slate-600 |

### Usage

```tsx
<PriorityBadge priority="HIGH" />
<PriorityBadge priority="CRITICAL" showLabel />
<PriorityBadge priority="LOW" variant="icon" size="sm" />
```

---

## 9. Button Components

### Purpose
Triggers actions with clear visual hierarchy.

### Variants

| Variant | Purpose | Appearance |
|---------|---------|------------|
| Primary | Main CTA | Solid primary color |
| Secondary | Alternative action | Outlined |
| Ghost | Tertiary action | Text only |
| Danger | Destructive action | Red solid |
| Link | Navigation | Underlined text |

### Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 32px | 12px | 12px |
| md | 40px | 16px | 14px |
| lg | 48px | 24px | 16px |

### Specification

```tsx
interface ButtonProps {
  // Content
  children: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  
  // Variant
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  
  // States
  disabled?: boolean;
  loading?: boolean;
  
  // Attributes
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  
  // Full width
  fullWidth?: boolean;
  
  className?: string;
}
```

### Visual Design

```
[ Primary Button ]    [ ⭐ Secondary ]    [ Ghost ]    [ ⚠️ Danger ]
     40px                   40px            40px          40px
```

### Usage

```tsx
<Button variant="primary" icon={Plus}>Create Request</Button>
<Button variant="secondary" icon={Download}>Export</Button>
<Button variant="ghost" icon={Settings}>Settings</Button>
<Button variant="danger" icon={Trash} loading={deleting}>Delete</Button>
```

### Anti-patterns
- ❌ Do not use more than one primary button per section
- ❌ Do not disable buttons without explanation
- ❌ Do not use primary button for dangerous actions

---

## 10. Search Input Component

### Purpose
Provides consistent search experience across the application.

### Specification

```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  debounceMs?: number;
  clearable?: boolean;
  className?: string;
}
```

### Visual Design

```
┌────────────────────────────────────────────────┐
│ 🔍  Search tickets...                     ✕  │
└────────────────────────────────────────────────┘
```

### Usage

```tsx
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search by ticket number, title, or assignee..."
  debounceMs={300}
  clearable
/>
```

---

## 11. Filter Components

### 11.1 Filter Dropdown

```tsx
interface FilterDropdownProps {
  label?: string;
  options: Array<{ value: string; label: string; count?: number }>;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
}
```

### 11.2 Filter Chip

```tsx
interface FilterChipProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  removable?: boolean;
}
```

### 11.3 Filter Bar

```tsx
interface FilterBarProps {
  filters: FilterChipProps[];
  onClearAll?: () => void;
  className?: string;
}
```

### Visual Design

```
[Status ▼]  [Priority ▼]  [Date Range ▼]    [Category ▼]

[ 🏷️ Network ✕]  [ 🏷️ High ✕]  [ 🏷️ Last 7 days ✕]    Clear all
```

### Usage

```tsx
<FilterDropdown
  label="Status"
  options={statusOptions}
  value={selectedStatus}
  onChange={setSelectedStatus}
/>

<FilterBar
  filters={[
    { label: 'Network', onRemove: () => {} },
    { label: 'High', onRemove: () => {} }
  ]}
  onClearAll={clearFilters}
/>
```

---

## 12. Date Picker Component

### Purpose
Enables date and range selection with calendar UI.

### Specification

```tsx
interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  placeholder?: string;
  presets?: Array<{
    label: string;
    getRange: () => [Date, Date];
  }>;
}
```

### Usage

```tsx
<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Select date"
/>

<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onChange={(start, end) => { setStartDate(start); setEndDate(end); }}
  presets={[
    { label: 'Today', getRange: () => [today, today] },
    { label: 'Last 7 days', getRange: () => [weekAgo, today] },
    { label: 'Last 30 days', getRange: () => [monthAgo, today] }
  ]}
/>
```

---

## 13. Modal Component

### Purpose
Displays content requiring user attention or interaction.

### Variants

| Variant | Use Case | Size |
|---------|----------|------|
| Dialog | Simple confirmations | sm-md |
| Modal | Forms, detailed content | md-xl |
| Drawer | Side panels, lists | md-xl |
| Fullscreen | Complex workflows | full |

### Specification

```tsx
interface ModalProps {
  // State
  isOpen: boolean;
  onClose: () => void;
  
  // Content
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  
  // Variants
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'default' | 'danger';
  
  // Features
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  
  className?: string;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│                                             [ ✕ ]       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Icon]  Title                                   │    │
│  │          Subtitle                                 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │                                                  │    │
│  │  Content area                                    │    │
│  │                                                  │    │
│  ├─────────────────────────────────────────────────┤    │
│  │              [Cancel]  [Confirm]                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Usage

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Delete Request"
  subtitle="This action cannot be undone"
  size="sm"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this request?</p>
</Modal>
```

### Anti-patterns
- ❌ Do not nest modals
- ❌ Do not use for simple confirmations (use inline)
- ❌ Do not add too much content (use drawers or pages)

---

## 14. Drawer Component

### Purpose
Displays supplementary content from the side.

### Specification

```tsx
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  className?: string;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────┐
│ Content                              │  Drawer  │
│                                       │  ─────  │
│                                       │  Title  │
│                                       │          │
│                                       │  Body    │
│                                       │          │
│                                       │  ─────  │
│                                       │ Actions │
└─────────────────────────────────────────────────┘
```

### Usage

```tsx
<Drawer
  isOpen={isOpen}
  onClose={onClose}
  title="Ticket Details"
  position="right"
  size="md"
  footer={<Button onClick={closeDrawer}>Close</Button>}
>
  <TicketDetails ticket={ticket} />
</Drawer>
```

---

## 15. Tabs Component

### Purpose
Organizes related content into switchable views.

### Specification

```tsx
interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  activeTab: string;
  onChange: (tabId: string) => void;
  
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  
  className?: string;
}
```

### Visual Design

```
Default:                    Pills:                    Underline:

[ Details ] [ Attachments ]  ( All ) ( Open ) ( Closed )  ──────────
[ History ] [ Comments ]                                  Details
                                                          Attachments
```

### Usage

```tsx
<Tabs
  tabs={[
    { id: 'details', label: 'Details' },
    { id: 'attachments', label: 'Attachments', count: 3 },
    { id: 'history', label: 'History' },
    { id: 'comments', label: 'Comments', count: 12 }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

---

## 16. Timeline Component

### Purpose
Displays chronological activity and history.

### Specification

```tsx
interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: LucideIcon;
  iconColor?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  actions?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: 'default' | 'compact' | 'grouped';
  className?: string;
}
```

### Visual Design

```
●─── 10:30 AM - John updated status to "In Progress"
│        Status changed from New to Assigned
│
●─── 09:15 AM - Sarah assigned to John Doe
│
●─── 09:00 AM - Request created by Jane
```

### Usage

```tsx
<Timeline
  items={[
    {
      id: '1',
      title: 'Status updated to Resolved',
      description: 'Issue has been fixed',
      timestamp: new Date(),
      user: { name: 'John Doe' },
      icon: CheckCircle,
      iconColor: 'green'
    }
  ]}
/>
```

---

## 17. File Upload Component

### Purpose
Enables file attachment with drag-and-drop support.

### Specification

```tsx
interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;  // bytes
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface FileUploadListProps {
  files: UploadedFile[];
  onRemove?: (fileId: string) => void;
  onPreview?: (file: UploadedFile) => void;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              📁 Drag files here or click to browse        │
│                                                          │
│              PNG, JPG, PDF up to 25MB                   │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📄 document.pdf              2.4 MB     [👁] [🗑️]      │
│ 🖼️ screenshot.png            1.1 MB     [👁] [🗑️]      │
│ 📊 spreadsheet.xlsx          456 KB     [👁] [🗑️]      │
└─────────────────────────────────────────────────────────┘
```

---

## 18. Comment Box Component

### Purpose
Enables threaded discussions on records.

### Specification

```tsx
interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
  attachments?: UploadedFile[];
}

interface CommentBoxProps {
  comments: Comment[];
  onSubmit: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ 💬 3 Comments                                          │
├─────────────────────────────────────────────────────────┤
│ ┌───┐ John Doe                      2 hours ago    ⋮   │
│ │ 👤 │                                                    │
│ └───┘ This issue needs attention from the network team │
│        📎 document.pdf                                   │
├─────────────────────────────────────────────────────────┤
│ ┌───┐ Sarah                    Just now            ⋮   │
│ │ 👤 │                                                    │
│ └───┘ I'm looking into this now.                       │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ [Send]   │
│ │ Add a comment...                         │           │
│ └───────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 19. Activity Feed Component

### Purpose
Shows recent user and system activities.

### Specification

```tsx
interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'commented' | 'assigned';
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: {
    name: string;
    avatar?: string;
  };
  link?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
}
```

### Usage

```tsx
<ActivityFeed
  activities={activities}
  limit={10}
  showLoadMore
  onLoadMore={loadMore}
/>
```

---

## 20. Empty State Component

### Purpose
Provides helpful guidance when no data exists.

### Specification

```tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}
```

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                        📋                                │
│                                                          │
│                   No items found                         │
│                                                          │
│       Try adjusting your search or filter to             │
│       find what you're looking for.                     │
│                                                          │
│              [+ Create New Request]                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Usage

```tsx
<EmptyState
  icon={FileQuestion}
  title="No service requests"
  description="Create your first service request to get started."
  action={{
    label: 'Create Request',
    onClick: () => navigate('/service-requests/new'),
    icon: Plus
  }}
/>
```

---

## 21. Loading States

### 21.1 Skeleton Component

```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}
```

### 21.2 Spinner Component

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'muted';
}
```

### 21.3 Progress Bar

```tsx
interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
```

### Visual Design

```
Skeleton:                          Spinner:                Progress:
██████████                         ○○○                    ████████░░ 80%
████████████                                              
█████████                                                  
```

---

## 22. Toast Notification Component

### Purpose
Provides non-blocking feedback messages.

### Variants

| Variant | Use Case |
|---------|----------|
| Success | Completed actions |
| Error | Failed operations |
| Warning | Caution needed |
| Info | General information |

### Specification

```tsx
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;  // ms, 0 for persistent
  onDismiss?: () => void;
}

interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}
```

### Visual Design

```
┌─────────────────────────────────────┐
│ ✓  Success                         │
│    Request created successfully     │
│                          [Undo] [✕]│
└─────────────────────────────────────┘
```

---

## 23. Component Composition Patterns

### Page Layout Composition

```tsx
<PageLayout>
  <PageHeader
    title="Service Requests"
    breadcrumbs={breadcrumbs}
    actions={<CreateButton />}
  />
  <Toolbar
    search={<SearchInput />}
    filters={<FilterDropdowns />}
  />
  <SummaryCards cards={stats} />
  <DataTable
    columns={columns}
    data={data}
    pagination={pagination}
  />
  <Pagination {...pagination} />
</PageLayout>
```

### Detail Page Composition

```tsx
<DetailPage>
  <PageHeader
    title={ticket.title}
    breadcrumbs={breadcrumbs}
    actions={<EditButton />}
  />
  <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
  <TwoColumnLayout>
    <MainContent>
      {activeTab === 'details' && <TicketDetails />}
      {activeTab === 'attachments' && <Attachments />}
    </MainContent>
    <Sidebar>
      <StatusCard />
      <AssigneeCard />
      <DatesCard />
    </Sidebar>
  </TwoColumnLayout>
</DetailPage>
```

---

## 24. Component File Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Badge/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── Tabs/
│   │   ├── DataTable/
│   │   └── ...
│   │
│   ├── layout/               # Layout components
│   │   ├── PageHeader/
│   │   ├── Toolbar/
│   │   ├── Sidebar/
│   │   └── ...
│   │
│   └── features/             # Feature-specific
│       ├── StatusBadge/
│       ├── PriorityBadge/
│       └── ...
│
├── hooks/                    # Component hooks
│   ├── useToast.ts
│   ├── useModal.ts
│   └── ...
│
└── types/                    # Component types
    └── components.ts
```

---

**End of Component Library Document**
