import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  permissions: string[];
  permissionSet: Set<string>;  // O(1) lookup set
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionList: string[]) => boolean;
  hasAllPermissions: (permissionList: string[]) => boolean;
  can: (action: string, module?: string) => boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshPermissions: () => Promise<void>;  // PART 7: Refresh permissions without logout
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('infraops.token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('infraops.user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isBootstrapping] = useState(false);

  if (token) setAuthToken(token);

  const permissions = user?.permissions || [];

  // PART 8: Cache permissions in a Set for O(1) lookup
  const permissionSet = useMemo(() => {
    return new Set(permissions);
  }, [permissions]);

  // All roles follow the same permission evaluation logic
  // isSuperAdmin is now just a flag indicating the role - it does NOT bypass permissions
  const isSuperAdmin = useMemo(() => {
    return user?.roles?.includes('Super Admin') ?? false;
  }, [user?.roles]);

  // Check if user has a specific permission - O(1) lookup using Set
  const hasPermission = useCallback((permission: string): boolean => {
    return permissionSet.has(permission);
  }, [permissionSet]);

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return false;
    return permissionList.some(p => permissionSet.has(p));
  }, [permissionSet]);

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.every(p => permissionSet.has(p));
  }, [permissionSet]);

  // Shorthand permission check: can("action") or can("action", "module")
  // Examples: can("manage", "inventory"), can("create"), can("delete")
  const can = useCallback((action: string, module?: string): boolean => {
    // Build permission string: "module:action" or just "action"
    const permission = module ? `${module}:${action}` : action;
    
    // Check exact match first using Set - O(1)
    if (permissionSet.has(permission)) return true;
    
    // Check for wildcard "module:*" permission
    if (module && permissionSet.has(`${module}:*`)) return true;
    
    // Check for global wildcard "*:*" 
    if (permissionSet.has('*:*')) return true;
    
    return false;
  }, [permissionSet]);

  // PART 7: Refresh permissions from server without logout
  const refreshPermissions = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get('/auth/me');
      const updatedUser = response.data.user;
      
      // Update local storage and state
      localStorage.setItem('infraops.user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      // If refresh fails, logout user (token might be invalid)
      logout();
    }
  }, [token]);

  // Auto-refresh permissions when token changes
  useEffect(() => {
    if (token) {
      // Debounce refresh to avoid multiple calls
      const timeoutId = setTimeout(() => {
        refreshPermissions();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [token, refreshPermissions]);

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const nextToken = response.data.token;
    const nextUser = response.data.user;
    localStorage.setItem('infraops.token', nextToken);
    localStorage.setItem('infraops.user', JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem('infraops.token');
    localStorage.removeItem('infraops.user');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ 
    token, 
    user, 
    permissions,
    permissionSet,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isBootstrapping, 
    login, 
    logout,
    refreshPermissions
  }), [token, user, permissions, permissionSet, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions, can, isBootstrapping, refreshPermissions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

