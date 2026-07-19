import { prisma } from '../common/prisma.js';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
  'text/plain'
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.zip', '.png', '.jpg', '.jpeg', '.txt'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export class ProjectDocumentService {
  static validateFile(file: { mimeType: string; originalName: string; size: number }): { valid: boolean; error?: string } {
    // Check file extension
    const ext = '.' + file.originalName.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` };
    }

    // Check MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.mimeType)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 20 MB limit' };
    }

    return { valid: true };
  }

  static async list(projectId: string, params: { search?: string; sortBy?: string; sortOrder?: string } = {}) {
    const { search, sortBy = 'uploadedAt', sortOrder = 'desc' } = params;

    const where: any = { projectId };
    if (search) {
      where.OR = [
        { originalFileName: { contains: search } },
        { fileType: { contains: search } },
        { uploadedBy: { contains: search } },
        { remarks: { contains: search } }
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'fileName') {
      orderBy.originalFileName = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'fileType') {
      orderBy.fileType = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'fileSize') {
      orderBy.fileSize = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'uploadedBy') {
      orderBy.uploadedBy = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'uploadedAt') {
      orderBy.uploadedAt = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.uploadedAt = 'desc';
    }

    const documents = await prisma.projectDocument.findMany({
      where,
      orderBy,
      select: {
        id: true,
        fileName: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
        uploadedBy: true,
        uploadedAt: true,
        remarks: true
      }
    });

    return { items: documents };
  }

  static async getById(id: string) {
    return prisma.projectDocument.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        fileName: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
        uploadedBy: true,
        uploadedAt: true,
        remarks: true
      }
    });
  }

  static async upload(projectId: string, file: { filename: string; originalName: string; mimeType: string; size: number }, uploadedBy?: string, remarks?: string) {
    const document = await prisma.projectDocument.create({
      data: {
        projectId,
        fileName: file.filename,
        originalFileName: file.originalName,
        fileType: file.mimeType,
        fileSize: file.size,
        uploadedBy,
        remarks
      }
    });

    return document;
  }

  static async delete(id: string) {
    return prisma.projectDocument.delete({
      where: { id }
    });
  }
}
