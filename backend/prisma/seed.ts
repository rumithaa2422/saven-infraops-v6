import { PrismaClient, TicketPriority, ServiceRequestStatus, IncidentStatus, ProblemStatus, ChangeRequestStatus, IncidentSeverity, AssetStatus, AccessStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ============================================
  // RBAC 2.0 PERMISSION CATALOG
  // ============================================
  // Phase 1: Add granular permissions alongside existing ones
  // All old permissions are preserved for backward compatibility
  // New granular permissions follow module:action naming convention
  
  const permissions = [
    // ============================================
    // DASHBOARD MODULE
    // ============================================
    'dashboard:view',           // View dashboard
    'dashboard:view_my_tasks',  // View personal task counts
    'dashboard:view_activity',  // View recent activity feed
    'dashboard:view_health',    // View system health status
    
    // ============================================
    // SERVICE REQUESTS MODULE
    // ============================================
    // Legacy permissions (preserved for backward compatibility)
    'tickets:read',             // Legacy read
    'tickets:write',            // Legacy write
    'tickets:assign',           // Legacy assign
    'tickets:manage',           // Legacy manage (satisfies all granular)
    
    // New granular permissions
    'tickets:view',             // View service requests
    'tickets:view_own',         // View own requests only
    'tickets:view_all',         // View all requests (admin)
    'tickets:create',           // Create new requests
    'tickets:edit',             // Edit request details
    'tickets:delete',           // Delete requests
    'tickets:reassign',         // Reassign requests
    'tickets:update_status',    // Update request status
    'tickets:reopen',           // Reopen closed requests
    'tickets:close',            // Close requests
    'tickets:comment',          // Add comments
    'tickets:view_comments',    // View comments
    'tickets:view_timeline',    // View request timeline
    'tickets:upload_attachment', // Upload attachments
    'tickets:download_attachment', // Download attachments
    'tickets:delete_attachment',  // Delete attachments
    'tickets:export',           // Export requests
    'tickets:print',            // Print requests
    
    // ============================================
    // INCIDENTS MODULE
    // ============================================
    // Legacy permissions
    'incidents:read',           // Legacy read
    'incidents:write',          // Legacy write
    'incidents:manage',          // Legacy manage
    
    // New granular permissions
    'incidents:view',           // View incidents
    'incidents:create',         // Create incidents
    'incidents:update',         // Update incident details
    'incidents:update_status',  // Update incident status
    'incidents:update_severity', // Update severity level
    'incidents:upload_resolution', // Upload resolution docs
    'incidents:delete_resolution', // Delete resolution docs
    'incidents:close',          // Close incidents
    'incidents:export',         // Export incidents
    
    // ============================================
    // PROBLEMS MODULE
    // ============================================
    'problems:view',            // View problems
    'problems:create',          // Create problems
    'problems:update',          // Update problem details
    'problems:update_status',   // Update problem status
    'problems:link_incident',   // Link incidents to problems
    'problems:export',          // Export problems
    
    // ============================================
    // CHANGES MODULE
    // ============================================
    // Legacy permissions
    'changes:read',             // Legacy read
    'changes:approve',          // Legacy approve
    'changes:manage',           // Legacy manage
    
    // New granular permissions
    'changes:view',             // View change requests
    'changes:create',           // Create change requests
    'changes:update',           // Update change details
    'changes:update_status',    // Update change status
    'changes:reject',           // Reject changes
    'changes:implement',        // Implement changes
    'changes:close',            // Close changes
    'changes:export',           // Export changes
    
    // ============================================
    // INVENTORY MODULE
    // ============================================
    // Legacy permissions
    'inventory:read',           // Legacy read
    'inventory:write',          // Legacy write
    'inventory:manage',         // Legacy manage
    'inventory:delete',         // Legacy delete
    
    // New granular permissions
    'inventory:view',           // View inventory
    'inventory:view_categories', // View categories
    'inventory:view_items',     // View items
    'inventory:view_details',   // View item details
    'inventory:view_history',   // View assignment history
    'inventory:view_analytics', // View analytics
    'inventory:create_category', // Create category
    'inventory:update_category', // Update category
    'inventory:delete_category', // Delete category
    'inventory:create_asset',   // Create asset
    'inventory:update_asset',   // Update asset
    'inventory:delete_asset',   // Delete asset
    'inventory:assign_user',    // Assign to user
    'inventory:assign_project', // Assign to project
    'inventory:unassign',       // Unassign asset
    'inventory:export',         // Export inventory
    
    // ============================================
    // ACCESS MANAGEMENT MODULE
    // ============================================
    // Legacy permissions
    'access:read',              // Legacy read
    'access:approve',           // Legacy approve
    
    // New granular permissions
    'access:view',              // View access requests
    'access:view_user',        // View user access
    'access:view_project',     // View project access
    'access:view_own',         // View own access
    'access:request',          // Request access
    'access:reject',            // Reject access
    'access:provision',        // Provision access
    'access:revoke',            // Revoke access
    'access:export',            // Export access
    
    // ============================================
    // COMPLIANCE MODULE
    // ============================================
    // Legacy permissions
    'compliance:read',          // Legacy read
    'compliance:write',         // Legacy write
    'compliance:manage',        // Legacy manage
    'compliance:audit',         // Legacy audit
    
    // New granular permissions
    'compliance:view',          // View compliance
    'compliance:view_folder',   // View folders
    'compliance:download_file', // Download files
    'compliance:preview_file',  // Preview files
    'compliance:view_activity', // View activity
    'compliance:create_folder', // Create folder
    'compliance:rename_folder',  // Rename folder
    'compliance:move_folder',   // Move folder
    'compliance:delete_folder', // Delete folder
    'compliance:upload_file',   // Upload file
    'compliance:rename_file',   // Rename file
    'compliance:move_file',     // Move file
    'compliance:delete_file',   // Delete file
    'compliance:replace_version', // Replace version
    'compliance:restore_version', // Restore version
    'compliance:add_tag',       // Add tag
    'compliance:remove_tag',    // Remove tag
    'compliance:create_tag',    // Create tag
    'compliance:bulk_upload',   // Bulk upload
    'compliance:export',        // Export compliance
    
    // ============================================
    // PROJECTS MODULE
    // ============================================
    'projects:view',            // View projects
    'projects:view_details',    // View project details
    'projects:view_documents',   // View documents
    'projects:view_activities', // View activities
    'projects:create',          // Create projects
    'projects:update',          // Update projects
    'projects:delete',          // Delete projects
    'projects:upload_document', // Upload documents
    'projects:download_document', // Download documents
    'projects:delete_document', // Delete documents
    'projects:export',          // Export projects
    
    // ============================================
    // VENDORS MODULE
    // ============================================
    'vendors:view',             // View vendors
    'vendors:view_details',     // View vendor details
    'vendors:view_inventory',   // View vendor inventory
    'vendors:create',           // Create vendors
    'vendors:update',           // Update vendors
    'vendors:delete',           // Delete vendors
    'vendors:update_status',    // Update vendor status
    'vendors:set_owner',        // Set vendor owner
    'vendors:export',           // Export vendors
    
    // ============================================
    // KNOWLEDGE BASE MODULE
    // ============================================
    // Legacy kb: namespace
    'kb:view',                  // View knowledge base
    'kb:create',                // Legacy create
    'kb:manage',                // Legacy manage
    'kb:publish',               // Legacy publish
    'kb:archive',               // Legacy archive
    'kb:export',                // Export KB
    
    // New granular permissions (kb: namespace)
    'kb:view_articles',         // View articles
    'kb:create_article',       // Create article
    'kb:update_article',       // Update article
    'kb:delete_article',       // Delete article
    'kb:publish_article',      // Publish article
    'kb:archive_article',      // Archive article
    'kb:upload_attachment',     // Upload attachment
    'kb:download_attachment',   // Download attachment
    'kb:delete_attachment',    // Delete attachment
    'kb:view_analytics',        // View analytics
    
    // Knowledge Categories (knowledge.category: namespace)
    'knowledge.category:view',    // View categories
    'knowledge.category:create',  // Create category
    'knowledge.category:update',  // Update category
    'knowledge.category:delete',  // Delete category
    
    // ============================================
    // REPORTS MODULE
    // ============================================
    'reports:view',             // View reports
    'reports:view_stats',       // View statistics
    'reports:preview',          // Preview report
    'reports:count',            // Get record counts
    'reports:generate',         // Generate report
    'reports:download',         // Download report
    'reports:create',           // Create reports
    'reports:export',           // Export reports
    
    // ============================================
    // USERS MODULE
    // ============================================
    // Legacy permissions
    'users:read',               // Legacy read
    'users:write',              // Legacy write
    'users:delete',             // Legacy delete
    'users:manage',             // Legacy manage
    
    // New granular permissions
    'users:view',               // View users
    'users:view_list',          // View user list
    'users:view_details',       // View user details
    'users:view_own_profile',   // View own profile
    'users:create',             // Create users
    'users:update',             // Update users
    'users:activate',           // Activate users
    'users:deactivate',         // Deactivate users
    'users:assign_role',         // Assign roles
    'users:remove_role',        // Remove roles
    'users:reset_password',     // Reset passwords
    'users:update_own_profile', // Update own profile
    'users:update_preferences', // Update preferences
    'users:import',             // Import users
    'users:export',             // Export users
    
    // ============================================
    // ROLES MODULE
    // ============================================
    'roles:view',               // View roles
    'roles:view_list',          // View roles list
    'roles:view_details',       // View role details
    'roles:view_permissions',   // View permissions
    'roles:create',             // Create roles
    'roles:update',             // Update roles
    'roles:delete',             // Delete roles
    'roles:update_permissions', // Update role permissions
    'roles:manage',             // Legacy manage
    
    // ============================================
    // SETTINGS MODULE
    // ============================================
    // Legacy permissions
    'settings:read',            // Legacy read
    'settings:write',           // Legacy write
    'settings:manage',          // Legacy manage
    
    // New granular permissions
    'settings:view',            // View settings
    'settings:update',          // Update settings
    
    // ============================================
    // AI MODULE
    // ============================================
    'ai:ask',                   // Use AI assistant
  ];

  console.log(`[RBAC] Seeding ${permissions.length} permissions...`);

  for (const code of permissions) {
    await prisma.permission.upsert({ 
      where: { code }, 
      update: { description: code }, 
      create: { code, description: code } 
    });
  }

  console.log('[RBAC] Permissions seeded successfully.');

  // Get all permissions for role assignment
  const allPermissions = await prisma.permission.findMany();
  console.log(`[RBAC] Total permissions in database: ${allPermissions.length}`);

  // ============================================
  // ROLE DEFINITIONS - Phase 3A
  // ============================================
  // Keep existing roles for backward compatibility
  // New roles to be added in Phase E

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: { description: 'Full system access - can manage all resources and users' },
    create: { name: 'Super Admin', description: 'Full system access - can manage all resources and users' }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: { description: 'Administrative access - can manage all resources' },
    create: { name: 'Admin', description: 'Administrative access - can manage all resources' }
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: { description: 'Basic access - can view dashboard and submit requests' },
    create: { name: 'Employee', description: 'Basic access - can view dashboard and submit requests' }
  });

  console.log('[RBAC] Roles seeded successfully.');

  // ============================================
  // ROLE-PERMISSION ASSIGNMENTS - Phase 3A
  // ============================================
  // Super Admin and Admin get ALL permissions (new and legacy)
  // Employee gets all permissions (for backward compatibility during migration)

  console.log('[RBAC] Assigning permissions to roles...');

  // Assign all permissions to Super Admin
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${allPermissions.length} permissions to Super Admin`);

  // Assign all permissions to Admin
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${allPermissions.length} permissions to Admin`);

  // Assign all permissions to Employee (for migration - same as admin during transition)
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${allPermissions.length} permissions to Employee`);

  // Log permission counts by role
  const superAdminPerms = await prisma.rolePermission.count({ where: { roleId: superAdminRole.id } });
  const adminPerms = await prisma.rolePermission.count({ where: { roleId: adminRole.id } });
  const employeePerms = await prisma.rolePermission.count({ where: { roleId: employeeRole.id } });
  
  console.log(`[RBAC] Role permission summary:`);
  console.log(`  Super Admin: ${superAdminPerms} permissions`);
  console.log(`  Admin: ${adminPerms} permissions`);
  console.log(`  Employee: ${employeePerms} permissions`);
  console.log('[RBAC] Role-permission assignments complete.');

  // ============================================
  // DEFAULT ADMIN USER
  // ============================================
  // Creates a single default administrator account
  // Using upsert ensures idempotency - running seed multiple times won't create duplicates

  const admin = await prisma.user.upsert({
    where: { email: 'admin@saven.in' },
    update: { 
      name: 'Saven Admin',
      department: 'InfraOps',
      status: 'ACTIVE'
    },
    create: {
      name: 'Saven Admin',
      email: 'admin@saven.in',
      department: 'InfraOps',
      status: 'ACTIVE',
      passwordHash: await bcrypt.hash('Admin@12345', 12)
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id }
  });

  console.log('[RBAC] Default admin user created/updated: admin@saven.in');

  const settings = [
    ['AI', 'AI_PROVIDER', 'mock'],
    ['AI', 'OPENAI_MODEL', 'gpt-4.1-mini'],
    ['AI', 'CLAUDE_MODEL', 'claude-3-5-sonnet-latest'],
    ['AI', 'PRIVATE_AI_BASE_URL', ''],
    ['AUTH', 'CUSTOM_LOGIN_ENABLED', 'true'],
    ['AUTH', 'MICROSOFT_LOGIN_ENABLED', 'false'],
    ['NOTIFICATION', 'EMAIL_ENABLED', 'false'],
    ['NOTIFICATION', 'TEAMS_ENABLED', 'false'],
    ['SLA', 'CRITICAL_RESPONSE_MINUTES', '15'],
    ['SLA', 'HIGH_RESPONSE_MINUTES', '30'],
    ['IMPORT', 'EXCEL_PREVIEW_REQUIRED', 'true']
  ];

  for (const [group, key, value] of settings) {
    await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { group, key, value } });
  }

  await prisma.serviceRequest.upsert({
    where: { ticketNo: 'SR-1001' },
    update: {},
    create: {
      ticketNo: 'SR-1001',
      title: 'VPN not working for Federal project access',
      description: 'User cannot connect to VPN since morning.',
      category: 'Network',
      subCategory: 'VPN',
      priority: TicketPriority.HIGH,
      status: ServiceRequestStatus.OPEN,
      requesterName: 'Vaishnavi Kavali',
      assigneeName: 'Infra Team',
      projectName: 'Federal'
    }
  });

  await prisma.serviceRequest.upsert({
    where: { ticketNo: 'SR-1002' },
    update: {},
    create: {
      ticketNo: 'SR-1002',
      title: 'Laptop allocation for new QA resource',
      category: 'Asset',
      subCategory: 'Laptop',
      priority: TicketPriority.MEDIUM,
      status: ServiceRequestStatus.ASSIGNED,
      requesterName: 'HR Team',
      assigneeName: 'Admin Team'
    }
  });

  await prisma.incident.upsert({
    where: { incidentNo: 'INC-1001' },
    update: {},
    create: {
      incidentNo: 'INC-1001',
      title: 'UAT API timeout for payment service',
      severity: IncidentSeverity.SEV2,
      status: ServiceRequestStatus.IN_PROGRESS,
      impactedService: 'Payment API',
      impactedProject: 'Federal',
      ownerName: 'DevOps Team'
    }
  });

  await prisma.asset.upsert({
    where: { assetNo: 'AST-1001' },
    update: {},
    create: {
      assetNo: 'AST-1001',
      assetType: 'Laptop',
      make: 'Dell',
      model: 'Latitude',
      serialNo: 'DL-SAV-1001',
      status: AssetStatus.AVAILABLE,
      location: 'Hyderabad Office'
    }
  });

  // NOTE: Compliance module is now a document repository.
  // No seed data needed - documents are uploaded by users.

  // ============================================
  // KNOWLEDGE BASE CATEGORIES
  // ============================================
  // Default knowledge categories for organizing KB articles
  // Using upsert for idempotency

  const knowledgeCategories = [
    { id: 'kbcat_getting_started', name: 'Getting Started', description: 'Guides and tutorials for new users', color: '#10b981', displayOrder: 1 },
    { id: 'kbcat_infrastructure', name: 'Infrastructure', description: 'Infrastructure setup and management', color: '#3b82f6', displayOrder: 2 },
    { id: 'kbcat_development', name: 'Development', description: 'Development best practices and guides', color: '#8b5cf6', displayOrder: 3 },
    { id: 'kbcat_cloud', name: 'Cloud', description: 'Cloud platforms and services', color: '#06b6d4', displayOrder: 4 },
    { id: 'kbcat_security', name: 'Security', description: 'Security policies and procedures', color: '#ef4444', displayOrder: 5 },
    { id: 'kbcat_ai', name: 'AI', description: 'AI and machine learning resources', color: '#f59e0b', displayOrder: 6 },
    { id: 'kbcat_hr', name: 'HR', description: 'Human resources policies and guides', color: '#ec4899', displayOrder: 7 },
    { id: 'kbcat_policies', name: 'Policies', description: 'Company policies and procedures', color: '#64748b', displayOrder: 8 },
    { id: 'kbcat_internal_tools', name: 'Internal Tools', description: 'Internal tool documentation', color: '#84cc16', displayOrder: 9 }
  ];

  console.log('[KB] Seeding knowledge categories...');
  for (const category of knowledgeCategories) {
    await prisma.knowledgeCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        description: category.description,
        color: category.color,
        displayOrder: category.displayOrder,
        isActive: true
      },
      create: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        displayOrder: category.displayOrder,
        isActive: true
      }
    });
  }
  console.log(`[KB] Seeded ${knowledgeCategories.length} knowledge categories.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
