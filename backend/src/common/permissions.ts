/**
 * RBAC 2.0 Permission Constants
 * 
 * This file contains all granular permission constants for the application.
 * Organized by module following the pattern: module:action
 * 
 * IMPORTANT: These are the ONLY source of truth for permission strings.
 * DO NOT hardcode permission strings elsewhere in the codebase.
 * 
 * Backward Compatibility:
 * - Old permissions (tickets:view, tickets:manage, etc.) are preserved
 * - New granular permissions are added alongside them
 * - The alias map provides automatic equivalence (tickets:manage satisfies tickets:edit, etc.)
 */

// ============================================
// PERMISSION TYPE DEFINITIONS
// ============================================

export type PermissionCode = string;

export type PermissionModule = {
  code: PermissionCode;
  description: string;
  category: 'view' | 'action' | 'manage';
};

// ============================================
// DASHBOARD MODULE
// ============================================
export const DASHBOARD_PERMISSIONS = {
  VIEW: 'dashboard:view',
  VIEW_MY_TASKS: 'dashboard:view_my_tasks',
  VIEW_ACTIVITY: 'dashboard:view_activity',
  VIEW_HEALTH: 'dashboard:view_health',
} as const;

export type DashboardPermission = typeof DASHBOARD_PERMISSIONS[keyof typeof DASHBOARD_PERMISSIONS];

// ============================================
// SERVICE REQUESTS MODULE
// ============================================
export const TICKETS_PERMISSIONS = {
  // Legacy permissions (preserved for backward compatibility)
  READ: 'tickets:read',
  WRITE: 'tickets:write',
  ASSIGN: 'tickets:assign',
  MANAGE: 'tickets:manage',
  
  // New granular permissions
  VIEW: 'tickets:view',
  VIEW_OWN: 'tickets:view_own',
  VIEW_ALL: 'tickets:view_all',
  CREATE: 'tickets:create',
  EDIT: 'tickets:edit',
  DELETE: 'tickets:delete',
  ASSIGN_TICKET: 'tickets:assign',
  REASSIGN: 'tickets:reassign',
  UPDATE_STATUS: 'tickets:update_status',
  REOPEN: 'tickets:reopen',
  CLOSE: 'tickets:close',
  COMMENT: 'tickets:comment',
  VIEW_COMMENTS: 'tickets:view_comments',
  VIEW_TIMELINE: 'tickets:view_timeline',
  UPLOAD_ATTACHMENT: 'tickets:upload_attachment',
  DOWNLOAD_ATTACHMENT: 'tickets:download_attachment',
  DELETE_ATTACHMENT: 'tickets:delete_attachment',
  EXPORT: 'tickets:export',
  PRINT: 'tickets:print',
} as const;

export type TicketsPermission = typeof TICKETS_PERMISSIONS[keyof typeof TICKETS_PERMISSIONS];

// ============================================
// INCIDENTS MODULE
// ============================================
export const INCIDENTS_PERMISSIONS = {
  // Legacy permissions
  READ: 'incidents:read',
  WRITE: 'incidents:write',
  MANAGE: 'incidents:manage',
  
  // New granular permissions
  VIEW: 'incidents:view',
  CREATE: 'incidents:create',
  UPDATE: 'incidents:update',
  UPDATE_STATUS: 'incidents:update_status',
  UPDATE_SEVERITY: 'incidents:update_severity',
  UPLOAD_RESOLUTION: 'incidents:upload_resolution',
  DELETE_RESOLUTION: 'incidents:delete_resolution',
  CLOSE: 'incidents:close',
  EXPORT: 'incidents:export',
} as const;

export type IncidentsPermission = typeof INCIDENTS_PERMISSIONS[keyof typeof INCIDENTS_PERMISSIONS];

// ============================================
// PROBLEMS MODULE
// ============================================
export const PROBLEMS_PERMISSIONS = {
  VIEW: 'problems:view',
  CREATE: 'problems:create',
  UPDATE: 'problems:update',
  UPDATE_STATUS: 'problems:update_status',
  LINK_INCIDENT: 'problems:link_incident',
  EXPORT: 'problems:export',
} as const;

export type ProblemsPermission = typeof PROBLEMS_PERMISSIONS[keyof typeof PROBLEMS_PERMISSIONS];

// ============================================
// CHANGES MODULE
// ============================================
export const CHANGES_PERMISSIONS = {
  // Legacy permissions
  READ: 'changes:read',
  APPROVE: 'changes:approve',
  MANAGE: 'changes:manage',
  
  // New granular permissions
  VIEW: 'changes:view',
  CREATE: 'changes:create',
  UPDATE: 'changes:update',
  UPDATE_STATUS: 'changes:update_status',
  APPROVE_CHANGE: 'changes:approve',
  REJECT: 'changes:reject',
  IMPLEMENT: 'changes:implement',
  CLOSE: 'changes:close',
  EXPORT: 'changes:export',
} as const;

