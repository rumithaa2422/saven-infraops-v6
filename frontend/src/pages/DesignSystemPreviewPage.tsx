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
              <div className={styles.summaryIconWrap}>
                <Ticket size={24} />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Total</span>
                <span className={styles.summaryValue}>156</span>
                <span className={styles.summaryTrend}>
                  <TrendingUp size={14} />
                  +12%
                </span>
              </div>
            </div>
          </div>

          {/* Open - Orange */}
          <div className={styles.summaryCard} data-type="open">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryIconWrap}>
                <AlertCircle size={24} />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Open</span>
                <span className={styles.summaryValue}>45</span>
                <span className={styles.summaryTrend}>
                  <TrendingDown size={14} />
                  -4%
                </span>
              </div>
            </div>
          </div>

          {/* Pending - Purple */}
          <div className={styles.summaryCard} data-type="pending">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryIconWrap}>
                <Clock size={24} />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Pending</span>
                <span className={styles.summaryValue}>23</span>
                <span className={styles.summaryTrend}>
                  <Minus size={14} />
                  0%
                </span>
              </div>
            </div>
          </div>

          {/* Resolved - Green */}
          <div className={styles.summaryCard} data-type="resolved">
            <div className={styles.summaryCardContent}>
              <div className={styles.summaryIconWrap}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryLabel}>Resolved</span>
                <span className={styles.summaryValue}>88</span>
                <span className={styles.summaryTrend}>
                  <TrendingUp size={14} />
                  +8%
                </span>
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
          {/* Dialog Cards */}
          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Confirmation Dialog</h4>
            <p className={styles.dialogCardDesc}>Standard confirmation with overlay and blur</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 400 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogIconWrap}>
                    <HelpCircle size={20} />
                  </div>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Confirm Action</h3>
                    <p className={styles.dialogSubtitle}>Please review the details below</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  <p className={styles.dialogText}>Are you sure you want to proceed with this action? This operation cannot be undone.</p>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnSecondary}>Cancel</button>
                  <button className={styles.dialogBtnPrimary}>Confirm</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Delete Dialog</h4>
            <p className={styles.dialogCardDesc}>Dangerous action with red accent</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 400 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogIconWrap} style={{ background: 'var(--dialog-danger-bg)' }}>
                    <Trash2 size={20} style={{ color: 'var(--dialog-danger)' }} />
                  </div>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Delete Item</h3>
                    <p className={styles.dialogSubtitle}>This action is permanent</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  <p className={styles.dialogText}>You are about to permanently delete <strong>"Server Authentication Timeout"</strong>. This action cannot be undone.</p>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnSecondary}>Cancel</button>
                  <button className={styles.dialogBtnDanger}>Delete</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Success Dialog</h4>
            <p className={styles.dialogCardDesc}>Positive feedback with green accent</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 400 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogIconWrap} style={{ background: 'var(--dialog-success-bg)' }}>
                    <CheckCircle size={20} style={{ color: 'var(--dialog-success)' }} />
                  </div>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Request Approved</h3>
                    <p className={styles.dialogSubtitle}>Operation completed</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  <p className={styles.dialogText}>Your request has been successfully approved and processed. You will receive a confirmation email shortly.</p>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnPrimary}>Great!</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Warning Dialog</h4>
            <p className={styles.dialogCardDesc}>Caution with amber accent</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 400 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogIconWrap} style={{ background: 'var(--dialog-warning-bg)' }}>
                    <AlertTriangle size={20} style={{ color: 'var(--dialog-warning)' }} />
                  </div>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Storage Warning</h3>
                    <p className={styles.dialogSubtitle}>Attention required</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  <p className={styles.dialogText}>Your storage usage has reached 85% capacity. Consider deleting unused files or upgrading your plan.</p>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnSecondary}>Dismiss</button>
                  <button className={styles.dialogBtnPrimary}>Upgrade</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Error Dialog</h4>
            <p className={styles.dialogCardDesc}>Error feedback with red accent</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 400 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogIconWrap} style={{ background: 'var(--dialog-danger-bg)' }}>
                    <AlertOctagon size={20} style={{ color: 'var(--dialog-danger)' }} />
                  </div>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Connection Failed</h3>
                    <p className={styles.dialogSubtitle}>Something went wrong</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBody}>
                  <p className={styles.dialogText}>Unable to connect to the server. Please check your internet connection and try again.</p>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnSecondary}>Cancel</button>
                  <button className={styles.dialogBtnPrimary}>Retry</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dialogCard}>
            <h4 className={styles.dialogCardTitle}>Form Dialog</h4>
            <p className={styles.dialogCardDesc}>With scrollable body and form fields</p>
            <div className={styles.dialogPreview}>
              <div className={styles.dialogOverlay} />
              <div className={styles.dialogBox} style={{ maxWidth: 480 }}>
                <div className={styles.dialogHeader}>
                  <div className={styles.dialogHeaderContent}>
                    <h3 className={styles.dialogTitle}>Create New Request</h3>
                    <p className={styles.dialogSubtitle}>Fill in the details below</p>
                  </div>
                  <button className={styles.dialogClose}>
                    <X size={18} />
                  </button>
                </div>
                <div className={styles.dialogBodyScroll}>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Title <span className={styles.dialogRequired}>*</span></label>
                    <input type="text" className={styles.dialogInput} placeholder="Enter request title" />
                  </div>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Description</label>
                    <textarea className={styles.dialogTextarea} rows={3} placeholder="Describe your request..." />
                  </div>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Priority</label>
                    <select className={styles.dialogSelect}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Assignee</label>
                    <select className={styles.dialogSelect}>
                      <option>Select assignee...</option>
                      <option>John Doe</option>
                      <option>Mary Kim</option>
                      <option>Robert Smith</option>
                    </select>
                  </div>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Due Date</label>
                    <input type="date" className={styles.dialogInput} />
                  </div>
                  <div className={styles.dialogFormGroup}>
                    <label className={styles.dialogLabel}>Tags</label>
                    <input type="text" className={styles.dialogInput} placeholder="Add tags..." />
                  </div>
                </div>
                <div className={styles.dialogFooter}>
                  <button className={styles.dialogBtnSecondary}>Cancel</button>
                  <button className={styles.dialogBtnPrimary}>Create Request</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Previews */}
        <div className={styles.drawerSection}>
          <h4 className={styles.drawerSectionTitle}>Drawer & Panel Variants</h4>
          
          <div className={styles.drawerGrid}>
            {/* Right Drawer */}
            <div className={styles.drawerCard}>
              <h4 className={styles.dialogCardTitle}>Right Drawer</h4>
              <p className={styles.dialogCardDesc}>Slide from right side</p>
              <div className={styles.drawerPreview}>
                <div className={styles.drawerOverlay} />
                <div className={styles.rightDrawer}>
                  <div className={styles.drawerHeader}>
                    <h3 className={styles.drawerTitle}>Request Details</h3>
                    <button className={styles.drawerClose}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className={styles.drawerBody}>
                    <div className={styles.drawerSection}>
                      <span className={styles.drawerSectionLabel}>Status</span>
                      <span className={styles.statusBadge} data-status="open">Open</span>
                    </div>
                    <div className={styles.drawerSection}>
                      <span className={styles.drawerSectionLabel}>Requester</span>
                      <span className={styles.drawerValue}>John Doe</span>
                    </div>
                    <div className={styles.drawerSection}>
                      <span className={styles.drawerSectionLabel}>Assignee</span>
                      <span className={styles.drawerValue}>Mary Kim</span>
                    </div>
                    <div className={styles.drawerSection}>
                      <span className={styles.drawerSectionLabel}>Created</span>
                      <span className={styles.drawerValue}>Jan 15, 2024</span>
                    </div>
                    <div className={styles.drawerSection}>
                      <span className={styles.drawerSectionLabel}>Priority</span>
                      <span className={styles.priorityBadge} data-priority="high">High</span>
                    </div>
                  </div>
                  <div className={styles.drawerFooter}>
                    <button className={styles.drawerBtnSecondary}>Cancel</button>
                    <button className={styles.drawerBtnPrimary}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Drawer */}
            <div className={styles.drawerCard}>
              <h4 className={styles.dialogCardTitle}>Left Drawer</h4>
              <p className={styles.dialogCardDesc}>Navigation panel from left</p>
              <div className={styles.drawerPreview}>
                <div className={styles.drawerOverlay} />
                <div className={styles.leftDrawer}>
                  <div className={styles.drawerNav}>
                    <div className={styles.drawerNavItem}>
                      <Home size={18} />
                      <span>Dashboard</span>
                    </div>
                    <div className={styles.drawerNavItem}>
                      <FileText size={18} />
                      <span>Requests</span>
                    </div>
                    <div className={styles.drawerNavItem}>
                      <Users size={18} />
                      <span>Users</span>
                    </div>
                    <div className={styles.drawerNavItem}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
              <p className={styles.dialogCardDesc}>Expandable details panel</p>
              <div className={styles.drawerPreview}>
                <div className={styles.drawerOverlay} />
                <div className={styles.slidePanel}>
                  <div className={styles.slidePanelHeader}>
                    <h3 className={styles.slidePanelTitle}>Quick Actions</h3>
                    <button className={styles.drawerClose}>
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
