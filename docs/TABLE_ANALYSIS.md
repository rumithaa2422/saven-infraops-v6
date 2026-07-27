# TABLE COMPONENT ANALYSIS

## Pages with Tables (19 pages)

| # | Page | Table Components Used | CSS Approach | Table Class |
|---|------|---------------------|--------------|-------------|
| 1 | ServiceRequestsPage | TableContainer, SortHeader, TableRow, TableCell | Tailwind | Native `<table>` with DS components |
| 2 | IncidentsPage | TableContainer, SortHeader, TableRow, TableCell | Tailwind | Native `<table>` with DS components |
| 3 | VendorDirectoryPage | None (custom) | Custom CSS | `data-table` class |
| 4 | CompliancePage | None (custom) | Custom CSS | Native `<table>` |
| 5 | InventoryMasterPage | ? | ? | ? |
| 6 | InventoryCategoryPage | ? | ? | ? |
| 7 | AssetManagementPage | ? | ? | ? |
| 8 | ProjectAssetsPage | ? | ? | ? |
| 9 | UsersDashboardPage | ? | ? | ? |
| 10 | DocumentRepositoryPage | ? | ? | ? |
| 11 | ProjectDetailsPage | ? | ? | ? |
| 12 | UserDetailsPage | ? | ? | ? |
| 13 | UserAssetsPage | ? | ? | ? |
| 14 | UsersImportExportPage | ? | ? | ? |
| 15 | VendorDetailsPage | ? | ? | ? |
| 16 | KnowledgeCategoryPage | ? | ? | ? |
| 17 | InventoryAnalyticsPage | ? | ? | ? |
| 18 | ProjectDashboardPage | ? | ? | ? |
| 19 | DesignSystemPreviewPage | ? | ? | ? |

---

## SERVICE REQUESTS PAGE TABLE (STANDARD/BEST)

### Components Used:
```
✓ TableContainer    - Wraps the entire table with loading/empty states
✓ SortHeader       - Clickable column headers with sort icons
✓ TableRow         - Row with hover effects and click handlers
✓ TableCell        - Individual cell with truncation support
✓ Pagination       - Full pagination with page numbers
✓ SearchInput      - Search with clear button
✓ FilterChip       - Active filter display
```

### Table Structure:
```tsx
<TableContainer loading={loading} empty={!loading && paginatedItems.length === 0}>
  <table className="w-full">
    <thead className="bg-slate-50 border-b border-slate-100">
      <tr>
        <SortHeader label="Ticket" sortKey="ticketNo" currentSort={sortConfig} onSort={handleSort} />
        <SortHeader label="Title" sortKey="title" currentSort={sortConfig} onSort={handleSort} />
        ...
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {paginatedItems.map((item) => (
        <TableRow key={item.id} onClick={() => handleOpenTicket(item)}>
          <TableCell>...</TableCell>
          <TableCell truncate>...</TableCell>
          ...
        </TableRow>
      ))}
    </tbody>
  </table>
</TableContainer>

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={sortedItems.length}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
/>
```

### Key Styling:
- Table container: `bg-white rounded-2xl border border-slate-200/60 shadow-sm`
- Table header: `bg-slate-50 border-b border-slate-100`
- Sort headers: `text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-purple-600`
- Table rows: `border-b border-slate-100 last:border-b-0 hover:bg-slate-50`
- Pagination: Bottom border, flex layout with page numbers
- Search: `rounded-xl border-2 border-slate-200 focus:border-purple-400`

---

## VENDOR DIRECTORY PAGE TABLE (DIFFERENT STYLE)

### Components Used:
```
✗ No DS components
✗ Custom HTML table
✗ Custom CSS classes: data-table, vendor-name-cell, contact-cell, actions-cell
```

### Table Structure:
```tsx
<table className="data-table">
  <thead>
    <tr>
      <th onClick={() => handleSort('vendorName')} className="sortable">
        Vendor {sortBy === 'vendorName' && <span className="sort-indicator">↑↓</span>}
      </th>
      ...
    </tr>
  </thead>
  <tbody>
    {vendors.map(vendor => (
      <tr onClick={() => handleViewDetails(vendor)} style={{ cursor: 'pointer' }}>
        <td>
          <div className="vendor-name-cell">
            <strong>{vendor.vendorName}</strong>
            <small>{vendor.vendorCode}</small>
          </div>
        </td>
        ...
      </tr>
    ))}
  </tbody>
</table>
```

