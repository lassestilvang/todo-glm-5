/**
 * Custom error classes for the Daily Task Planner application
 * 
 * These error classes provide structured error handling throughout the service layer.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Error thrown when an entity is not found
 */
export class NotFoundError extends AppError {
  constructor(
    entity: string,
    id?: string,
    details?: Record<string, unknown>
  ) {
    const message = id
      ? `${entity} with id "${id}" not found`
      : `${entity} not found`;
    super(message, 'NOT_FOUND', 404, { entity, id, ...details });
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    originalError?: Error,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      { 
        originalError: originalError?.message,
        ...details 
      }
    );
  }
}

/**
 * Error thrown when a unique constraint is violated
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Error thrown when an operation is not allowed
 */
export class ForbiddenError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is a DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}
