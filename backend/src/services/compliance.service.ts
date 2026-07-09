/**
 * Compliance Document Service
 * 
 * Handles PDF document storage and retrieval for compliance repository.
 */

import { prisma } from '../common/prisma.js';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'compliance');

export interface CreateDocumentInput {
  fileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string | null;
  uploadedByEmail?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  uploadedByEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Create a compliance document record
 */
export async function createComplianceDocument(data: CreateDocumentInput): Promise<DocumentRecord> {
  const item = await prisma.complianceDocument.create({
    data: {
      fileName: data.fileName,
      storedFileName: data.storedFileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      uploadedBy: data.uploadedBy || null,
      uploadedByEmail: data.uploadedByEmail || null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'UPLOAD',
      entityType: 'ComplianceDocument',
      entityId: item.id,
      newValue: { fileName: item.fileName, fileSize: item.fileSize } as any,
      ipAddress: data.ipAddress || null
    }
  });

  return item;
}

/**
 * List all compliance documents
 */
export async function listComplianceDocuments(): Promise<DocumentRecord[]> {
  return prisma.complianceDocument.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get a single compliance document by ID
 */
export async function getComplianceDocument(id: string): Promise<DocumentRecord | null> {
  return prisma.complianceDocument.findUnique({
    where: { id }
  });
}

/**
 * Delete a compliance document and its file
 */
export async function deleteComplianceDocument(
  id: string,
  actorId?: string | null,
  actorEmail?: string | null,
  ipAddress?: string | null
): Promise<{ success: boolean; message: string }> {
  const document = await prisma.complianceDocument.findUnique({
    where: { id }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Delete the file from disk
  const filePath = path.join(UPLOAD_DIR, document.storedFileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
  }

  // Delete the database record
  await prisma.complianceDocument.delete({
    where: { id }
  });

  await prisma.auditLog.create({
    data: {
      actorId: actorId || null,
      actorEmail: actorEmail || null,
      action: 'DELETE',
      entityType: 'ComplianceDocument',
      entityId: id,
      oldValue: { fileName: document.fileName } as any,
      ipAddress: ipAddress || null
    }
  });

  return { success: true, message: 'Document deleted successfully' };
}

/**
 * Get the file path for a stored document
 */
export function getDocumentFilePath(storedFileName: string): string {
  return path.join(UPLOAD_DIR, storedFileName);
}
