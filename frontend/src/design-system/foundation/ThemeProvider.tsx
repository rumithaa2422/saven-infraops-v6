/**
 * ThemeProvider Component
 * Enterprise Design System V2
 * Wraps application with design system context and CSS variables
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { designTokens, designTokensCSS } from './DesignTokens';

// Theme type definitions
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  tokens: typeof designTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Hook to use theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to get effective theme mode
export function useThemeMode(): ThemeContextValue['effectiveMode'] {
  const { effectiveMode } = useTheme();
  return effectiveMode;
}

// Storage key for theme preference
const THEME_STORAGE_KEY = 'ds-theme-mode';

// Get system preference
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get stored preference
function getStoredPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

// Store preference
function storePreference(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

// Apply CSS variables to document
function applyCSSVariables(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Remove existing theme class
  root.classList.remove('ds-theme-light', 'ds-theme-dark');
  root.classList.add(`ds-theme-${mode}`);
  
  // For dark mode, we can override specific variables if needed
  if (mode === 'dark') {
    root.style.setProperty('--bg-app', '#0f172a');
    root.style.setProperty('--bg-surface', '#1e293b');
    root.style.setProperty('--bg-surface-hover', '#334155');
    root.style.setProperty('--text-primary', '#f1f5f9');
    root.style.setProperty('--text-secondary', '#94a3b8');
    root.style.setProperty('--text-muted', '#64748b');
    root.style.setProperty('--border-default', '#334155');
  } else {
    // Reset to light mode values
    root.style.setProperty('--bg-app', '#f8fafc');
    root.style.setProperty('--bg-surface', '#ffffff');
    root.style.setProperty('--bg-surface-hover', '#f8fafc');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#475569');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--border-default', '#e2e8f0');
  }
}

// Inject CSS variables style element
function injectCSSTokens(): void {
  if (typeof document === 'undefined') return;
  
  // Check if already injected
  const existing = document.getElementById('ds-tokens');
  if (existing) return;
  
  const style = document.createElement('style');
  style.id = 'ds-tokens';
  style.textContent = designTokensCSS;
  document.head.appendChild(style);
}

// Component props
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
}

export function ThemeProvider({
  children,
  defaultMode,
  onModeChange
}: ThemeProviderProps): React.JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? getStoredPreference());
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(() => 
    mode === 'system' ? getSystemPreference() : mode
  );

  // Inject CSS on mount
  useEffect(() => {
    injectCSSTokens();
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        setEffectiveMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Update effective mode when mode changes
  useEffect(() => {
    const effective = mode === 'system' ? getSystemPreference() : mode;
    setEffectiveMode(effective);
    applyCSSVariables(effective);
  }, [mode]);

  // Set mode with persistence
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storePreference(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
    mode,
    effectiveMode,
    setMode,
    tokens: designTokens,
  }), [mode, effectiveMode, setMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
