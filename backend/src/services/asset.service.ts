import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';

function withRef(prefix: string, count: number) {
  return `${prefix}-${1001 + count}`;
}

export interface CreateAssetInput {
  assetType: string;
  make?: string | null;
  model?: string | null;
  serialNo?: string | null;
  assignedToName?: string | null;
  location?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

// Valid status values for assets (AssetStatus enum)
const ASSET_STATUSES = ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED', 'DISPOSED'] as const;
type AssetStatus = typeof ASSET_STATUSES[number];

export async function createAsset(data: CreateAssetInput) {
  const count = await prisma.asset.count();
  
  const item = await prisma.asset.create({
    data: {
      assetNo: withRef('AST', count),
      assetType: data.assetType,
      make: data.make || null,
      model: data.model || null,
      serialNo: data.serialNo || null,
      assignedToName: data.assignedToName || null,
      location: data.location || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'CREATE',
      entityType: 'Asset',
      entityId: item.id,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

export async function updateAsset(
  id: string,
  data: Partial<CreateAssetInput>
) {
  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Asset not found');
  }

  const item = await prisma.asset.update({
    where: { id },
    data: {
      assetType: data.assetType,
      make: data.make !== undefined ? (data.make || null) : undefined,
      model: data.model !== undefined ? (data.model || null) : undefined,
      serialNo: data.serialNo !== undefined ? (data.serialNo || null) : undefined,
      assignedToName: data.assignedToName !== undefined ? (data.assignedToName || null) : undefined,
      location: data.location !== undefined ? (data.location || null) : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPDATE',
      entityType: 'Asset',
      entityId: item.id,
      oldValue: existing as any,
      newValue: item as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

// Status update for assets
export interface UpdateAssetStatusInput {
  status: string;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateAssetStatus(id: string, data: UpdateAssetStatusInput) {
  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Asset not found');
  }

  const newStatus = data.status.toUpperCase();
  if (!ASSET_STATUSES.includes(newStatus as AssetStatus)) {
    throw new HttpError(400, `Invalid status. Must be one of: ${ASSET_STATUSES.join(', ')}`);
  }

  const item = await prisma.asset.update({
    where: { id },
    data: { status: newStatus as AssetStatus }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'STATUS_CHANGE',
      entityType: 'Asset',
      entityId: item.id,
      oldValue: { status: existing.status },
      newValue: { status: item.status },
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}
