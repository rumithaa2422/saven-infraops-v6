# Enterprise Design System V2 - Component Library

This document describes all components available in the Enterprise Design System V2 for Saven InfraOps v6.

## Overview

The Enterprise Design System V2 is a complete, reusable component library built parallel to the existing application. It provides:

- **Consistent UI** across all applications
- **Accessible components** with keyboard navigation
- **Responsive design** for all screen sizes
- **TypeScript support** for type safety
- **CSS Modules** for encapsulated styling

## Directory Structure

```
frontend/src/design-system/
├── tokens/           # Design tokens (colors, spacing, typography, etc.)
├── foundation/       # ThemeProvider, DesignTokens
├── components/       # Core UI components
├── layout/          # Page layout components
├── data-display/   # Data visualization components
├── forms/          # Form elements
├── feedback/       # Toast, Dialog
├── navigation/     # Tabs, Pagination
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── index.ts       # Main export
```

## Usage

### Basic Usage

```tsx
import { Button, Card, Input } from '@/design-system';
import { ThemeProvider } from '@/design-system/foundation/ThemeProvider';

// Wrap your app with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <Card>
        <Card.Header title="Welcome" />
        <Card.Body>
          <Input label="Email" type="email" />
        </Card.Body>
        <Card.Footer>
          <Button variant="primary">Submit</Button>
        </Card.Footer>
      </Card>
    </ThemeProvider>
  );
}
```

---

## Design Tokens

### Colors (`tokens/colors.ts`)

CSS custom properties for the color palette.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-500` | Primary brand color |
| `--color-success-500` | Success states |
| `--color-warning-500` | Warning states |
| `--color-danger-500` | Error/danger states |
| `--color-info-500` | Informational states |

### Spacing (`tokens/spacing.ts`)

CSS custom properties for spacing scale.

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

### Typography (`tokens/typography.ts`)

Font families and sizes.

| Token | Value |
|-------|-------|
| `--font-sans` | System font stack |
| `--text-sm` | 14px |
| `--text-base` | 16px |
| `--text-lg` | 18px |

### Radius (`tokens/radius.ts`)

Border radius tokens.

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--radius-xl` | 12px |
| `--radius-full` | 9999px |

### Shadows (`tokens/shadows.ts`)

Box shadow tokens.

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle shadows |
| `--shadow-md` | Card shadows |
| `--shadow-lg` | Dropdown shadows |
| `--shadow-xl` | Modal shadows |

---

## Components

### Button

**Location:** `components/Button`

**Variants:**
- `primary` - Primary action
- `secondary` - Secondary action
- `ghost` - Subtle action
- `danger` - Destructive action
- `link` - Text link

**Sizes:** `sm`, `md`, `lg`

**Props:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<Button variant="primary" size="md" icon={Plus} loading={isLoading}>
  Create New
</Button>
```

**Accessibility:**
- Uses `<button>` element
- Supports `disabled` state
- Loading state with `aria-busy`
- Focus visible outline

---

### Card

**Location:** `components/Card`

**Variants:**
- `default` - Subtle background
- `bordered` - Bordered card
- `elevated` - Elevated shadow

**Props:**
```tsx
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}
```

**Sub-components:**
- `Card.Header` - Card header with title, subtitle, actions
- `Card.Body` - Card content
- `Card.Footer` - Card footer
- `Card.Section` - Separated section
- `SummaryCard` - Metric summary card with icon, value, trend

**Usage:**
```tsx
<Card variant="bordered">
  <Card.Header 
    title="Service Requests" 
    subtitle="24 active requests"
    actions={<Button size="sm">View All</Button>}
  />
  <Card.Body>
    {/* content */}
  </Card.Body>