### Differences from ServiceRequestsPage:
| Aspect | ServiceRequestsPage | VendorDirectoryPage |
|--------|-------------------|-------------------|
| Container | TableContainer (rounded-2xl, shadow) | None (just `<table>`) |
| Header bg | `bg-slate-50` | Default |
| Row hover | `hover:bg-slate-50` | `cursor: pointer` only |
| Sort indicator | ChevronUp/ChevronDown icons | ↑↓ text |
| Cell styling | TableCell component | Custom div classes |
| Pagination | Custom component | `.pagination` class |
| Empty state | TableContainer built-in | Need to check |

---

## COMPLIANCE PAGE TABLE (YET ANOTHER STYLE)

### Components Used:
```
✗ No DS components
✗ Custom HTML table
✗ Custom CSS: table-wrapper, table-loading, table-empty
```

### Table Structure:
```tsx
<div className="table-wrapper">
  <table>
    <thead>
      <tr>
        <th style={{ width: '40px' }}>
          <input type="checkbox" />
        </th>
        <th>Control List Name</th>
        ...
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr>
          <td colSpan={6} className="table-loading">
            <div className="loading-spinner"></div>
          </td>
        </tr>
      ) : controls.length === 0 ? (
        <tr>
          <td colSpan={6} className="table-empty">
            <FileCheck size={48} />
            <p>No controls found</p>
          </td>
        </tr>
      ) : (
        controls.map(...)
      )}
    </tbody>
  </table>
</div>
```

### Differences:
| Aspect | ServiceRequestsPage | CompliancePage |
|--------|-------------------|----------------|
| Container | TableContainer | `.table-wrapper` |
| Checkbox | Not in header | In header |
| Empty state | Built-in to TableContainer | Custom cell with colspan |
| Loading | Built-in to TableContainer | Custom cell with colspan |
| Sort | SortHeader component | None (static headers) |

---

## ACTION PLAN: Make All Tables Consistent

### Step 1: Identify All Table Components Needed
Located in: `/frontend/src/components/serviceRequests/Table.tsx`

```tsx
export function TableContainer({...})     // Container with rounded corners, shadow
export function SortHeader({...})         // Clickable sort column
export function TableRow({...})          // Row with hover, click
export function TableCell({...})         // Cell with truncate option
export function Pagination({...})        // Full pagination
export function SearchInput({...})      // Search with clear
export function FilterChip({...})       // Active filter display
```

### Step 2: Pages to Update (17 pages - excluding ServiceRequestsPage & IncidentsPage)

1. VendorDirectoryPage
2. CompliancePage
3. InventoryMasterPage
4. InventoryCategoryPage
5. AssetManagementPage
6. ProjectAssetsPage
7. UsersDashboardPage
8. DocumentRepositoryPage
9. ProjectDetailsPage
10. UserDetailsPage
11. UserAssetsPage
12. UsersImportExportPage
13. VendorDetailsPage
14. KnowledgeCategoryPage
15. InventoryAnalyticsPage
16. ProjectDashboardPage
17. (ModulePage - check if has table)

### Step 3: How to Update Each Page

For each page, replace:
```tsx
// OLD (custom table)
<table className="data-table">
  <thead>
    <tr>
      <th onClick={() => handleSort('name')} className="sortable">
        Name {sortBy === 'name' && <span>↑</span>}
      </th>
      ...
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
      <tr onClick={() => handleView(item)}>
        <td>...</td>
      </tr>
    ))}
  </tbody>
</table>
```

With:
```tsx
// NEW (using DS components)
<TableContainer loading={loading} empty={items.length === 0}>
  <table className="w-full">
    <thead className="bg-slate-50 border-b border-slate-100">
      <tr>
        <SortHeader label="Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
        <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
        ...
        <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {items.map(item => (
        <TableRow key={item.id} onClick={() => handleView(item)}>
          <TableCell truncate>...</TableCell>
          <TableCell>...</TableCell>
          <TableCell>
            <div className="flex justify-end">
              {/* Action buttons */}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </tbody>
  </table>
</TableContainer>
```

### Step 4: Replace Pagination

OLD:
```tsx
<div className="pagination">
  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
    Previous
  </button>
  {/* page numbers */}
  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
    Next
  </button>
</div>
```

NEW:
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
/>
```

---

## SUMMARY

### ServiceRequestsPage Table = STANDARD ✅

**Components to use everywhere:**
1. `TableContainer` - wrapper with rounded corners, shadow, loading/empty states
2. `SortHeader` - for sortable column headers
3. `TableRow` - for table rows with hover effects
4. `TableCell` - for cells with optional truncation
5. `Pagination` - for page navigation
6. `SearchInput` - for search functionality
7. `FilterChip` - for displaying active filters

**All 17 other table pages should be updated to use these components.**
