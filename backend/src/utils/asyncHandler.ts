import { Request, Response, NextFunction, RequestHandler } from 'express';

// Generic type for route handlers
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async function to handle errors in Express routes
 * @param fn Async function to wrap
 * @returns Express RequestHandler
 */
export const asyncHandler = (fn: AsyncFunction): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Handle known errors with status codes
      if ('statusCode' in error) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(error.errors && { errors: error.errors })
        });
        return;
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
        return;
      }

      // Handle mongoose duplicate key errors
      if (error.code === 11000) {
        res.status(400).json({
          success: false,
          message: 'Duplicate field value entered'
        });
        return;
      }

      // Handle other errors
      console.error('Unhandled Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  };
};

// Custom error class with status code
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Helper functions to create common errors
export const createNotFoundError = (message: string) => new AppError(message, 404);
export const createValidationError = (message: string, errors: any[]) => new AppError(message, 400, errors);
export const createUnauthorizedError = (message: string) => new AppError(message, 401);
export const createForbiddenError = (message: string) => new AppError(message, 403);