</Card>
```

---

### Badge

**Location:** `components/Badge`

**Variants:**
- Status: `open`, `in_progress`, `resolved`, `closed`, `cancelled`
- Priority: `low`, `medium`, `high`, `critical`
- Severity: `info`, `warning`, `error`, `critical`
- Category: Various category colors
- Inventory: `in_stock`, `low_stock`, `out_of_stock`, `discontinued`
- Compliance: `compliant`, `non_compliant`, `pending`, `expired`

**Props:**
```tsx
interface BadgeProps {
  variant?: BadgeVariant;
  color?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  children?: React.ReactNode;
}
```

**StatusBadge:** Pre-styled badge for status values
**PriorityBadge:** Pre-styled badge for priority levels

**Usage:**
```tsx
<Badge variant="open">Open</Badge>
<StatusBadge status="in_progress" />
<PriorityBadge priority="high" />
```

---

### Avatar

**Location:** `components/Avatar`

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`

**Props:**
```tsx
interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  fallback?: string;
  className?: string;
}
```

**Usage:**
```tsx
<Avatar src="/photos/user.jpg" name="John Doe" size="md" />
<Avatar name="JD" size="sm" />
```

---

### Tooltip

**Location:** `components/Tooltip`

**Positions:** `top`, `bottom`, `left`, `right`

**Props:**
```tsx
interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}
```

**Usage:**
```tsx
<Tooltip content="This action cannot be undone" position="top">
  <Button variant="danger">Delete</Button>
</Tooltip>
```

---

### EmptyState

**Location:** `components/EmptyState`

**Props:**
```tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={Inbox}
  title="No service requests"
  description="Create your first service request to get started"
  action={{ label: "Create Request", onClick: handleCreate }}
/>
```

---

### Loading

**Location:** `components/Loading`

**Variants:** `spinner`, `dots`, `bars`

**Sizes:** `sm`, `md`, `lg`

**Props:**
```tsx
interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'bars';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}
```

**Usage:**
```tsx
<Loading text="Loading data..." />
<Loading variant="dots" size="sm" />
```

---

### Skeleton

**Location:** `components/Skeleton`

**Variants:** `text`, `circle`, `rect`, `card`

**Props:**
```tsx
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}
```

**Usage:**
```tsx
<Skeleton variant="text" lines={3} />
<Skeleton variant="circle" width={40} height={40} />
<Skeleton variant="card" />
```

---

## Layout Components

### PageContainer

**Location:** `layout/PageContainer`

**Props:**
```tsx
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<PageContainer maxWidth="lg" padding>
  {children}
</PageContainer>
```

---

### PageHeader

**Location:** `layout/PageHeader`

**Props:**
```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
}
```

**Usage:**
```tsx
<PageHeader
  title="Service Requests"
  subtitle="Manage and track service requests"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Service Requests', href: '/requests' },
    { label: 'Details' },
  ]}
  actions={<Button variant="primary">Create</Button>}
/>
```

---

### PageToolbar

**Location:** `layout/PageToolbar`

**Props:**
```tsx
interface PageToolbarProps {
  search?: SearchConfig;
  filters?: React.ReactNode;
  bulkActions?: BulkAction[];
  selectedCount?: number;
  onClearSelection?: () => void;
  actions?: React.ReactNode;
  sticky?: boolean;
}
```

**Usage:**
```tsx
<PageToolbar
  search={{
    placeholder: 'Search requests...',
    value: searchTerm,
    onChange: setSearchTerm,
    debounceMs: 300,
  }}
  filters={<FilterDropdown filter={statusFilter} />}
  bulkActions={[
    { id: 'assign', label: 'Assign', icon: UserPlus, onClick: handleAssign },
    { id: 'delete', label: 'Delete', icon: Trash, variant: 'danger', onClick: handleDelete },
  ]}
  selectedCount={selectedRows.length}
  actions={<Button icon={Plus}>New Request</Button>}
/>
```

---

### SummaryGrid

**Location:** `layout/SummaryGrid`

**Props:**
```tsx
interface SummaryGridProps {
  items: SummaryGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

interface SummaryGridItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: { value: number; direction: 'up' | 'down' | 'neutral'; label?: string };
  onClick?: () => void;
}
```

