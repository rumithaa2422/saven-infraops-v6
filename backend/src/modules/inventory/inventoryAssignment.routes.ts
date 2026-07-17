import { Router, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../common/prisma.js';

export const inventoryAssignmentRouter = Router();

// Non-assignable statuses
const NON_ASSIGNABLE_STATUSES = ['UNDER_REPAIR', 'RETIRED', 'LOST', 'DAMAGED'];

// ============================================
// Inventory Assignment Routes
// ============================================

// POST /inventory-assignments - Create new assignment
inventoryAssignmentRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, userId, projectId, remarks } = req.body;
    const user = req.user!;

    // Validation
    const errors: string[] = [];
    
    if (!inventoryId) {
      errors.push('Inventory ID is required');
    }
    
    if (!userId) {
      errors.push('User is required');
    }
    
    if (!projectId) {
      errors.push('Project is required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    // Check if inventory item exists
    const inventory = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryId }
    });
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if inventory is in assignable status
    if (NON_ASSIGNABLE_STATUSES.includes(inventory.status)) {
      return res.status(400).json({ 
        message: `Cannot assign inventory with status: ${inventory.status}` 
      });
    }

    // Check if already has an active assignment
    const existingAssignment = await prisma.inventoryAssignment.findFirst({
      where: {
        inventoryId,
        status: 'ACTIVE'
      }
    });
    
    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'Inventory already has an active assignment' 
      });
    }

    // Verify user exists
    const assignToUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!assignToUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify project exists
    const project = await prisma.projectEnvironment.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create assignment and update inventory status in a transaction
    const [assignment] = await prisma.$transaction([
      // Create assignment
      prisma.inventoryAssignment.create({
        data: {
          inventoryId,
          userId,
          projectId,
          assignedBy: user.id,
          assignedByName: user.name || user.email,
          status: 'ACTIVE',
          remarks
        },
        include: {
          inventory: {
            include: {
              category: { select: { id: true, name: true } },
              subcategory: { select: { id: true, name: true } }
            }
          },
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, projectName: true, projectCode: true } }
        }
      }),
      // Update inventory status
      prisma.inventoryMaster.update({
        where: { id: inventoryId },
        data: { status: 'ASSIGNED' }
      }),
      // Create history entry
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'ASSIGNED',
          description: `Assigned to ${assignToUser.name} for project ${project.projectName}`,
          performedBy: user.name || user.email,
          userId: user.id
        }
      })
    ]);

    res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-assignments - Get all assignments (with filters)
inventoryAssignmentRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const inventoryId = req.query.inventoryId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    
    if (inventoryId) {
      where.inventoryId = inventoryId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (status) {
      where.status = status;
    }

    const assignments = await prisma.inventoryAssignment.findMany({
      where,
      include: {
        inventory: {
          include: {
            category: { select: { id: true, name: true } },
            subcategory: { select: { id: true, name: true } }
          }
        },
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, projectName: true, projectCode: true } }
      },
      orderBy: { assignedDate: 'desc' }
    });

    res.json({ assignments });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-assignments/inventory/:inventoryId - Get active assignment for inventory
inventoryAssignmentRouter.get('/inventory/:inventoryId', requireAuth, async (req, res, next) => {
  try {
    const inventoryId = req.params.inventoryId;

    const assignment = await prisma.inventoryAssignment.findFirst({
      where: {
        inventoryId,
        status: 'ACTIVE'
      },
      include: {
        inventory: {
          include: {
            category: { select: { id: true, name: true } },
            subcategory: { select: { id: true, name: true } }
          }
        },
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, projectName: true, projectCode: true } }
      }
    });

    res.json({ assignment });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-assignments/users - Get all users for assignment dropdown
inventoryAssignmentRouter.get('/users', requireAuth, async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    
    const where: any = {
      status: 'ACTIVE'
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: true
      },
      orderBy: { name: 'asc' },
      take: 50
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// GET /inventory-assignments/projects - Get all projects for assignment dropdown
inventoryAssignmentRouter.get('/projects', requireAuth, async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    
    const where: any = {
      status: 'ACTIVE'
    };
    
    if (search) {
      where.OR = [
        { projectName: { contains: search } },
        { projectCode: { contains: search } }
      ];
    }

    const projects = await prisma.projectEnvironment.findMany({
      where,
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        status: true
      },
      orderBy: { projectName: 'asc' },
      take: 50
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});
