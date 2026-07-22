/**
 * Design System Preview Page
 * Enterprise Design System V2 - Interactive Showcase
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Palette,
  Type,
  Grid3X3,
  MousePointer2,
  Layers,
  List,
  Table2,
  LayoutGrid,
  Heading1,
  LayoutDashboard,
  MessageSquare,
  Columns,
  Clock,
  FileQuestion,
  Loader2,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Trash2,
  Edit3,
  Copy,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock3,
  XCircle,
  TrendingUp,
  TrendingDown,
  User,
  FileText,
  Bell,
  Info,
  AlertTriangle,
  X,
  Home,
  ArrowLeft,
  LucideIcon,
} from 'lucide-react';

// Design System Imports
import {
  // Components
  Button,
  Card,
  Badge,
  Avatar,
  Tooltip,
  EmptyState,
  Loading,
  Skeleton,
  
  // Layout
  PageContainer,
  PageHeader,
  PageToolbar,
  SummaryGrid,
  Section,
  ContentCard,
  Breadcrumb,
  
  // Data Display
  DataTable,
  StatusBadge,
  Timeline,
  ActivityFeed,
  
  // Forms
  Input,
  TextArea,
  Select,
  SearchInput,
  Checkbox,
  Radio,
  
  // Feedback
  Dialog,
  ConfirmDialog,
  ToastProvider,
  useToast,
  
  // Navigation
  Tabs,
  Pagination,
} from '../design-system';

// Badge types
type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'danger' | 'info' | 'new' | 'assigned' | 'inProgress' | 'waiting' | 'resolved' | 'closed' | 'blocked';
type BadgeStatus = 'new' | 'assigned' | 'inProgress' | 'waiting' | 'resolved' | 'closed' | 'blocked';

// Timeline types
interface TimelineItemData {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'warning' | 'info' | 'danger' | 'success' | 'muted';
}

// Activity types
type ActivityType = 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'status_changed';
interface ActivityData {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  link?: string;
}

// Summary grid types
interface SummaryItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  onClick?: () => void;
}

import styles from './DesignSystemPreviewPage.module.css';

// ============================================
// SECTION COMPONENTS
// ============================================

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ContentCard className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionContent}>{children}</div>
    </ContentCard>
  );
}

// ============================================
// NAVIGATION ITEM
// ============================================

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ label, icon, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={`${styles.navItem} ${active ? styles.navItem__active : ''}`}
      onClick={onClick}
    >
      <span className={styles.navItem__icon}>{icon}</span>
      <span className={styles.navItem__label}>{label}</span>
      <ChevronRight size={14} className={styles.navItem__arrow} />
    </button>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export function DesignSystemPreviewPage() {
  // Toast hook for demo
  const toast = useToast();
  
  // State
  const [activeSection, setActiveSection] = useState('colors');
  const [tablePage, setTablePage] = useState(1);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    input: '',
    textarea: '',
    select: '',
    checkbox: false,
    radio: 'option1',
  });

  // Demo data for table
  const demoTableData = useMemo(() => [
    { id: 1, title: 'Network infrastructure maintenance', status: 'inProgress' as BadgeStatus, priority: 'high' as BadgeVariant, assignee: 'John Smith', category: 'Infrastructure' },
    { id: 2, title: 'Server upgrade deployment', status: 'new' as BadgeStatus, priority: 'medium' as BadgeVariant, assignee: 'Sarah Johnson', category: 'Servers' },
    { id: 3, title: 'Security patch installation', status: 'resolved' as BadgeStatus, priority: 'critical' as BadgeVariant, assignee: 'Mike Wilson', category: 'Security' },
    { id: 4, title: 'Database backup verification', status: 'new' as BadgeStatus, priority: 'low' as BadgeVariant, assignee: 'Emily Brown', category: 'Database' },
    { id: 5, title: 'Cloud migration planning', status: 'inProgress' as BadgeStatus, priority: 'high' as BadgeVariant, assignee: 'David Lee', category: 'Cloud' },
    { id: 6, title: 'Email system configuration', status: 'closed' as BadgeStatus, priority: 'medium' as BadgeVariant, assignee: 'Lisa Chen', category: 'Communication' },
    { id: 7, title: 'VPN access setup', status: 'new' as BadgeStatus, priority: 'low' as BadgeVariant, assignee: 'Tom Garcia', category: 'Access' },
    { id: 8, title: 'Storage allocation review', status: 'resolved' as BadgeStatus, priority: 'medium' as BadgeVariant, assignee: 'Anna Martinez', category: 'Storage' },
  ], []);

  // Timeline data
  const timelineData = useMemo((): TimelineItemData[] => [
    { id: '1', title: 'Request Created', description: 'Initial request submitted by user', timestamp: new Date(Date.now() - 3600000 * 5), icon: Plus, iconColor: 'primary' },
    { id: '2', title: 'Assigned', description: 'Assigned to John Smith for review', timestamp: new Date(Date.now() - 3600000 * 4), icon: User, iconColor: 'info' },
    { id: '3', title: 'In Progress', description: 'Work started on the request', timestamp: new Date(Date.now() - 3600000 * 2), icon: Clock3, iconColor: 'warning' },
    { id: '4', title: 'Completed', description: 'Request fulfilled successfully', timestamp: new Date(Date.now() - 3600000), icon: CheckCircle, iconColor: 'success' },
  ], []);

  // Activity feed data
  const activityData = useMemo((): ActivityData[] => [
    { id: '1', type: 'created', title: 'Created Service Request #1234', timestamp: new Date(Date.now() - 3600000), user: { name: 'John Smith', avatar: 'JS' } },
    { id: '2', type: 'updated', title: 'Updated Incident #5678', timestamp: new Date(Date.now() - 7200000), user: { name: 'Sarah Johnson', avatar: 'SJ' } },
    { id: '3', type: 'commented', title: 'Commented on Change Request #9012', timestamp: new Date(Date.now() - 10800000), user: { name: 'Mike Wilson', avatar: 'MW' } },
    { id: '4', type: 'status_changed', title: 'Resolved Ticket #3456', timestamp: new Date(Date.now() - 14400000), user: { name: 'Emily Brown', avatar: 'EB' } },
  ], []);

  // Summary grid data
  const summaryData = useMemo((): SummaryItem[] => [
    { id: '1', title: 'Total Requests', value: 156, icon: <FileText size={24} />, iconColor: 'primary', trend: { value: 12, direction: 'up' as const, label: 'vs last month' } },
    { id: '2', title: 'Open', value: 24, icon: <AlertCircle size={24} />, iconColor: 'warning' },
    { id: '3', title: 'Resolved', value: 132, icon: <CheckCircle size={24} />, iconColor: 'success', trend: { value: 8, direction: 'up' as const } },
    { id: '4', title: 'Avg Response', value: '2.4h', icon: <Clock size={24} />, iconColor: 'info', trend: { value: 15, direction: 'down' as const, label: 'improvement' } },
  ], []);

  // Table columns
  const tableColumns = useMemo(() => [
    { id: 'title', header: 'Title', accessor: 'title' as keyof typeof demoTableData[0], sortable: true },
    { id: 'status', header: 'Status', accessor: 'status' as keyof typeof demoTableData[0], sortable: true, render: (val: any) => <StatusBadge status={val as BadgeStatus} /> },
    { id: 'priority', header: 'Priority', accessor: 'priority' as keyof typeof demoTableData[0], sortable: true, render: (val: any) => <Badge variant={val as BadgeVariant}>{val}</Badge> },
    { id: 'assignee', header: 'Assignee', accessor: 'assignee' as keyof typeof demoTableData[0], sortable: true },
    { id: 'actions', header: '', accessor: 'id' as keyof typeof demoTableData[0], render: () => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Tooltip content="Edit"><button type="button" style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={14} /></button></Tooltip>
        <Tooltip content="Delete"><button type="button" style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button></Tooltip>
      </div>
    )},
  ], []);

  // Section navigation
  const sections = [
    { id: 'colors', label: 'Colors', icon: <Palette size={16} /> },
    { id: 'typography', label: 'Typography', icon: <Type size={16} /> },
    { id: 'spacing', label: 'Spacing', icon: <Grid3X3 size={16} /> },
    { id: 'buttons', label: 'Buttons', icon: <MousePointer2 size={16} /> },
    { id: 'badges', label: 'Badges', icon: <Layers size={16} /> },
    { id: 'cards', label: 'Cards', icon: <Layers size={16} /> },
    { id: 'inputs', label: 'Inputs', icon: <FileText size={16} /> },
    { id: 'tables', label: 'Tables', icon: <Table2 size={16} /> },
    { id: 'toolbar', label: 'Toolbar', icon: <LayoutGrid size={16} /> },
    { id: 'page-header', label: 'Page Header', icon: <Heading1 size={16} /> },
    { id: 'summary-cards', label: 'Summary Cards', icon: <LayoutDashboard size={16} /> },
    { id: 'dialogs', label: 'Dialogs', icon: <MessageSquare size={16} /> },
    { id: 'tabs', label: 'Tabs', icon: <Columns size={16} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
    { id: 'activity-feed', label: 'Activity Feed', icon: <Bell size={16} /> },
    { id: 'pagination', label: 'Pagination', icon: <List size={16} /> },
    { id: 'empty-states', label: 'Empty States', icon: <FileQuestion size={16} /> },
    { id: 'loading', label: 'Loading', icon: <Loader2 size={16} /> },
    { id: 'responsive', label: 'Responsive', icon: <Monitor size={16} /> },
  ];

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Filter table data based on search
  const filteredTableData = useMemo(() => {
    if (!searchTerm) return demoTableData;
    return demoTableData.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignee.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [demoTableData, searchTerm]);

  // Toast demo functions
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Success!', description: 'The action was completed successfully.' },
      error: { title: 'Error', description: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning', description: 'Please review the highlighted items.' },
      info: { title: 'Information', description: 'Here is some helpful information.' },
    };
    toast.addToast({ type, ...messages[type] });
  }, [toast]);

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'colors':
        return (
          <SectionWrapper title="Colors">
            <div className={styles.colorGrid}>
              <ColorSwatch name="Primary" color="var(--color-primary-600)" />
              <ColorSwatch name="Primary Light" color="var(--color-primary-100)" />
              <ColorSwatch name="Success" color="var(--color-success-500)" />
              <ColorSwatch name="Success Light" color="var(--color-success-100)" />
              <ColorSwatch name="Warning" color="var(--color-warning-500)" />
              <ColorSwatch name="Warning Light" color="var(--color-warning-100)" />
              <ColorSwatch name="Danger" color="var(--color-danger-500)" />
              <ColorSwatch name="Danger Light" color="var(--color-danger-100)" />
              <ColorSwatch name="Info" color="var(--color-info-500)" />
              <ColorSwatch name="Info Light" color="var(--color-info-100)" />
              <ColorSwatch name="Surface" color="var(--bg-surface)" border />
              <ColorSwatch name="Background" color="var(--bg-primary)" border />
              <ColorSwatch name="Border" color="var(--border-default)" />
              <ColorSwatch name="Text Primary" color="var(--text-primary)" />
              <ColorSwatch name="Text Secondary" color="var(--text-secondary)" />
              <ColorSwatch name="Text Muted" color="var(--text-muted)" />
            </div>
          </SectionWrapper>
        );

      case 'typography':
        return (
          <SectionWrapper title="Typography">
            <div className={styles.typeGrid}>
              <TypeExample style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-normal)' }}>Caption / XS - 12px</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-normal)' }}>Small / SM - 14px</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-normal)' }}>Body / Base - 16px</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Large / LG - 18px Semibold</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>XL - 20px Semibold</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)' }}>2XL - 24px Semibold</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>3XL - 30px Bold</TypeExample>
              <TypeExample style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)' }}>4XL - 36px Bold</TypeExample>
            </div>
          </SectionWrapper>
        );

      case 'spacing':
        return (
          <SectionWrapper title="Spacing Scale">
            <div className={styles.spacingGrid}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => (
                <div key={n} className={styles.spacingItem}>
                  <div className={styles.spacingBox} style={{ width: `var(--space-${n})`, height: `var(--space-${n})` }} />
                  <span>space-{n}</span>
                </div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'buttons':
        return (
          <SectionWrapper title="Buttons">
            <div className={styles.demoSection}>
              <h4>Variants</h4>
              <div className={styles.buttonRow}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Sizes</h4>
              <div className={styles.buttonRow}>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>With Icons</h4>
              <div className={styles.buttonRow}>
                <Button icon={Plus}>With Icon</Button>
                <Button icon={Plus} iconPosition="right">Icon Right</Button>
                <Button variant="secondary" icon={Download}>Download</Button>
                <Button variant="danger" icon={Trash2}>Delete</Button>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>States</h4>
              <div className={styles.buttonRow}>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </SectionWrapper>
        );

      case 'badges':
        return (
          <SectionWrapper title="Badges">
            <div className={styles.demoSection}>
              <h4>Status Badges</h4>
              <div className={styles.badgeRow}>
                <StatusBadge status="new" />
                <StatusBadge status="assigned" />
                <StatusBadge status="inProgress" />
                <StatusBadge status="waiting" />
                <StatusBadge status="resolved" />
                <StatusBadge status="closed" />
                <StatusBadge status="blocked" />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Priority Badges</h4>
              <div className={styles.badgeRow}>
                <Badge variant="critical">Critical</Badge>
                <Badge variant="high">High</Badge>
                <Badge variant="medium">Medium</Badge>
                <Badge variant="low">Low</Badge>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Severity Badges</h4>
              <div className={styles.badgeRow}>
                <Badge variant="danger">Error</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Category Badges</h4>
              <div className={styles.badgeRow}>
                <Badge variant="success">Success</Badge>
                <Badge variant="default">Default</Badge>
              </div>
            </div>
          </SectionWrapper>
        );

      case 'cards':
        return (
          <SectionWrapper title="Cards">
            <div className={styles.demoSection}>
              <h4>Basic Cards</h4>
              <div className={styles.cardRow}>
                <Card variant="default" padding="md">
                  <h5>Default Card</h5>
                  <p>This is a default card variant.</p>
                </Card>
                <Card variant="bordered" padding="md">
                  <h5>Bordered Card</h5>
                  <p>This is a bordered card variant.</p>
                </Card>
                <Card variant="elevated" padding="md">
                  <h5>Elevated Card</h5>
                  <p>This is an elevated card variant.</p>
                </Card>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Interactive Card</h4>
              <Card variant="elevated" interactive padding="md" onClick={() => showToast('info')}>
                <h5>Click Me</h5>
                <p>This card is interactive and hoverable.</p>
              </Card>
            </div>
          </SectionWrapper>
        );

      case 'inputs':
        return (
          <SectionWrapper title="Form Inputs">
            <div className={styles.demoSection}>
              <h4>Text Input</h4>
              <div className={styles.formRow}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, input: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Textarea</h4>
              <div className={styles.formRow}>
                <TextArea
                  label="Description"
                  placeholder="Enter a description..."
                  rows={3}
                  value={formData.textarea}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, textarea: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Select</h4>
              <div className={styles.formRow}>
                <Select
                  label="Category"
                  options={[
                    { value: 'infrastructure', label: 'Infrastructure' },
                    { value: 'security', label: 'Security' },
                    { value: 'network', label: 'Network' },
                  ]}
                  value={formData.select}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, select: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Checkbox</h4>
              <div className={styles.formRow}>
                <Checkbox
                  label="I agree to the terms and conditions"
                  checked={formData.checkbox}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, checkbox: e.target.checked })}
                />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Radio Group</h4>
              <div className={styles.formRow}>
                <Radio
                  name="demo-radio"
                  label="Option 1"
                  checked={formData.radio === 'option1'}
                  onChange={() => setFormData({ ...formData, radio: 'option1' })}
                />
                <Radio
                  name="demo-radio"
                  label="Option 2"
                  checked={formData.radio === 'option2'}
                  onChange={() => setFormData({ ...formData, radio: 'option2' })}
                />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Validation States</h4>
              <div className={styles.formRow}>
                <Input label="Error State" error="This field is required" />
                <Input label="Success State" success="Looks good!" />
              </div>
            </div>
          </SectionWrapper>
        );

      case 'tables':
        return (
          <SectionWrapper title="Data Table">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search table..."
            />
            <DataTable
              columns={tableColumns}
              data={filteredTableData}
              keyField="id"
              selectable
              sortable
              pagination={{
                page: tablePage,
                pageSize: 5,
                total: filteredTableData.length,
                onPageChange: setTablePage,
              }}
              onSelectionChange={(rows) => setSelectedRows(rows.map(r => r.id))}
              onRowClick={(row) => showToast('info')}
              empty={{
                title: 'No results found',
                description: 'Try adjusting your search criteria.',
              }}
            />
            <p style={{ marginTop: '16px' }}>Selected: {selectedRows.length} rows</p>
          </SectionWrapper>
        );

      case 'toolbar':
        return (
          <SectionWrapper title="Page Toolbar">
            <PageToolbar
              search={{
                placeholder: 'Search...',
                value: searchTerm,
                onChange: setSearchTerm,
                debounceMs: 300,
              }}
              actions={
                <>
                  <Button variant="primary" icon={Plus}>New</Button>
                  <Button variant="secondary" icon={RefreshCw}>Refresh</Button>
                </>
              }
              bulkActions={[
                { id: 'export', label: 'Export', icon: Download, onClick: () => showToast('success') },
                { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => showToast('warning') },
              ]}
              selectedCount={selectedRows.length}
              onClearSelection={() => setSelectedRows([])}
            />
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Toolbar with search, actions, and bulk action support
            </p>
          </SectionWrapper>
        );

      case 'page-header':
        return (
          <SectionWrapper title="Page Header">
            <PageHeader
              title="Service Requests"
              subtitle="Manage and track service requests"
              breadcrumbs={[
                { label: 'Home', href: '#' },
                { label: 'Service Requests', href: '#' },
                { label: 'Details' },
              ]}
              actions={<Button variant="primary" icon={Plus}>Create Request</Button>}
              tags={[{ label: 'New', color: 'var(--color-success-500)' }]}
            />
          </SectionWrapper>
        );

      case 'summary-cards':
        return (
          <SectionWrapper title="Summary Cards">
            <div className={styles.demoSection}>
              <h4>4 Column Grid</h4>
              <SummaryGrid items={summaryData} columns={4} />
            </div>
            <div className={styles.demoSection}>
              <h4>2 Column Grid</h4>
              <SummaryGrid items={summaryData.slice(0, 2)} columns={2} />
            </div>
          </SectionWrapper>
        );

      case 'dialogs':
        return (
          <SectionWrapper title="Dialogs">
            <div className={styles.demoSection}>
              <h4>Confirmation Dialog</h4>
              <div className={styles.buttonRow}>
                <Button onClick={() => setConfirmDialogOpen(true)}>Open Confirm</Button>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Form Dialog</h4>
              <div className={styles.buttonRow}>
                <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Toast Notifications</h4>
              <div className={styles.buttonRow}>
                <Button variant="primary" onClick={() => showToast('success')}>Success</Button>
                <Button variant="danger" onClick={() => showToast('error')}>Error</Button>
                <Button variant="secondary" onClick={() => showToast('warning')}>Warning</Button>
                <Button onClick={() => showToast('info')}>Info</Button>
              </div>
            </div>
          </SectionWrapper>
        );

      case 'tabs':
        return (
          <SectionWrapper title="Tabs">
            <Tabs
              variant="default"
              tabs={[
                { id: 'overview', label: 'Overview', content: <p>Overview content goes here.</p> },
                { id: 'details', label: 'Details', content: <p>Details content goes here.</p> },
                { id: 'history', label: 'History', badge: 3, content: <p>History content goes here.</p> },
              ]}
            />
            <div style={{ marginTop: '24px' }}>
              <Tabs
                variant="pills"
                tabs={[
                  { id: 'info', label: 'Information', content: <p>Info tab content.</p> },
                  { id: 'settings', label: 'Settings', content: <p>Settings tab content.</p> },
                ]}
              />
            </div>
            <div style={{ marginTop: '24px' }}>
              <Tabs
                variant="underline"
                tabs={[
                  { id: 'tab1', label: 'Tab 1', content: <p>Underline variant.</p> },
                  { id: 'tab2', label: 'Tab 2', content: <p>Tab 2 content.</p> },
                ]}
              />
            </div>
          </SectionWrapper>
        );

      case 'timeline':
        return (
          <SectionWrapper title="Timeline">
            <Timeline items={timelineData} showDate />
          </SectionWrapper>
        );

      case 'activity-feed':
        return (
          <SectionWrapper title="Activity Feed">
            <ActivityFeed activities={activityData} />
          </SectionWrapper>
        );

      case 'pagination':
        return (
          <SectionWrapper title="Pagination">
            <Pagination
              page={tablePage}
              pageSize={10}
              total={100}
              pageSizes={[10, 20, 50, 100]}
              onPageChange={setTablePage}
              onPageSizeChange={() => {}}
              showTotal
            />
          </SectionWrapper>
        );

      case 'empty-states':
        return (
          <SectionWrapper title="Empty States">
            <div className={styles.emptyStateRow}>
              <EmptyState
                icon={FileText}
                title="No Data"
                description="There are no items to display at this time."
                action={{ label: 'Create New', onClick: () => showToast('info') }}
              />
            </div>
            <div className={styles.emptyStateRow}>
              <EmptyState
                icon={Search}
                title="No Search Results"
                description="Try adjusting your search or filter criteria."
              />
            </div>
            <div className={styles.emptyStateRow}>
              <EmptyState
                icon={AlertCircle}
                title="Error State"
                description="Something went wrong. Please try again."
                action={{ label: 'Retry', onClick: () => showToast('info') }}
              />
            </div>
          </SectionWrapper>
        );

      case 'loading':
        return (
          <SectionWrapper title="Loading States">
            <div className={styles.demoSection}>
              <h4>Spinner</h4>
              <div className={styles.loadingRow}>
                <Loading size="sm" />
                <Loading size="md" />
                <Loading size="lg" />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Spinner with Text</h4>
              <div className={styles.loadingRow}>
                <Loading size="md" text="Loading data..." />
              </div>
            </div>
            <div className={styles.demoSection}>
              <h4>Skeleton</h4>
              <div className={styles.skeletonRow}>
                <Skeleton variant="text" lines={3} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width={200} />
                </div>
              </div>
            </div>
          </SectionWrapper>
        );

      case 'responsive':
        return (
          <SectionWrapper title="Responsive Preview">
            <div className={styles.responsiveGrid}>
              <ResponsivePreview
                title="Desktop"
                icon={<Monitor size={24} />}
                width="100%"
              />
              <ResponsivePreview
                title="Laptop"
                icon={<Laptop size={24} />}
                width="75%"
              />
              <ResponsivePreview
                title="Tablet"
                icon={<Tablet size={24} />}
                width="50%"
              />
              <ResponsivePreview
                title="Mobile"
                icon={<Smartphone size={24} />}
                width="25%"
              />
            </div>
          </SectionWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className={styles.page}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Components</h3>
          </div>
          <nav className={styles.nav}>
            {sections.map((section) => (
              <NavItem
                key={section.id}
                label={section.label}
                icon={section.icon}
                active={activeSection === section.id}
                onClick={() => scrollToSection(section.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          <PageHeader
            title="Enterprise Design System V2"
            subtitle="Component Library Preview - Build Version 2.0.0"
            breadcrumbs={[
              { label: 'Home', href: '#', icon: Home },
              { label: 'Design System' },
            ]}
          />

          <div className={styles.content}>
            {sections.map((section) => (
              <div key={section.id} id={section.id}>
                {renderContent()}
              </div>
            ))}
          </div>
        </main>

        {/* Dialogs */}
        <ConfirmDialog
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            setConfirmDialogOpen(false);
            showToast('success');
          }}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action? This cannot be undone."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />

        <Dialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Edit Request"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                setDialogOpen(false);
                showToast('success');
              }}>Save Changes</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Title" defaultValue="Service Request" />
            <TextArea label="Description" rows={4} />
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
        </Dialog>
      </div>
    </ToastProvider>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ColorSwatch({ name, color, border }: { name: string; color: string; border?: boolean }) {
  return (
    <div className={styles.colorSwatch}>
      <div
        className={styles.colorBox}
        style={{
          backgroundColor: color,
          border: border ? '1px solid var(--border-default)' : 'none',
        }}
      />
      <span className={styles.colorName}>{name}</span>
    </div>
  );
}

function TypeExample({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={styles.typeExample}>
      <p style={style}>{children}</p>
    </div>
  );
}

function ResponsivePreview({ title, icon, width }: { title: string; icon: React.ReactNode; width: string }) {
  return (
    <div className={styles.responsivePreview}>
      <div className={styles.responsiveIcon}>{icon}</div>
      <span className={styles.responsiveTitle}>{title}</span>
      <div className={styles.responsiveFrame} style={{ width }}>
        <div className={styles.responsiveContent}>
          <div className={styles.responsiveHeader} />
          <div className={styles.responsiveBody}>
            <div className={styles.responsiveCard} />
            <div className={styles.responsiveCard} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignSystemPreviewPage;
