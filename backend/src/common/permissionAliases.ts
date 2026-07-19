/**
 * Permission Alias Map for RBAC 2.0 Backward Compatibility
 * 
 * This file defines which granular permissions are satisfied by legacy permissions.
 * For example: 'tickets:manage' automatically satisfies 'tickets:edit', 'tickets:update_status', etc.
 * 
 * This ensures that during the migration phase:
 * - Existing roles with old permissions continue to work
 * - New granular permissions can be checked alongside old ones
 * - The application remains functional throughout the transition
 * 
 * STRUCTURE:
 * Map<LegacyPermission, Set<GranularPermissionsSatisfied>>
 */

export type PermissionAliasMap = Map<string, Set<string>>;

/**
 * The alias map defines backward compatibility relationships.
 * 
 * Key: A legacy permission that might be assigned to existing roles
 * Value: Set of granular permissions that are automatically satisfied by the key
 * 
 * Example: 'tickets:manage' => new Set(['tickets:create', 'tickets:edit', 'tickets:update_status', ...])
 * This means if a user has 'tickets:manage', they automatically satisfy all the granular permissions.
 */

export const PERMISSION_ALIAS_MAP: PermissionAliasMap = new Map([
  // ============================================
  // DASHBOARD MODULE
  // ============================================
  ['dashboard:view', new Set([
    'dashboard:view',
    'dashboard:view_my_tasks',
    'dashboard:view_activity',
    'dashboard:view_health',
  ])],
  ['dashboard:read', new Set([
    'dashboard:view',
    'dashboard:view_my_tasks',
    'dashboard:view_activity',
    'dashboard:view_health',
  ])],

  // ============================================
  // SERVICE REQUESTS MODULE
  // ============================================
  ['tickets:manage', new Set([
    'tickets:view',
    'tickets:view_own',
    'tickets:view_all',
    'tickets:create',
    'tickets:edit',
    'tickets:delete',
    'tickets:assign',
    'tickets:reassign',
    'tickets:update_status',
    'tickets:reopen',
    'tickets:close',
    'tickets:comment',
    'tickets:view_comments',
    'tickets:view_timeline',
    'tickets:upload_attachment',
    'tickets:download_attachment',
    'tickets:delete_attachment',
    'tickets:export',
    'tickets:print',
  ])],
  ['tickets:write', new Set([
    'tickets:create',
    'tickets:edit',
    'tickets:comment',
    'tickets:upload_attachment',
    'tickets:update_status',
  ])],
  ['tickets:read', new Set([
    'tickets:view',
    'tickets:view_own',
    'tickets:view_comments',
    'tickets:view_timeline',
    'tickets:download_attachment',
  ])],
  ['tickets:assign', new Set([
    'tickets:assign',
    'tickets:reassign',
  ])],

  // ============================================
  // INCIDENTS MODULE
  // ============================================
  ['incidents:manage', new Set([
    'incidents:view',
    'incidents:create',
    'incidents:update',
    'incidents:update_status',
    'incidents:update_severity',
    'incidents:upload_resolution',
    'incidents:delete_resolution',
    'incidents:close',
    'incidents:export',
  ])],
  ['incidents:write', new Set([
    'incidents:create',
    'incidents:update',
    'incidents:update_status',
    'incidents:update_severity',
    'incidents:upload_resolution',
  ])],
  ['incidents:read', new Set([
    'incidents:view',
    'incidents:export',
  ])],

  // ============================================
  // PROBLEMS MODULE - PART 4: Granular Permissions
  // ============================================
  ['problems:manage', new Set([
    'problems:view',
    'problems:create',
    'problems:update',
    'problems:delete',
    'problems:update_status',
    'problems:resolve',
    'problems:close',
    'problems:reopen',
    'problems:assign',
    'problems:update_rca',
    'problems:link_incident',
    'problems:comment',
    'problems:upload_attachment',
    'problems:download_attachment',
    'problems:export',
  ])],
  ['problems:update', new Set([
    'problems:update',
    'problems:update_status',
    'problems:resolve',
    'problems:close',
    'problems:reopen',
    'problems:assign',
    'problems:update_rca',
    'problems:comment',
    'problems:upload_attachment',
  ])],

  // ============================================
  // CHANGES MODULE - PART 4: Granular Permissions
  // ============================================
  ['changes:manage', new Set([
    'changes:view',
    'changes:create',
    'changes:update',
    'changes:delete',
    'changes:update_status',
    'changes:submit',
    'changes:approve',
    'changes:reject',
    'changes:schedule',
    'changes:implement',
    'changes:close',
    'changes:reopen',
    'changes:update_rollback',
    'changes:assign',
    'changes:upload_attachment',
    'changes:download_attachment',
    'changes:export',
  ])],
  ['changes:update', new Set([
    'changes:update',
    'changes:update_status',
    'changes:schedule',
    'changes:implement',
    'changes:close',
    'changes:reopen',
    'changes:update_rollback',
    'changes:assign',
    'changes:upload_attachment',
  ])],
  ['changes:approve', new Set([
    'changes:approve',
    'changes:reject',
    'changes:close',
  ])],
  ['changes:read', new Set([
    'changes:view',
    'changes:export',
  ])],

  // ============================================
  // INVENTORY MODULE - PART 4: Granular Permissions
  // ============================================
  ['inventory:manage', new Set([
    'inventory:view',
    'inventory:view_categories',
    'inventory:view_items',
    'inventory:view_details',
    'inventory:view_history',
    'inventory:view_analytics',
    'inventory:create_category',
    'inventory:update_category',
    'inventory:delete_category',
    'inventory:create_asset',
    'inventory:update_asset',
    'inventory:delete_asset',
    'inventory:assign',
    'inventory:return',
    'inventory:transfer',
    'inventory:update_status',
    'inventory:upload_document',
    'inventory:download_document',
    'inventory:export',
  ])],
  ['inventory:write', new Set([
    'inventory:create_category',
    'inventory:update_category',
    'inventory:create_asset',
    'inventory:update_asset',
    'inventory:assign',
    'inventory:return',
    'inventory:transfer',
    'inventory:update_status',
    'inventory:upload_document',
  ])],
  ['inventory:read', new Set([
    'inventory:view',
    'inventory:view_categories',
    'inventory:view_items',
    'inventory:view_details',
    'inventory:view_history',
    'inventory:download_document',
    'inventory:export',
  ])],
  ['inventory:delete', new Set([
    'inventory:delete_asset',
    'inventory:delete_category',
  ])],

  // ============================================
  // ACCESS MANAGEMENT MODULE - PART 4: Granular Permissions
  // ============================================
  ['access:manage', new Set([
    'access:view',
    'access:view_user',
    'access:view_project',
    'access:view_own',
    'access:request',
    'access:edit',
    'access:delete',
    'access:approve',
    'access:reject',
    'access:provision',
    'access:revoke',
    'access:extend',
    'access:update_status',
    'access:export',
  ])],
  ['access:approve', new Set([
    'access:approve',
    'access:reject',
    'access:provision',
    'access:revoke',
    'access:extend',
    'access:update_status',
  ])],
  ['access:read', new Set([
    'access:view',
    'access:view_user',
    'access:view_project',
    'access:view_own',
    'access:request',
    'access:export',
  ])],

  // ============================================
  // COMPLIANCE MODULE
  // ============================================
  ['compliance:manage', new Set([
    'compliance:view',
    'compliance:view_folder',
    'compliance:download_file',
    'compliance:preview_file',
    'compliance:view_activity',
    'compliance:create_folder',
    'compliance:rename_folder',
    'compliance:move_folder',
    'compliance:delete_folder',
    'compliance:upload_file',
    'compliance:rename_file',
    'compliance:move_file',
    'compliance:delete_file',
    'compliance:replace_version',
    'compliance:restore_version',
    'compliance:add_tag',
    'compliance:remove_tag',
    'compliance:create_tag',
    'compliance:bulk_upload',
    'compliance:export',
  ])],
  ['compliance:write', new Set([
    'compliance:create_folder',
    'compliance:rename_folder',
    'compliance:move_folder',
    'compliance:upload_file',
    'compliance:rename_file',
    'compliance:move_file',
    'compliance:replace_version',
    'compliance:add_tag',
    'compliance:create_tag',
    'compliance:bulk_upload',
  ])],
  ['compliance:read', new Set([
    'compliance:view',
    'compliance:view_folder',
    'compliance:download_file',
    'compliance:preview_file',
    'compliance:view_activity',
    'compliance:export',
  ])],
  ['compliance:audit', new Set([
    'compliance:view_activity',
    'compliance:view_folder',
    'compliance:download_file',
    'compliance:export',
  ])],

  // ============================================
  // PROJECTS MODULE
  // ============================================
  ['projects:manage', new Set([
    'projects:view',
    'projects:view_details',
    'projects:view_documents',
    'projects:view_activities',
    'projects:create',
    'projects:update',
    'projects:delete',
    'projects:upload_document',
    'projects:download_document',
    'projects:delete_document',
    'projects:export',
  ])],

  // ============================================
  // VENDORS MODULE
  // ============================================
  ['vendors:manage', new Set([
    'vendors:view',
    'vendors:view_details',
    'vendors:view_inventory',
    'vendors:create',
    'vendors:update',
    'vendors:delete',
    'vendors:update_status',
    'vendors:set_owner',
    'vendors:export',
  ])],

  // ============================================
  // KNOWLEDGE BASE MODULE
  // ============================================
  ['kb:manage', new Set([
    'kb:view',
    'kb:view_articles',
    'kb:create_article',
    'kb:update_article',
    'kb:delete_article',
    'kb:publish_article',
    'kb:archive_article',
    'kb:upload_attachment',
    'kb:download_attachment',
    'kb:delete_attachment',
    'kb:view_analytics',
    'kb:export',
    // Also satisfy knowledge.category permissions
    'knowledge.category:view',
    'knowledge.category:create',
    'knowledge.category:update',
    'knowledge.category:delete',
  ])],
  ['kb:create', new Set([
    'kb:create_article',
    'knowledge.category:create',
  ])],
  ['kb:publish', new Set([
    'kb:publish_article',
  ])],
  ['kb:archive', new Set([
    'kb:archive_article',
  ])],
  // knowledge.category namespace aliases
  ['knowledge.category:view', new Set([
    'kb:view',
    'kb:view_articles',
    'knowledge.category:view',
  ])],
  ['knowledge.category:create', new Set([
    'knowledge.category:create',
    'kb:create_article',
  ])],
  ['knowledge.category:update', new Set([
    'knowledge.category:update',
    'kb:update_article',
  ])],
  ['knowledge.category:delete', new Set([
    'knowledge.category:delete',
    'kb:delete_article',
  ])],

  // ============================================
  // REPORTS MODULE
  // ============================================
  ['reports:create', new Set([
    'reports:view',
    'reports:view_stats',
    'reports:preview',
    'reports:count',
    'reports:generate',
    'reports:download',
    'reports:create',
    'reports:export',
  ])],

  // ============================================
  // USERS MODULE
  // ============================================
  ['users:manage', new Set([
    'users:view',
    'users:view_list',
    'users:view_details',
    'users:view_own_profile',
    'users:create',
    'users:update',
    'users:activate',
    'users:deactivate',
    'users:assign_role',
    'users:remove_role',
    'users:reset_password',
    'users:update_own_profile',
    'users:update_preferences',
    'users:import',
    'users:export',
  ])],
  ['users:write', new Set([
    'users:create',
    'users:update',
    'users:activate',
    'users:deactivate',
    'users:assign_role',
    'users:remove_role',
    'users:reset_password',
    'users:update_own_profile',
    'users:update_preferences',
  ])],
  ['users:read', new Set([
    'users:view',
    'users:view_list',
    'users:view_details',
    'users:view_own_profile',
    'users:export',
  ])],
  ['users:delete', new Set([
    'users:delete',
    'users:deactivate',
  ])],

  // ============================================
  // ROLES MODULE
  // ============================================
  ['roles:manage', new Set([
    'roles:view',
    'roles:view_list',
    'roles:view_details',
    'roles:view_permissions',
    'roles:create',
    'roles:update',
    'roles:delete',
    'roles:update_permissions',
  ])],

  // ============================================
  // SETTINGS MODULE
  // ============================================
  ['settings:manage', new Set([
    'settings:view',
    'settings:update',
  ])],
  ['settings:write', new Set([
    'settings:update',
  ])],
  ['settings:read', new Set([
    'settings:view',
  ])],

  // ============================================
  // AI MODULE
  // ============================================
  ['ai:ask', new Set([
    'ai:ask',
  ])],
]);

