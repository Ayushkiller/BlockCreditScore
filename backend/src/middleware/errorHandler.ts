import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for debugging
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.message.includes('SQLITE_')) {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  } else if (error.message.includes('Invalid address')) {
    statusCode = 400;
    code = 'INVALID_ADDRESS';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    code: code,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

// Helper function to create custom errors
export function createError(
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): CustomError {
  return new CustomError(message, statusCode, code, details);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}