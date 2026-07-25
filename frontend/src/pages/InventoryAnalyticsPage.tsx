import { Eye } from 'lucide-react';
import {
  TableContainer,
  SortHeader,
  TableRow,
  TableCell
} from '../components/serviceRequests';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type AnalyticsData = {
  summary: {
    totalInventory: number;
    available: number;
    allocated: number;
    lowStock: number;
    expired: number;
    warrantyExpiring: number;
  };
  byCategory: Record<string, number>;
  bySubcategory: Record<string, number>;
  byLocation: Record<string, number>;
  byStatus: Record<string, number>;
  warrantyExpiry: {
    active: number;
    expiring30: number;
    expired: number;
    noWarranty: number;
  };
  stockTrend: { month: string; count: number }[];
  insights: {
    itemsExpiringThisMonth: number;
    lowStockItems: { id: string; itemName: string; currentQty: number; minStock: number }[];
    itemsWithoutWarranty: number;
    recentlyAdded: number;
    mostUsedCategories: { name: string; count: number }[];
  };
  filters: {
    categories: string[];
    subcategories: string[];
    locations: string[];
    vendors: string[];
    statuses: string[];
  };
};

type InventoryItem = {
  id: string;
  itemNo: string;
  itemName: string;
  brand?: string;
  model?: string;
  vendor?: string;
  location?: string;
  currentQty: number;
  minStock?: number;
  status: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
};

