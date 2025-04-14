import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { z } from 'zod';

/**
 * Middleware that validates request body against a Zod schema
 * 
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export function validateZodSchema(schema: z.ZodType<any, any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.errors
        });
      }
      
      // Update the request body with the parsed data
      req.body = result.data;
      
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during validation'
      });
    }
  };
}

/**
 * Middleware that validates request parameters against a Zod schema
 * 
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams(schema: z.ZodType<any, any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync(req.params);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation error',
          details: result.error.errors
        });
      }
      
      // Update the request parameters with the parsed data
      req.params = result.data;
      
      next();
    } catch (error) {
      console.error('Parameter validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during parameter validation'
      });
    }
  };
}

/**
 * Middleware that validates request query parameters against a Zod schema
 * 
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery(schema: z.ZodType<any, any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync(req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Query validation error',
          details: result.error.errors
        });
      }
      
      // Update the request query with the parsed data
      req.query = result.data;
      
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during query validation'
      });
    }
  };
}

/**
 * Middleware that checks for express-validator validation errors
 * 
 * @param errorMessage The error message to display if validation fails
 * @returns Express middleware function
 */
export function validateRequest(errorMessage: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: errors.array()
      });
    }
    next();
  };
}

export default {
  validateZodSchema,
  validateParams,
  validateQuery,
  validateRequest
};