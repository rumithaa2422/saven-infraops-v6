import { prisma } from '../common/prisma.js';

export interface CreateProjectEnvironmentInput {
  projectName: string;
  projectCode: string;
  environmentName?: string | null;
  serviceName?: string | null;
  serverName?: string | null;
  databaseName?: string | null;
  ownerName?: string | null;
  client?: string | null;
  description?: string | null;
  department?: string | null;
  technologyStack?: string | null;
  priority?: string;
  status?: string;
  budget?: number | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  actualEndDate?: string | null;
  projectType?: string | null;
  projectLocation?: string | null;
  remarks?: string | null;
  managerId?: string | null;
  teamMemberIds?: string[];
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createProjectEnvironment(
  data: CreateProjectEnvironmentInput
) {
  // Check for duplicate project code
  const existingByCode = await prisma.projectEnvironment.findUnique({
    where: { projectCode: data.projectCode }
  });
  if (existingByCode) {
    const error: any = new Error('Project code already exists');
    error.statusCode = 409;
    throw error;
  }

  // Check for duplicate project name
  const existingByName = await prisma.projectEnvironment.findFirst({
    where: { projectName: data.projectName }
  });
  if (existingByName) {
    const error: any = new Error('Project name already exists');
    error.statusCode = 409;
    throw error;
  }

  // Validate manager exists if provided
  if (data.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
    if (!manager) {
      const error: any = new Error('Manager not found');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate team members exist if provided
  if (data.teamMemberIds && data.teamMemberIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: data.teamMemberIds } }
    });
    if (users.length !== data.teamMemberIds.length) {
      const error: any = new Error('One or more team members not found');
      error.statusCode = 400;
      throw error;
    }
  }

  // Prepare team member IDs as JSON
  const teamMemberIdsJson = data.teamMemberIds && data.teamMemberIds.length > 0
    ? JSON.stringify(data.teamMemberIds)
    : null;

  const item = await prisma.projectEnvironment.create({
    data: {
      projectName: data.projectName,
      projectCode: data.projectCode,
      environmentName: data.environmentName || null,
      serviceName: data.serviceName || null,
      serverName: data.serverName || null,
      databaseName: data.databaseName || null,
      ownerName: data.ownerName || null,
      client: data.client || null,
      description: data.description || null,
      department: data.department || null,
      technologyStack: data.technologyStack || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'ACTIVE',
      budget: data.budget ? data.budget : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
      actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
      projectType: data.projectType || null,
      projectLocation: data.projectLocation || null,
      remarks: data.remarks || null,
      managerId: data.managerId || null,
      teamMemberIds: teamMemberIdsJson
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'ProjectEnvironment',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  // Create project activity
  await prisma.projectActivity.create({
    data: {
      projectId: item.id,
      activityType: 'PROJECT_CREATED',
      title: 'Project Created',
      description: `Project "${item.projectName}" (${item.projectCode}) was created`,
      performedBy: data.actorEmail || data.actorId || 'System',
      performedAt: new Date()
    }
  });

  return item;
}

export async function updateProjectEnvironment(
  id: string,
  data: Partial<CreateProjectEnvironmentInput> & { actorId?: string; actorEmail?: string; ipAddress?: string }
) {
  const existing = await prisma.projectEnvironment.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Check for duplicate project name (excluding current project)
  if (data.projectName && data.projectName !== existing.projectName) {
    const existingByName = await prisma.projectEnvironment.findFirst({
      where: { 
        projectName: data.projectName,
        id: { not: id }
      }
    });
    if (existingByName) {
      const error: any = new Error('Project name already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Validate manager exists if provided
  if (data.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
    if (!manager) {
      const error: any = new Error('Manager not found');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate team members exist if provided
  if (data.teamMemberIds && data.teamMemberIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: data.teamMemberIds } }
    });
    if (users.length !== data.teamMemberIds.length) {
      const error: any = new Error('One or more team members not found');
      error.statusCode = 400;
      throw error;
    }
  }

  // Prepare team member IDs as JSON
  let teamMemberIdsJson: string | null | undefined = undefined;
  if (data.teamMemberIds !== undefined) {
    teamMemberIdsJson = data.teamMemberIds.length > 0 ? JSON.stringify(data.teamMemberIds) : null;
  }

  const item = await prisma.projectEnvironment.update({
    where: { id },
    data: {
      projectName: data.projectName,
      environmentName: data.environmentName !== undefined ? (data.environmentName || null) : undefined,
      serviceName: data.serviceName !== undefined ? (data.serviceName || null) : undefined,
      serverName: data.serverName !== undefined ? (data.serverName || null) : undefined,
      databaseName: data.databaseName !== undefined ? (data.databaseName || null) : undefined,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined,
      client: data.client !== undefined ? (data.client || null) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined,
      department: data.department !== undefined ? (data.department || null) : undefined,
      technologyStack: data.technologyStack !== undefined ? (data.technologyStack || null) : undefined,
      priority: data.priority,
      status: data.status,
      budget: data.budget !== undefined ? (data.budget || null) : undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      expectedEndDate: data.expectedEndDate !== undefined ? (data.expectedEndDate ? new Date(data.expectedEndDate) : null) : undefined,
      actualEndDate: data.actualEndDate !== undefined ? (data.actualEndDate ? new Date(data.actualEndDate) : null) : undefined,
      projectType: data.projectType !== undefined ? (data.projectType || null) : undefined,
      projectLocation: data.projectLocation !== undefined ? (data.projectLocation || null) : undefined,
      remarks: data.remarks !== undefined ? (data.remarks || null) : undefined,
      managerId: data.managerId !== undefined ? (data.managerId || null) : undefined,
      teamMemberIds: teamMemberIdsJson
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'ProjectEnvironment',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  // Create project activity for updates
  const performedBy = data.actorEmail || data.actorId || 'System';

  // Check for specific changes
  if (data.status && data.status !== existing.status) {
    await prisma.projectActivity.create({
      data: {
        projectId: id,
        activityType: 'PROJECT_STATUS_CHANGED',
        title: 'Status Changed',
        description: `Status changed from "${existing.status}" to "${data.status}"`,
        performedBy,
        performedAt: new Date()
      }
    });
  }

  if (data.priority && data.priority !== existing.priority) {
    await prisma.projectActivity.create({
      data: {
        projectId: id,
        activityType: 'PROJECT_PRIORITY_CHANGED',
        title: 'Priority Changed',
        description: `Priority changed from "${existing.priority}" to "${data.priority}"`,
        performedBy,
        performedAt: new Date()
      }
    });
  }

  if (data.managerId !== undefined && data.managerId !== existing.managerId) {
    let description = 'Manager removed';
    if (data.managerId) {
      const newManager = await prisma.user.findUnique({ where: { id: data.managerId } });
      description = `Manager changed to "${newManager?.name || newManager?.email || 'Unknown'}"`;
    }
    await prisma.projectActivity.create({
      data: {
        projectId: id,
        activityType: 'PROJECT_MANAGER_CHANGED',
        title: 'Manager Changed',
        description,
        performedBy,
        performedAt: new Date()
      }
    });
  }

  // Always log general update if any other field changed
  const hasGeneralUpdate = 
    data.projectName !== undefined || data.projectName !== existing.projectName ||
    data.client !== undefined || data.description !== undefined ||
    data.department !== undefined || data.technologyStack !== undefined ||
    data.budget !== undefined || data.startDate !== undefined ||
    data.expectedEndDate !== undefined || data.projectType !== undefined ||
    data.projectLocation !== undefined || data.remarks !== undefined;

  if (hasGeneralUpdate && 
      !data.status && !data.priority && data.managerId === undefined) {
    await prisma.projectActivity.create({
      data: {
        projectId: id,
        activityType: 'PROJECT_UPDATED',
        title: 'Project Updated',
        description: `Project details were updated`,
        performedBy,
        performedAt: new Date()
      }
    });
  }

  return item;
}