export type ChangesPermission = typeof CHANGES_PERMISSIONS[keyof typeof CHANGES_PERMISSIONS];

// ============================================
// INVENTORY MODULE
// ============================================
export const INVENTORY_PERMISSIONS = {
  // Legacy permissions
  READ: 'inventory:read',
  WRITE: 'inventory:write',
  MANAGE: 'inventory:manage',
  DELETE: 'inventory:delete',
  
  // New granular permissions
  VIEW: 'inventory:view',
  VIEW_CATEGORIES: 'inventory:view_categories',
  VIEW_ITEMS: 'inventory:view_items',
  VIEW_DETAILS: 'inventory:view_details',
  VIEW_HISTORY: 'inventory:view_history',
  VIEW_ANALYTICS: 'inventory:view_analytics',
  CREATE_CATEGORY: 'inventory:create_category',
  UPDATE_CATEGORY: 'inventory:update_category',
  DELETE_CATEGORY: 'inventory:delete_category',
  CREATE_ASSET: 'inventory:create_asset',
  UPDATE_ASSET: 'inventory:update_asset',
  DELETE_ASSET: 'inventory:delete_asset',
  ASSIGN_USER: 'inventory:assign_user',
  ASSIGN_PROJECT: 'inventory:assign_project',
  UNASSIGN: 'inventory:unassign',
  EXPORT: 'inventory:export',
} as const;

export type InventoryPermission = typeof INVENTORY_PERMISSIONS[keyof typeof INVENTORY_PERMISSIONS];

// ============================================
// ACCESS MANAGEMENT MODULE
// ============================================
export const ACCESS_PERMISSIONS = {
  // Legacy permissions
  READ: 'access:read',
  APPROVE: 'access:approve',
  
  // New granular permissions
  VIEW: 'access:view',
  VIEW_USER: 'access:view_user',
  VIEW_PROJECT: 'access:view_project',
  VIEW_OWN: 'access:view_own',
  REQUEST: 'access:request',
  APPROVE_ACCESS: 'access:approve',
  REJECT: 'access:reject',
  PROVISION: 'access:provision',
  REVOKE: 'access:revoke',
  EXPORT: 'access:export',
} as const;

export type AccessPermission = typeof ACCESS_PERMISSIONS[keyof typeof ACCESS_PERMISSIONS];

// ============================================
// COMPLIANCE MODULE
// ============================================
export const COMPLIANCE_PERMISSIONS = {
  // Legacy permissions
  READ: 'compliance:read',
  WRITE: 'compliance:write',
  MANAGE: 'compliance:manage',
  AUDIT: 'compliance:audit',
  
  // New granular permissions
  VIEW: 'compliance:view',
  VIEW_FOLDER: 'compliance:view_folder',
  DOWNLOAD_FILE: 'compliance:download_file',
  PREVIEW_FILE: 'compliance:preview_file',
  VIEW_ACTIVITY: 'compliance:view_activity',
  CREATE_FOLDER: 'compliance:create_folder',
  RENAME_FOLDER: 'compliance:rename_folder',
  MOVE_FOLDER: 'compliance:move_folder',
  DELETE_FOLDER: 'compliance:delete_folder',
  UPLOAD_FILE: 'compliance:upload_file',
  RENAME_FILE: 'compliance:rename_file',
  MOVE_FILE: 'compliance:move_file',
  DELETE_FILE: 'compliance:delete_file',
  REPLACE_VERSION: 'compliance:replace_version',
  RESTORE_VERSION: 'compliance:restore_version',
  ADD_TAG: 'compliance:add_tag',
  REMOVE_TAG: 'compliance:remove_tag',
  CREATE_TAG: 'compliance:create_tag',
  BULK_UPLOAD: 'compliance:bulk_upload',
  EXPORT: 'compliance:export',
} as const;

export type CompliancePermission = typeof COMPLIANCE_PERMISSIONS[keyof typeof COMPLIANCE_PERMISSIONS];

// ============================================
// PROJECTS MODULE
// ============================================
export const PROJECTS_PERMISSIONS = {
  VIEW: 'projects:view',
  VIEW_DETAILS: 'projects:view_details',
  VIEW_DOCUMENTS: 'projects:view_documents',
  VIEW_ACTIVITIES: 'projects:view_activities',
  CREATE: 'projects:create',
  UPDATE: 'projects:update',
  DELETE: 'projects:delete',
  UPLOAD_DOCUMENT: 'projects:upload_document',
  DOWNLOAD_DOCUMENT: 'projects:download_document',
  DELETE_DOCUMENT: 'projects:delete_document',
  EXPORT: 'projects:export',
} as const;