**Usage:**
```tsx
<SummaryGrid
  columns={4}
  items={[
    { id: '1', title: 'Total Requests', value: 156, icon: FileText, iconColor: 'primary' },
    { id: '2', title: 'Open', value: 24, icon: AlertCircle, iconColor: 'warning' },
    { id: '3', title: 'Resolved', value: 132, icon: CheckCircle, iconColor: 'success' },
    { id: '4', title: 'Avg Response', value: '2.4h', icon: Clock, iconColor: 'info' },
  ]}
/>
```

---

### Section

**Location:** `layout/Section`

**Props:**
```tsx
interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}
```

**Usage:**
```tsx
<Section title="Request Details" icon={FileText}>
  {children}
</Section>
```

---

### Breadcrumb

**Location:** `layout/Breadcrumb`

**Props:**
```tsx
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: '/' | '>' | '→' | React.ReactNode;
  maxItems?: number;
  showHomeIcon?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}
```

**Usage:**
```tsx
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Requests', href: '/requests' },
    { label: 'SR-001', href: '/requests/1' },
  ]}
  showHomeIcon
/>
```

---

## Data Display Components

### DataTable

**Location:** `data-display/DataTable`

**Props:**
```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: keyof T;
  selectable?: boolean;
  sortable?: boolean;
  pagination?: PaginationConfig;
  loading?: boolean;
  empty?: { title: string; description?: string; action?: { label: string; onClick: () => void } };
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSort?: (columnId: string, direction: SortDirection) => void;
  variant?: 'default' | 'compact' | 'bordered';
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}
```

**Usage:**
```tsx
const columns = [
  { id: 'id', header: 'ID', accessor: 'id', sortable: true },
  { id: 'title', header: 'Title', accessor: 'title', sortable: true },
  { id: 'status', header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
];

<DataTable
  columns={columns}
  data={requests}
  keyField="id"
  selectable
  sortable
  pagination={{
    page: 1,
    pageSize: 20,
    total: 100,
    onPageChange: setPage,
  }}
  onRowClick={(row) => navigate(`/requests/${row.id}`)}
/>
```

---

### StatusBadge

**Location:** `data-display/StatusBadge`

Re-exports `StatusBadge`, `PriorityBadge` from Badge component.

**Usage:**
```tsx
<StatusBadge status="in_progress" />
<StatusBadge status="open" size="sm" />
```

---

### Timeline

**Location:** `data-display/Timeline`

**Props:**
```tsx
interface TimelineProps {
  items: TimelineItem[];
  showDate?: boolean;
  variant?: 'default' | 'compact';
}

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
}
```

**Usage:**
```tsx
<Timeline
  showDate
  items={[
    { id: '1', title: 'Request created', timestamp: new Date(), icon: Plus, iconColor: 'success' },
    { id: '2', title: 'Assigned to John', timestamp: new Date(), icon: UserPlus, iconColor: 'primary' },
  ]}
/>
```

---

### ActivityFeed

**Location:** `data-display/ActivityFeed`

**Props:**
```tsx
interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  onActivityClick?: (activity: Activity) => void;
}
```

**Usage:**
```tsx
<ActivityFeed
  activities={activities}
  limit={10}
  showLoadMore
  onActivityClick={(activity) => navigate(`/activity/${activity.id}`)}
/>
```

---

## Form Components

### Input

**Location:** `forms/Input`

**Props:**
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: 'sm' | 'md' | 'lg';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  fullWidth
/>
```

---

### TextArea

**Location:** `forms/TextArea`

**Props:**
```tsx
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  rows?: number;
  showCount?: boolean;
  maxLength?: number;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
<TextArea
  label="Description"
  rows={4}
  showCount
  maxLength={500}
  fullWidth
/>
```

---

### Select

**Location:** `forms/Select`

**Props:**
```tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<Select
  label="Priority"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]}
  value={priority}
  onChange={setPriority}
  fullWidth
