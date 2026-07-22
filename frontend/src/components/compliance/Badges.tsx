/**
 * Compliance Status Badges
 */

type FrameworkStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type ControlStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface StatusBadgeProps {
  status: FrameworkStatus | ControlStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Framework statuses
  DRAFT: { label: 'Draft', className: 'badge-draft' },
  ACTIVE: { label: 'Active', className: 'badge-active' },
  ARCHIVED: { label: 'Archived', className: 'badge-archived' },
  // Control statuses
  PENDING: { label: 'Pending', className: 'badge-pending' },
  APPROVED: { label: 'Approved', className: 'badge-approved' },
  REJECTED: { label: 'Rejected', className: 'badge-rejected' },
  COMPLETED: { label: 'Completed', className: 'badge-completed' }
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-default' };
  
  return (
    <span className={`status-badge ${config.className} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {config.label}
    </span>
  );
}