export type ProjectsPermission = typeof PROJECTS_PERMISSIONS[keyof typeof PROJECTS_PERMISSIONS];

// ============================================
// VENDORS MODULE
// ============================================
export const VENDORS_PERMISSIONS = {
  VIEW: 'vendors:view',
  VIEW_DETAILS: 'vendors:view_details',
  VIEW_INVENTORY: 'vendors:view_inventory',
  CREATE: 'vendors:create',
  UPDATE: 'vendors:update',
  DELETE: 'vendors:delete',
  UPDATE_STATUS: 'vendors:update_status',
  SET_OWNER: 'vendors:set_owner',
  EXPORT: 'vendors:export',
} as const;

export type VendorsPermission = typeof VENDORS_PERMISSIONS[keyof typeof VENDORS_PERMISSIONS];

// ============================================
// KNOWLEDGE BASE MODULE
// ============================================
export const KB_PERMISSIONS = {
  // Legacy permissions (knowledge.category namespace)
  VIEW_CATEGORY: 'knowledge.category:view',
  CREATE_CATEGORY: 'knowledge.category:create',
  UPDATE_CATEGORY: 'knowledge.category:update',
  DELETE_CATEGORY: 'knowledge.category:delete',
  
  // New kb: namespace permissions
  VIEW: 'kb:view',
  VIEW_ARTICLES: 'kb:view_articles',
  CREATE_ARTICLE: 'kb:create_article',
  UPDATE_ARTICLE: 'kb:update_article',
  DELETE_ARTICLE: 'kb:delete_article',
  PUBLISH_ARTICLE: 'kb:publish_article',
  ARCHIVE_ARTICLE: 'kb:archive_article',
  UPLOAD_ATTACHMENT: 'kb:upload_attachment',
  DOWNLOAD_ATTACHMENT: 'kb:download_attachment',
  DELETE_ATTACHMENT: 'kb:delete_attachment',
  VIEW_ANALYTICS: 'kb:view_analytics',
  EXPORT: 'kb:export',
  
  // Legacy kb: namespace
  KB_CREATE: 'kb:create',
  KB_MANAGE: 'kb:manage',
  KB_PUBLISH: 'kb:publish',
  KB_ARCHIVE: 'kb:archive',
} as const;

export type KBPermission = typeof KB_PERMISSIONS[keyof typeof KB_PERMISSIONS];

// ============================================
// REPORTS MODULE
// ============================================
export const REPORTS_PERMISSIONS = {
  VIEW: 'reports:view',
  VIEW_STATS: 'reports:view_stats',
  PREVIEW: 'reports:preview',
  COUNT: 'reports:count',
  GENERATE: 'reports:generate',
  DOWNLOAD: 'reports:download',
  CREATE: 'reports:create',
  EXPORT: 'reports:export',
} as const;

export type ReportsPermission = typeof REPORTS_PERMISSIONS[keyof typeof REPORTS_PERMISSIONS];

// ============================================
// USERS MODULE
// ============================================
export const USERS_PERMISSIONS = {
  // Legacy permissions
  READ: 'users:read',
  WRITE: 'users:write',
  DELETE: 'users:delete',
  MANAGE: 'users:manage',
  
  // New granular permissions
  VIEW: 'users:view',
  VIEW_LIST: 'users:view_list',
  VIEW_DETAILS: 'users:view_details',
  VIEW_OWN_PROFILE: 'users:view_own_profile',
  CREATE: 'users:create',
  UPDATE: 'users:update',
  ACTIVATE: 'users:activate',
  DEACTIVATE: 'users:deactivate',
  ASSIGN_ROLE: 'users:assign_role',
  REMOVE_ROLE: 'users:remove_role',
  RESET_PASSWORD: 'users:reset_password',
  UPDATE_OWN_PROFILE: 'users:update_own_profile',
  UPDATE_PREFERENCES: 'users:update_preferences',
  IMPORT: 'users:import',
  EXPORT: 'users:export',
} as const;

export type UsersPermission = typeof USERS_PERMISSIONS[keyof typeof USERS_PERMISSIONS];

