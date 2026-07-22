/**
 * Pagination Component
 * Enterprise Design System V2
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationProps } from './types';
import styles from './Pagination.module.css';

/**
 * Generate page numbers with ellipsis
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
  }

  return pages;
}

/**
 * Pagination component
 */
export function Pagination({
  page,
  pageSize,
  total,
  pageSizes,
  onPageChange,
  onPageSizeChange,
  showTotal = true,
  className = '',
}: PaginationProps): React.ReactElement {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const pageNumbers = useMemo(
    () => generatePageNumbers(page, totalPages),
    [page, totalPages]
  );

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange?.(Number(e.target.value));
    onPageChange(1); // Reset to first page
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav
      className={`${styles.pagination} ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <div className={styles.pagination__info}>
        {showTotal && (
          <span className={styles.pagination__text}>
            Showing {startItem} to {endItem} of {total} results
          </span>
        )}

        {pageSizes && onPageSizeChange && (
          <div className={styles.pagination__select}>
            <label htmlFor="page-size" className={styles.pagination__selectLabel}>
              Rows per page:
            </label>
            <select
              id="page-size"
              className={styles.pagination__selectInput}
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.pagination__controls}>
        {/* First page */}
        <button
          type="button"
          className={styles.pagination__button}
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous page */}
        <button
          type="button"
          className={styles.pagination__button}
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((pageNum, index) =>
          pageNum === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={styles.pagination__ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              type="button"
              className={`${styles.pagination__button} ${
                pageNum === page ? styles['pagination__button--active'] : ''
              }`}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        )}

        {/* Next page */}
        <button
          type="button"
          className={styles.pagination__button}
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page */}
        <button
          type="button"
          className={styles.pagination__button}
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          aria-label="Go to last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
