/**
 * Permission Metadata Service
 * 
 * Transforms raw permission codes into structured metadata for UI display.
 * Automatically detects modules from permission namespaces and provides
 * display names, descriptions, and categorization.
 */

import { prisma } from '../common/prisma.js';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type PermissionCategory = 'view' | 'action' | 'manage' | 'admin';

export interface PermissionMetadata {
  code: string;
  module: string;
  action: string;
  displayName: string;
  description: string;
  category: PermissionCategory;
  sortOrder: number;
}

export interface PermissionModule {
  name: string;
  key: string;
  description: string;
  icon: string;
  permissions: PermissionMetadata[];
  categories: PermissionCategory[];
  totalPermissions: number;
  enabledPermissions: number;
}

export interface GroupedPermissions {
  modules: PermissionModule[];
  totalModules: number;
  totalPermissions: number;
}

// ============================================
// MODULE CONFIGURATION
// ============================================

const MODULE_CONFIG: Record<string, {
  name: string;
  description: string;
  icon: string;
  actions: Record<string, { displayName: string; description: string; sortOrder: number }>;
}> = {
  dashboard: {
    name: 'Dashboard',
    description: 'Access to dashboard and system overview',
    icon: '📊',
    actions: {
      view: { displayName: 'View Dashboard', description: 'Access to dashboard and system overview', sortOrder: 1 },
      view_my_tasks: { displayName: 'View My Tasks', description: 'View personal task counts and assignments', sortOrder: 2 },
      view_activity: { displayName: 'View Activity', description: 'View recent activity feed', sortOrder: 3 },
      view_health: { displayName: 'View Health', description: 'View system health status', sortOrder: 4 },
    }
  },
  tickets: {
    name: 'Service Requests',
    description: 'Service request/ticket management',
    icon: '🎫',
    actions: {
      read: { displayName: 'Read Tickets', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Tickets', description: 'Legacy write access', sortOrder: 0 },
      assign: { displayName: 'Assign Tickets', description: 'Legacy assign access', sortOrder: 0 },
      manage: { displayName: 'Manage Tickets', description: 'Full ticket management access', sortOrder: 0 },
      view: { displayName: 'View Requests', description: 'View service requests', sortOrder: 1 },
      view_own: { displayName: 'View Own Requests', description: 'View only own requests', sortOrder: 2 },
      view_all: { displayName: 'View All Requests', description: 'View all requests regardless of owner', sortOrder: 3 },
      create: { displayName: 'Create Request', description: 'Create new service requests', sortOrder: 10 },
      edit: { displayName: 'Edit Request', description: 'Edit service request details', sortOrder: 11 },
      delete: { displayName: 'Delete Request', description: 'Delete service requests', sortOrder: 12 },
      reassign: { displayName: 'Reassign Request', description: 'Reassign requests to different users', sortOrder: 13 },
      update_status: { displayName: 'Update Status', description: 'Change request status', sortOrder: 14 },
      reopen: { displayName: 'Reopen Request', description: 'Reopen closed requests', sortOrder: 15 },
      close: { displayName: 'Close Request', description: 'Close service requests', sortOrder: 16 },
      comment: { displayName: 'Add Comment', description: 'Add comments to requests', sortOrder: 20 },
      view_comments: { displayName: 'View Comments', description: 'View comments on requests', sortOrder: 21 },
      view_timeline: { displayName: 'View Timeline', description: 'View request timeline', sortOrder: 22 },
      upload_attachment: { displayName: 'Upload Attachments', description: 'Upload files to requests', sortOrder: 30 },
      download_attachment: { displayName: 'Download Attachments', description: 'Download request attachments', sortOrder: 31 },
      delete_attachment: { displayName: 'Delete Attachments', description: 'Delete request attachments', sortOrder: 32 },
      export: { displayName: 'Export Requests', description: 'Export service requests to CSV', sortOrder: 40 },
      print: { displayName: 'Print Request', description: 'Print service request details', sortOrder: 41 },
    }
  },
  incidents: {
    name: 'Incidents',
    description: 'Incident management',
    icon: '🚨',
    actions: {
      read: { displayName: 'Read Incidents', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Incidents', description: 'Legacy write access', sortOrder: 0 },
      manage: { displayName: 'Manage Incidents', description: 'Full incident management access', sortOrder: 0 },
      view: { displayName: 'View Incidents', description: 'View incident records', sortOrder: 1 },
      create: { displayName: 'Create Incident', description: 'Create new incidents', sortOrder: 10 },
      update: { displayName: 'Update Incident', description: 'Update incident details', sortOrder: 11 },
      update_status: { displayName: 'Update Status', description: 'Change incident status', sortOrder: 12 },
      update_severity: { displayName: 'Update Severity', description: 'Change incident severity level', sortOrder: 13 },
      upload_resolution: { displayName: 'Upload Resolution', description: 'Upload resolution documents', sortOrder: 20 },
      delete_resolution: { displayName: 'Delete Resolution', description: 'Delete resolution documents', sortOrder: 21 },
      close: { displayName: 'Close Incident', description: 'Close incidents', sortOrder: 30 },
      export: { displayName: 'Export Incidents', description: 'Export incidents to CSV', sortOrder: 40 },
    }
  },
  problems: {
    name: 'Problems',
    description: 'Problem management',
    icon: '🔧',
    actions: {
      view: { displayName: 'View Problems', description: 'View problem records', sortOrder: 1 },
      create: { displayName: 'Create Problem', description: 'Create new problems', sortOrder: 10 },
      update: { displayName: 'Update Problem', description: 'Update problem details', sortOrder: 11 },
      update_status: { displayName: 'Update Status', description: 'Change problem status', sortOrder: 12 },
      link_incident: { displayName: 'Link Incident', description: 'Link incidents to problems', sortOrder: 20 },
      export: { displayName: 'Export Problems', description: 'Export problems to CSV', sortOrder: 40 },
    }
  },
  changes: {
    name: 'Changes',
    description: 'Change request management',
    icon: '🔄',
    actions: {
      read: { displayName: 'Read Changes', description: 'Legacy read access', sortOrder: 0 },
      approve: { displayName: 'Approve Changes', description: 'Legacy approve access', sortOrder: 0 },
      manage: { displayName: 'Manage Changes', description: 'Full change management access', sortOrder: 0 },
      view: { displayName: 'View Changes', description: 'View change requests', sortOrder: 1 },
      create: { displayName: 'Create Change', description: 'Create new change requests', sortOrder: 10 },
      update: { displayName: 'Update Change', description: 'Update change details', sortOrder: 11 },
      update_status: { displayName: 'Update Status', description: 'Change request status', sortOrder: 12 },
      reject: { displayName: 'Reject Change', description: 'Reject change requests', sortOrder: 13 },
      implement: { displayName: 'Implement Change', description: 'Mark changes as implemented', sortOrder: 14 },
      close: { displayName: 'Close Change', description: 'Close change requests', sortOrder: 20 },
      export: { displayName: 'Export Changes', description: 'Export changes to CSV', sortOrder: 40 },
    }
  },
  inventory: {
    name: 'Inventory',
    description: 'Asset and inventory management',
    icon: '📦',
    actions: {
      read: { displayName: 'Read Inventory', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Inventory', description: 'Legacy write access', sortOrder: 0 },
      manage: { displayName: 'Manage Inventory', description: 'Full inventory management access', sortOrder: 0 },
      delete: { displayName: 'Delete Inventory', description: 'Legacy delete access', sortOrder: 0 },
      view: { displayName: 'View Inventory', description: 'View inventory and assets', sortOrder: 1 },
      view_categories: { displayName: 'View Categories', description: 'View inventory categories', sortOrder: 2 },
      view_items: { displayName: 'View Items', description: 'View inventory items', sortOrder: 3 },
      view_details: { displayName: 'View Details', description: 'View detailed item information', sortOrder: 4 },
      view_history: { displayName: 'View History', description: 'View assignment history', sortOrder: 5 },
      view_analytics: { displayName: 'View Analytics', description: 'View inventory analytics', sortOrder: 6 },
      create_category: { displayName: 'Create Category', description: 'Create inventory categories', sortOrder: 10 },
      update_category: { displayName: 'Update Category', description: 'Update category details', sortOrder: 11 },
      delete_category: { displayName: 'Delete Category', description: 'Delete categories', sortOrder: 12 },
      create_asset: { displayName: 'Create Asset', description: 'Create new assets', sortOrder: 20 },
      update_asset: { displayName: 'Update Asset', description: 'Update asset details', sortOrder: 21 },
      delete_asset: { displayName: 'Delete Asset', description: 'Delete assets', sortOrder: 22 },
      assign_user: { displayName: 'Assign User', description: 'Assign assets to users', sortOrder: 30 },
      assign_project: { displayName: 'Assign Project', description: 'Assign assets to projects', sortOrder: 31 },
      unassign: { displayName: 'Unassign', description: 'Unassign assets', sortOrder: 32 },
      export: { displayName: 'Export Inventory', description: 'Export inventory to CSV', sortOrder: 40 },
    }
  },
  access: {
    name: 'Access Management',
    description: 'Access request management',
    icon: '🔑',
    actions: {
      read: { displayName: 'Read Access', description: 'Legacy read access', sortOrder: 0 },
      approve: { displayName: 'Approve Access', description: 'Legacy approve access', sortOrder: 0 },
      view: { displayName: 'View Requests', description: 'View access requests', sortOrder: 1 },
      view_user: { displayName: 'View User Access', description: 'View user access details', sortOrder: 2 },
      view_project: { displayName: 'View Project Access', description: 'View project access', sortOrder: 3 },
      view_own: { displayName: 'View Own Access', description: 'View own access requests', sortOrder: 4 },
      request: { displayName: 'Request Access', description: 'Submit access requests', sortOrder: 10 },
      reject: { displayName: 'Reject Request', description: 'Reject access requests', sortOrder: 11 },
      provision: { displayName: 'Provision Access', description: 'Provision access to users', sortOrder: 12 },
      revoke: { displayName: 'Revoke Access', description: 'Revoke user access', sortOrder: 13 },
      export: { displayName: 'Export Access', description: 'Export access requests', sortOrder: 40 },
    }
  },
  compliance: {
    name: 'Compliance',
    description: 'Document repository and compliance',
    icon: '📋',
    actions: {
      read: { displayName: 'Read Compliance', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Compliance', description: 'Legacy write access', sortOrder: 0 },
      manage: { displayName: 'Manage Compliance', description: 'Full compliance management access', sortOrder: 0 },
      audit: { displayName: 'Audit Compliance', description: 'Audit compliance records', sortOrder: 0 },
      view: { displayName: 'View Compliance', description: 'View compliance documents', sortOrder: 1 },
      view_folder: { displayName: 'View Folders', description: 'Browse document folders', sortOrder: 2 },
      download_file: { displayName: 'Download Files', description: 'Download documents', sortOrder: 3 },
      preview_file: { displayName: 'Preview Files', description: 'Preview document content', sortOrder: 4 },
      view_activity: { displayName: 'View Activity', description: 'View document activity', sortOrder: 5 },
      create_folder: { displayName: 'Create Folder', description: 'Create new folders', sortOrder: 10 },
      rename_folder: { displayName: 'Rename Folder', description: 'Rename existing folders', sortOrder: 11 },
      move_folder: { displayName: 'Move Folder', description: 'Move folders to different locations', sortOrder: 12 },
      delete_folder: { displayName: 'Delete Folder', description: 'Delete folders', sortOrder: 13 },
      upload_file: { displayName: 'Upload Files', description: 'Upload documents', sortOrder: 20 },
      rename_file: { displayName: 'Rename Files', description: 'Rename documents', sortOrder: 21 },
      move_file: { displayName: 'Move Files', description: 'Move files to different folders', sortOrder: 22 },
      delete_file: { displayName: 'Delete Files', description: 'Delete documents', sortOrder: 23 },
      replace_version: { displayName: 'Replace Version', description: 'Replace file versions', sortOrder: 30 },
      restore_version: { displayName: 'Restore Version', description: 'Restore previous versions', sortOrder: 31 },
      add_tag: { displayName: 'Add Tag', description: 'Add tags to files', sortOrder: 40 },
      remove_tag: { displayName: 'Remove Tag', description: 'Remove tags from files', sortOrder: 41 },
      create_tag: { displayName: 'Create Tag', description: 'Create new tags', sortOrder: 42 },
      bulk_upload: { displayName: 'Bulk Upload', description: 'Upload multiple files at once', sortOrder: 50 },
      export: { displayName: 'Export Compliance', description: 'Export compliance data', sortOrder: 60 },
    }
  },
  projects: {
    name: 'Projects',
    description: 'Project and environment management',
    icon: '📁',
    actions: {
      view: { displayName: 'View Projects', description: 'View projects and environments', sortOrder: 1 },
      view_details: { displayName: 'View Details', description: 'View project details', sortOrder: 2 },
      view_documents: { displayName: 'View Documents', description: 'View project documents', sortOrder: 3 },
      view_activities: { displayName: 'View Activities', description: 'View project activities', sortOrder: 4 },
      create: { displayName: 'Create Project', description: 'Create new projects', sortOrder: 10 },
      update: { displayName: 'Update Project', description: 'Update project details', sortOrder: 11 },
      delete: { displayName: 'Delete Project', description: 'Delete projects', sortOrder: 12 },
      upload_document: { displayName: 'Upload Document', description: 'Upload project documents', sortOrder: 20 },
      download_document: { displayName: 'Download Document', description: 'Download project documents', sortOrder: 21 },
      delete_document: { displayName: 'Delete Document', description: 'Delete project documents', sortOrder: 22 },
      export: { displayName: 'Export Projects', description: 'Export project data', sortOrder: 40 },
    }
  },
  vendors: {
    name: 'Vendors',
    description: 'Vendor and license management',
    icon: '🏢',
    actions: {
      view: { displayName: 'View Vendors', description: 'View vendor directory', sortOrder: 1 },
      view_details: { displayName: 'View Details', description: 'View vendor details', sortOrder: 2 },
      view_inventory: { displayName: 'View Inventory', description: 'View vendor inventory', sortOrder: 3 },
      create: { displayName: 'Create Vendor', description: 'Create new vendors', sortOrder: 10 },
      update: { displayName: 'Update Vendor', description: 'Update vendor details', sortOrder: 11 },
      delete: { displayName: 'Delete Vendor', description: 'Delete vendors', sortOrder: 12 },
      update_status: { displayName: 'Update Status', description: 'Change vendor status', sortOrder: 13 },
      set_owner: { displayName: 'Set Owner', description: 'Assign vendor owner', sortOrder: 14 },
      export: { displayName: 'Export Vendors', description: 'Export vendor data', sortOrder: 40 },
    }
  },
  kb: {
    name: 'Knowledge Base',
    description: 'Knowledge base articles and categories',
    icon: '📚',
    actions: {
      view: { displayName: 'View Knowledge Base', description: 'Access knowledge base', sortOrder: 1 },
      create: { displayName: 'Create KB', description: 'Legacy create access', sortOrder: 0 },
      manage: { displayName: 'Manage KB', description: 'Legacy manage access', sortOrder: 0 },
      publish: { displayName: 'Publish KB', description: 'Legacy publish access', sortOrder: 0 },
      archive: { displayName: 'Archive KB', description: 'Legacy archive access', sortOrder: 0 },
      export: { displayName: 'Export KB', description: 'Export knowledge base', sortOrder: 0 },
      view_articles: { displayName: 'View Articles', description: 'View KB articles', sortOrder: 2 },
      create_article: { displayName: 'Create Article', description: 'Create KB articles', sortOrder: 10 },
      update_article: { displayName: 'Update Article', description: 'Update KB articles', sortOrder: 11 },
      delete_article: { displayName: 'Delete Article', description: 'Delete KB articles', sortOrder: 12 },
      publish_article: { displayName: 'Publish Article', description: 'Publish KB articles', sortOrder: 13 },
      archive_article: { displayName: 'Archive Article', description: 'Archive KB articles', sortOrder: 14 },
      upload_attachment: { displayName: 'Upload Attachment', description: 'Upload article attachments', sortOrder: 20 },
      download_attachment: { displayName: 'Download Attachment', description: 'Download article attachments', sortOrder: 21 },
      delete_attachment: { displayName: 'Delete Attachment', description: 'Delete article attachments', sortOrder: 22 },
      view_analytics: { displayName: 'View Analytics', description: 'View KB analytics', sortOrder: 30 },
    }
  },
  'knowledge.category': {
    name: 'Knowledge Categories',
    description: 'Knowledge base category management',
    icon: '📑',
    actions: {
      view: { displayName: 'View Categories', description: 'View KB categories', sortOrder: 1 },
      create: { displayName: 'Create Category', description: 'Create KB categories', sortOrder: 10 },
      update: { displayName: 'Update Category', description: 'Update KB categories', sortOrder: 11 },
      delete: { displayName: 'Delete Category', description: 'Delete KB categories', sortOrder: 12 },
    }
  },
  reports: {
    name: 'Reports',
    description: 'Reports and analytics',
    icon: '📈',
    actions: {
      view: { displayName: 'View Reports', description: 'Access reports module', sortOrder: 1 },
      view_stats: { displayName: 'View Statistics', description: 'View report statistics', sortOrder: 2 },
      preview: { displayName: 'Preview Report', description: 'Preview reports before download', sortOrder: 3 },
      count: { displayName: 'Get Counts', description: 'Get record counts', sortOrder: 4 },
      generate: { displayName: 'Generate Report', description: 'Generate new reports', sortOrder: 10 },
      download: { displayName: 'Download Report', description: 'Download generated reports', sortOrder: 11 },
      create: { displayName: 'Create Report', description: 'Create custom reports', sortOrder: 12 },
      export: { displayName: 'Export Reports', description: 'Export report data', sortOrder: 20 },
    }
  },
  users: {
    name: 'Users',
    description: 'User management',
    icon: '👥',
    actions: {
      read: { displayName: 'Read Users', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Users', description: 'Legacy write access', sortOrder: 0 },
      delete: { displayName: 'Delete Users', description: 'Legacy delete access', sortOrder: 0 },
      manage: { displayName: 'Manage Users', description: 'Full user management access', sortOrder: 0 },
      view: { displayName: 'View Users', description: 'View user list and profiles', sortOrder: 1 },
      view_list: { displayName: 'View User List', description: 'View list of all users', sortOrder: 2 },
      view_details: { displayName: 'View Details', description: 'View detailed user information', sortOrder: 3 },
      view_own_profile: { displayName: 'View Own Profile', description: 'View own user profile', sortOrder: 4 },
      create: { displayName: 'Create User', description: 'Create new users', sortOrder: 10 },
      update: { displayName: 'Update User', description: 'Update user details', sortOrder: 11 },
      activate: { displayName: 'Activate User', description: 'Activate user accounts', sortOrder: 12 },
      deactivate: { displayName: 'Deactivate User', description: 'Deactivate user accounts', sortOrder: 13 },
      assign_role: { displayName: 'Assign Role', description: 'Assign roles to users', sortOrder: 14 },
      remove_role: { displayName: 'Remove Role', description: 'Remove roles from users', sortOrder: 15 },
      reset_password: { displayName: 'Reset Password', description: 'Reset user passwords', sortOrder: 16 },
      update_own_profile: { displayName: 'Update Own Profile', description: 'Update own profile information', sortOrder: 20 },
      update_preferences: { displayName: 'Update Preferences', description: 'Update user preferences', sortOrder: 21 },
      import: { displayName: 'Import Users', description: 'Import users from CSV', sortOrder: 30 },
      export: { displayName: 'Export Users', description: 'Export user data', sortOrder: 40 },
    }
  },
  roles: {
    name: 'Roles',
    description: 'Role and permission management',
    icon: '🎭',
    actions: {
      view: { displayName: 'View Roles', description: 'View role definitions', sortOrder: 1 },
      view_list: { displayName: 'View Role List', description: 'View list of all roles', sortOrder: 2 },
      view_details: { displayName: 'View Details', description: 'View detailed role information', sortOrder: 3 },
      view_permissions: { displayName: 'View Permissions', description: 'View role permissions', sortOrder: 4 },
      create: { displayName: 'Create Role', description: 'Create new roles', sortOrder: 10 },
      update: { displayName: 'Update Role', description: 'Update role details', sortOrder: 11 },
      delete: { displayName: 'Delete Role', description: 'Delete roles', sortOrder: 12 },
      update_permissions: { displayName: 'Update Permissions', description: 'Modify role permissions', sortOrder: 13 },
      manage: { displayName: 'Manage Roles', description: 'Full role management access', sortOrder: 0 },
    }
  },
  settings: {
    name: 'Settings',
    description: 'System settings',
    icon: '⚙️',
    actions: {
      read: { displayName: 'Read Settings', description: 'Legacy read access', sortOrder: 0 },
      write: { displayName: 'Write Settings', description: 'Legacy write access', sortOrder: 0 },
      manage: { displayName: 'Manage Settings', description: 'Full settings access', sortOrder: 0 },
      view: { displayName: 'View Settings', description: 'View system settings', sortOrder: 1 },
      update: { displayName: 'Update Settings', description: 'Modify system settings', sortOrder: 10 },
    }
  },
  ai: {
    name: 'AI Assistant',
    description: 'AI-powered assistant',
    icon: '🤖',
    actions: {
      ask: { displayName: 'Use AI Assistant', description: 'Access AI assistant feature', sortOrder: 1 },
    }
  }
};

// Module order for display
const MODULE_ORDER = [
  'dashboard',
  'tickets',
  'incidents',
  'problems',
  'changes',
  'inventory',
  'access',
  'compliance',
  'projects',
  'vendors',
  'kb',
  'knowledge.category',
  'reports',
  'users',
  'roles',
  'settings',
  'ai'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseModuleFromCode(code: string): { moduleKey: string; action: string } {
  const parts = code.split(':');
  if (parts.length !== 2) {
    return { moduleKey: parts[0] || 'unknown', action: parts[1] || code };
  }
  return { moduleKey: parts[0], action: parts[1] };
}

function getCategory(action: string): PermissionCategory {
  if (['view', 'read'].includes(action)) return 'view';
  if (['manage', 'update', 'delete', 'approve', 'reject', 'close', 'reopen', 'assign', 'reassign', 'upload', 'download', 'upload_document', 'download_document', 'upload_attachment', 'download_attachment', 'upload_resolution', 'delete_resolution', 'publish', 'archive', 'publish_article', 'archive_article', 'provision', 'revoke', 'replace_version', 'restore_version', 'reset_password', 'activate', 'deactivate', 'assign_role', 'remove_role', 'set_owner', 'implement', 'link_incident', 'update_status', 'update_severity', 'add_tag', 'remove_tag', 'create_tag', 'bulk_upload', 'replace', 'restore', 'request', 'update_own_profile', 'update_preferences', 'reopen', 'unassign'].includes(action)) {
    return 'action';
  }
  if (['create', 'create_article', 'create_asset', 'create_category', 'create_folder', 'create_project', 'create_vendor', 'create_change', 'create_incident', 'create_problem', 'create_role', 'create_user', 'create_report', 'create_tag'].includes(action)) {
    return 'action';
  }
  if (['delete', 'delete_article', 'delete_asset', 'delete_category', 'delete_folder', 'delete_project', 'delete_vendor', 'delete_change', 'delete_incident', 'delete_problem', 'delete_role', 'delete_user', 'delete_file', 'delete_document', 'delete_attachment', 'delete_resolution'].includes(action)) {
    return 'manage';
  }
  return 'action';
}

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Transform a raw permission code into metadata
 */
export function transformPermission(code: string): PermissionMetadata | null {
  const { moduleKey, action } = parseModuleFromCode(code);
  const moduleConfig = MODULE_CONFIG[moduleKey];
  
  if (!moduleConfig) {
    // Unknown module - generate generic metadata
    return {
      code,
      module: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1).replace('_', ' '),
      action,
      displayName: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Permission for ${action.replace(/_/g, ' ')} on ${moduleKey}`,
      category: getCategory(action),
      sortOrder: 100
    };
  }
  
  const actionConfig = moduleConfig.actions[action];
  if (actionConfig) {
    return {
      code,
      module: moduleConfig.name,
      action,
      displayName: actionConfig.displayName,
      description: actionConfig.description,
      category: getCategory(action),
      sortOrder: actionConfig.sortOrder
    };
  }
  
  // Action not in config - generate generic metadata
  return {
    code,
    module: moduleConfig.name,
    action,
    displayName: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Permission for ${action.replace(/_/g, ' ')} on ${moduleConfig.name.toLowerCase()}`,
    category: getCategory(action),
    sortOrder: 50
  };
}

/**
 * Get all permissions from database with metadata
 */
export async function getAllPermissionsWithMetadata(): Promise<PermissionMetadata[]> {
  const permissions = await prisma.permission.findMany({
    orderBy: { code: 'asc' }
  });
  
  return permissions
    .map(p => transformPermission(p.code))
    .filter((p): p is PermissionMetadata => p !== null);
}

/**
 * Get permissions grouped by module with full metadata
 */
export async function getGroupedPermissions(): Promise<GroupedPermissions> {
  const allPermissions = await getAllPermissionsWithMetadata();
  
  const moduleMap = new Map<string, PermissionMetadata[]>();
  
  for (const perm of allPermissions) {
    const existing = moduleMap.get(perm.module) || [];
    existing.push(perm);
    moduleMap.set(perm.module, existing);
  }
  
  const modules: PermissionModule[] = [];
  
  for (const moduleKey of MODULE_ORDER) {
    const moduleConfig = MODULE_CONFIG[moduleKey];
    if (!moduleConfig) continue;
    
    const perms = moduleMap.get(moduleConfig.name) || [];
    if (perms.length === 0) continue;
    
    // Sort permissions by sortOrder within the module
    perms.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Get unique categories
    const categories = [...new Set(perms.map(p => p.category))];
    
    modules.push({
      name: moduleConfig.name,
      key: moduleKey,
      description: moduleConfig.description,
      icon: moduleConfig.icon,
      permissions: perms,
      categories,
      totalPermissions: perms.length,
      enabledPermissions: 0 // Will be set when checking against role
    });
  }
  
  return {
    modules,
    totalModules: modules.length,
    totalPermissions: allPermissions.length
  };
}

/**
 * Get role permissions with full metadata
 */
export async function getRolePermissionsWithMetadata(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  
  if (!role) {
    return null;
  }
  
  const rolePermissionCodes = new Set(role.permissions.map(rp => rp.permission.code));
  const grouped = await getGroupedPermissions();
  
  // Update enabledPermissions count for each module
  for (const module of grouped.modules) {
    module.enabledPermissions = module.permissions.filter(p => 
      rolePermissionCodes.has(p.code)
    ).length;
  }
  
  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description
    },
    permissions: grouped,
    assignedPermissions: [...rolePermissionCodes]
  };
}

/**
 * Get summary statistics for dashboard
 */
export async function getPermissionStats() {
  const [permissionCount, roleCount, moduleCount, categoryCount] = await Promise.all([
    prisma.permission.count(),
    prisma.role.count(),
    Promise.resolve(MODULE_ORDER.length),
    Promise.resolve(3) // view, action, manage
  ]);
  
  return {
    totalPermissions: permissionCount,
    totalRoles: roleCount,
    totalModules: moduleCount,
    totalCategories: categoryCount
  };
}
