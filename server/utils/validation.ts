import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware factory to validate request data using express-validator
 * 
 * @example
 * // Usage in routes.ts
 * app.post('/api/users', [
 *   body('username').notEmpty().withMessage('Username is required'),
 *   body('email').isEmail().withMessage('Invalid email format'),
 *   validate()
 * ], createUser);
 */
export const validate = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  };
};

/**
 * Utility function to sanitize object properties
 * Remove specified fields or all fields except allowed ones
 * 
 * @param obj Object to sanitize
 * @param options Configuration options
 * @param options.allowList Fields to allow (if provided, all others are removed)
 * @param options.denyList Fields to remove (used if allowList not provided)
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  options: {
    allowList?: string[];
    denyList?: string[];
  } = {}
): Partial<T> {
  const result: Partial<T> = {};
  
  if (options.allowList && options.allowList.length > 0) {
    // Keep only fields in the allowList
    for (const key of options.allowList) {
      if (key in obj) {
        result[key as keyof T] = obj[key];
      }
    }
  } else if (options.denyList && options.denyList.length > 0) {
    // Keep all fields except those in denyList
    for (const key in obj) {
      if (!options.denyList.includes(key)) {
        result[key as keyof T] = obj[key];
      }
    }
  } else {
    // No filtering, return the original object
    return { ...obj };
  }
  
  return result;
}