/**
 * Compliance Management Service
 * 
 * Handles CRUD operations for compliance frameworks, controls, and evidence.
 */

import { prisma } from '../common/prisma.js';
import { Prisma } from '@prisma/client';

// ============================================================
// Framework Types
// ============================================================

export interface CreateFrameworkInput {
  name: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateFrameworkInput {
  name?: string;
  description?: string | null;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface FrameworkListOptions {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================
// Control Types
// ============================================================

export interface CreateControlInput {
  frameworkId: string;
  name: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateControlInput {
  name?: string;
  description?: string | null;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
}

export interface ControlListOptions {
  frameworkId?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================
// Framework Operations
// ============================================================

export class ComplianceManagementService {
  
  // -------- Framework CRUD --------

  static async createFramework(input: CreateFrameworkInput) {
    return prisma.complianceFramework.create({
      data: {
        name: input.name,
        description: input.description || null,
        createdBy: input.createdBy || null,
        status: 'DRAFT'
      }
    });
  }

  static async updateFramework(id: string, input: UpdateFrameworkInput) {
    return prisma.complianceFramework.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status as any })
      }
    });
  }

  static async deleteFramework(id: string) {
    // Prisma cascade delete will handle related controls and evidence
    return prisma.complianceFramework.delete({
      where: { id }
    });
  }

  static async getFramework(id: string) {
    return prisma.complianceFramework.findUnique({
      where: { id },
      include: {
        _count: {
          select: { controls: true }
        }
      }
    });
  }

  static async listFrameworks(options: FrameworkListOptions = {}) {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ComplianceFrameworkWhereInput = {};

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ];
    }

    if (status) {
      where.status = status as any;
    }

    // Build orderBy
    const orderBy: Prisma.ComplianceFrameworkOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'status':
        orderBy.status = sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = sortOrder;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder;
        break;
    }

    const [items, total] = await Promise.all([
      prisma.complianceFramework.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { controls: true }
          }
        }
      }),
      prisma.complianceFramework.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getFrameworksDropdown() {
    return prisma.complianceFramework.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: { name: 'asc' }
    });
  }

  // -------- Control CRUD --------

  static async createControl(input: CreateControlInput) {
    // Verify framework exists
    const framework = await prisma.complianceFramework.findUnique({
      where: { id: input.frameworkId }
    });

    if (!framework) {
      throw new Error('Framework not found');
    }

    return prisma.complianceControl.create({
      data: {
        frameworkId: input.frameworkId,
        name: input.name,
        description: input.description || null,
        createdBy: input.createdBy || null,
        status: 'DRAFT'
      }
    });
  }

  static async updateControl(id: string, input: UpdateControlInput) {
    return prisma.complianceControl.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status as any })
      }
    });
  }

  static async deleteControl(id: string) {
    // Prisma cascade delete will handle related evidence
    return prisma.complianceControl.delete({
      where: { id }
    });
  }

  static async getControl(id: string) {
    return prisma.complianceControl.findUnique({
      where: { id },
      include: {
        framework: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { evidence: true }
        }
      }
    });
  }

  static async listControls(options: ControlListOptions = {}) {
    const {
      frameworkId,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ComplianceControlWhereInput = {};

    if (frameworkId) {
      where.frameworkId = frameworkId;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ];
    }

    if (status) {
      where.status = status as any;
    }

    // Build orderBy
    const orderBy: Prisma.ComplianceControlOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'status':
        orderBy.status = sortOrder;
        break;
      case 'updatedAt':
        orderBy.updatedAt = sortOrder;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder;
        break;
    }

    const [items, total] = await Promise.all([
      prisma.complianceControl.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          framework: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { evidence: true }
          }
        }
      }),
      prisma.complianceControl.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // -------- Summary Statistics --------

  static async getSummary() {
    const [
      frameworkCount,
      controlCount,
      evidenceCount,
      missingEvidenceControls
    ] = await Promise.all([
      prisma.complianceFramework.count({
        where: { status: { not: 'ARCHIVED' } }
      }),
      prisma.complianceControl.count(),
      prisma.complianceEvidence.count(),
      // Controls with no evidence
      prisma.complianceControl.count({
        where: {
          evidence: { none: {} }
        }
      })
    ]);

    return {
      frameworks: frameworkCount,
      controls: controlCount,
      evidenceDocuments: evidenceCount,
      missingEvidence: missingEvidenceControls
    };
  }
}
