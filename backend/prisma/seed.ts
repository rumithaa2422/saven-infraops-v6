import { PrismaClient, TicketPriority, WorkStatus, IncidentSeverity, AssetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ============================================
  // RBAC PERMISSION CATALOG - Phase 3A Migration
  // ============================================
  // New permissions added to support granular RBAC
  // Old permissions kept for backward compatibility
  
  const permissions = [
    // Dashboard
    'dashboard:read',        // Legacy - read dashboard
    'dashboard:view',       // NEW - view dashboard
    
    // Service Requests / Tickets
    'tickets:read',         // Legacy - read tickets
    'tickets:write',        // Legacy - write tickets
    'tickets:assign',        // Legacy - assign tickets
    'tickets:view',         // NEW - view tickets
    'tickets:create',        // NEW - create tickets
    'tickets:manage',        // NEW - manage tickets (status, close)
    'tickets:comment',       // NEW - add comments
    'tickets:export',        // NEW - export tickets
    
    // Incidents
    'incidents:read',        // Legacy - read incidents
    'incidents:write',       // Legacy - write incidents
    'incidents:view',        // NEW - view incidents
    'incidents:create',      // NEW - create incidents
    'incidents:manage',       // NEW - manage incidents
    'incidents:export',       // NEW - export incidents
    
    // Problems (NEW namespace - separated from incidents)
    'problems:view',         // NEW - view problems
    'problems:create',       // NEW - create problems
    'problems:manage',       // NEW - manage problems
    'problems:export',       // NEW - export problems
    
    // Changes
    'changes:read',          // Legacy - read changes
    'changes:approve',       // Legacy - approve changes
    'changes:view',          // NEW - view changes
    'changes:create',        // NEW - submit changes
    'changes:manage',        // NEW - manage changes
    'changes:export',        // NEW - export changes
    
    // Inventory / Assets
    'inventory:read',        // Legacy - read inventory
    'inventory:write',       // Legacy - write inventory
    'inventory:view',        // NEW - view inventory
    'inventory:create',      // NEW - create assets
    'inventory:manage',      // NEW - manage assets
    'inventory:delete',      // NEW - delete assets
    'inventory:export',      // NEW - export inventory
    
    // Access Management
    'access:read',           // Legacy - read access
    'access:approve',        // Legacy - approve access
    'access:view',           // NEW - view access requests
    'access:request',        // NEW - request access
    'access:provision',      // NEW - provision access
    'access:revoke',         // NEW - revoke access
    'access:export',         // NEW - export access
    
    // Compliance
    'compliance:read',       // Legacy - read compliance
    'compliance:write',      // Legacy - write compliance
    'compliance:view',       // NEW - view compliance
    'compliance:create',     // NEW - create controls
    'compliance:manage',     // NEW - manage controls
    'compliance:audit',      // NEW - audit controls
    'compliance:export',     // NEW - export compliance
    
    // Projects & Environments (NEW namespace)
    'projects:view',         // NEW - view projects
    'projects:create',        // NEW - create projects
    'projects:manage',       // NEW - manage projects
    'projects:delete',       // NEW - delete projects
    'projects:export',       // NEW - export projects
    
    // Vendors & Licenses (NEW namespace)
    'vendors:view',          // NEW - view vendors
    'vendors:create',        // NEW - create vendors
    'vendors:manage',        // NEW - manage vendors
    'vendors:delete',       // NEW - delete vendors
    'vendors:export',        // NEW - export vendors
    
    // Knowledge Base (NEW namespace)
    'kb:view',               // NEW - view knowledge base
    'kb:create',             // NEW - create articles
    'kb:manage',             // NEW - manage articles
    'kb:publish',            // NEW - publish articles
    'kb:archive',            // NEW - archive articles
    'kb:export',             // NEW - export KB
    
    // Reports & Analytics (NEW namespace)
    'reports:view',          // NEW - view reports
    'reports:create',        // NEW - create reports
    'reports:export',        // NEW - export reports
    
    // Settings
    'settings:read',         // Legacy - read settings
    'settings:write',        // Legacy - write settings
    'settings:view',         // NEW - view settings
    'settings:manage',       // NEW - manage settings
    
    // Users
    'users:read',            // Legacy - read users
    'users:write',          // Legacy - write users
    'users:delete',          // Legacy - delete users
    'users:view',            // NEW - view users
    'users:create',          // NEW - create users
    'users:manage',          // NEW - manage users
    'users:export',          // NEW - export users
    
    // Roles (NEW namespace - separated from users for display)
    'roles:view',            // NEW - view roles
    'roles:create',          // NEW - create roles
    'roles:manage',          // NEW - manage roles
    'roles:delete',          // NEW - delete roles
    
    // AI
    'ai:ask'                 // Existing - AI access
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
  // TEST ROLES FOR USERS & TEAMS RBAC VALIDATION - Phase 4D
  // ============================================

  // Get specific user permissions for test roles
  const userPermissions = allPermissions.filter(p => 
    ['users:read', 'users:write', 'users:delete', 'users:view', 'users:create', 'users:manage', 'users:export'].includes(p.code)
  );

  // 1. Viewer Role - can view users only
  const viewerRole = await prisma.role.upsert({
    where: { name: 'User Viewer' },
    update: { description: 'Can view user list only - cannot create, edit, or delete users' },
    create: { name: 'User Viewer', description: 'Can view user list only - cannot create, edit, or delete users' }
  });

  // 2. User Creator Role - can view and create users
  const userCreatorRole = await prisma.role.upsert({
    where: { name: 'User Creator' },
    update: { description: 'Can view and create users - cannot edit or delete' },
    create: { name: 'User Creator', description: 'Can view and create users - cannot edit or delete' }
  });

  // 3. User Manager Role - can view and manage users
  const userManagerRole = await prisma.role.upsert({
    where: { name: 'User Manager' },
    update: { description: 'Can view and manage users - cannot delete' },
    create: { name: 'User Manager', description: 'Can view and manage users - cannot delete' }
  });

  // 4. User Admin Role - full user management
  const userAdminRole = await prisma.role.upsert({
    where: { name: 'User Admin' },
    update: { description: 'Full user management - can view, create, edit, delete, and export users' },
    create: { name: 'User Admin', description: 'Full user management - can view, create, edit, delete, and export users' }
  });

  console.log('[RBAC] Test roles created.');

  // Assign permissions to test roles
  console.log('[RBAC] Assigning permissions to test roles...');

  // Viewer: users:view only
  const viewerPerms = userPermissions.filter(p => ['users:view'].includes(p.code));
  for (const permission of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${viewerPerms.length} permissions to User Viewer`);

  // User Creator: users:view + users:create
  const creatorPerms = userPermissions.filter(p => ['users:view', 'users:create'].includes(p.code));
  for (const permission of creatorPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userCreatorRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: userCreatorRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${creatorPerms.length} permissions to User Creator`);

  // User Manager: users:view + users:manage
  const managerPerms = userPermissions.filter(p => ['users:view', 'users:manage'].includes(p.code));
  for (const permission of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userManagerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: userManagerRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${managerPerms.length} permissions to User Manager`);

  // User Admin: all user permissions
  const userAdminPerms = userPermissions.filter(p => 
    ['users:view', 'users:create', 'users:manage', 'users:delete', 'users:export'].includes(p.code)
  );
  for (const permission of userAdminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: userAdminRole.id, permissionId: permission.id }
    });
  }
  console.log(`[RBAC] Assigned ${userAdminPerms.length} permissions to User Admin`);

  // ============================================
  // TEST USERS FOR RBAC VALIDATION - Phase 4D
  // ============================================
  // Each test user is assigned to a specific test role

  const testUsers = [
    { email: 'viewer@saven.in', name: 'Test Viewer', role: viewerRole, password: 'Test@12345' },
    { email: 'creator@saven.in', name: 'Test Creator', role: userCreatorRole, password: 'Test@12345' },
    { email: 'manager@saven.in', name: 'Test Manager', role: userManagerRole, password: 'Test@12345' },
    { email: 'useradmin@saven.in', name: 'Test User Admin', role: userAdminRole, password: 'Test@12345' }
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: {
        name: userData.name,
        email: userData.email,
        department: 'InfraOps',
        passwordHash: await bcrypt.hash(userData.password, 12)
      }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: userData.role.id } },
      update: {},
      create: { userId: user.id, roleId: userData.role.id }
    });

    console.log(`[RBAC] Created test user: ${userData.email} (${userData.role.name})`);
  }

  console.log('[RBAC] Test users created successfully.');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@saven.in' },
    update: {},
    create: {
      name: 'Saven Admin',
      email: 'admin@saven.in',
      department: 'InfraOps',
      passwordHash: await bcrypt.hash('Admin@12345', 12)
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id }
  });

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
      status: WorkStatus.OPEN,
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
      status: WorkStatus.ASSIGNED,
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
      status: WorkStatus.IN_PROGRESS,
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

  await prisma.complianceControl.upsert({
    where: { controlNo: 'CMP-1001' },
    update: {},
    create: {
      controlNo: 'CMP-1001',
      title: 'Quarterly user access review',
      controlArea: 'Access Management',
      ownerName: 'InfoSec Team',
      frequency: 'Quarterly',
      riskRating: 'HIGH'
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