export function InventoryAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isEmployee = !isSuperAdmin && !isAdmin;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    location: '',
    vendor: '',
    status: '',
    warranty: ''
  });
  const [sortBy, setSortBy] = useState('itemName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showInsights, setShowInsights] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Sort config for table headers
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'itemName',
    direction: 'asc'
  });

  function handleSort(key: string) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    performSearch();
  }, [activeFilters, sortBy, sortOrder]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await api.get('/inventory/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function performSearch() {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (activeFilters.search) params.set('search', activeFilters.search);
      if (activeFilters.category) params.set('category', activeFilters.category);
      if (activeFilters.subcategory) params.set('subcategory', activeFilters.subcategory);
      if (activeFilters.location) params.set('location', activeFilters.location);
      if (activeFilters.vendor) params.set('vendor', activeFilters.vendor);
      if (activeFilters.status) params.set('status', activeFilters.status);
      if (activeFilters.warranty) params.set('warranty', activeFilters.warranty);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await api.get(`/inventory/analytics/search?${params.toString()}`);
      setSearchResults(res.data.items);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }

  function getChartData(data: Record<string, number>, color: string = '#6366f1') {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      color
    }));
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getActiveFilterCount() {
    return Object.values(activeFilters).filter(v => v).length;
  }

  function clearFilters() {
    setActiveFilters({
      search: '',
      category: '',
      subcategory: '',
      location: '',
      vendor: '',
      status: '',
      warranty: ''
    });
  }

  if (isEmployee) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Access Restricted. You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="skeleton" style={{ width: '200px', height: '32px' }}></div>
        </div>
        <div className="summary-cards-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="summary-card">
              <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
              <div className="summary-card-content">
                <div className="skeleton" style={{ width: '80px', height: '14px' }}></div>
                <div className="skeleton" style={{ width: '40px', height: '24px', marginTop: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categoryChartData = analytics ? getChartData(analytics.byCategory) : [];
  const subcategoryChartData = analytics ? getChartData(analytics.bySubcategory, '#8b5cf6') : [];
  const locationChartData = analytics ? getChartData(analytics.byLocation, '#06b6d4') : [];
  const statusChartData = analytics ? getChartData(analytics.byStatus, '#f59e0b') : [];

  return (
    <div className="workspace">
      <div className="page-stack inventory-analytics">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <h1 className="page-header-title">Inventory Analytics</h1>
              <p className="page-header-subtitle">Real-time insights and inventory overview</p>
            </div>
          </div>
          <div className="page-header-actions">
            <button className="btn-secondary" onClick={() => setShowInsights(!showInsights)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Insights
            </button>
            <button className="btn-primary" onClick={() => navigate('/inventory')}>
              View Inventory
            </button>
          </div>
        </div>

        {/* Summary Cards */}
      {analytics && (
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="summary-card-icon total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Total Inventory</span>
              <span className="summary-card-value">{analytics.summary.totalInventory}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon available">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Available</span>
              <span className="summary-card-value">{analytics.summary.available}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon allocated">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55332C18.7122 5.25592 19.0078 6.12183 19.0078 7.01C19.0078 7.89817 18.7122 8.76408 18.1676 9.46669C17.623 10.1693 16.8604 10.6697 16 10.89" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Allocated</span>
              <span className="summary-card-value">{analytics.summary.allocated}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon low">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.74C2.88 20.92 3.23 21.01 3.59 21.01H20.41C20.77 21.01 21.12 20.92 21.43 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.94 2.85C11.58 2.85 11.23 2.94 10.92 3.12C10.61 3.3 10.35 3.56 10.17 3.86L10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Low Stock</span>
              <span className="summary-card-value">{analytics.summary.lowStock}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon expired">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Warranty Expired</span>
              <span className="summary-card-value">{analytics.summary.expired}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon expiring">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Warranty Expiring</span>
              <span className="summary-card-value">{analytics.summary.warrantyExpiring}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Insights Panel */}
      {showInsights && analytics && (
        <div className="insights-panel">
          <div className="insights-header">
            <h3>Quick Insights</h3>
            <button className="btn-icon" onClick={() => setShowInsights(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="insight-content">
                <span className="insight-value">{analytics.insights.itemsExpiringThisMonth}</span>
                <span className="insight-label">Expiring this month</span>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon danger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.74C2.88 20.92 3.23 21.01 3.59 21.01H20.41C20.77 21.01 21.12 20.92 21.43 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.94 2.85C11.58 2.85 11.23 2.94 10.92 3.12C10.61 3.3 10.35 3.56 10.17 3.86L10.29 3.86Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="insight-content">
                <span className="insight-value">{analytics.insights.lowStockItems.length}</span>
                <span className="insight-label">Low stock items</span>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="insight-content">
                <span className="insight-value">{analytics.insights.itemsWithoutWarranty}</span>
                <span className="insight-label">Without warranty</span>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="insight-content">
                <span className="insight-value">{analytics.insights.recentlyAdded}</span>
                <span className="insight-label">Added this week</span>
              </div>
            </div>
          </div>

          {analytics.insights.lowStockItems.length > 0 && (
            <div className="insight-detail">
              <h4>Low Stock Items</h4>
              <div className="low-stock-list">
                {analytics.insights.lowStockItems.slice(0, 5).map(item => (
                  <Link key={item.id} to={`/inventory/master/${item.id}`} className="low-stock-item">
                    <span className="low-stock-name">{item.itemName}</span>
                    <span className="low-stock-qty">{item.currentQty} / {item.minStock}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {analytics.insights.mostUsedCategories.length > 0 && (
            <div className="insight-detail">
              <h4>Most Used Categories</h4>
              <div className="category-list">
                {analytics.insights.mostUsedCategories.map((cat, idx) => (
                  <div key={cat.name} className="category-item">
                    <span className="category-rank">#{idx + 1}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* By Category */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>By Category</h3>
          </div>
          <div className="chart-body">
            {categoryChartData.length > 0 ? (
              <div className="bar-chart">
                {categoryChartData.slice(0, 6).map((item, idx) => (
                  <div key={item.label} className="bar-item">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: `hsl(239, 84%, ${60 - idx * 5}%)`
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-empty">No data</div>
            )}
          </div>
        </div>

        {/* By Status */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>By Status</h3>
          </div>
          <div className="chart-body">
            {statusChartData.length > 0 ? (
              <div className="donut-chart-container">
                <div className="donut-chart">
                  {statusChartData.map((item, idx) => (
                    <div
                      key={item.label}
                      className="donut-segment"
                      style={{
                        '--offset': statusChartData.slice(0, idx).reduce((sum, d) => sum + parseFloat(d.percentage), 0),
                        '--value': item.percentage,
                        '--color': item.color
                      } as React.CSSProperties}
                    ></div>
                  ))}
                </div>
                <div className="donut-legend">
                  {statusChartData.map(item => (
                    <div key={item.label} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.label}</span>
                      <span className="legend-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chart-empty">No data</div>
            )}
          </div>
        </div>

        {/* Warranty Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Warranty Status</h3>
          </div>
          <div className="chart-body">
            {analytics && (
              <div className="warranty-chart">
                <div className="warranty-item">
                  <span className="warranty-dot active"></span>
                  <span className="warranty-label">Active</span>
                  <span className="warranty-value">{analytics.warrantyExpiry.active}</span>
                </div>
                <div className="warranty-item">
                  <span className="warranty-dot expiring"></span>
                  <span className="warranty-label">Expiring Soon</span>
                  <span className="warranty-value">{analytics.warrantyExpiry.expiring30}</span>
                </div>
                <div className="warranty-item">
                  <span className="warranty-dot expired"></span>
                  <span className="warranty-label">Expired</span>
                  <span className="warranty-value">{analytics.warrantyExpiry.expired}</span>
                </div>
                <div className="warranty-item">
                  <span className="warranty-dot none"></span>
                  <span className="warranty-label">No Warranty</span>
                  <span className="warranty-value">{analytics.warrantyExpiry.noWarranty}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* By Location */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>By Location</h3>
          </div>
          <div className="chart-body">
            {locationChartData.length > 0 ? (
              <div className="bar-chart horizontal">
                {locationChartData.slice(0, 5).map((item) => (
                  <div key={item.label} className="bar-item">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${item.percentage}%`, backgroundColor: '#06b6d4' }}></div>
                    </div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-empty">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="search-toolbar">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, brand, model, vendor, invoice..."
              value={activeFilters.search}
              onChange={(e) => setActiveFilters({ ...activeFilters, search: e.target.value })}
            />
          </div>
          <div className="toolbar-actions">
            <button 
              className={`icon-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Filters {getActiveFilterCount() > 0 && <span className="filter-badge">{getActiveFilterCount()}</span>}
            </button>
            <select 
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="sort-select"
            >
              <option value="itemName_asc">Name A-Z</option>
              <option value="itemName_desc">Name Z-A</option>
              <option value="purchaseDate_desc">Purchase Newest</option>
              <option value="purchaseDate_asc">Purchase Oldest</option>
              <option value="warrantyExpiry_asc">Warranty Earliest</option>
              <option value="warrantyExpiry_desc">Warranty Latest</option>
              <option value="currentQty_desc">Qty High-Low</option>
              <option value="currentQty_asc">Qty Low-High</option>
              <option value="vendor_asc">Vendor A-Z</option>
              <option value="location_asc">Location A-Z</option>
            </select>
            {getActiveFilterCount() > 0 && (
              <button className="btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && analytics && (
          <div className="filter-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={activeFilters.category}
                  onChange={(e) => setActiveFilters({ ...activeFilters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {analytics.filters.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Location</label>
                <select
                  value={activeFilters.location}
                  onChange={(e) => setActiveFilters({ ...activeFilters, location: e.target.value })}
                >
                  <option value="">All Locations</option>
                  {analytics.filters.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Vendor</label>
                <select
                  value={activeFilters.vendor}
                  onChange={(e) => setActiveFilters({ ...activeFilters, vendor: e.target.value })}
                >
                  <option value="">All Vendors</option>
                  {analytics.filters.vendors.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={activeFilters.status}
                  onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  {analytics.filters.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Warranty</label>
                <select
                  value={activeFilters.warranty}
                  onChange={(e) => setActiveFilters({ ...activeFilters, warranty: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="none">No Warranty</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="results-section">
          <div className="results-header">
            <span className="results-count">
              {searching ? 'Searching...' : `${searchResults.length} items found`}
            </span>
          </div>
          {searchResults.length > 0 ? (
            <TableContainer loading={searching} empty={searchResults.length === 0} emptyTitle="No items found" emptyDescription="Try adjusting your search criteria">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <SortHeader label="Item No" sortKey="itemNo" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Item Name" sortKey="itemName" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Location" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Vendor" sortKey="vendor" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Qty" sortKey="currentQty" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                    <SortHeader label="Warranty" sortKey="warrantyExpiry" currentSort={sortConfig} onSort={handleSort} />
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchResults.slice(0, 20).map(item => (
                    <TableRow key={item.id} onClick={() => navigate(`/inventory/master/${item.id}`)}>
                      <TableCell>
                        <span className="font-mono text-sm text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                          {item.itemNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-900">{item.itemName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.category.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.location || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.vendor || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${item.minStock && item.currentQty < item.minStock ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                          {item.currentQty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${
                          item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                          item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{formatDate(item.warrantyExpiry)}</span>
                      </TableCell>
                      <TableCell>
                        <button 
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                          onClick={(e) => { e.stopPropagation(); navigate(`/inventory/master/${item.id}`); }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          ) : (
            <div className="results-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p>No inventory items found</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
