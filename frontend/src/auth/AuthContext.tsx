import { createContext, useContext, useMemo, useState, useCallback } from 'react';
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
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionList: string[]) => boolean;
  hasAllPermissions: (permissionList: string[]) => boolean;
  can: (action: string, module?: string) => boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Super Admin permission that grants full access
const SUPER_ADMIN_PERMISSION = 'sys:admin';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('infraops.token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('infraops.user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isBootstrapping] = useState(false);

  if (token) setAuthToken(token);

  const permissions = user?.permissions || [];

  // Check if user is Super Admin (bypasses all permission checks)
  // Check both sys:admin permission AND Super Admin role name
  const isSuperAdmin = useMemo(() => {
    const hasSuperAdminPermission = permissions.includes(SUPER_ADMIN_PERMISSION);
    const hasSuperAdminRole = user?.roles?.includes('Super Admin') ?? false;
    return hasSuperAdminPermission || hasSuperAdminRole;
  }, [permissions, user?.roles]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  }, [permissions, isSuperAdmin]);

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (!permissionList || permissionList.length === 0) return false;
    return permissionList.some(p => permissions.includes(p));
  }, [permissions, isSuperAdmin]);

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.every(p => permissions.includes(p));
  }, [permissions, isSuperAdmin]);

  // Shorthand permission check: can("action") or can("action", "module")
  // Examples: can("manage", "inventory"), can("create"), can("delete")
  const can = useCallback((action: string, module?: string): boolean => {
    if (isSuperAdmin) return true;
    
    // Build permission string: "module:action" or just "action"
    const permission = module ? `${module}:${action}` : action;
    
    // Check exact match first
    if (permissions.includes(permission)) return true;
    
    // Check for wildcard "module:*" permission
    if (module && permissions.includes(`${module}:*`)) return true;
    
    // Check for global wildcard "*:*" 
    if (permissions.includes('*:*')) return true;
    
    return false;
  }, [permissions, isSuperAdmin]);

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
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isBootstrapping, 
    login, 
    logout 
  }), [token, user, permissions, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions, can, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Export the super admin permission constant for use elsewhere
export { SUPER_ADMIN_PERMISSION };

