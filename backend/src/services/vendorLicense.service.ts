import { prisma } from '../common/prisma.js';

export interface CreateVendorLicenseInput {
  vendorName: string;
  licenseName: string;
  licenseCount?: number;
  assignedCount?: number;
  cost?: number | null;
  renewalAt?: Date | string | null;
  ownerName?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createVendorLicense(data: CreateVendorLicenseInput) {
  const item = await prisma.vendorLicense.create({
    data: {
      vendorName: data.vendorName,
      licenseName: data.licenseName,
      licenseCount: Number(data.licenseCount || 0),
      assignedCount: Number(data.assignedCount || 0),
      cost: data.cost ?? null,
      renewalAt: data.renewalAt ? new Date(data.renewalAt) : null,
      ownerName: data.ownerName || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'VendorLicense',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateVendorLicense(
  id: string,
  data: Partial<CreateVendorLicenseInput>
) {
  const existing = await prisma.vendorLicense.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Vendor license not found');
  }

  const item = await prisma.vendorLicense.update({
    where: { id },
    data: {
      vendorName: data.vendorName,
      licenseName: data.licenseName,
      licenseCount: data.licenseCount !== undefined ? Number(data.licenseCount) : undefined,
      assignedCount: data.assignedCount !== undefined ? Number(data.assignedCount) : undefined,
      cost: data.cost !== undefined ? data.cost ?? null : undefined,
      renewalAt: data.renewalAt !== undefined ? (data.renewalAt ? new Date(data.renewalAt) : null) : undefined,
      ownerName: data.ownerName !== undefined ? (data.ownerName || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'VendorLicense',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
