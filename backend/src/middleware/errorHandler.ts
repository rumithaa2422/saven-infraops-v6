import { ErrorRequestHandler } from 'express';
import { HttpError } from '../common/httpError.js';
import { prisma } from '../common/prisma.js';

/**
 * Standard API error response format
 */
interface ApiErrorResponse {
  success: false;
  code?: string;
  permission?: string;  // For 403 responses
  message: string;
  details?: unknown;
}

/**
 * Log permission denied events for audit
 * PART 9: Audit Logs
 */
async function logPermissionDenied(
  userId: string | undefined,
  userEmail: string | undefined,
  permission: string,
  endpoint: string,
  method: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'PERMISSION_DENIED',
        entityType: 'Permission',
        entityId: permission,
        performedBy: userId || 'unknown',
        performedByEmail: userEmail,
        ipAddress: undefined, // Will be available from request
        userAgent: undefined,
        details: {
          permission,
          endpoint,
          method,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log permission denied:', error);
  }
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // Log errors to console for debugging
  console.error('Error:', error);
  
  if (error instanceof HttpError) {
    // PART 10: Standard API response format
    const response: ApiErrorResponse = {
      success: false,
      code: error.code,
      message: error.message
    };

    // Add permission info for 403 responses
    if (error.statusCode === 403) {
      response.permission = error.permission;
      
      // PART 9: Log permission denied to audit log
      const user = (req as any).user;
      logPermissionDenied(
        user?.id,
        user?.email,
        error.permission || 'unknown',
        req.path,
        req.method
      );
    }

    if (error.details) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({ 
          success: false,
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists' 
        });
        return;
      case 'P2025':
        res.status(404).json({ 
          success: false,
          code: 'NOT_FOUND',
          message: 'Record not found' 
        });
        return;
      default:
        res.status(500).json({ 
          success: false,
          code: 'DATABASE_ERROR',
          message: error.message || 'Database error' 
        });
        return;
    }
  }

  // Handle other errors - PART 10: Include code for consistency
  res.status(500).json({ 
    success: false,
    code: 'INTERNAL_ERROR',
    message: error.message || 'Internal server error' 
  });
};