// ============================================
// ROLES MODULE
// ============================================
export const ROLES_PERMISSIONS = {
  VIEW: 'roles:view',
  VIEW_LIST: 'roles:view_list',
  VIEW_DETAILS: 'roles:view_details',
  VIEW_PERMISSIONS: 'roles:view_permissions',
  CREATE: 'roles:create',
  UPDATE: 'roles:update',
  DELETE: 'roles:delete',
  UPDATE_PERMISSIONS: 'roles:update_permissions',
  
  // Legacy permission
  MANAGE: 'roles:manage',
} as const;

export type RolesPermission = typeof ROLES_PERMISSIONS[keyof typeof ROLES_PERMISSIONS];

// ============================================
// SETTINGS MODULE
// ============================================
export const SETTINGS_PERMISSIONS = {
  // Legacy permissions
  READ: 'settings:read',
  WRITE: 'settings:write',
  MANAGE: 'settings:manage',
  
  // New granular permissions
  VIEW: 'settings:view',
  UPDATE: 'settings:update',
} as const;

export type SettingsPermission = typeof SETTINGS_PERMISSIONS[keyof typeof SETTINGS_PERMISSIONS];

// ============================================
// AI MODULE
// ============================================
export const AI_PERMISSIONS = {
  ASK: 'ai:ask',
} as const;

export type AIPermission = typeof AI_PERMISSIONS[keyof typeof AI_PERMISSIONS];

// ============================================
// ALL PERMISSIONS ARRAY
// ============================================

/**
 * Complete list of all permission codes
 * Used for seeding and validation
 */
export const ALL_PERMISSIONS = [
  // Dashboard
  ...Object.values(DASHBOARD_PERMISSIONS),
  
  // Service Requests
  ...Object.values(TICKETS_PERMISSIONS),
  
  // Incidents
  ...Object.values(INCIDENTS_PERMISSIONS),
  
  // Problems
  ...Object.values(PROBLEMS_PERMISSIONS),
  
  // Changes
  ...Object.values(CHANGES_PERMISSIONS),
  
  // Inventory
  ...Object.values(INVENTORY_PERMISSIONS),
  
  // Access Management
  ...Object.values(ACCESS_PERMISSIONS),
  
  // Compliance
  ...Object.values(COMPLIANCE_PERMISSIONS),
  
  // Projects
  ...Object.values(PROJECTS_PERMISSIONS),
  
  // Vendors
  ...Object.values(VENDORS_PERMISSIONS),
  
  // Knowledge Base
  ...Object.values(KB_PERMISSIONS),
  
  // Reports
  ...Object.values(REPORTS_PERMISSIONS),
  
  // Users
  ...Object.values(USERS_PERMISSIONS),
  
  // Roles
  ...Object.values(ROLES_PERMISSIONS),
  
  // Settings
  ...Object.values(SETTINGS_PERMISSIONS),
  
  // AI
  ...Object.values(AI_PERMISSIONS),
] as const;

/**
 * Set of all permissions for O(1) lookup
 */
export const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

/**
 * Check if a permission code is valid
 */
export function isValidPermission(permission: string): boolean {
  return PERMISSION_SET.has(permission);
}

/**
 * Get all permissions for a module
 */
export function getModulePermissions(module: string): string[] {
  const moduleUpper = module.toUpperCase();
  switch (moduleUpper) {
    case 'DASHBOARD':
      return Object.values(DASHBOARD_PERMISSIONS);
    case 'TICKETS':
    case 'SERVICEREQUESTS':
      return Object.values(TICKETS_PERMISSIONS);
    case 'INCIDENTS':
      return Object.values(INCIDENTS_PERMISSIONS);
    case 'PROBLEMS':
      return Object.values(PROBLEMS_PERMISSIONS);
    case 'CHANGES':
      return Object.values(CHANGES_PERMISSIONS);
    case 'INVENTORY':
      return Object.values(INVENTORY_PERMISSIONS);
    case 'ACCESS':
      return Object.values(ACCESS_PERMISSIONS);
    case 'COMPLIANCE':
      return Object.values(COMPLIANCE_PERMISSIONS);
    case 'PROJECTS':
      return Object.values(PROJECTS_PERMISSIONS);
    case 'VENDORS':
      return Object.values(VENDORS_PERMISSIONS);
    case 'KB':
    case 'KNOWLEDGEBASE':
      return Object.values(KB_PERMISSIONS);
    case 'REPORTS':
      return Object.values(REPORTS_PERMISSIONS);
    case 'USERS':
      return Object.values(USERS_PERMISSIONS);
    case 'ROLES':
      return Object.values(ROLES_PERMISSIONS);
    case 'SETTINGS':
      return Object.values(SETTINGS_PERMISSIONS);
    case 'AI':
      return Object.values(AI_PERMISSIONS);
    default:
      return [];
  }
}
