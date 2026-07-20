import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, LucideIcon, FileQuestion } from 'lucide-react';

// Table Container Component
interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  empty?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
}

export function TableContainer({
  children,
  className = '',
  empty = false,
  loading = false,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display.',
  emptyIcon: EmptyIcon = FileQuestion
}: TableContainerProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <EmptyIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">{emptyTitle}</h3>
          <p className="text-sm text-slate-500 text-center max-w-sm">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

// Sort Header Component
interface SortHeaderProps {
  label: string;
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  className?: string;
  sortable?: boolean;
}

export function SortHeader({ label, sortKey, currentSort, onSort, className = '', sortable = true }: SortHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const isAsc = isActive && currentSort?.direction === 'asc';

  if (!sortable) {
    return (
      <th className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
        {label}
      </th>
    );
  }

  return (
    <th className={`px-4 py-3.5 text-left ${className}`}>
      <button
        onClick={() => onSort(sortKey || label)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors group"
      >
        {label}
        <span className={`transition-colors ${isActive ? 'text-brand-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
          {isActive ? (
            isAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronsUpDown className="w-4 h-4" />
          )}
        </span>
      </button>
    </th>
  );
}

// Table Row Component
interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function TableRow({ children, onClick, className = '', disabled = false }: TableRowProps) {
  if (!onClick) {
    return (
      <tr className={`border-b border-slate-100 last:border-b-0 ${className}`}>
        {children}
      </tr>
    );
  }

  return (
    <tr
      onClick={disabled ? undefined : onClick}
      className={`
        border-b border-slate-100 last:border-b-0
        transition-colors duration-150
        ${disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:bg-slate-50 cursor-pointer'
        }
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

// Table Cell Component
interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  truncate?: boolean;
}

export function TableCell({ children, className = '', truncate = false }: TableCellProps) {
  return (
    <td className={`px-4 py-4 text-sm text-slate-700 ${truncate ? 'max-w-xs truncate' : ''} ${className}`}>
      {children}
    </td>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = ''
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-slate-100 ${className}`}>
      {/* Info */}
      <div className="text-sm text-slate-600">
        Showing <span className="font-semibold">{startItem}</span> to{' '}
        <span className="font-semibold">{endItem}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> results
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`
                w-10 h-10 rounded-lg text-sm font-medium transition-all
                ${currentPage === page
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Search Input Component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Filter Chip Component
interface FilterChipProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
}

export function FilterChip({ label, value, onRemove, onClick, active = false }: FilterChipProps) {
  const content = (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {value && <span className="text-slate-500">({value})</span>}
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${active
            ? 'bg-brand-100 text-brand-700 border border-brand-200'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        ${active
          ? 'bg-brand-100 text-brand-700 border border-brand-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200'
        }
      `}
    >
      {content}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
