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
    </div>
  );
}

export default DesignSystemPreviewPage;
