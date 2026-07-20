// Re-export user service functions including deleteUser
export { createUser, updateUser, deleteUser } from './user.service.js';

// Export other services
export * from './asset.service.js';
export * from './access.service.js';
export * from './change.service.js';
export * from './compliance.service.js';
export * from './incident.service.js';
export * from './knowledgeBase.service.js';
export * from './knowledgeCategory.service.js';
export * from './problem.service.js';
export * from './projectEnvironment.service.js';
export * from './role.service.js';
export * from './serviceRequest.service.js';
export * from './vendorLicense.service.js';

// Export permission services (PermissionModule is a type-only export - interfaces don't exist at runtime)
export * from './permission.service.js';
export {
  getGroupedPermissions,
  getRolePermissionsWithMetadata,
  getPermissionStats
} from './permissionMetadata.service.js';
export type { PermissionModule, PermissionMetadata, GroupedPermissions } from './permissionMetadata.service.js';
export * from './rolePermission.service.js';
