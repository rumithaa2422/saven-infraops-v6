import { Router, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { prisma } from '../../common/prisma.js';

/**
 * PART 4: Inventory Assignment Permission Enforcement
 * Permissions:
 * - inventory:assign - Assign inventory to users/projects
 * - inventory:return - Return inventory
 * - inventory:transfer - Transfer inventory
 */

export const inventoryAssignmentRouter = Router();

// Non-assignable statuses
const NON_ASSIGNABLE_STATUSES = ['UNDER_REPAIR', 'RETIRED', 'LOST', 'DAMAGED'];

// Permission constants - PART 4
const ASSIGN_PERMISSION = 'inventory:assign';

// ============================================
// Inventory Assignment Routes - PART 4: Permission Protected
// ============================================

// POST /inventory-assignments - Create new assignment (PART 4: inventory:assign)
inventoryAssignmentRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermission(ASSIGN_PERMISSION)(req, res, (err) => err ? reject(err) : resolve())
    );

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

// POST /inventory-assignments/transfer - Transfer inventory to new user/project
inventoryAssignmentRouter.post('/transfer', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, userId, projectId, remarks } = req.body;
    const user = req.user!;

    // Validation
    if (!inventoryId) {
      return res.status(400).json({ message: 'Inventory ID is required' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'New user is required' });
    }
    if (!projectId) {
      return res.status(400).json({ message: 'New project is required' });
    }

    // Get inventory item
    const inventory = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if status is ASSIGNED
    if (inventory.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'Can only transfer assigned inventory' });
    }

    // Get current active assignment
    const currentAssignment = await prisma.inventoryAssignment.findFirst({
      where: {
        inventoryId,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { name: true } },
        project: { select: { projectName: true } }
      }
    });

    if (!currentAssignment) {
      return res.status(400).json({ message: 'No active assignment found' });
    }

    // Verify new user is different from current
    if (currentAssignment.userId === userId) {
      return res.status(400).json({ message: 'New user must be different from current user' });
    }

    // Verify new user exists
    const newUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!newUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify project exists
    const newProject = await prisma.projectEnvironment.findUnique({
      where: { id: projectId }
    });
    if (!newProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Transfer in transaction
    const [closedAssignment, newAssignment] = await prisma.$transaction([
      // Close current assignment
      prisma.inventoryAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          status: 'TRANSFERRED',
          returnedDate: new Date(),
          remarks: remarks || `Transferred to ${newUser.name}`
        }
      }),
      // Create new assignment
      prisma.inventoryAssignment.create({
        data: {
          inventoryId,
          userId,
          projectId,
          assignedBy: user.id,
          assignedByName: user.name || user.email,
          status: 'ACTIVE',
          remarks: `Transferred from ${currentAssignment.user?.name || 'Unknown'}`
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
      // Create history entries
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'TRANSFERRED',
          description: `Transferred from ${currentAssignment.user?.name} to ${newUser.name}`,
          performedBy: user.name || user.email,
          userId: user.id
        }
      }),
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'ASSIGNED',
          description: `Assigned to ${newUser.name} for project ${newProject.projectName}`,
          performedBy: user.name || user.email,
          userId: user.id
        }
      })
    ]);

    res.json({ assignment: newAssignment });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-assignments/return - Return inventory