/>
```

---

### SearchInput

**Location:** `forms/SearchInput`

**Props:**
```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  debounceMs?: number;
  clearable?: boolean;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
  placeholder="Search requests..."
  debounceMs={300}
/>
```

---

### Checkbox

**Location:** `forms/Checkbox`

**Props:**
```tsx
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}
```

**Usage:**
```tsx
<Checkbox
  label="I agree to the terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

---

### Radio

**Location:** `forms/Radio`

**Props:**
```tsx
interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}
```

**Usage:**
```tsx
<RadioGroup
  label="Notification preference"
  options={[
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'none', label: 'None' },
  ]}
  value={preference}
  onChange={setPreference}
/>
```

---

## Feedback Components

### Toast

**Location:** `feedback/Toast`

**Provider:**
```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

**Hook:**
```tsx
const { addToast, removeToast, clearToasts } = useToast();

addToast({
  type: 'success',
  title: 'Saved successfully',
  description: 'Your changes have been saved.',
  duration: 5000,
});
```

**Types:** `success`, `error`, `warning`, `info`

---

### Dialog

**Location:** `feedback/Dialog`

**Props:**
```tsx
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}
```

**ConfirmDialog:**
```tsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Are you sure?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  confirmVariant="danger"
/>
```

**Usage:**
```tsx
<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Request"
  size="lg"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <RequestForm />
</Dialog>
```

---

## Navigation Components

### Tabs

**Location:** `navigation/Tabs`

**Props:**
```tsx
interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  content: React.ReactNode;
}
```

**Usage:**
```tsx
<Tabs
  variant="pills"
  tabs={[
    { id: 'details', label: 'Details', content: <Details /> },
    { id: 'history', label: 'History', badge: 5, content: <History /> },
    { id: 'comments', label: 'Comments', content: <Comments /> },
  ]}
  defaultTab="details"
  onChange={(id) => console.log(id)}
/>
```

---

### Pagination

**Location:** `navigation/Pagination`

**Props:**
```tsx
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showTotal?: boolean;
}
```

**Usage:**
```tsx
<Pagination
  page={currentPage}
  pageSize={pageSize}
  total={totalItems}
  pageSizes={[10, 20, 50, 100]}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

---

## Hooks

### useLocalStorage

```tsx
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
```

### useDebounce

```tsx
const debouncedValue = useDebounce(value, 300);
```

### useMediaQuery

```tsx
const isLarge = useMediaQuery('(min-width: 1024px)');
const { isMobile, isTablet, isDesktop } = useBreakpoints();
```

### useDisclosure

```tsx
const { isOpen, onOpen, onClose, onToggle } = useDisclosure(false);
```

### useKeyPress

```tsx
useKeyPress('Escape', handleEscape);
useKeyPress(['ctrl+s', 'cmd+s'], handleSave);
```

---

## Utilities

### cn

```tsx
import { cn } from '@/design-system/utils';

<div className={cn(styles.base, isActive && styles.active, className)}>
```

### format

```tsx
import { formatDate, formatRelativeTime, formatNumber, formatCurrency } from '@/design-system/utils';

formatDate(new Date()); // "Jul 22, 2024"
formatRelativeTime(new Date()); // "Just now"
formatNumber(1000); // "1,000"
formatCurrency(19.99); // "$19.99"
```

### validation

```tsx
import { required, email, minLength, validate } from '@/design-system/utils';

const rules = [required(), email(), minLength(5)];
const result = validate('test@example.com', rules);
```

---

## Accessibility

All components follow WCAG 2.1 guidelines:

- **Keyboard navigation** - All interactive elements are keyboard accessible
- **Focus management** - Focus states are visible and logical
- **ARIA attributes** - Proper ARIA labels and roles
- **Color contrast** - Minimum 4.5:1 contrast ratio
- **Screen reader** - Compatible with screen readers

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Version

Current version: **2.0.0**

Last updated: 2024
