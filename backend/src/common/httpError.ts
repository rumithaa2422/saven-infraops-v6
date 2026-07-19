/**
 * Custom HTTP Error class with support for standard error responses
 * Including permission code for 403 Forbidden responses
 */
export class HttpError extends Error {
  statusCode: number;
  details?: unknown;
  code?: string;  // Error code for API responses (e.g., 'PERMISSION_DENIED')
  permission?: string;  // Permission that was required (for 403 responses)

  constructor(statusCode: number, message: string, details?: unknown, code?: string, permission?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.permission = permission;
  }
}

/**
 * Create a standard permission denied error
 * Used when user lacks required permission
 */
export function permissionDenied(permission: string, message?: string): HttpError {
  return new HttpError(
    403,
    message || "You do not have permission to perform this action.",
    undefined,
    'PERMISSION_DENIED',
    permission
  );
}

/**
 * Create an unauthorized error (401)
 */
export function unauthorized(message: string = 'Authentication required'): HttpError {
  return new HttpError(401, message, undefined, 'UNAUTHORIZED');
}

/**
 * Create a not found error (404)
 */
export function notFound(resource: string = 'Resource'): HttpError {
  return new HttpError(404, `${resource} not found`, undefined, 'NOT_FOUND');
}
