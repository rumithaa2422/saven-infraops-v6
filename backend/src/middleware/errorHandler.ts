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

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyMessage(error: Error): string {
  // Check for common network/connection errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
    return 'Unable to connect to the server. Please verify your network connection.';
  }
  
  if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNRESET')) {
    return 'The request timed out. Please try again.';
  }
  
  if (error.message.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again later.';
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
          message: 'A record with this value already exists. Please check if this item already exists.' 
        });
        return;
      case 'P2025':
        res.status(404).json({ 
          success: false,
          code: 'NOT_FOUND',
          message: 'The requested record could not be found. It may have been deleted or never existed.' 
        });
        return;
      case 'P2003':
        // In development, show the actual constraint field
        const isDev = process.env.NODE_ENV === 'development';
        res.status(400).json({ 
          success: false,
          code: 'FOREIGN_KEY_ERROR',
          message: isDev ? `Foreign key constraint failed: ${error.message}` : 'Cannot complete this operation because the related record does not exist.' 
        });
        return;
      case 'P2014':
        res.status(400).json({ 
          success: false,
          code: 'CONSTRAINT_ERROR',
          message: 'The operation violates a data constraint. Please check your input values.' 
        });
        return;
      default:
        res.status(500).json({ 
          success: false,
          code: 'DATABASE_ERROR',
          message: 'The server encountered a database error. Please try again later.' 
        });
        return;
    }
  }

  // Handle validation errors from express-validator or similar
  if (error.name === 'ValidationError') {
    res.status(400).json({ 
      success: false,
      code: 'VALIDATION_ERROR',
      message: error.message || 'Please check your input and try again.'
    });
    return;
  }

  // Handle other errors - PART 10: Include user-friendly message
  // In development mode, show the real error message for debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    success: false,
    code: 'INTERNAL_ERROR',
    message: isDevelopment ? error.message : getUserFriendlyMessage(error),
    ...(isDevelopment && { 
      originalError: error.message,
      stack: error.stack 
    })
  });
};