/**
 * Get all permissions that are satisfied by a given permission
 * (including the permission itself)
 */
export function getSatisfiedPermissions(permission: string): Set<string> {
  const directSatisfied = PERMISSION_ALIAS_MAP.get(permission);
  const result = new Set<string>();
  
  // Add the permission itself
  result.add(permission);
  
  // Add all permissions satisfied by this permission through aliases
  if (directSatisfied) {
    for (const satisfied of directSatisfied) {
      result.add(satisfied);
    }
  }
  
  return result;
}

/**
 * Check if a user has a permission either directly or through aliasing
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermission - The permission to check
 * @returns true if the user has the permission (directly or via alias)
 */
export function hasPermissionViaAlias(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  const userPermissionSet = new Set(userPermissions);
  
  // Check if user has the permission directly
  if (userPermissionSet.has(requiredPermission)) {
    return true;
  }
  
  // Check if user has a permission that satisfies the required permission via alias
  for (const userPerm of userPermissions) {
    const satisfied = PERMISSION_ALIAS_MAP.get(userPerm);
    if (satisfied && satisfied.has(requiredPermission)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user has any of the required permissions
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions to check (any match)
 * @returns true if the user has at least one of the required permissions
 */
export function hasAnyPermissionViaAlias(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  for (const required of requiredPermissions) {
    if (hasPermissionViaAlias(userPermissions, required)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a user has ALL of the required permissions
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions to check (all required)
 * @returns true if the user has all of the required permissions
 */
export function hasAllPermissionsViaAlias(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  for (const required of requiredPermissions) {
    if (!hasPermissionViaAlias(userPermissions, required)) {
      return false;
    }
  }
  return true;
}
