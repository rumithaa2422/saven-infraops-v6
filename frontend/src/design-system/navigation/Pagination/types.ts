/**
 * Pagination Component Types
 * Enterprise Design System V2
 */

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showTotal?: boolean;
  className?: string;
}

export default PaginationProps;
