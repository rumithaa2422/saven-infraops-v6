/**
 * Enterprise Experience Lab
 * Design System V2 - Hero Section
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Sun,
  Moon,
  Monitor,
  Layers,
  Palette,
  Zap,
  Shield,
  Database,
  Code2,
  Layout,
  ArrowRight,
  ExternalLink,
  Home,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  User,
  Ticket,
  AlertTriangle,
  FileText,
  Plus,
  MoreHorizontal,
  Filter,
  Bell,
  Settings,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  Download,
  Upload,
  RotateCw,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
  ArrowUpDown,
  Tag,
  MessageSquare,
  File,
  History,
  Link2,
  Users,
  Send,
  Paperclip,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';

import styles from './DesignSystemPreviewPage.module.css';

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export function DesignSystemPreviewPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [density, setDensity] = useState<'compact' | 'default' | 'comfortable'>('default');
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg'>('md');
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      icon: Layers,
      title: 'Component Library',
      description: '50+ production-ready components with consistent styling and behavior.',
    },
    {
      icon: Palette,
      title: 'Design Tokens',
      description: 'Centralized design tokens for colors, typography, spacing, and shadows.',
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Optimized components with minimal bundle size and fast rendering.',
    },
    {
      icon: Shield,
      title: 'Accessibility',
      description: 'WCAG 2.1 compliant components with full keyboard and screen reader support.',
    },
    {
      icon: Database,
      title: 'Data Display',
      description: 'Advanced tables, timelines, and activity feeds for enterprise data.',
    },
    {
      icon: Code2,
      title: 'TypeScript',
      description: 'Full TypeScript support with comprehensive type definitions.',
    },
  ];

  return (
    <div className={styles.lab}>
      <div className={styles.heroContainer}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.logo}>
              <Sparkles size={24} />
            </div>
            <span className={styles.versionBadge}>v2.0.0</span>
          </div>
          <div className={styles.topBarRight}>
            {/* Future: GitHub link, documentation link, etc. */}
          </div>
        </div>

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Enterprise <span className={styles.heroTitleGradient}>Experience Lab</span>
          </h1>
          <p className={styles.heroDescription}>
            A modern, production-ready design system built for enterprise applications.
            Explore our component library, customize themes, and build beautiful interfaces.
          </p>
        </div>

        {/* Stats */}
        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>50+</div>
            <div className={styles.statLabel}>Components</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>100%</div>
            <div className={styles.statLabel}>TypeScript</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>WCAG</div>
            <div className={styles.statLabel}>Accessible</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>4.2kb</div>
            <div className={styles.statLabel}>Gzipped</div>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search components, tokens, or documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.searchShortcut}>
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className={styles.controlPanel}>
          {/* Theme Toggle */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Theme</span>
            <div className={styles.themeToggle}>
              <button
                type="button"
                className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={16} />
                Light
              </button>
              <button
                type="button"
                className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={16} />
                Dark
              </button>
              <button
                type="button"
                className={`${styles.themeOption} ${theme === 'system' ? styles.active : ''}`}
                onClick={() => setTheme('system')}
              >
                <Monitor size={16} />
                System
              </button>
            </div>
          </div>

          {/* Density Selector */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Density</span>
            <div className={styles.densitySelector}>
              <button
                type="button"
                className={`${styles.densityOption} ${styles.compact} ${density === 'compact' ? styles.active : ''}`}
                onClick={() => setDensity('compact')}
                title="Compact"
              >
                <div className={styles.densityDots}>
                  <span /><span /><span />
                </div>
              </button>
              <button
                type="button"
                className={`${styles.densityOption} ${density === 'default' ? styles.active : ''}`}
                onClick={() => setDensity('default')}
                title="Default"
              >
                <div className={styles.densityDots}>
                  <span /><span /><span />
                </div>
              </button>
              <button
                type="button"
                className={`${styles.densityOption} ${styles.comfortable} ${density === 'comfortable' ? styles.active : ''}`}
                onClick={() => setDensity('comfortable')}
                title="Comfortable"
              >
                <div className={styles.densityDots}>
                  <span /><span /><span />
                </div>
              </button>
            </div>
          </div>

          {/* Border Radius Selector */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Border Radius</span>
            <div className={styles.radiusSelector}>
              <button
                type="button"
                className={`${styles.radiusOption} ${borderRadius === 'none' ? styles.active : ''}`}
                onClick={() => setBorderRadius('none')}
                title="None"
              >
                <div className={styles.radiusPreview} style={{ width: 16, height: 16, borderRadius: 0 }} />
              </button>
              <button
                type="button"
                className={`${styles.radiusOption} ${borderRadius === 'sm' ? styles.active : ''}`}
                onClick={() => setBorderRadius('sm')}
                title="Small"
              >
                <div className={styles.radiusPreview} style={{ width: 16, height: 16, borderRadius: 4 }} />
              </button>
              <button
                type="button"
                className={`${styles.radiusOption} ${borderRadius === 'md' ? styles.active : ''}`}
                onClick={() => setBorderRadius('md')}
                title="Medium"
              >
                <div className={styles.radiusPreview} style={{ width: 16, height: 16, borderRadius: 8 }} />
              </button>
              <button
                type="button"
                className={`${styles.radiusOption} ${borderRadius === 'lg' ? styles.active : ''}`}
                onClick={() => setBorderRadius('lg')}
                title="Large"
              >
                <div className={styles.radiusPreview} style={{ width: 16, height: 16, borderRadius: 12 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className={styles.featureCards}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <feature.icon size={24} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaButtons}>
            <button type="button" className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}>
              <Layout size={18} />
              Explore Components
              <ArrowRight size={16} />
            </button>
            <button type="button" className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}>
              <Code2 size={18} />
              View Documentation
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE DASHBOARD PREVIEW */}
      {/* ============================================ */}
      <div className={styles.dashboard}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.breadcrumb}>
            <a href="#" className={styles.breadcrumbLink}><Home size={14} /></a>
            <ChevronRight size={12} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>Dashboard</span>
          </div>
          <div className={styles.dashboardActions}>
            <button type="button" className={styles.iconButton} title="Notifications">
              <Bell size={16} />
              <span className={styles.notificationBadge}>3</span>
            </button>
            <button type="button" className={styles.iconButton} title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div className={styles.pageTitle}>
          <h2 className={styles.pageTitleText}>Welcome back, Sarah</h2>
          <p className={styles.pageTitleSub}>Here's what's happening with your projects today.</p>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Active Requests</span>
              <Ticket size={14} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiValue}>47</div>
            <div className={styles.kpiTrend}>
              <span className={styles.kpiTrendUp}>
                <ArrowUpRight size={12} /> 12%
              </span>
              <span className={styles.kpiTrendPeriod}>from last week</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Open Incidents</span>
              <AlertCircle size={14} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiValue}>8</div>
            <div className={styles.kpiTrend}>
              <span className={styles.kpiTrendDown}>
                <ArrowDownRight size={12} /> 3%
              </span>
              <span className={styles.kpiTrendPeriod}>from last week</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Pending Approvals</span>
              <Clock size={14} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiValue}>15</div>
            <div className={styles.kpiTrend}>
              <span className={styles.kpiTrendNeutral}>
                <Minus size={12} /> 0%
              </span>
              <span className={styles.kpiTrendPeriod}>no change</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Resolved Today</span>
              <CheckCircle2 size={14} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiValue}>23</div>
            <div className={styles.kpiTrend}>
              <span className={styles.kpiTrendUp}>
                <ArrowUpRight size={12} /> 8%
              </span>
              <span className={styles.kpiTrendPeriod}>from yesterday</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.dashboardGrid}>
          {/* Charts Section */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Request Volume</h3>
              <div className={styles.cardActions}>
                <button type="button" className={styles.cardAction}>7 Days</button>
                <button type="button" className={styles.cardAction}>30 Days</button>
              </div>
            </div>
            <div className={styles.chartPlaceholder}>
              <div className={styles.chartBars}>
                <div className={styles.chartBar} style={{ height: '45%' }} />
                <div className={styles.chartBar} style={{ height: '65%' }} />
                <div className={styles.chartBar} style={{ height: '55%' }} />
                <div className={styles.chartBar} style={{ height: '80%' }} />
                <div className={styles.chartBar} style={{ height: '70%' }} />
                <div className={styles.chartBar} style={{ height: '90%' }} />
                <div className={styles.chartBar} style={{ height: '75%' }} />
              </div>
              <div className={styles.chartLabels}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Quick Actions</h3>
            </div>
            <div className={styles.quickActions}>
              <button type="button" className={styles.quickAction}>
                <div className={styles.quickActionIcon}><Plus size={14} /></div>
                <span>New Request</span>
              </button>
              <button type="button" className={styles.quickAction}>
                <div className={styles.quickActionIcon}><FileText size={14} /></div>
                <span>Create Report</span>
              </button>
              <button type="button" className={styles.quickAction}>
                <div className={styles.quickActionIcon}><Calendar size={14} /></div>
                <span>Schedule Task</span>
              </button>
              <button type="button" className={styles.quickAction}>
                <div className={styles.quickActionIcon}><User size={14} /></div>
                <span>Assign User</span>
              </button>
            </div>
          </div>

          {/* My Work */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>My Work</h3>
              <button type="button" className={styles.cardAction}>View All</button>
            </div>
            <div className={styles.workList}>
              <div className={styles.workItem}>
                <div className={styles.workItemPriority} data-priority="high" />
                <div className={styles.workItemContent}>
                  <span className={styles.workItemTitle}>SR-1234: Login authentication issue</span>
                  <span className={styles.workItemMeta}>Due in 2 hours • High Priority</span>
                </div>
                <button type="button" className={styles.workItemAction}><MoreHorizontal size={14} /></button>
              </div>
              <div className={styles.workItem}>
                <div className={styles.workItemPriority} data-priority="medium" />
                <div className={styles.workItemContent}>
                  <span className={styles.workItemTitle}>SR-1235: Dashboard loading slow</span>
                  <span className={styles.workItemMeta}>Due tomorrow • Medium Priority</span>
                </div>
                <button type="button" className={styles.workItemAction}><MoreHorizontal size={14} /></button>
              </div>
              <div className={styles.workItem}>
                <div className={styles.workItemPriority} data-priority="low" />
                <div className={styles.workItemContent}>
                  <span className={styles.workItemTitle}>SR-1236: Update user profile photo</span>
                  <span className={styles.workItemMeta}>Due in 3 days • Low Priority</span>
                </div>
                <button type="button" className={styles.workItemAction}><MoreHorizontal size={14} /></button>
              </div>
              <div className={styles.workItem}>
                <div className={styles.workItemPriority} data-priority="medium" />
                <div className={styles.workItemContent}>
                  <span className={styles.workItemTitle}>SR-1237: Export data to CSV</span>
                  <span className={styles.workItemMeta}>Due in 5 days • Medium Priority</span>
                </div>
                <button type="button" className={styles.workItemAction}><MoreHorizontal size={14} /></button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Alerts</h3>
              <span className={styles.alertBadge}>4 new</span>
            </div>
            <div className={styles.alertList}>
              <div className={styles.alertItem}>
                <AlertTriangle size={14} className={styles.alertIconWarning} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>3 licenses expiring within 30 days</span>
                  <span className={styles.alertTime}>2 hours ago</span>
                </div>
              </div>
              <div className={styles.alertItem}>
                <AlertCircle size={14} className={styles.alertIconError} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>Server SR-4567 exceeded SLA</span>
                  <span className={styles.alertTime}>5 hours ago</span>
                </div>
              </div>
              <div className={styles.alertItem}>
                <Bell size={14} className={styles.alertIconInfo} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>New comment on SR-890</span>
                  <span className={styles.alertTime}>Yesterday</span>
                </div>
              </div>
              <div className={styles.alertItem}>
                <CheckCircle2 size={14} className={styles.alertIconSuccess} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>Incident INC-234 resolved</span>
                  <span className={styles.alertTime}>Yesterday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              <button type="button" className={styles.cardAction}>View All</button>
            </div>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar}>JD</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>John D.</strong> updated SR-1234 status to In Progress</span>
                  <span className={styles.activityTime}>15 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar}>MK</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Mary K.</strong> commented on INC-567</span>
                  <span className={styles.activityTime}>32 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar}>RS</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Robert S.</strong> assigned SR-890 to you</span>
                  <span className={styles.activityTime}>1 hour ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar}>AL</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Anna L.</strong> created new inventory item</span>
                  <span className={styles.activityTime}>2 hours ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar}>TW</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Tom W.</strong> resolved SR-456</span>
                  <span className={styles.activityTime}>3 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Workload */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Team Workload</h3>
              <button type="button" className={styles.cardAction}><Filter size={12} /></button>
            </div>
            <div className={styles.teamList}>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar}>JD</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>John Doe</span>
                  <span className={styles.teamRole}>Support Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} style={{ width: '75%' }} />
                  </div>
                  <span className={styles.workloadCount}>12</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar}>MK</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Mary Kim</span>
                  <span className={styles.teamRole}>Senior Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} style={{ width: '45%' }} />
                  </div>
                  <span className={styles.workloadCount}>7</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar}>RS</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Robert Smith</span>
                  <span className={styles.teamRole}>IT Manager</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} style={{ width: '30%' }} />
                  </div>
                  <span className={styles.workloadCount}>4</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar}>AL</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Anna Lee</span>
                  <span className={styles.teamRole}>Support Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} style={{ width: '85%' }} />
                  </div>
                  <span className={styles.workloadCount}>15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE LIST PAGE PREVIEW */}
      {/* ============================================ */}
      <div className={styles.listPage}>
        {/* Page Header */}
        <div className={styles.listHeader}>
          <div className={styles.breadcrumb}>
            <a href="#" className={styles.breadcrumbLink}><Home size={14} /></a>
            <ChevronRight size={12} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>Service Requests</span>
          </div>
          <div className={styles.listActions}>
            <button type="button" className={styles.listActionButton}>
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Page Title Row */}
        <div className={styles.listTitleRow}>
          <div className={styles.listTitleInfo}>
            <h1 className={styles.listTitle}>Service Requests</h1>
            <p className={styles.listSubtitle}>Manage and track all service requests</p>
          </div>
          <button type="button" className={styles.createButton}>
            <Plus size={14} />
            New Request
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {/* Search */}
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search requests..."
              />
            </div>

            {/* Filter Dropdown */}
            <div className={styles.dropdown}>
              <button type="button" className={styles.dropdownTrigger}>
                <Filter size={14} />
                Status
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.dropdown}>
              <button type="button" className={styles.dropdownTrigger}>
                <ArrowUpDown size={14} />
                Sort by
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            {/* Selection Count */}
            <span className={styles.selectionCount}>0 selected</span>

            {/* Toolbar Actions */}
            <button type="button" className={styles.toolbarButton} title="Export">
              <Download size={14} />
              <span>Export</span>
            </button>
            <button type="button" className={styles.toolbarButton} title="Import">
              <Upload size={14} />
              <span>Import</span>
            </button>
            <button type="button" className={styles.toolbarButton} title="Refresh">
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total</span>
            <span className={styles.summaryValue}>156</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Open</span>
            <span className={styles.summaryValue}>45</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Pending</span>
            <span className={styles.summaryValue}>23</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Resolved</span>
            <span className={styles.summaryValue}>88</span>
          </div>
        </div>

        {/* Table Container */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.thCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </th>
                <th className={styles.thSortable}>
                  <span>ID</span>
                  <button type="button" className={styles.sortButton}><ArrowUp size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Title</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Status</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Priority</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Category</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Assigned To</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thSortable}>
                  <span>Created</span>
                  <button type="button" className={styles.sortButton}><ChevronsUpDown size={12} /></button>
                </th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              <tr className={styles.tableRow}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </td>
                <td className={styles.tdId}>SR-0156</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>Unable to login to the system</span>
                  <span className={styles.rowSubtitle}>User cannot access their account</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="open">Open</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="high">High</span>
                </td>
                <td className={styles.tdCategory}>Authentication</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>JD</span>
                    <span>John Doe</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 15, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              <tr className={`${styles.tableRow} ${styles.tableRowSelected}`}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} defaultChecked />
                </td>
                <td className={styles.tdId}>SR-0155</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>Password reset request</span>
                  <span className={styles.rowSubtitle}>User forgot their password</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="in-progress">In Progress</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="medium">Medium</span>
                </td>
                <td className={styles.tdCategory}>Account</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>MK</span>
                    <span>Mary Kim</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 14, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </td>
                <td className={styles.tdId}>SR-0154</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>Email not syncing</span>
                  <span className={styles.rowSubtitle}>Outlook connection issues</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="pending">Pending</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="low">Low</span>
                </td>
                <td className={styles.tdCategory}>Email</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>RS</span>
                    <span>Robert Smith</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 13, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </td>
                <td className={styles.tdId}>SR-0153</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>VPN connection unstable</span>
                  <span className={styles.rowSubtitle}>Frequent disconnections</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="resolved">Resolved</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="high">High</span>
                </td>
                <td className={styles.tdCategory}>Network</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>AL</span>
                    <span>Anna Lee</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 12, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </td>
                <td className={styles.tdId}>SR-0152</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>Software installation request</span>
                  <span className={styles.rowSubtitle}>Need Adobe Creative Suite</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="closed">Closed</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="medium">Medium</span>
                </td>
                <td className={styles.tdCategory}>Software</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>TW</span>
                    <span>Tom Wilson</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 11, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.tdCheckbox}>
                  <input type="checkbox" className={styles.checkbox} />
                </td>
                <td className={styles.tdId}>SR-0151</td>
                <td className={styles.tdTitle}>
                  <span className={styles.rowTitle}>Printer not working</span>
                  <span className={styles.rowSubtitle}>Office floor 3 printer</span>
                </td>
                <td className={styles.tdStatus}>
                  <span className={styles.statusBadge} data-status="open">Open</span>
                </td>
                <td className={styles.tdPriority}>
                  <span className={styles.priorityBadge} data-priority="low">Low</span>
                </td>
                <td className={styles.tdCategory}>Hardware</td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>JD</span>
                    <span>John Doe</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 10, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing <strong>1-10</strong> of <strong>156</strong> results
          </div>
          <div className={styles.paginationControls}>
            <button type="button" className={styles.paginationButton} disabled>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button type="button" className={`${styles.paginationButton} ${styles.paginationActive}`}>1</button>
            <button type="button" className={styles.paginationButton}>2</button>
            <button type="button" className={styles.paginationButton}>3</button>
            <span className={styles.paginationEllipsis}>...</span>
            <button type="button" className={styles.paginationButton}>16</button>
            <button type="button" className={styles.paginationButton}>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.paginationSize}>
            <span>Rows per page:</span>
            <select className={styles.paginationSelect}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE DETAIL PAGE PREVIEW */}
      {/* ============================================ */}
      <div className={styles.detailPage}>
        {/* Breadcrumb */}
        <div className={styles.detailBreadcrumb}>
          <a href="#" className={styles.breadcrumbLink}><Home size={14} /></a>
          <ChevronRight size={12} className={styles.breadcrumbSep} />
          <a href="#" className={styles.breadcrumbLink}>Service Requests</a>
          <ChevronRight size={12} className={styles.breadcrumbSep} />
          <span className={styles.breadcrumbCurrent}>SR-0156</span>
        </div>

        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            <div className={styles.detailHeaderTop}>
              <span className={styles.detailStatusBadge} data-status="open">Open</span>
              <span className={styles.detailId}>SR-0156</span>
            </div>
            <h1 className={styles.detailTitle}>Unable to login to the system</h1>
            <div className={styles.detailMeta}>
              <span className={styles.metaItem}>
                <User size={12} />
                John Doe
              </span>
              <span className={styles.metaSep}>·</span>
              <span className={styles.metaItem}>
                <Calendar size={12} />
                Created Jan 15, 2024
              </span>
              <span className={styles.metaSep}>·</span>
              <span className={styles.metaItem}>
                <Clock size={12} />
                Updated 2 hours ago
              </span>
            </div>
          </div>
          <div className={styles.detailHeaderRight}>
            <button type="button" className={styles.detailAction}>
              <Edit2 size={14} />
              Edit
            </button>
            <button type="button" className={styles.detailAction}>
              <Download size={14} />
              Export
            </button>
            <button type="button" className={`${styles.detailAction} ${styles.detailActionDanger}`}>
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.detailTabs}>
          <button type="button" className={`${styles.detailTab} ${styles.detailTabActive}`}>Details</button>
          <button type="button" className={styles.detailTab}>Timeline</button>
          <button type="button" className={styles.detailTab}>Activity</button>
          <button type="button" className={styles.detailTab}>Documents <span className={styles.tabBadge}>2</span></button>
          <button type="button" className={styles.detailTab}>Comments <span className={styles.tabBadge}>5</span></button>
          <button type="button" className={styles.detailTab}>Assignments</button>
          <button type="button" className={styles.detailTab}>Related</button>
        </div>

        {/* Content Grid */}
        <div className={styles.detailContent}>
          {/* Main Content */}
          <div className={styles.detailMain}>
            {/* Description */}
            <div className={styles.detailCard}>
              <h3 className={styles.cardTitle}>Description</h3>
              <p className={styles.detailDescription}>
                User is unable to login to the corporate system. The user reports that they receive an "Invalid credentials" error even though they are using the correct username and password. This issue started after the password reset was performed yesterday.
              </p>
            </div>

            {/* Details Grid */}
            <div className={styles.detailCard}>
              <h3 className={styles.cardTitle}>Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Category</span>
                  <span className={styles.detailValue}>Authentication</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Priority</span>
                  <span className={styles.priorityBadgeInline} data-priority="high">High</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Assignee</span>
                  <div className={styles.assigneeInline}>
                    <span className={styles.assigneeAvatarSmall}>JD</span>
                    John Doe
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Requester</span>
                  <div className={styles.assigneeInline}>
                    <span className={styles.assigneeAvatarSmall}>MK</span>
                    Mary Kim
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Impact</span>
                  <span className={styles.detailValue}>Medium</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Due Date</span>
                  <span className={styles.detailValue}>Jan 20, 2024</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tags</span>
                  <div className={styles.tagList}>
                    <span className={styles.tag}>urgent</span>
                    <span className={styles.tag}>login</span>
                    <span className={styles.tag}>authentication</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Records */}
            <div className={styles.detailCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>Related Records</h3>
                <button type="button" className={styles.addButton}>
                  <Plus size={12} />
                  Add
                </button>
              </div>
              <div className={styles.relatedList}>
                <div className={styles.relatedItem}>
                  <Link2 size={14} className={styles.relatedIcon} />
                  <span className={styles.relatedType}>Incident</span>
                  <span className={styles.relatedId}>INC-456</span>
                  <span className={styles.relatedTitle}>Server authentication timeout</span>
                </div>
                <div className={styles.relatedItem}>
                  <Link2 size={14} className={styles.relatedIcon} />
                  <span className={styles.relatedType}>SR</span>
                  <span className={styles.relatedId}>SR-0155</span>
                  <span className={styles.relatedTitle}>Password reset request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.detailSidebar}>
            {/* Status Update */}
            <div className={styles.detailCard}>
              <h3 className={styles.cardTitle}>Update Status</h3>
              <div className={styles.statusOptions}>
                <label className={styles.statusOption}>
                  <input type="radio" name="status" defaultChecked />
                  <span className={styles.statusRadio} />
                  Open
                </label>
                <label className={styles.statusOption}>
                  <input type="radio" name="status" />
                  <span className={styles.statusRadio} />
                  In Progress
                </label>
                <label className={styles.statusOption}>
                  <input type="radio" name="status" />
                  <span className={styles.statusRadio} />
                  Pending
                </label>
                <label className={styles.statusOption}>
                  <input type="radio" name="status" />
                  <span className={styles.statusRadio} />
                  Resolved
                </label>
                <label className={styles.statusOption}>
                  <input type="radio" name="status" />
                  <span className={styles.statusRadio} />
                  Closed
                </label>
              </div>
              <button type="button" className={styles.updateButton}>Update Status</button>
            </div>

            {/* Timeline */}
            <div className={styles.detailCard}>
              <h3 className={styles.cardTitle}>Timeline</h3>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Status changed to Open</span>
                    <span className={styles.timelineMeta}>by John Doe · 2 hours ago</span>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Assigned to John Doe</span>
                    <span className={styles.timelineMeta}>by System · 3 hours ago</span>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Request created</span>
                    <span className={styles.timelineMeta}>by Mary Kim · 3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className={styles.detailCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>Team</h3>
                <button type="button" className={styles.addButton}>
                  <Plus size={12} />
                  Add
                </button>
              </div>
              <div className={styles.teamList}>
                <div className={styles.teamMember}>
                  <span className={styles.teamAvatar}>JD</span>
                  <div className={styles.teamInfo}>
                    <span className={styles.teamName}>John Doe</span>
                    <span className={styles.teamRole}>Assignee</span>
                  </div>
                </div>
                <div className={styles.teamMember}>
                  <span className={styles.teamAvatar}>MK</span>
                  <div className={styles.teamInfo}>
                    <span className={styles.teamName}>Mary Kim</span>
                    <span className={styles.teamRole}>Requester</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className={styles.detailCard}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              <div className={styles.activity}>
                <div className={styles.activityItem}>
                  <span className={styles.activityAvatar}>JD</span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}><strong>John Doe</strong> updated the status</p>
                    <span className={styles.activityTime}>2 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityAvatar}>MK</span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}><strong>Mary Kim</strong> added a comment</p>
                    <span className={styles.activityTime}>3 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityAvatar}>RS</span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}><strong>Robert Smith</strong> changed priority to High</p>
                    <span className={styles.activityTime}>Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignSystemPreviewPage;
