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
  Image,
  Type,
  AlignLeft,
  List,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertOctagon,
  Check,
  GripVertical,
  FolderOpen,
  MapPin,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  Hash,
  Wifi,
  Copy,
  Share2,
  LogOut,
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
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [previewDensity, setPreviewDensity] = useState<'compact' | 'default' | 'comfortable'>('default');
  const [previewRadius, setPreviewRadius] = useState<'none' | 'sm' | 'md' | 'lg'>('md');

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
              <Sparkles size={16} />
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
            <Search className={styles.searchIcon} size={16} />
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
                <feature.icon size={16} />
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
              <Layout size={14} />
              Explore Components
              <ArrowRight size={12} />
            </button>
            <button type="button" className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}>
              <Code2 size={14} />
              View Documentation
              <ExternalLink size={12} />
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
          <div className={styles.kpiCard} data-accent="requests">
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

          <div className={styles.kpiCard} data-accent="incidents">
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

          <div className={styles.kpiCard} data-accent="approvals">
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

          <div className={styles.kpiCard} data-accent="resolved">
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
          <div className={`${styles.dashboardCard} ${styles.chartCard}`}>
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
          <div className={`${styles.dashboardCard} ${styles.quickActionsCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Quick Actions</h3>
            </div>
            <div className={styles.quickActions}>
              <button type="button" className={styles.quickAction} data-action="new">
                <div className={styles.quickActionIcon}><Plus size={14} /></div>
                <span>New Request</span>
              </button>
              <button type="button" className={styles.quickAction} data-action="report">
                <div className={styles.quickActionIcon}><FileText size={14} /></div>
                <span>Create Report</span>
              </button>
              <button type="button" className={styles.quickAction} data-action="schedule">
                <div className={styles.quickActionIcon}><Calendar size={14} /></div>
                <span>Schedule Task</span>
              </button>
              <button type="button" className={styles.quickAction} data-action="user">
                <div className={styles.quickActionIcon}><User size={14} /></div>
                <span>Assign User</span>
              </button>
            </div>
          </div>

          {/* My Work */}
          <div className={`${styles.dashboardCard} ${styles.workCard}`}>
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
          <div className={`${styles.dashboardCard} ${styles.alertsCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Alerts</h3>
              <span className={styles.alertBadge}>4 new</span>
            </div>
            <div className={styles.alertList}>
              <div className={styles.alertItem} data-type="warning">
                <AlertTriangle size={14} className={styles.alertIconWarning} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>3 licenses expiring within 30 days</span>
                  <span className={styles.alertTime}>2 hours ago</span>
                </div>
              </div>
              <div className={styles.alertItem} data-type="critical">
                <AlertCircle size={14} className={styles.alertIconError} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>Server SR-4567 exceeded SLA</span>
                  <span className={styles.alertTime}>5 hours ago</span>
                </div>
              </div>
              <div className={styles.alertItem} data-type="information">
                <Bell size={14} className={styles.alertIconInfo} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>New comment on SR-890</span>
                  <span className={styles.alertTime}>Yesterday</span>
                </div>
              </div>
              <div className={styles.alertItem} data-type="success">
                <CheckCircle2 size={14} className={styles.alertIconSuccess} />
                <div className={styles.alertContent}>
                  <span className={styles.alertText}>Incident INC-234 resolved</span>
                  <span className={styles.alertTime}>Yesterday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${styles.dashboardCard} ${styles.activityCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              <button type="button" className={styles.cardAction}>View All</button>
            </div>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar} data-user="JD">JD</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>John D.</strong> updated SR-1234 status to In Progress</span>
                  <span className={styles.activityTime}>15 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar} data-user="MK">MK</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Mary K.</strong> commented on INC-567</span>
                  <span className={styles.activityTime}>32 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar} data-user="RS">RS</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Robert S.</strong> assigned SR-890 to you</span>
                  <span className={styles.activityTime}>1 hour ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar} data-user="AL">AL</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Anna L.</strong> created new inventory item</span>
                  <span className={styles.activityTime}>2 hours ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityAvatar} data-user="TW">TW</div>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}><strong>Tom W.</strong> resolved SR-456</span>
                  <span className={styles.activityTime}>3 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Workload */}
          <div className={`${styles.dashboardCard} ${styles.teamCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Team Workload</h3>
              <button type="button" className={styles.cardAction}><Filter size={12} /></button>
            </div>
            <div className={styles.teamList}>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar} data-member="JD">JD</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>John Doe</span>
                  <span className={styles.teamRole}>Support Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} data-level="medium" style={{ width: '75%' }} />
                  </div>
                  <span className={styles.workloadCount}>12</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar} data-member="MK">MK</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Mary Kim</span>
                  <span className={styles.teamRole}>Senior Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} data-level="low" style={{ width: '45%' }} />
                  </div>
                  <span className={styles.workloadCount}>7</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar} data-member="RS">RS</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Robert Smith</span>
                  <span className={styles.teamRole}>IT Manager</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} data-level="low" style={{ width: '30%' }} />
                  </div>
                  <span className={styles.workloadCount}>4</span>
                </div>
              </div>
              <div className={styles.teamMember}>
                <div className={styles.teamAvatar} data-member="AL">AL</div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>Anna Lee</span>
                  <span className={styles.teamRole}>Support Engineer</span>
                </div>
                <div className={styles.teamWorkload}>
                  <div className={styles.workloadBar}>
                    <div className={styles.workloadFill} data-level="high" style={{ width: '85%' }} />
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

            {/* Filter Button */}
            <button type="button" className={styles.toolbarButton} data-action="filter">
              <Filter size={14} />
              <span>Filter</span>
            </button>

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
            <button type="button" className={styles.toolbarButton} data-action="export" title="Export">
              <Download size={14} />
              <span>Export</span>
            </button>
            <button type="button" className={styles.toolbarButton} data-action="import" title="Import">
              <Upload size={14} />
              <span>Import</span>
            </button>
            <button type="button" className={styles.toolbarButton} data-action="refresh" title="Refresh">
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          {/* Total - Blue */}
          <div className={styles.summaryCard} data-type="total">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryCardHeader}>
                <div className={styles.summaryIconWrap}>
                  <Ticket size={16} />
                </div>
                <div className={styles.summaryHeaderRight}>
                  <span className={styles.summaryLabel}>Total</span>
                  <span className={styles.summaryTrend}>
                    <TrendingUp size={12} />
                    +12%
                  </span>
                </div>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryValue}>156</span>
                <span className={styles.summaryHelper}>Updated 5 mins ago</span>
              </div>
            </div>
          </div>

          {/* Open - Orange */}
          <div className={styles.summaryCard} data-type="open">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryCardHeader}>
                <div className={styles.summaryIconWrap}>
                  <AlertCircle size={16} />
                </div>
                <div className={styles.summaryHeaderRight}>
                  <span className={styles.summaryLabel}>Open</span>
                  <span className={styles.summaryTrend}>
                    <TrendingDown size={12} />
                    -4%
                  </span>
                </div>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryValue}>45</span>
                <span className={styles.summaryHelper}>Active this week</span>
              </div>
            </div>
          </div>

          {/* Pending - Purple */}
          <div className={styles.summaryCard} data-type="pending">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryCardHeader}>
                <div className={styles.summaryIconWrap}>
                  <Clock size={16} />
                </div>
                <div className={styles.summaryHeaderRight}>
                  <span className={styles.summaryLabel}>Pending</span>
                  <span className={styles.summaryTrend}>
                    <Minus size={12} />
                    0%
                  </span>
                </div>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryValue}>23</span>
                <span className={styles.summaryHelper}>Awaiting review</span>
              </div>
            </div>
          </div>

          {/* Resolved - Green */}
          <div className={styles.summaryCard} data-type="resolved">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryCardHeader}>
                <div className={styles.summaryIconWrap}>
                  <CheckCircle2 size={16} />
                </div>
                <div className={styles.summaryHeaderRight}>
                  <span className={styles.summaryLabel}>Resolved</span>
                  <span className={styles.summaryTrend}>
                    <TrendingUp size={12} />
                    +8%
                  </span>
                </div>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryValue}>88</span>
                <span className={styles.summaryHelper}>Compared to yesterday</span>
              </div>
            </div>
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="authentication">Authentication</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar} data-initials="JD">JD</span>
                    <span>John Doe</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 15, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="account">Account</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar} data-initials="MK">MK</span>
                    <span>Mary Kim</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 14, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="email">Email</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar} data-initials="RS">RS</span>
                    <span>Robert Smith</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 13, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="network">Network</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar} data-initials="AL">AL</span>
                    <span>Anna Lee</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 12, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="software">Software</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar}>TW</span>
                    <span>Tom Wilson</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 11, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                <td className={styles.tdCategory}><span className={styles.categoryBadge} data-category="infrastructure">Hardware</span></td>
                <td className={styles.tdAssignee}>
                  <div className={styles.assigneeCell}>
                    <span className={styles.assigneeAvatar} data-initials="JD">JD</span>
                    <span>John Doe</span>
                  </div>
                </td>
                <td className={styles.tdDate}>Jan 10, 2024</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.actionButton} data-action="view" title="View">
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="edit" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className={styles.actionButton} data-action="delete" title="Delete">
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
                  <ArrowRight size={14} className={styles.relatedArrow} />
                </div>
                <div className={styles.relatedItem}>
                  <Link2 size={14} className={styles.relatedIcon} />
                  <span className={styles.relatedType}>SR</span>
                  <span className={styles.relatedId}>SR-0155</span>
                  <span className={styles.relatedTitle}>Password reset request</span>
                  <ArrowRight size={14} className={styles.relatedArrow} />
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
                <div className={styles.timelineItem} data-state="current">
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Status changed to Open</span>
                    <span className={styles.timelineMeta}>by John Doe · 2 hours ago</span>
                  </div>
                </div>
                <div className={styles.timelineItem} data-state="completed">
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>Assigned to John Doe</span>
                    <span className={styles.timelineMeta}>by System · 3 hours ago</span>
                  </div>
                </div>
                <div className={styles.timelineItem} data-state="completed">
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

      {/* ============================================ */}
      {/* ENTERPRISE FORM SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.formShowcase}>
      {/* Page Header */}
      <div className={styles.formShowcaseHeader}>
        <div className={styles.breadcrumb}>
          <a href="#" className={styles.breadcrumbLink}><Home size={14} /></a>
          <ChevronRight size={12} className={styles.breadcrumbSep} />
          <span className={styles.breadcrumbCurrent}>Form Components</span>
        </div>
        <div className={styles.formShowcaseTitle}>
          <h2 className={styles.pageTitleText}>Enterprise Form Showcase</h2>
          <p className={styles.pageTitleSub}>A comprehensive collection of form components for enterprise applications.</p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className={styles.formContainer}>
        <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.formColumn}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <Briefcase size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Basic Information</h3>
              </div>
              
              {/* Text Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Title <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Type size={14} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="Enter request title"
                  />
                </div>
                <span className={styles.formHint}>Brief description of the request</span>
              </div>

              {/* Textarea */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Description <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <AlignLeft size={14} className={styles.inputIcon} />
                  <textarea 
                    className={styles.formTextarea} 
                    rows={4}
                    placeholder="Provide detailed description of the request..."
                  />
                </div>
                <span className={styles.formHint}>Include all relevant details</span>
              </div>

              {/* Select */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Category <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <List size={14} className={styles.inputIcon} />
                  <select className={styles.formSelect}>
                    <option value="">Select category</option>
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access">Access</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectArrow} />
                </div>
              </div>

              {/* Multi-Select Preview */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tags</label>
                <div className={styles.multiSelectWrapper}>
                  <div className={styles.selectedTags}>
                    <span className={styles.selectedTag}>
                      urgent
                      <X size={10} />
                    </span>
                    <span className={styles.selectedTag}>
                      login
                      <X size={10} />
                    </span>
                  </div>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="Add tags..."
                  />
                </div>
                <div className={styles.tagSuggestions}>
                  <span className={styles.tagSuggestion}>authentication</span>
                  <span className={styles.tagSuggestion}>security</span>
                  <span className={styles.tagSuggestion}>password</span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <FileText size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Request Details</h3>
              </div>

              {/* Priority */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input type="radio" name="priority" value="low" />
                    <span className={styles.radioCustom} />
                    <span className={styles.radioLabel}>Low</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="priority" value="medium" defaultChecked />
                    <span className={styles.radioCustom} />
                    <span className={styles.radioLabel}>Medium</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="priority" value="high" />
                    <span className={styles.radioCustom} />
                    <span className={styles.radioLabel}>High</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="priority" value="critical" />
                    <span className={styles.radioCustom} />
                    <span className={styles.radioLabel}>Critical</span>
                  </label>
                </div>
              </div>

              {/* Checkboxes */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notifications</label>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxOption}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.checkboxCustom}>
                      <Check size={10} />
                    </span>
                    <span className={styles.checkboxLabel}>Email notifications</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input type="checkbox" />
                    <span className={styles.checkboxCustom}>
                      <Check size={10} />
                    </span>
                    <span className={styles.checkboxLabel}>SMS notifications</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.checkboxCustom}>
                      <Check size={10} />
                    </span>
                    <span className={styles.checkboxLabel}>In-app notifications</span>
                  </label>
                </div>
              </div>

              {/* Toggle Switches */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Settings</label>
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleItem}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Send confirmation email</span>
                      <span className={styles.toggleHint}>Receive email when request is created</span>
                    </div>
                    <label className={styles.toggle}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.toggleTrack}>
                        <span className={styles.toggleThumb} />
                      </span>
                    </label>
                  </div>
                  <div className={styles.toggleItem}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Auto-assign</span>
                      <span className={styles.toggleHint}>Automatically assign to available team member</span>
                    </div>
                    <label className={styles.toggle}>
                      <input type="checkbox" />
                      <span className={styles.toggleTrack}>
                        <span className={styles.toggleThumb} />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <Calendar size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Schedule</h3>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Date</label>
                  <div className={styles.inputWrapper}>
                    <Calendar size={14} className={styles.inputIcon} />
                    <input 
                      type="date" 
                      className={styles.formInput} 
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Date</label>
                  <div className={styles.inputWrapper}>
                    <Calendar size={14} className={styles.inputIcon} />
                    <input 
                      type="date" 
                      className={styles.formInput} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.formColumn}>
            {/* Assignment */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <User size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Assignment</h3>
              </div>

              {/* Requester */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Requester</label>
                <div className={styles.userSelect}>
                  <div className={styles.userAvatar}>JD</div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>John Doe</span>
                    <span className={styles.userEmail}>john.doe@company.com</span>
                  </div>
                  <button type="button" className={styles.userChange}>Change</button>
                </div>
              </div>

              {/* Assignee */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assign To</label>
                <div className={styles.assigneeDropdown}>
                  <div className={styles.assigneeSearch}>
                    <Search size={14} />
                    <input 
                      type="text" 
                      placeholder="Search users..."
                      className={styles.assigneeSearchInput}
                    />
                  </div>
                  <div className={styles.assigneeList}>
                    <div className={styles.assigneeItem}>
                      <div className={styles.assigneeAvatar}>MK</div>
                      <div className={styles.assigneeInfo}>
                        <span className={styles.assigneeName}>Mary Kim</span>
                        <span className={styles.assigneeRole}>Senior Engineer</span>
                      </div>
                      <Check size={14} className={styles.assigneeCheck} />
                    </div>
                    <div className={styles.assigneeItem}>
                      <div className={styles.assigneeAvatar} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>RS</div>
                      <div className={styles.assigneeInfo}>
                        <span className={styles.assigneeName}>Robert Smith</span>
                        <span className={styles.assigneeRole}>IT Manager</span>
                      </div>
                    </div>
                    <div className={styles.assigneeItem}>
                      <div className={styles.assigneeAvatar} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>AL</div>
                      <div className={styles.assigneeInfo}>
                        <span className={styles.assigneeName}>Anna Lee</span>
                        <span className={styles.assigneeRole}>Support Engineer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <MapPin size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Location</h3>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Building</label>
                <div className={styles.inputWrapper}>
                  <Building size={14} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g., Building A"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Floor / Room</label>
                <div className={styles.inputWrapper}>
                  <Hash size={14} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g., Floor 3, Room 302"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <Paperclip size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Attachments</h3>
              </div>

              <div className={styles.uploadZone}>
                <div className={styles.uploadIcon}>
                  <Upload size={24} />
                </div>
                <div className={styles.uploadText}>
                  <span className={styles.uploadPrimary}>Drop files here or click to upload</span>
                  <span className={styles.uploadSecondary}>PNG, JPG, PDF up to 10MB</span>
                </div>
              </div>

              <div className={styles.uploadedFiles}>
                <div className={styles.uploadedFile}>
                  <File size={16} className={styles.fileIcon} />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>screenshot-2024.png</span>
                    <span className={styles.fileSize}>245 KB</span>
                  </div>
                  <button type="button" className={styles.fileRemove}>
                    <X size={14} />
                  </button>
                </div>
                <div className={styles.uploadedFile}>
                  <FileText size={16} className={styles.fileIcon} />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>requirements.pdf</span>
                    <span className={styles.fileSize}>1.2 MB</span>
                  </div>
                  <button type="button" className={styles.fileRemove}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Validation States */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <AlertCircle size={16} className={styles.formSectionIcon} />
                <h3 className={styles.formSectionTitle}>Validation States</h3>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Error State</label>
                <div className={styles.inputWrapper}>
                  <AlertOctagon size={14} className={`${styles.inputIcon} ${styles.inputIconError}`} />
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${styles.formInputError}`}
                    defaultValue="Invalid input"
                  />
                </div>
                <span className={styles.formError}>This field is required and cannot be empty</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Success State</label>
                <div className={styles.inputWrapper}>
                  <CheckCircle size={14} className={`${styles.inputIcon} ${styles.inputIconSuccess}`} />
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${styles.formInputSuccess}`}
                    defaultValue="Valid email address"
                  />
                </div>
                <span className={styles.formSuccess}>Email address is valid</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warning State</label>
                <div className={styles.inputWrapper}>
                  <AlertTriangle size={14} className={`${styles.inputIcon} ${styles.inputIconWarning}`} />
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${styles.formInputWarning}`}
                    defaultValue="Password too short"
                  />
                </div>
                <span className={styles.formWarning}>Password should be at least 8 characters</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Disabled State</label>
                <div className={styles.inputWrapper}>
                  <Lock size={14} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    disabled
                    defaultValue="Cannot edit this field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className={styles.formActionBar}>
          <div className={styles.formActionLeft}>
            <button type="button" className={styles.formButtonSecondary}>
              <RotateCw size={14} />
              Reset
            </button>
            <button type="button" className={styles.formButtonSecondary}>
              <Save size={14} />
              Save Draft
            </button>
          </div>
          <div className={styles.formActionRight}>
            <button type="button" className={styles.formButtonCancel}>
              Cancel
            </button>
            <button type="button" className={styles.formButtonPrimary}>
              <Check size={14} />
              Submit Request
            </button>
          </div>
        </div>
      </div>

      {/* Button Variants Showcase */}
      <div className={styles.buttonShowcase}>
        <div className={styles.buttonShowcaseHeader}>
          <h3 className={styles.buttonShowcaseTitle}>Button Variants</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.formButtonPrimary}>Primary</button>
          <button className={styles.formButtonSecondary}><Check size={14} /> Secondary</button>
          <button className={styles.formButtonCancel}>Cancel</button>
          <button className={styles.formButtonDanger}><Trash2 size={14} /> Delete</button>
          <button className={styles.formButtonGhost}>Ghost</button>
          <button className={styles.formButtonLink}>Link</button>
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.formButtonPrimary} disabled>Primary Disabled</button>
          <button className={styles.formButtonSecondary} disabled>Secondary Disabled</button>
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.formButtonPrimarySm}>Small Primary</button>
          <button className={styles.formButtonSecondarySm}>Small Secondary</button>
        </div>
      </div>

      {/* Input States Showcase */}
      <div className={styles.inputShowcase}>
        <div className={styles.inputShowcaseHeader}>
          <h3 className={styles.inputShowcaseTitle}>Input States</h3>
        </div>
        <div className={styles.inputShowcaseGrid}>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>Default</label>
            <input type="text" className={styles.formInput} placeholder="Enter text..." />
          </div>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>With Value</label>
            <input type="text" className={styles.formInput} defaultValue="Some value" />
          </div>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>Focused</label>
            <input type="text" className={styles.formInput} placeholder="Click to focus" />
          </div>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>Error</label>
            <input type="text" className={`${styles.formInput} ${styles.formInputError}`} defaultValue="Invalid" />
          </div>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>Success</label>
            <input type="text" className={`${styles.formInput} ${styles.formInputSuccess}`} defaultValue="Valid" />
          </div>
          <div className={styles.inputStateExample}>
            <label className={styles.inputStateLabel}>Disabled</label>
            <input type="text" className={`${styles.formInput} ${styles.formInputDisabled}`} disabled defaultValue="Disabled" />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE DIALOG & DRAWER SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.dialogShowcase}>
        {/* Section Header */}
        <div className={styles.dialogShowcaseHeader}>
          <h3 className={styles.dialogShowcaseTitle}>Dialog & Drawer Showcase</h3>
          <p className={styles.dialogShowcaseSub}>Premium modal dialogs, drawers, and slide panels for enterprise applications.</p>
        </div>

        {/* Dialog Grid */}
        <div className={styles.dialogGrid}>
          {/* Confirmation Dialog */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Confirmation</h4>
            <p className={styles.dialogCardDesc}>Compact confirmation dialog</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.confirmDialog} data-type="confirmation">
                <div className={styles.confirmBody}>
                  <div className={styles.confirmIconWrap}>
                    <HelpCircle size={20} />
                  </div>
                  <h3 className={styles.confirmTitle}>Confirm Action</h3>
                  <p className={styles.confirmText}>Are you sure you want to proceed?</p>
                </div>
                <div className={styles.confirmFooter}>
                  <button className={styles.confirmBtnSecondary}>Cancel</button>
                  <button className={styles.confirmBtnPrimary}>Confirm</button>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Dialog */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Delete</h4>
            <p className={styles.dialogCardDesc}>Destructive action confirmation</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.confirmDialog} data-type="delete">
                <div className={styles.confirmBody}>
                  <div className={styles.confirmIconWrap}>
                    <Trash2 size={20} />
                  </div>
                  <h3 className={styles.confirmTitle}>Delete Item?</h3>
                  <p className={styles.confirmText}>This action cannot be undone.</p>
                </div>
                <div className={styles.confirmFooter}>
                  <button className={styles.confirmBtnSecondary}>Cancel</button>
                  <button className={styles.confirmBtnDanger}>Delete</button>
                </div>
              </div>
            </div>
          </div>

          {/* Success Dialog */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Success</h4>
            <p className={styles.dialogCardDesc}>Positive feedback dialog</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.confirmDialog} data-type="success">
                <div className={styles.confirmBody}>
                  <div className={styles.confirmIconWrap}>
                    <CheckCircle size={20} />
                  </div>
                  <h3 className={styles.confirmTitle}>Request Approved</h3>
                  <p className={styles.confirmText}>Your request has been processed.</p>
                </div>
                <div className={styles.confirmFooter}>
                  <button className={styles.confirmBtnPrimary}>Done</button>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Dialog */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Warning</h4>
            <p className={styles.dialogCardDesc}>Caution alert dialog</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.confirmDialog} data-type="warning">
                <div className={styles.confirmBody}>
                  <div className={styles.confirmIconWrap}>
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className={styles.confirmTitle}>Storage Warning</h3>
                  <p className={styles.confirmText}>Usage at 85% capacity.</p>
                </div>
                <div className={styles.confirmFooter}>
                  <button className={styles.confirmBtnSecondary}>Dismiss</button>
                  <button className={styles.confirmBtnPrimary}>Upgrade</button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Dialog */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Error</h4>
            <p className={styles.dialogCardDesc}>Error feedback dialog</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.confirmDialog} data-type="error">
                <div className={styles.confirmBody}>
                  <div className={styles.confirmIconWrap}>
                    <AlertOctagon size={20} />
                  </div>
                  <h3 className={styles.confirmTitle}>Connection Failed</h3>
                  <p className={styles.confirmText}>Unable to reach the server.</p>
                </div>
                <div className={styles.confirmFooter}>
                  <button className={styles.confirmBtnSecondary}>Cancel</button>
                  <button className={styles.confirmBtnPrimary}>Retry</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Form Dialog - Full Viewport Modal */}
        <div className={styles.dialogCard} style={{ marginBottom: 24 }}>
          <h4 className={styles.dialogCardTitle}>Premium Form Dialog</h4>
          <p className={styles.dialogCardDesc}>Standard Create/Edit dialog - full viewport modal</p>
          
          <div className={styles.dialogPreview} style={{ minHeight: 120 }}>
            <button 
              className={styles.premiumFormBtnPrimary} 
              onClick={() => setShowPremiumForm(true)}
            >
              <Plus size={16} />
              Open Create Form
            </button>
          </div>
        </div>

        {/* Premium Form Modal - Rendered at end of page when active */}
        {showPremiumForm && (
          <div className={styles.premiumModalOverlay} onClick={() => setShowPremiumForm(false)}>
            <div className={styles.premiumFormDialog} onClick={(e) => e.stopPropagation()}>
              {/* Sticky Header */}
              <div className={styles.premiumFormDialogHeader}>
                <div className={styles.premiumFormDialogHeaderContent}>
                  <h3 className={styles.premiumFormDialogTitle}>Create New Request</h3>
                  <p className={styles.premiumFormDialogSubtitle}>Fill in the required information to create a new service request</p>
                </div>
                <button className={styles.premiumFormDialogClose} onClick={() => setShowPremiumForm(false)}>
                  <X size={18} />
                </button>
              </div>
              
              {/* Scrollable Body */}
              <div className={styles.premiumFormDialogBody}>
                {/* Section 1: General Information */}
                <div className={styles.premiumFormSection}>
                  <h4 className={styles.premiumFormSectionTitle}>General Information</h4>
                  <div className={styles.premiumFormDialogGrid}>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Title <span className={styles.premiumFormRequired}>*</span></label>
                      <input type="text" className={styles.premiumFormInput} placeholder="Enter request title" />
                    </div>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Category <span className={styles.premiumFormRequired}>*</span></label>
                      <select className={styles.premiumFormSelect}>
                        <option>Select category...</option>
                        <option>Hardware Request</option>
                        <option>Software Installation</option>
                        <option>Access Request</option>
                        <option>Network Issue</option>
                        <option>System Access</option>
                        <option>Equipment Request</option>
                      </select>
                    </div>
                    <div className={`${styles.premiumFormField} ${styles.premiumFullWidth}`}>
                      <label className={styles.premiumFormLabel}>Description</label>
                      <textarea className={styles.premiumFormTextarea} rows={3} placeholder="Describe your request in detail..." />
                      <span className={styles.premiumFormHelper}>Provide as much detail as possible for faster resolution.</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Assignment */}
                <div className={styles.premiumFormSection}>
                  <h4 className={styles.premiumFormSectionTitle}>Assignment</h4>
                  <div className={styles.premiumFormDialogGrid}>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Priority</label>
                      <select className={styles.premiumFormSelect}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Assignee</label>
                      <select className={styles.premiumFormSelect}>
                        <option>Select assignee...</option>
                        <option>John Doe</option>
                        <option>Mary Kim</option>
                        <option>Robert Smith</option>
                        <option>Sarah Wilson</option>
                        <option>Michael Chen</option>
                      </select>
                    </div>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Due Date</label>
                      <input type="date" className={styles.premiumFormInput} />
                    </div>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Tags</label>
                      <input type="text" className={styles.premiumFormInput} placeholder="Add tags separated by comma" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Additional Details */}
                <div className={styles.premiumFormSection}>
                  <h4 className={styles.premiumFormSectionTitle}>Additional Details</h4>
                  <div className={styles.premiumFormDialogGrid}>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Department</label>
                      <select className={styles.premiumFormSelect}>
                        <option>Select department...</option>
                        <option>Engineering</option>
                        <option>Sales</option>
                        <option>Marketing</option>
                        <option>Human Resources</option>
                        <option>Finance</option>
                      </select>
                    </div>
                    <div className={styles.premiumFormField}>
                      <label className={styles.premiumFormLabel}>Location</label>
                      <input type="text" className={styles.premiumFormInput} placeholder="Office location or room" />
                    </div>
                    <div className={`${styles.premiumFormField} ${styles.premiumFullWidth}`}>
                      <label className={styles.premiumFormLabel}>Attachments</label>
                      <input type="text" className={styles.premiumFormInput} placeholder="Drop files here or click to upload" readOnly />
                      <span className={styles.premiumFormHelper}>Supported formats: PDF, DOC, JPG, PNG (max 10MB)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sticky Footer */}
              <div className={styles.premiumFormDialogFooter}>
                <button className={styles.premiumFormBtnSecondary} onClick={() => setShowPremiumForm(false)}>Cancel</button>
                <button className={styles.premiumFormBtnDraft}>Save Draft</button>
                <button className={styles.premiumFormBtnPrimary}>Create Request</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sheet & Slide Panel */}
        <div className={styles.drawerSection}>
          <h4 className={styles.drawerSectionTitle}>Mobile Panels</h4>
          
          <div className={styles.drawerGrid}>
            {/* Bottom Sheet */}
            <div className={styles.drawerCard}>
              <h4 className={styles.dialogCardTitle}>Bottom Sheet</h4>
              <p className={styles.dialogCardDesc}>Mobile-friendly bottom panel</p>
              <div className={styles.drawerPreview}>
                <div className={styles.drawerOverlay} />
                <div className={styles.bottomSheet}>
                  <div className={styles.sheetHandle} />
                  <div className={styles.sheetContent}>
                    <h3 className={styles.sheetTitle}>Share Request</h3>
                    <div className={styles.shareOptions}>
                      <div className={styles.shareOption}>
                        <Mail size={20} />
                        <span>Email</span>
                      </div>
                      <div className={styles.shareOption}>
                        <Link2 size={20} />
                        <span>Copy Link</span>
                      </div>
                      <div className={styles.shareOption}>
                        <MessageSquare size={20} />
                        <span>Message</span>
                      </div>
                      <div className={styles.shareOption}>
                        <Send size={20} />
                        <span>Slack</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Panel */}
            <div className={styles.drawerCard}>
              <h4 className={styles.dialogCardTitle}>Slide Panel</h4>
              <p className={styles.dialogCardDesc}>Quick actions panel</p>
              <div className={styles.drawerPreview}>
                <div className={styles.drawerOverlay} />
                <div className={styles.slidePanel}>
                  <div className={styles.slidePanelHeader}>
                    <h3 className={styles.slidePanelTitle}>Quick Actions</h3>
                    <button className={styles.slidePanelClose}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className={styles.slidePanelBody}>
                    <button className={styles.slidePanelAction}>
                      <Edit2 size={16} />
                      <span>Edit Request</span>
                    </button>
                    <button className={styles.slidePanelAction}>
                      <Trash2 size={16} />
                      <span>Delete Request</span>
                    </button>
                    <button className={styles.slidePanelAction}>
                      <Download size={16} />
                      <span>Export PDF</span>
                    </button>
                    <button className={styles.slidePanelAction}>
                      <Clock size={16} />
                      <span>View History</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ENTERPRISE EMPTY STATES */}
        {/* ============================================ */}
        <div className={styles.emptyStatesSection}>
          <div className={styles.emptyStatesSectionHeader}>
            <h2 className={styles.emptyStatesSectionTitle}>Enterprise Empty States</h2>
            <p className={styles.emptyStatesSectionSub}>Modern empty state illustrations using icons only</p>
          </div>

          {/* Empty States Grid */}
          <div className={styles.emptyStatesGrid}>
            {/* No Data */}
            <div className={styles.emptyStateCard} data-variant="default">
              <div className={styles.emptyStateIconWrap}>
                <Database size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Data</h4>
              <p className={styles.emptyStateDesc}>No data available yet</p>
            </div>

            {/* No Search Results */}
            <div className={styles.emptyStateCard} data-variant="search">
              <div className={styles.emptyStateIconWrap}>
                <Search size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Results</h4>
              <p className={styles.emptyStateDesc}>Try adjusting your search</p>
            </div>

            {/* No Permissions */}
            <div className={styles.emptyStateCard} data-variant="permission">
              <div className={styles.emptyStateIconWrap}>
                <Shield size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Access</h4>
              <p className={styles.emptyStateDesc}>You lack required permissions</p>
            </div>

            {/* No Notifications */}
            <div className={styles.emptyStateCard} data-variant="muted">
              <div className={styles.emptyStateIconWrap}>
                <Bell size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>All Caught Up</h4>
              <p className={styles.emptyStateDesc}>No new notifications</p>
            </div>

            {/* No Projects */}
            <div className={styles.emptyStateCard} data-variant="default">
              <div className={styles.emptyStateIconWrap}>
                <FolderOpen size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Projects</h4>
              <p className={styles.emptyStateDesc}>Create your first project</p>
            </div>

            {/* No Incidents */}
            <div className={styles.emptyStateCard} data-variant="success">
              <div className={styles.emptyStateIconWrap}>
                <CheckCircle2 size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Incidents</h4>
              <p className={styles.emptyStateDesc}>All systems operational</p>
            </div>

            {/* No Requests */}
            <div className={styles.emptyStateCard} data-variant="default">
              <div className={styles.emptyStateIconWrap}>
                <Ticket size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Requests</h4>
              <p className={styles.emptyStateDesc}>No requests to display</p>
            </div>

            {/* No Vendors */}
            <div className={styles.emptyStateCard} data-variant="default">
              <div className={styles.emptyStateIconWrap}>
                <Building size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Vendors</h4>
              <p className={styles.emptyStateDesc}>Add your first vendor</p>
            </div>

            {/* No Assets */}
            <div className={styles.emptyStateCard} data-variant="default">
              <div className={styles.emptyStateIconWrap}>
                <Monitor size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Assets</h4>
              <p className={styles.emptyStateDesc}>Start tracking assets</p>
            </div>

            {/* No Internet */}
            <div className={styles.emptyStateCard} data-variant="danger">
              <div className={styles.emptyStateIconWrap}>
                <Wifi size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>No Connection</h4>
              <p className={styles.emptyStateDesc}>Check your internet</p>
            </div>

            {/* Server Error */}
            <div className={styles.emptyStateCard} data-variant="danger">
              <div className={styles.emptyStateIconWrap}>
                <AlertOctagon size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>Server Error</h4>
              <p className={styles.emptyStateDesc}>Please try again later</p>
            </div>

            {/* 404 */}
            <div className={styles.emptyStateCard} data-variant="muted">
              <div className={styles.emptyStateIconWrap}>
                <File size={24} />
              </div>
              <h4 className={styles.emptyStateTitle}>404 - Not Found</h4>
              <p className={styles.emptyStateDesc}>Page doesn't exist</p>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ENTERPRISE LOADING STATES */}
        {/* ============================================ */}
        <div className={styles.loadingStatesSection}>
          <div className={styles.loadingStatesSectionHeader}>
            <h2 className={styles.loadingStatesSectionTitle}>Enterprise Loading States</h2>
            <p className={styles.loadingStatesSectionSub}>Skeleton screens and progress indicators</p>
          </div>

          {/* Loading States Grid */}
          <div className={styles.loadingStatesGrid}>
            {/* Skeleton Cards */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Skeleton Cards</h4>
              <div className={styles.skeletonCard}>
                <div className={styles.skeletonCardHeader}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonCardLines}>
                    <div className={styles.skeletonLine} style={{ width: '60%', height: 14 }} />
                    <div className={styles.skeletonLine} />
                  </div>
                </div>
                <div className={styles.skeletonCardBody}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} style={{ width: '50%' }} />
                </div>
              </div>
            </div>

            {/* Skeleton Table */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Skeleton Table</h4>
              <div className={styles.skeletonTable}>
                <div className={styles.skeletonTableHeader}>
                  <div className={styles.skeletonTableHeaderCell} style={{ flex: 0.5 }} />
                  <div className={styles.skeletonTableHeaderCell} />
                  <div className={styles.skeletonTableHeaderCell} />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonTableRow}>
                    <div className={styles.skeletonTableCell} />
                    <div className={styles.skeletonTableCell} />
                    <div className={styles.skeletonTableCell} />
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton Form */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Skeleton Form</h4>
              <div className={styles.skeletonForm}>
                <div className={styles.skeletonFormField}>
                  <div className={styles.skeletonFormLabel} />
                  <div className={styles.skeletonFormInput} />
                </div>
                <div className={styles.skeletonFormField}>
                  <div className={styles.skeletonFormLabel} />
                  <div className={styles.skeletonFormInput} />
                </div>
                <div className={styles.skeletonFormField}>
                  <div className={styles.skeletonFormLabel} />
                  <div className={styles.skeletonFormInput} />
                </div>
              </div>
            </div>

            {/* Linear Progress */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Linear Progress</h4>
              <div className={styles.progressContainer}>
                <div className={styles.progressWithLabel}>
                  <div className={styles.progressLabel}>
                    <span>Processing</span>
                    <span className={styles.progressValue}>75%</span>
                  </div>
                  <div className={styles.linearProgress}>
                    <div className={styles.linearProgressBar} style={{ width: '75%' }} />
                  </div>
                </div>
                <div className={styles.progressWithLabel}>
                  <div className={styles.progressLabel}>
                    <span>Completed</span>
                    <span className={styles.progressValue}>100%</span>
                  </div>
                  <div className={styles.linearProgress}>
                    <div className={styles.linearProgressBar} data-state="success" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className={styles.progressWithLabel}>
                  <div className={styles.progressLabel}>
                    <span>Warning</span>
                    <span className={styles.progressValue}>45%</span>
                  </div>
                  <div className={styles.linearProgress}>
                    <div className={styles.linearProgressBar} data-state="warning" style={{ width: '45%' }} />
                  </div>
                </div>
                <div className={styles.progressWithLabel}>
                  <div className={styles.progressLabel}>
                    <span>Error</span>
                    <span className={styles.progressValue}>25%</span>
                  </div>
                  <div className={styles.linearProgress}>
                    <div className={styles.linearProgressBar} data-state="danger" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Circular Progress */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Circular Progress</h4>
              <div className={styles.progressGrid}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className={styles.circularProgress} style={{ position: 'relative', width: 64, height: 64 }}>
                    <svg className={styles.circularProgressSvg} width="64" height="64" viewBox="0 0 64 64">
                      <circle className={styles.circularProgressTrack} cx="32" cy="32" r="28" strokeWidth="6" />
                      <circle className={styles.circularProgressFill} cx="32" cy="32" r="28" strokeWidth="6" 
                        strokeDasharray="175.9" strokeDashoffset="44" />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: 14, fontWeight: 600, color: 'var(--hero-text-primary)' }}>75%</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--hero-text-secondary)' }}>Default</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className={styles.circularProgress} style={{ position: 'relative', width: 64, height: 64 }}>
                    <svg className={styles.circularProgressSvg} width="64" height="64" viewBox="0 0 64 64">
                      <circle className={styles.circularProgressTrack} cx="32" cy="32" r="28" strokeWidth="6" />
                      <circle className={styles.circularProgressFill} data-state="success" cx="32" cy="32" r="28" strokeWidth="6" 
                        strokeDasharray="175.9" strokeDashoffset="0" />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: 14, fontWeight: 600, color: 'var(--hero-text-primary)' }}>100%</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--hero-text-secondary)' }}>Success</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className={styles.circularProgress} style={{ position: 'relative', width: 64, height: 64 }}>
                    <svg className={styles.circularProgressSvg} width="64" height="64" viewBox="0 0 64 64">
                      <circle className={styles.circularProgressTrack} cx="32" cy="32" r="28" strokeWidth="6" />
                      <circle className={styles.circularProgressFill} data-state="warning" cx="32" cy="32" r="28" strokeWidth="6" 
                        strokeDasharray="175.9" strokeDashoffset="96" />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: 14, fontWeight: 600, color: 'var(--hero-text-primary)' }}>45%</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--hero-text-secondary)' }}>Warning</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className={styles.circularProgress} style={{ position: 'relative', width: 64, height: 64 }}>
                    <svg className={styles.circularProgressSvg} width="64" height="64" viewBox="0 0 64 64">
                      <circle className={styles.circularProgressTrack} cx="32" cy="32" r="28" strokeWidth="6" />
                      <circle className={styles.circularProgressFill} data-state="danger" cx="32" cy="32" r="28" strokeWidth="6" 
                        strokeDasharray="175.9" strokeDashoffset="132" />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: 14, fontWeight: 600, color: 'var(--hero-text-primary)' }}>25%</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--hero-text-secondary)' }}>Error</span>
                </div>
              </div>
            </div>

            {/* Loading Spinner */}
            <div className={styles.loadingStateCard}>
              <h4 className={styles.loadingStateTitle}>Loading Spinner</h4>
              <div className={styles.loadingEmptyState}>
                <div className={styles.loadingSpinner} />
                <p style={{ fontSize: 13, color: 'var(--hero-text-secondary)', marginTop: 16 }}>Loading content...</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ENTERPRISE NAVIGATION SHOWCASE */}
        {/* ============================================ */}
        <div className={styles.navShowcaseSection}>
          <div className={styles.navShowcaseHeader}>
            <h2 className={styles.navShowcaseTitle}>Enterprise Navigation</h2>
            <p className={styles.navShowcaseSub}>Premium navigation components for enterprise applications</p>
          </div>

          {/* Navigation Components Grid */}
          <div className={styles.navComponentsGrid}>
            {/* Top Navigation */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Top Navigation</h4>
              <div className={styles.topNav}>
                <div className={styles.topNavLeft}>
                  <div className={styles.topNavLogo}>
                    <Layers size={20} />
                    <span>Saven</span>
                  </div>
                  <div className={styles.topNavLinks}>
                    <button className={`${styles.topNavLink} ${styles.active}`}>Dashboard</button>
                    <button className={styles.topNavLink}>Projects</button>
                    <button className={styles.topNavLink}>Reports</button>
                    <button className={styles.topNavLink}>Settings</button>
                  </div>
                </div>
                <div className={styles.topNavRight}>
                  <button className={styles.topNavIconBtn}>
                    <Search size={18} />
                  </button>
                  <button className={styles.topNavIconBtn}>
                    <Bell size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Breadcrumbs</h4>
              <div className={styles.breadcrumbs}>
                <button className={styles.breadcrumbItem}>Home</button>
                <span className={styles.breadcrumbSep}>/</span>
                <button className={styles.breadcrumbItem}>Projects</button>
                <span className={styles.breadcrumbSep}>/</span>
                <button className={styles.breadcrumbItem}>Service Requests</button>
                <span className={styles.breadcrumbSep}>/</span>
                <span className={`${styles.breadcrumbItem} ${styles.current}`}>SR-1234</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Sidebar Navigation (Premium Dark Theme)</h4>
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Full Sidebar */}
                <div className={styles.sidebarNav}>
                  {/* Logo Area */}
                  <div className={styles.sidebarLogo}>
                    <div className={styles.sidebarLogoIcon}>
                      <Layers size={20} />
                    </div>
                    <span className={styles.sidebarLogoText}>Saven</span>
                  </div>

                  <div className={styles.sidebarNavSection}>
                    <div className={styles.sidebarNavSectionTitle}>Main Menu</div>
                    <button className={`${styles.sidebarNavItem} ${styles.active}`}>
                      <Layout size={18} />
                      Dashboard
                    </button>
                    <button className={styles.sidebarNavItem}>
                      <FileText size={18} />
                      Requests
                    </button>
                    <button className={styles.sidebarNavItem}>
                      <Users size={18} />
                      Users
                    </button>
                    <button className={styles.sidebarNavItem}>
                      <Briefcase size={18} />
                      Projects
                    </button>
                  </div>

                  <div className={styles.sidebarNavSection}>
                    <div className={styles.sidebarNavSectionTitle}>System</div>
                    <button className={styles.sidebarNavItem}>
                      <Settings size={18} />
                      Settings
                    </button>
                  </div>

                  {/* User Profile Section */}
                  <div className={styles.sidebarUser}>
                    <div className={styles.sidebarUserAvatar}>JD</div>
                    <div className={styles.sidebarUserInfo}>
                      <div className={styles.sidebarUserName}>John Doe</div>
                      <div className={styles.sidebarUserRole}>Administrator</div>
                    </div>
                    <ChevronRight size={16} className={styles.sidebarUserArrow} />
                  </div>
                </div>

                {/* Mini Sidebar */}
                <div className={styles.miniSidebarNav}>
                  <div className={styles.miniSidebarLogo}>
                    <Layers size={24} />
                  </div>
                  <button className={`${styles.miniSidebarItem} ${styles.active}`}>
                    <Layout size={20} />
                  </button>
                  <button className={styles.miniSidebarItem}>
                    <FileText size={20} />
                  </button>
                  <button className={styles.miniSidebarItem}>
                    <Users size={20} />
                  </button>
                  <button className={styles.miniSidebarItem}>
                    <Briefcase size={20} />
                  </button>
                  <button className={styles.miniSidebarItem}>
                    <Settings size={20} />
                  </button>
                  <div className={styles.miniSidebarUser}>JD</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Tabs</h4>
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${styles.active}`}>Overview</button>
                <button className={styles.tab}>Activity</button>
                <button className={styles.tab}>Members</button>
                <button className={styles.tab}>
                  Settings
                  <span className={styles.tabBadge}>3</span>
                </button>
              </div>
            </div>

            {/* Secondary Tabs */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Secondary Tabs (Pill Style)</h4>
              <div className={styles.secondaryTabs}>
                <button className={`${styles.secondaryTab} ${styles.active}`}>All Items</button>
                <button className={styles.secondaryTab}>Active</button>
                <button className={styles.secondaryTab}>Pending</button>
                <button className={styles.secondaryTab}>Archived</button>
              </div>
            </div>

            {/* Context Menu */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Context Menu</h4>
              <div className={styles.contextMenu}>
                <div className={styles.contextMenuTrigger}>Right-click me</div>
                <div className={styles.contextMenuDropdown}>
                  <button className={styles.contextMenuItem}>
                    <Edit2 size={16} />
                    Edit
                    <span className={styles.contextMenuShortcut}>
                      <span className={styles.commandPaletteKey}>⌘</span>
                      <span className={styles.commandPaletteKey}>E</span>
                    </span>
                  </button>
                  <button className={styles.contextMenuItem}>
                    <Copy size={16} />
                    Duplicate
                    <span className={styles.contextMenuShortcut}>
                      <span className={styles.commandPaletteKey}>⌘</span>
                      <span className={styles.commandPaletteKey}>D</span>
                    </span>
                  </button>
                  <button className={styles.contextMenuItem}>
                    <Share2 size={16} />
                    Share
                  </button>
                  <div className={styles.contextMenuSep} />
                  <button className={`${styles.contextMenuItem} ${styles.danger}`}>
                    <Trash2 size={16} />
                    Delete
                    <span className={styles.contextMenuShortcut}>
                      <span className={styles.commandPaletteKey}>⌘</span>
                      <span className={styles.commandPaletteKey}>⌫</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Dropdown Menu</h4>
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownMenuTrigger}>
                  Actions
                  <ChevronDown size={16} />
                </button>
                <div className={styles.dropdownMenuContent}>
                  <button className={styles.dropdownMenuItem}>
                    <Plus size={16} />
                    New Request
                  </button>
                  <button className={styles.dropdownMenuItem}>
                    <Upload size={16} />
                    Import Data
                  </button>
                  <button className={styles.dropdownMenuItem}>
                    <Download size={16} />
                    Export Data
                  </button>
                  <div className={styles.contextMenuSep} />
                  <button className={styles.dropdownMenuItem}>
                    <Settings size={16} />
                    Preferences
                  </button>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>User Menu</h4>
              <div className={styles.userMenu}>
                <div className={styles.userAvatar}>JD</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>John Doe</div>
                  <div className={styles.userRole}>Administrator</div>
                </div>
                <ChevronDown size={16} style={{ color: '#9ca3af' }} />
              </div>
              <div className={styles.userMenuDropdown} style={{ position: 'relative', marginTop: 8 }}>
                <div className={styles.userMenuHeader}>
                  <div className={styles.userMenuAvatar}>JD</div>
                  <div>
                    <div className={styles.userName}>John Doe</div>
                    <div className={styles.userRole}>john.doe@company.com</div>
                  </div>
                </div>
                <button className={styles.dropdownMenuItem}>
                  <User size={16} />
                  Profile
                </button>
                <button className={styles.dropdownMenuItem}>
                  <Settings size={16} />
                  Settings
                </button>
                <div className={styles.contextMenuSep} />
                <button className={`${styles.dropdownMenuItem} ${styles.danger}`}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Pagination */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Pagination</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className={styles.pagination}>
                  <button className={styles.paginationBtn} disabled>
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                  <button className={styles.paginationBtn}>1</button>
                  <button className={`${styles.paginationBtn} ${styles.active}`}>2</button>
                  <button className={styles.paginationBtn}>3</button>
                  <span className={styles.paginationEllipsis}>...</span>
                  <button className={styles.paginationBtn}>10</button>
                  <button className={styles.paginationBtn}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className={styles.pageSizeSelector}>
                  <span className={styles.pageSizeLabel}>Rows per page:</span>
                  <select className={styles.pageSizeSelect} defaultValue="25">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Navigation Chips */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Navigation Chips</h4>
              <div className={styles.navChips}>
                <button className={`${styles.navChip} ${styles.active}`}>
                  <Tag size={14} />
                  Active
                </button>
                <button className={styles.navChip}>
                  <Tag size={14} />
                  In Progress
                </button>
                <button className={styles.navChip}>
                  <Tag size={14} />
                  Pending
                </button>
                <button className={styles.navChip}>
                  Completed
                  <button className={styles.navChipClose}>
                    <X size={12} />
                  </button>
                </button>
              </div>
            </div>

            {/* Command Palette Preview */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Command Palette</h4>
              <div style={{ position: 'relative' }}>
                <div className={styles.commandPalette} style={{ position: 'relative' }}>
                  <div className={styles.commandPaletteSearch}>
                    <Search size={18} className={styles.commandPaletteSearchIcon} />
                    <input type="text" className={styles.commandPaletteInput} placeholder="Type a command or search..." readOnly />
                  </div>
                  <div className={styles.commandPaletteResults}>
                    <div className={styles.commandPaletteGroup}>
                      <div className={styles.commandPaletteGroupTitle}>Quick Actions</div>
                      <button className={`${styles.commandPaletteItem} ${styles.selected}`}>
                        <div className={styles.commandPaletteItemIcon}>
                          <Plus size={16} />
                        </div>
                        <div className={styles.commandPaletteItemContent}>
                          <div className={styles.commandPaletteItemTitle}>Create New Request</div>
                          <div className={styles.commandPaletteItemDesc}>Open the request creation form</div>
                        </div>
                        <div className={styles.commandPaletteShortcut}>
                          <span className={styles.commandPaletteKey}>⌘</span>
                          <span className={styles.commandPaletteKey}>N</span>
                        </div>
                      </button>
                      <button className={styles.commandPaletteItem}>
                        <div className={styles.commandPaletteItemIcon}>
                          <Search size={16} />
                        </div>
                        <div className={styles.commandPaletteItemContent}>
                          <div className={styles.commandPaletteItemTitle}>Search Everything</div>
                          <div className={styles.commandPaletteItemDesc}>Search across all content</div>
                        </div>
                        <div className={styles.commandPaletteShortcut}>
                          <span className={styles.commandPaletteKey}>⌘</span>
                          <span className={styles.commandPaletteKey}>K</span>
                        </div>
                      </button>
                    </div>
                    <div className={styles.commandPaletteGroup}>
                      <div className={styles.commandPaletteGroupTitle}>Navigation</div>
                      <button className={styles.commandPaletteItem}>
                        <div className={styles.commandPaletteItemIcon}>
                          <Layout size={16} />
                        </div>
                        <div className={styles.commandPaletteItemContent}>
                          <div className={styles.commandPaletteItemTitle}>Go to Dashboard</div>
                          <div className={styles.commandPaletteItemDesc}>View your dashboard</div>
                        </div>
                      </button>
                      <button className={styles.commandPaletteItem}>
                        <div className={styles.commandPaletteItemIcon}>
                          <FileText size={16} />
                        </div>
                        <div className={styles.commandPaletteItemContent}>
                          <div className={styles.commandPaletteItemTitle}>View All Requests</div>
                          <div className={styles.commandPaletteItemDesc}>Browse service requests</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Overlay Preview */}
            <div className={styles.navComponentCard}>
              <h4 className={styles.navComponentTitle}>Search Overlay</h4>
              <div style={{ position: 'relative' }}>
                <div className={styles.searchModal} style={{ position: 'relative' }}>
                  <div className={styles.searchModalHeader}>
                    <Search size={18} style={{ color: '#9ca3af' }} />
                    <input type="text" className={styles.searchModalInput} placeholder="Search requests, users, projects..." readOnly />
                    <button className={styles.searchModalClose}>ESC</button>
                  </div>
                  <div className={styles.searchModalBody}>
                    <div className={styles.searchRecentTitle}>Recent Searches</div>
                    <div className={styles.searchResultItem}>
                      <div className={styles.searchResultIcon}>
                        <Clock size={16} />
                      </div>
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultTitle}>Password reset request</div>
                        <div className={styles.searchResultMeta}>Service Request · SR-1234</div>
                      </div>
                    </div>
                    <div className={styles.searchResultItem}>
                      <div className={styles.searchResultIcon}>
                        <User size={16} />
                      </div>
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultTitle}>John Doe</div>
                        <div className={styles.searchResultMeta}>User · Engineering</div>
                      </div>
                    </div>
                    <div className={styles.searchResultItem}>
                      <div className={styles.searchResultIcon}>
                        <Briefcase size={16} />
                      </div>
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultTitle}>Cloud Migration Project</div>
                        <div className={styles.searchResultMeta}>Project · Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* THEME & RESPONSIVENESS SHOWCASE */}
        {/* ============================================ */}
        <div className={styles.themeShowcaseSection}>
          <div className={styles.themeShowcaseHeader}>
            <h2 className={styles.themeShowcaseTitle}>Theme & Responsiveness</h2>
            <p className={styles.themeShowcaseSub}>Interactive theme controls and responsive design preview</p>
          </div>

          <div className={styles.themeShowcaseGrid}>
            {/* Control Panel */}
            <div className={styles.themeControlPanel}>
              <h3 className={styles.themeControlTitle}>Controls</h3>
              
              {/* Theme Toggle */}
              <div className={styles.themeControlGroup}>
                <label className={styles.themeControlLabel}>Theme</label>
                <div className={styles.themeToggleButtons}>
                  <button 
                    className={`${styles.themeToggleBtn} ${previewTheme === 'light' ? styles.active : ''}`}
                    onClick={() => setPreviewTheme('light')}
                  >
                    <Sun size={14} />
                    Light
                  </button>
                  <button 
                    className={`${styles.themeToggleBtn} ${previewTheme === 'dark' ? styles.active : ''}`}
                    onClick={() => setPreviewTheme('dark')}
                  >
                    <Moon size={14} />
                    Dark
                  </button>
                  <button 
                    className={`${styles.themeToggleBtn} ${previewTheme === 'system' ? styles.active : ''}`}
                    onClick={() => setPreviewTheme('system')}
                  >
                    <Monitor size={14} />
                    System
                  </button>
                </div>
              </div>

              {/* Density */}
              <div className={styles.themeControlGroup}>
                <label className={styles.themeControlLabel}>Density</label>
                <div className={styles.densityButtons}>
                  <button 
                    className={`${styles.densityBtn} ${previewDensity === 'compact' ? styles.active : ''}`}
                    onClick={() => setPreviewDensity('compact')}
                  >
                    Compact
                  </button>
                  <button 
                    className={`${styles.densityBtn} ${previewDensity === 'default' ? styles.active : ''}`}
                    onClick={() => setPreviewDensity('default')}
                  >
                    Default
                  </button>
                  <button 
                    className={`${styles.densityBtn} ${previewDensity === 'comfortable' ? styles.active : ''}`}
                    onClick={() => setPreviewDensity('comfortable')}
                  >
                    Comfortable
                  </button>
                </div>
              </div>

              {/* Border Radius */}
              <div className={styles.themeControlGroup}>
                <label className={styles.themeControlLabel}>Border Radius</label>
                <div className={styles.radiusButtons}>
                  <button 
                    className={`${styles.radiusBtn} ${styles.small} ${previewRadius === 'none' ? styles.active : ''}`}
                    onClick={() => setPreviewRadius('none')}
                  >
                    None
                  </button>
                  <button 
                    className={`${styles.radiusBtn} ${styles.small} ${previewRadius === 'sm' ? styles.active : ''}`}
                    onClick={() => setPreviewRadius('sm')}
                  >
                    Small
                  </button>
                  <button 
                    className={`${styles.radiusBtn} ${styles.medium} ${previewRadius === 'md' ? styles.active : ''}`}
                    onClick={() => setPreviewRadius('md')}
                  >
                    Medium
                  </button>
                  <button 
                    className={`${styles.radiusBtn} ${styles.large} ${previewRadius === 'lg' ? styles.active : ''}`}
                    onClick={() => setPreviewRadius('lg')}
                  >
                    Large
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className={styles.livePreviewCard}>
                <div className={styles.livePreviewTitle}>Live Preview</div>
                <div className={styles.livePreviewContent}>
                  <button className={styles.livePreviewItem}>
                    <CheckCircle size={14} />
                    Item
                  </button>
                  <button className={styles.livePreviewItem}>
                    <FileText size={14} />
                    Card
                  </button>
                  <button className={`${styles.livePreviewItem} ${styles.primary}`}>
                    <Plus size={14} />
                    Button
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className={styles.themePreviewArea}>
              <h3 className={styles.themePreviewTitle}>Responsive Device Preview</h3>
              
              <div className={styles.devicePreviewContainer}>
                {/* Desktop */}
                <div className={styles.devicePreview}>
                  <span className={styles.devicePreviewLabel}>Desktop</span>
                  <div className={`${styles.deviceFrame} ${styles.desktop}`}>
                    <div className={styles.deviceHeader}>
                      <span className={`${styles.deviceDot} ${styles.red}`} />
                      <span className={`${styles.deviceDot} ${styles.yellow}`} />
                      <span className={`${styles.deviceDot} ${styles.green}`} />
                    </div>
                    <div className={styles.deviceContent}>
                      <div className={styles.deviceSidebar} />
                      <div className={styles.deviceMain}>
                        <div className={styles.deviceBar} />
                        <div className={styles.deviceCard} />
                        <div className={styles.deviceCard} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop */}
                <div className={styles.devicePreview}>
                  <span className={styles.devicePreviewLabel}>Laptop</span>
                  <div className={`${styles.deviceFrame} ${styles.laptop}`}>
                    <div className={styles.deviceScreen}>
                      <div className={styles.deviceTopbar} />
                      <div className={styles.deviceBody}>
                        <div className={styles.deviceSide} />
                        <div className={styles.deviceContent}>
                          <div className={styles.deviceItem} />
                          <div className={styles.deviceItem} />
                          <div className={styles.deviceItem} />
                        </div>
                      </div>
                    </div>
                    <div className={styles.deviceBase} />
                  </div>
                </div>

                {/* Tablet */}
                <div className={styles.devicePreview}>
                  <span className={styles.devicePreviewLabel}>Tablet</span>
                  <div className={`${styles.deviceFrame} ${styles.tablet}`}>
                    <div className={styles.deviceInner}>
                      <div className={styles.deviceTopbar} />
                      <div className={styles.deviceContent}>
                        <div className={styles.deviceSide} />
                        <div className={styles.deviceMain}>
                          <div className={styles.deviceItem} />
                          <div className={styles.deviceItem} />
                          <div className={styles.deviceItem} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile */}
                <div className={styles.devicePreview}>
                  <span className={styles.devicePreviewLabel}>Mobile</span>
                  <div className={`${styles.deviceFrame} ${styles.mobile}`}>
                    <div className={styles.deviceInner}>
                      <div className={styles.deviceTopbar} />
                      <div className={styles.deviceContent}>
                        <div className={styles.deviceItem} />
                        <div className={styles.deviceItem} />
                        <div className={styles.deviceItem} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE BADGES & LABELS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.badgesSection}>
        <div className={styles.badgesSectionHeader}>
          <h2 className={styles.badgesSectionTitle}>Badges & Labels</h2>
          <p className={styles.badgesSectionSub}>Status indicators, priority markers, and category labels</p>
        </div>

        {/* Status Badges */}
        <div className={styles.badgesGrid}>
          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Status Badges</h4>
            <div className={styles.badgeRow}>
              <span className={styles.statusBadgeNew}>New</span>
              <span className={styles.statusBadgeOpen}>Open</span>
              <span className={styles.statusBadgeInProgress}>In Progress</span>
              <span className={styles.statusBadgePending}>Pending</span>
              <span className={styles.statusBadgeResolved}>Resolved</span>
              <span className={styles.statusBadgeClosed}>Closed</span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Priority Badges</h4>
            <div className={styles.badgeRow}>
              <span className={styles.priorityBadgeNew}>Critical</span>
              <span className={styles.priorityBadgeHigh}>High</span>
              <span className={styles.priorityBadgeMedium}>Medium</span>
              <span className={styles.priorityBadgeLow}>Low</span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Severity Badges</h4>
            <div className={styles.badgeRow}>
              <span className={styles.severityBadgeCritical}>SEV-1 Critical</span>
              <span className={styles.severityBadgeHigh}>SEV-2 High</span>
              <span className={styles.severityBadgeMedium}>SEV-3 Medium</span>
              <span className={styles.severityBadgeLow}>SEV-4 Low</span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Category Badges</h4>
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadgeHardware}><Database size={12} /> Hardware</span>
              <span className={styles.categoryBadgeSoftware}><Code2 size={12} /> Software</span>
              <span className={styles.categoryBadgeNetwork}><Wifi size={12} /> Network</span>
              <span className={styles.categoryBadgeSecurity}><Shield size={12} /> Security</span>
              <span className={styles.categoryBadgeGeneral}><FileText size={12} /> General</span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Tags</h4>
            <div className={styles.tagRow}>
              <span className={styles.tag}><Tag size={10} /> urgent</span>
              <span className={styles.tag}><Tag size={10} /> cloud-migration</span>
              <span className={styles.tag}><Tag size={10} /> production</span>
              <span className={styles.tag}><Tag size={10} /> database</span>
              <span className={styles.tagAdd}><Plus size={10} /> Add Tag</span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <h4 className={styles.badgeGroupTitle}>Count Badges</h4>
            <div className={styles.countBadgeRow}>
              <button type="button" className={styles.iconButton}>
                <Bell size={16} />
                <span className={styles.countBadge}>3</span>
              </button>
              <span className={styles.countBadgeOutline}>12</span>
              <span className={styles.countBadgeSolid}>99+</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE SELECT & PICKERS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.pickersSection}>
        <div className={styles.pickersSectionHeader}>
          <h2 className={styles.pickersSectionTitle}>Select & Pickers</h2>
          <p className={styles.pickersSectionSub}>Dropdowns, date pickers, and multi-select inputs</p>
        </div>

        <div className={styles.pickersGrid}>
          {/* Standard Select */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Standard Select</h4>
            <div className={styles.pickerWrapper}>
              <select className={styles.pickerSelect}>
                <option value="">Select priority...</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown size={14} className={styles.pickerArrow} />
            </div>
          </div>

          {/* Multi-Select */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Multi-Select</h4>
            <div className={styles.multiSelectDemo}>
              <div className={styles.multiSelectSelected}>
                <span className={styles.selectedTag}><Tag size={10} /> Hardware <X size={10} /></span>
                <span className={styles.selectedTag}><Tag size={10} /> Software <X size={10} /></span>
              </div>
              <input type="text" className={styles.multiSelectInput} placeholder="Add item..." />
            </div>
          </div>

          {/* Date Picker */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Date Picker</h4>
            <div className={styles.pickerWrapper}>
              <Calendar size={14} className={styles.pickerIcon} />
              <input type="date" className={styles.pickerInput} defaultValue="2026-07-23" />
            </div>
          </div>

          {/* Date Range */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Date Range</h4>
            <div className={styles.dateRangeWrapper}>
              <div className={styles.pickerWrapper}>
                <Calendar size={14} className={styles.pickerIcon} />
                <input type="date" className={styles.pickerInput} defaultValue="2026-07-01" />
              </div>
              <span className={styles.dateRangeSep}>to</span>
              <div className={styles.pickerWrapper}>
                <Calendar size={14} className={styles.pickerIcon} />
                <input type="date" className={styles.pickerInput} defaultValue="2026-07-23" />
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Time Picker</h4>
            <div className={styles.pickerWrapper}>
              <Clock size={14} className={styles.pickerIcon} />
              <input type="time" className={styles.pickerInput} defaultValue="09:30" />
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className={styles.pickerCard}>
            <h4 className={styles.pickerCardTitle}>Dropdown Menu</h4>
            <div className={styles.dropdownDemo}>
              <button type="button" className={styles.dropdownTrigger}>
                <span>Actions</span>
                <ChevronDown size={14} />
              </button>
              <div className={styles.dropdownMenuShow}>
                <button type="button" className={styles.dropdownMenuItem}><Edit2 size={14} /> Edit</button>
                <button type="button" className={styles.dropdownMenuItem}><Copy size={14} /> Duplicate</button>
                <button type="button" className={styles.dropdownMenuItem}><Share2 size={14} /> Share</button>
                <div className={styles.dropdownMenuDivider} />
                <button type="button" className={styles.dropdownMenuItemDanger}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE TABLE FILTERS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersSectionHeader}>
          <h2 className={styles.filtersSectionTitle}>Table Filters</h2>
          <p className={styles.filtersSectionSub}>Filter chips, active filters, and table controls</p>
        </div>

        {/* Filter Chips */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Filter Chips</h4>
          <div className={styles.filterChips}>
            <button type="button" className={styles.filterChip}>
              <span>Status: Open</span>
              <X size={12} />
            </button>
            <button type="button" className={styles.filterChip}>
              <span>Priority: High</span>
              <X size={12} />
            </button>
            <button type="button" className={styles.filterChipAdd}>
              <Plus size={12} />
              <span>Add filter</span>
            </button>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Active Filters Bar</h4>
          <div className={styles.activeFiltersBar}>
            <span className={styles.activeFiltersLabel}>Active filters:</span>
            <div className={styles.activeFiltersList}>
              <span className={styles.activeFilter}>
                <span>Status</span>
                <span className={styles.activeFilterValue}>Open</span>
                <button type="button" className={styles.activeFilterRemove}><X size={10} /></button>
              </span>
              <span className={styles.activeFilter}>
                <span>Priority</span>
                <span className={styles.activeFilterValue}>High</span>
                <button type="button" className={styles.activeFilterRemove}><X size={10} /></button>
              </span>
              <span className={styles.activeFilter}>
                <span>Assigned to</span>
                <span className={styles.activeFilterValue}>Me</span>
                <button type="button" className={styles.activeFilterRemove}><X size={10} /></button>
              </span>
            </div>
            <button type="button" className={styles.clearFilters}>Clear all</button>
          </div>
        </div>

        {/* Column Toggle */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionTitle}>Column Visibility</h4>
          <div className={styles.columnToggle}>
            <button type="button" className={styles.columnToggleBtn}>
              <Eye size={14} />
              <span>Columns</span>
              <ChevronDown size={12} />
            </button>
            <div className={styles.columnToggleMenu}>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" defaultChecked /> ID
              </label>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" defaultChecked /> Title
              </label>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" defaultChecked /> Status
              </label>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" defaultChecked /> Priority
              </label>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" /> Assignee
              </label>
              <label className={styles.columnToggleItem}>
                <input type="checkbox" defaultChecked /> Created
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE DIALOG VARIANTS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.dialogVariantsSection}>
        <div className={styles.dialogVariantsSectionHeader}>
          <h2 className={styles.dialogVariantsSectionTitle}>Dialog Variants</h2>
          <p className={styles.dialogVariantsSectionSub}>Confirmation, alert, and action dialogs</p>
        </div>

        <div className={styles.dialogVariantsGrid}>
          {/* Delete Confirmation */}
          <div className={styles.dialogVariantCard}>
            <h4 className={styles.dialogVariantTitle}>Delete Confirmation</h4>
            <div className={styles.dialogPreview}>
              <div className={styles.confirmDialog}>
                <div className={styles.confirmIconWrap} data-type="danger">
                  <Trash2 size={20} />
                </div>
                <h3 className={styles.confirmTitle}>Delete Item?</h3>
                <p className={styles.confirmText}>This action cannot be undone. The item and all associated data will be permanently removed.</p>
                <div className={styles.confirmFooter}>
                  <button type="button" className={styles.confirmBtnSecondary}>Cancel</button>
                  <button type="button" className={styles.confirmBtnDanger}>Delete</button>
                </div>
              </div>
            </div>
          </div>

          {/* Success Confirmation */}
          <div className={styles.dialogVariantCard}>
            <h4 className={styles.dialogVariantTitle}>Success Alert</h4>
            <div className={styles.dialogPreview}>
              <div className={styles.confirmDialog}>
                <div className={styles.confirmIconWrap} data-type="success">
                  <CheckCircle size={20} />
                </div>
                <h3 className={styles.confirmTitle}>Request Created</h3>
                <p className={styles.confirmText}>Your service request has been submitted successfully. Ticket #SR-2024-001.</p>
                <div className={styles.confirmFooter}>
                  <button type="button" className={styles.confirmBtnPrimary}>View Request</button>
                  <button type="button" className={styles.confirmBtnSecondary}>Close</button>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Confirmation */}
          <div className={styles.dialogVariantCard}>
            <h4 className={styles.dialogVariantTitle}>Warning Alert</h4>
            <div className={styles.dialogPreview}>
              <div className={styles.confirmDialog}>
                <div className={styles.confirmIconWrap} data-type="warning">
                  <AlertTriangle size={20} />
                </div>
                <h3 className={styles.confirmTitle}>Unsaved Changes</h3>
                <p className={styles.confirmText}>You have unsaved changes that will be lost. Are you sure you want to leave?</p>
                <div className={styles.confirmFooter}>
                  <button type="button" className={styles.confirmBtnSecondary}>Stay</button>
                  <button type="button" className={styles.confirmBtnDanger}>Leave</button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Dialog */}
          <div className={styles.dialogVariantCard}>
            <h4 className={styles.dialogVariantTitle}>Form Dialog</h4>
            <div className={styles.dialogPreview}>
              <div className={styles.formDialog}>
                <div className={styles.formDialogHeader}>
                  <h3 className={styles.formDialogTitle}>Quick Add</h3>
                  <button type="button" className={styles.formDialogClose}><X size={16} /></button>
                </div>
                <div className={styles.formDialogBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name</label>
                    <input type="text" className={styles.formInput} placeholder="Enter name" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select className={styles.formSelect}>
                      <option>Select category</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formDialogFooter}>
                  <button type="button" className={styles.confirmBtnSecondary}>Cancel</button>
                  <button type="button" className={styles.confirmBtnPrimary}>Create</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE PROPERTY LIST SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.propertySection}>
        <div className={styles.propertySectionHeader}>
          <h2 className={styles.propertySectionTitle}>Property Lists</h2>
          <p className={styles.propertySectionSub}>Detail view property displays</p>
        </div>

        <div className={styles.propertyGrid}>
          {/* Info Grid */}
          <div className={styles.propertyCard}>
            <h4 className={styles.propertyCardTitle}>Info Grid</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Status</span>
                <span className={styles.statusBadgeOpen}>Open</span>
              </div>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Priority</span>
                <span className={styles.priorityBadgeHigh}>High</span>
              </div>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Category</span>
                <span className={styles.infoGridValue}>Hardware</span>
              </div>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Assignee</span>
                <span className={styles.infoGridValue}>John Smith</span>
              </div>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Created</span>
                <span className={styles.infoGridValue}>Jul 15, 2026</span>
              </div>
              <div className={styles.infoGridItem}>
                <span className={styles.infoGridLabel}>Updated</span>
                <span className={styles.infoGridValue}>Jul 22, 2026</span>
              </div>
            </div>
          </div>

          {/* Property List */}
          <div className={styles.propertyCard}>
            <h4 className={styles.propertyCardTitle}>Property List</h4>
            <div className={styles.propertyList}>
              <div className={styles.propertyItem}>
                <span className={styles.propertyIcon}><User size={14} /></span>
                <span className={styles.propertyLabel}>Requester</span>
                <span className={styles.propertyValue}>Sarah Johnson</span>
              </div>
              <div className={styles.propertyItem}>
                <span className={styles.propertyIcon}><Mail size={14} /></span>
                <span className={styles.propertyLabel}>Email</span>
                <span className={styles.propertyValue}>sarah@company.com</span>
              </div>
              <div className={styles.propertyItem}>
                <span className={styles.propertyIcon}><Phone size={14} /></span>
                <span className={styles.propertyLabel}>Phone</span>
                <span className={styles.propertyValue}>+1 555-0123</span>
              </div>
              <div className={styles.propertyItem}>
                <span className={styles.propertyIcon}><Building size={14} /></span>
                <span className={styles.propertyLabel}>Department</span>
                <span className={styles.propertyValue}>Engineering</span>
              </div>
              <div className={styles.propertyItem}>
                <span className={styles.propertyIcon}><MapPin size={14} /></span>
                <span className={styles.propertyLabel}>Location</span>
                <span className={styles.propertyValue}>Building A, Floor 3</span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className={styles.propertyCard}>
            <h4 className={styles.propertyCardTitle}>Metadata</h4>
            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <Clock size={12} />
                <span>Created 3 days ago</span>
              </div>
              <div className={styles.metaItem}>
                <Clock size={12} />
                <span>Updated 2 hours ago</span>
              </div>
              <div className={styles.metaItem}>
                <User size={12} />
                <span>By Sarah Johnson</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE COMMENTS & ACTIVITY SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.commentsSection}>
        <div className={styles.commentsSectionHeader}>
          <h2 className={styles.commentsSectionTitle}>Comments & Activity</h2>
          <p className={styles.commentsSectionSub}>Discussion threads and activity feeds</p>
        </div>

        <div className={styles.commentsGrid}>
          {/* Comment Thread */}
          <div className={styles.commentCard}>
            <h4 className={styles.commentCardTitle}>Comment Thread</h4>
            <div className={styles.commentThread}>
              <div className={styles.comment}>
                <div className={styles.commentAvatar}>
                  <User size={16} />
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>Sarah Johnson</span>
                    <span className={styles.commentTime}>2 hours ago</span>
                  </div>
                  <p className={styles.commentText}>I've reviewed the request and it looks good to proceed. Assigning to the infrastructure team for implementation.</p>
                  <div className={styles.commentActions}>
                    <button type="button" className={styles.commentAction}>Reply</button>
                    <button type="button" className={styles.commentAction}>Edit</button>
                  </div>
                </div>
              </div>
              <div className={styles.commentReply}>
                <div className={styles.commentAvatar}>
                  <User size={16} />
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>Mike Chen</span>
                    <span className={styles.commentTime}>1 hour ago</span>
                  </div>
                  <p className={styles.commentText}>Thanks! Starting implementation today. Will update by end of week.</p>
                </div>
              </div>
              <div className={styles.commentInput}>
                <input type="text" className={styles.commentInputField} placeholder="Add a comment..." />
                <button type="button" className={styles.commentSendBtn}><Send size={14} /></button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className={styles.attachmentCard}>
            <h4 className={styles.attachmentCardTitle}>Attachments</h4>
            <div className={styles.attachmentList}>
              <div className={styles.attachmentItem}>
                <File size={16} className={styles.attachmentIcon} />
                <div className={styles.attachmentInfo}>
                  <span className={styles.attachmentName}>requirements.pdf</span>
                  <span className={styles.attachmentMeta}>2.4 MB • Uploaded by Sarah</span>
                </div>
                <button type="button" className={styles.attachmentAction}><Download size={14} /></button>
              </div>
              <div className={styles.attachmentItem}>
                <Image size={16} className={styles.attachmentIcon} />
                <div className={styles.attachmentInfo}>
                  <span className={styles.attachmentName}>screenshot.png</span>
                  <span className={styles.attachmentMeta}>1.1 MB • Uploaded by Mike</span>
                </div>
                <button type="button" className={styles.attachmentAction}><Download size={14} /></button>
              </div>
            </div>
            <button type="button" className={styles.addAttachmentBtn}>
              <Upload size={14} />
              <span>Add attachment</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE PERMISSION COMPONENTS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.permissionSection}>
        <div className={styles.permissionSectionHeader}>
          <h2 className={styles.permissionSectionTitle}>Permission Components</h2>
          <p className={styles.permissionSectionSub}>Access control and role-based visibility</p>
        </div>

        <div className={styles.permissionGrid}>
          {/* Permission Gate */}
          <div className={styles.permissionCard}>
            <h4 className={styles.permissionCardTitle}>Permission Gate</h4>
            <div className={styles.permissionDemo}>
              <div className={styles.permissionGate}>
                <div className={styles.permissionGateAllowed}>
                  <Shield size={16} />
                  <span>Admin Access</span>
                  <span className={styles.permissionStatus}>Visible</span>
                </div>
              </div>
              <div className={styles.permissionGate}>
                <div className={styles.permissionGateDenied}>
                  <Shield size={16} />
                  <span>Restricted Action</span>
                  <span className={styles.permissionStatusDenied}>Hidden</span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <div className={styles.permissionCard}>
            <h4 className={styles.permissionCardTitle}>Role Badges</h4>
            <div className={styles.roleBadgeList}>
              <span className={styles.roleBadgeAdmin}>Admin</span>
              <span className={styles.roleBadgeManager}>Manager</span>
              <span className={styles.roleBadgeUser}>User</span>
              <span className={styles.roleBadgeViewer}>Viewer</span>
            </div>
          </div>

          {/* Access Level Indicator */}
          <div className={styles.permissionCard}>
            <h4 className={styles.permissionCardTitle}>Access Levels</h4>
            <div className={styles.accessLevelList}>
              <div className={styles.accessLevelItem}>
                <span className={styles.accessLevelLabel}>Full Access</span>
                <div className={styles.accessLevelBar} data-level="full" />
              </div>
              <div className={styles.accessLevelItem}>
                <span className={styles.accessLevelLabel}>Read/Write</span>
                <div className={styles.accessLevelBar} data-level="write" />
              </div>
              <div className={styles.accessLevelItem}>
                <span className={styles.accessLevelLabel}>Read Only</span>
                <div className={styles.accessLevelBar} data-level="read" />
              </div>
              <div className={styles.accessLevelItem}>
                <span className={styles.accessLevelLabel}>No Access</span>
                <div className={styles.accessLevelBar} data-level="none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE ALERTS & BANNERS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.alertsBannerSection}>
        <div className={styles.alertsBannerSectionHeader}>
          <h2 className={styles.alertsBannerSectionTitle}>Alerts & Banners</h2>
          <p className={styles.alertsBannerSectionSub}>Inline notifications and system messages</p>
        </div>

        <div className={styles.alertsBannerGrid}>
          {/* Page Banner */}
          <div className={styles.alertBannerCard}>
            <h4 className={styles.alertBannerTitle}>Page Banner</h4>
            <div className={styles.alertBanner}>
              <AlertTriangle size={16} />
              <span className={styles.alertBannerText}>Maintenance scheduled for July 25, 2026 from 2:00 AM to 4:00 AM UTC</span>
              <button type="button" className={styles.alertBannerAction}>Learn more</button>
              <button type="button" className={styles.alertBannerClose}><X size={14} /></button>
            </div>
          </div>

          {/* Info Alert */}
          <div className={styles.alertCard}>
            <h4 className={styles.alertCardTitle}>Info Alert</h4>
            <div className={styles.alertItem}>
              <Info size={16} className={styles.alertIconInfo} />
              <div className={styles.alertContent}>
                <strong>Information</strong>
                <p>Your session will expire in 15 minutes. Save your work to prevent data loss.</p>
              </div>
              <button type="button" className={styles.alertClose}><X size={14} /></button>
            </div>
          </div>

          {/* Success Alert */}
          <div className={styles.alertCard}>
            <h4 className={styles.alertCardTitle}>Success Alert</h4>
            <div className={styles.alertItem}>
              <CheckCircle size={16} className={styles.alertIconSuccess} />
              <div className={styles.alertContent}>
                <strong>Success</strong>
                <p>Your changes have been saved successfully.</p>
              </div>
              <button type="button" className={styles.alertClose}><X size={14} /></button>
            </div>
          </div>

          {/* Warning Alert */}
          <div className={styles.alertCard}>
            <h4 className={styles.alertCardTitle}>Warning Alert</h4>
            <div className={styles.alertItem}>
              <AlertTriangle size={16} className={styles.alertIconWarning} />
              <div className={styles.alertContent}>
                <strong>Warning</strong>
                <p>This action may affect other users in your organization.</p>
              </div>
              <button type="button" className={styles.alertClose}><X size={14} /></button>
            </div>
          </div>

          {/* Error Alert */}
          <div className={styles.alertCard}>
            <h4 className={styles.alertCardTitle}>Error Alert</h4>
            <div className={styles.alertItem}>
              <AlertOctagon size={16} className={styles.alertIconError} />
              <div className={styles.alertContent}>
                <strong>Error</strong>
                <p>Failed to connect to server. Please try again later.</p>
              </div>
              <button type="button" className={styles.alertClose}><X size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENTERPRISE TABS SHOWCASE */}
      {/* ============================================ */}
      <div className={styles.tabsShowcaseSection}>
        <div className={styles.tabsShowcaseSectionHeader}>
          <h2 className={styles.tabsShowcaseSectionTitle}>Tabs</h2>
          <p className={styles.tabsShowcaseSectionSub}>Tab navigation for detail views</p>
        </div>

        <div className={styles.tabsShowcaseGrid}>
          {/* Primary Tabs */}
          <div className={styles.tabsCard}>
            <h4 className={styles.tabsCardTitle}>Primary Tabs</h4>
            <div className={styles.tabBar}>
              <button type="button" className={styles.tab} data-active="true">Details</button>
              <button type="button" className={styles.tab}>Activity</button>
              <button type="button" className={styles.tab}>Comments <span className={styles.tabBadge}>3</span></button>
              <button type="button" className={styles.tab}>Attachments</button>
            </div>
          </div>

          {/* Secondary Tabs */}
          <div className={styles.tabsCard}>
            <h4 className={styles.tabsCardTitle}>Secondary Tabs</h4>
            <div className={styles.secondaryTabBar}>
              <button type="button" className={styles.secondaryTab} data-active="true">Overview</button>
              <button type="button" className={styles.secondaryTab}>Settings</button>
              <button type="button" className={styles.secondaryTab}>History</button>
            </div>
          </div>

          {/* Pill Tabs */}
          <div className={styles.tabsCard}>
            <h4 className={styles.tabsCardTitle}>Pill Tabs</h4>
            <div className={styles.pillTabBar}>
              <button type="button" className={styles.pillTab} data-active="true">All</button>
              <button type="button" className={styles.pillTab}>Open</button>
              <button type="button" className={styles.pillTab}>Pending</button>
              <button type="button" className={styles.pillTab}>Resolved</button>
            </div>
          </div>

          {/* Vertical Tabs */}
          <div className={styles.tabsCard}>
            <h4 className={styles.tabsCardTitle}>Vertical Tabs</h4>
            <div className={styles.verticalTabLayout}>
              <div className={styles.verticalTabNav}>
                <button type="button" className={styles.verticalTab} data-active="true">General</button>
                <button type="button" className={styles.verticalTab}>Security</button>
                <button type="button" className={styles.verticalTab}>Notifications</button>
                <button type="button" className={styles.verticalTab}>Integrations</button>
              </div>
              <div className={styles.verticalTabContent}>
                <h5>General Settings</h5>
                <p>Configure your general preferences and settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Missing import for Lock and Save
const Lock = (props: any) => <Eye {...props} />;
const Save = (props: any) => <Download {...props} />;

// Missing icon for Dialog Showcase
const HelpCircle = (props: any) => <Circle {...props} />;

export default DesignSystemPreviewPage;