inventoryAssignmentRouter.post('/return', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, remarks } = req.body;
    const user = req.user!;

    if (!inventoryId) {
      return res.status(400).json({ message: 'Inventory ID is required' });
    }

    // Get inventory item
    const inventory = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventory.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'Can only return assigned inventory' });
    }

    // Get active assignment
    const assignment = await prisma.inventoryAssignment.findFirst({
      where: {
        inventoryId,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!assignment) {
      return res.status(400).json({ message: 'No active assignment found' });
    }

    // Return in transaction
    await prisma.$transaction([
      // Close assignment
      prisma.inventoryAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'RETURNED',
          returnedDate: new Date(),
          remarks: remarks || 'Returned'
        }
      }),
      // Update inventory status
      prisma.inventoryMaster.update({
        where: { id: inventoryId },
        data: { status: 'AVAILABLE' }
      }),
      // Create history
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'RETURNED',
          description: `Returned by ${assignment.user?.name || 'Unknown'}`,
          performedBy: user.name || user.email,
          userId: user.id,
          remarks
        }
      })
    ]);

    res.json({ message: 'Inventory returned successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-assignments/repair - Mark inventory for repair
inventoryAssignmentRouter.post('/repair', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, issueDescription, vendor, expectedReturnDate, remarks } = req.body;
    const user = req.user!;

    if (!inventoryId) {
      return res.status(400).json({ message: 'Inventory ID is required' });
    }
    if (!issueDescription) {
      return res.status(400).json({ message: 'Issue description is required' });
    }

    // Get inventory item
    const inventory = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Can repair if AVAILABLE or ASSIGNED
    if (!['AVAILABLE', 'ASSIGNED'].includes(inventory.status)) {
      return res.status(400).json({ 
        message: 'Can only repair available or assigned inventory' 
      });
    }

    // If assigned, close the assignment
    let closedAssignment = null;
    if (inventory.status === 'ASSIGNED') {
      closedAssignment = await prisma.inventoryAssignment.findFirst({
        where: { inventoryId, status: 'ACTIVE' }
      });
    }

    // Repair in transaction
    await prisma.$transaction([
      // Close assignment if exists
      ...(closedAssignment ? [
        prisma.inventoryAssignment.update({
          where: { id: closedAssignment.id },
          data: {
            status: 'RETURNED',
            returnedDate: new Date(),
            remarks: 'Sent for repair'
          }
        })
      ] : []),
      // Update inventory status
      prisma.inventoryMaster.update({
        where: { id: inventoryId },
        data: { status: 'UNDER_REPAIR' }
      }),
      // Create history
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'SENT_FOR_REPAIR',
          description: issueDescription,
          performedBy: user.name || user.email,
          userId: user.id,
          vendor,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          remarks
        }
      })
    ]);

    res.json({ message: 'Inventory sent for repair' });
  } catch (error) {
    next(error);
  }
});

// POST /inventory-assignments/retire - Retire inventory
inventoryAssignmentRouter.post('/retire', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, reason, remarks } = req.body;
    const user = req.user!;

    if (!inventoryId) {
      return res.status(400).json({ message: 'Inventory ID is required' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Retirement reason is required' });
    }

    // Get inventory item
    const inventory = await prisma.inventoryMaster.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Can retire if AVAILABLE or ASSIGNED
    if (!['AVAILABLE', 'ASSIGNED'].includes(inventory.status)) {
      return res.status(400).json({ 
        message: 'Can only retire available or assigned inventory' 
      });
    }

    // If assigned, close the assignment
    let closedAssignment = null;
    if (inventory.status === 'ASSIGNED') {
      closedAssignment = await prisma.inventoryAssignment.findFirst({
        where: { inventoryId, status: 'ACTIVE' }
      });
    }

    // Retire in transaction
    await prisma.$transaction([
      // Close assignment if exists
      ...(closedAssignment ? [
        prisma.inventoryAssignment.update({
          where: { id: closedAssignment.id },
          data: {
            status: 'RETURNED',
            returnedDate: new Date(),
            remarks: 'Inventory retired'
          }
        })
      ] : []),
      // Update inventory status
      prisma.inventoryMaster.update({
        where: { id: inventoryId },
        data: { status: 'RETIRED' }
      }),
      // Create history
      prisma.inventoryHistory.create({
        data: {
          inventoryId,
          action: 'RETIRED',
          description: `Retired: ${reason}`,
          performedBy: user.name || user.email,
          userId: user.id,
          remarks
        }
      })
    ]);

    res.json({ message: 'Inventory retired successfully' });
  } catch (error) {
    next(error);
  }
});
