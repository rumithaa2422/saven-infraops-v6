import { PrismaClient, TicketPriority, WorkStatus, IncidentSeverity, AssetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    'dashboard:read',
    'tickets:read', 'tickets:write', 'tickets:assign',
    'incidents:read', 'incidents:write',
    'changes:read', 'changes:approve',
    'inventory:read', 'inventory:write',
    'access:read', 'access:approve',
    'compliance:read', 'compliance:write',
    'settings:read', 'settings:write',
    'users:read', 'users:write',
    'ai:ask'
  ];

  for (const code of permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code, description: code } });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', description: 'Full system access' }
  });

  const adminRole2 = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Full system access' }
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: { name: 'Employee', description: 'Full system access' }
  });

  const allPermissions = await prisma.permission.findMany();

  // Assign all permissions to Super Admin
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id }
    });
  }

  // Assign all permissions to Admin
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole2.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole2.id, permissionId: permission.id }
    });
  }

  // Assign all permissions to Employee
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: permission.id }
    });
  }

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
