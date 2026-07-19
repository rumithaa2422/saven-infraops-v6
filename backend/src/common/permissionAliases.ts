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
  // COMPLIANCE MODULE - Phase 5: Granular Permissions
  // ============================================
  ['compliance:manage', new Set([
    'compliance:view',
    'compliance:view_folder',
    'compliance:download_file',
    'compliance:preview_file',
    'compliance:view_activity',
    'compliance:upload',
    'compliance:edit',
    'compliance:delete',
    'compliance:replace',
    'compliance:archive',
    'compliance:restore',
    'compliance:create_folder',
    'compliance:rename_folder',
    'compliance:move_folder',
    'compliance:delete_folder',
    'compliance:rename_file',
    'compliance:move_file',
    'compliance:replace_version',
    'compliance:restore_version',
    'compliance:add_tag',
    'compliance:remove_tag',
    'compliance:create_tag',
    'compliance:bulk_upload',
    'compliance:export',
  ])],
  ['compliance:write', new Set([
    'compliance:upload',
    'compliance:edit',
    'compliance:replace',
    'compliance:create_folder',
    'compliance:rename_folder',
    'compliance:move_folder',
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
  // PROJECTS MODULE - Phase 5: Granular Permissions
  // ============================================
  ['projects:manage', new Set([
    'projects:view',
    'projects:view_details',
    'projects:view_documents',
    'projects:view_activities',
    'projects:create',
    'projects:edit',
    'projects:delete',
    'projects:archive',
    'projects:restore',
    'projects:assign_owner',
    'projects:manage_environment',
    'projects:upload_document',
    'projects:download_document',
    'projects:delete_document',
    'projects:add_activity',
    'projects:export',
  ])],
  ['projects:write', new Set([
    'projects:create',
    'projects:edit',
    'projects:archive',
    'projects:restore',
    'projects:assign_owner',
    'projects:manage_environment',
    'projects:upload_document',
    'projects:add_activity',
  ])],
  ['projects:read', new Set([
    'projects:view',
    'projects:view_details',
    'projects:view_documents',
    'projects:view_activities',
    'projects:download_document',
    'projects:export',
  ])],

  // ============================================
  // VENDORS MODULE - Phase 5: Granular Permissions
  // ============================================
  ['vendors:manage', new Set([
    'vendors:view',
    'vendors:view_details',
    'vendors:view_inventory',
    'vendors:create',
    'vendors:edit',
    'vendors:delete',
    'vendors:renew',
    'vendors:update_contract',
    'vendors:assign_owner',
    'vendors:upload_document',
    'vendors:download_document',
    'vendors:export',
    // License permissions
    'licenses:view',
    'licenses:create',
    'licenses:edit',
    'licenses:delete',
    'licenses:assign',
    'licenses:revoke',
    'licenses:renew',
    'licenses:export',
  ])],
  ['vendors:write', new Set([
    'vendors:create',
    'vendors:edit',
    'vendors:renew',
    'vendors:update_contract',
    'vendors:assign_owner',
    'vendors:upload_document',
    'licenses:create',
    'licenses:edit',
    'licenses:assign',
    'licenses:revoke',
    'licenses:renew',
  ])],
  ['vendors:read', new Set([
    'vendors:view',
    'vendors:view_details',
    'vendors:view_inventory',
    'vendors:download_document',
    'vendors:export',
    'licenses:view',
    'licenses:export',
  ])],

  // ============================================
  // KNOWLEDGE BASE MODULE - Phase 5: Granular Permissions
  // ============================================
  ['kb:manage', new Set([
    'kb:view',
    'kb:view_articles',
    'kb:view_article',
    'kb:create',
    'kb:edit',
    'kb:delete',
    'kb:publish',
    'kb:archive',
    'kb:restore',
    'kb:feature',
    'kb:upload_attachment',
    'kb:download_attachment',
    'kb:delete_attachment',
    'kb:view_analytics',
    'kb:export',
    // Category permissions
    'kb.category:view',
    'kb.category:create',
    'kb.category:edit',
    'kb.category:delete',
  ])],
  ['kb:write', new Set([
    'kb:create',
    'kb:edit',
    'kb:publish',
    'kb:archive',
    'kb:restore',
    'kb:feature',
    'kb:upload_attachment',
    'kb:delete_attachment',
    'kb.category:create',
    'kb.category:edit',
    'kb.category:delete',
  ])],
  ['kb:read', new Set([
    'kb:view',
    'kb:view_articles',
    'kb:view_article',
    'kb:download_attachment',
    'kb:view_analytics',
    'kb:export',
    'kb.category:view',
  ])],
  ['kb:create', new Set([
    'kb:create',
    'kb:upload_attachment',
    'kb.category:create',
  ])],
  ['kb:publish', new Set([
    'kb:publish',
  ])],
  ['kb:archive', new Set([
    'kb:archive',
    'kb:restore',
  ])],
  // knowledge.category namespace aliases
  ['knowledge.category:view', new Set([
    'kb:view',
    'kb:view_articles',
    'kb.category:view',
  ])],
  ['knowledge.category:create', new Set([
    'kb.category:create',
    'kb:create',
  ])],
  ['knowledge.category:update', new Set([
    'kb.category:edit',
    'kb:edit',
  ])],
  ['knowledge.category:delete', new Set([
    'kb.category:delete',
    'kb:delete',
  ])],

  // ============================================
  // REPORTS MODULE - Phase 6: Granular Permissions
  // ============================================
  ['reports:create', new Set([
    'reports:view',
    'reports:view_stats',
    'reports:view_analytics',
    'reports:preview',
    'reports:count',
    'reports:generate',
    'reports:download',
    'reports:export',
    'reports:filter',
  ])],
  ['reports:manage', new Set([
    'reports:view',
    'reports:view_stats',
    'reports:view_analytics',
    'reports:preview',
    'reports:count',
    'reports:generate',
    'reports:download',
    'reports:export',
    'reports:filter',
  ])],
  ['reports:read', new Set([
    'reports:view',
    'reports:view_stats',
    'reports:view_analytics',
    'reports:preview',
    'reports:count',
    'reports:filter',
  ])],
  ['reports:write', new Set([
    'reports:generate',
    'reports:download',
    'reports:export',
  ])],

  // ============================================
  // USERS MODULE - Phase 6: Granular Permissions
  // ============================================
  ['users:manage', new Set([
    'users:view',
    'users:view_list',
    'users:view_details',
    'users:view_own_profile',
    'users:create',
    'users:edit',
    'users:delete',
    'users:activate',
    'users:deactivate',
    'users:lock',
    'users:unlock',
    'users:assign_team',
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
    'users:edit',
    'users:activate',
    'users:deactivate',
    'users:lock',
    'users:unlock',
    'users:assign_team',
    'users:assign_role',
    'users:remove_role',
    'users:reset_password',
    'users:import',
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
  // ROLES MODULE - Phase 6: Granular Permissions
  // ============================================
  ['roles:manage', new Set([
    'roles:view',
    'roles:view_list',
    'roles:view_details',
    'roles:view_permissions',
    'roles:create',
    'roles:edit',
    'roles:delete',
    'roles:clone',
    'roles:assign_permissions',
    'roles:remove_permissions',
    'roles:import',
    'roles:export',
  ])],
  ['roles:write', new Set([
    'roles:create',
    'roles:edit',
    'roles:clone',
    'roles:assign_permissions',
    'roles:remove_permissions',
    'roles:import',
  ])],
  ['roles:read', new Set([
    'roles:view',
    'roles:view_list',
    'roles:view_details',
    'roles:view_permissions',
    'roles:export',
  ])],
  // Permission matrix
  ['permissions:view', new Set([
    'permissions:view',
    'permissions:edit',
  ])],
  ['permissions:edit', new Set([
    'permissions:edit',
  ])],

  // ============================================
  // SETTINGS MODULE - Phase 6: Granular Permissions
  // ============================================
  ['settings:manage', new Set([
    'settings:view',
    'settings:update_profile',
    'settings:change_password',
    'settings:update_theme',
    'settings:update_notifications',
    'settings:update_system',
    'settings:update_company',
    'settings:update_security',
  ])],
  ['settings:write', new Set([
    'settings:update_profile',
    'settings:change_password',
    'settings:update_theme',
    'settings:update_notifications',
  ])],
  ['settings:read', new Set([
    'settings:view',
  ])],
  ['settings:system', new Set([
    'settings:update_system',
    'settings:update_company',
    'settings:update_security',
  ])],

  // ============================================
  // AI MODULE - Phase 6: Granular Permissions
  // ============================================
  ['ai:ask', new Set([
    'ai:view',
    'ai:chat',
    'ai:execute',
    'ai:view_history',
    'ai:delete_history',
  ])],
  ['ai:manage', new Set([
    'ai:view',
    'ai:chat',
    'ai:execute',
    'ai:view_history',
    'ai:delete_history',
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
