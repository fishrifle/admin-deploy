import { NextResponse } from "next/server";
import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: ValidationError[];
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const validationErrors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        response: createErrorResponse(
          "VALIDATION_ERROR",
          "Request validation failed",
          400,
          validationErrors
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: createErrorResponse(
        "INVALID_JSON",
        "Invalid JSON in request body",
        400
      ),
    };
  }
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(params);
  
  if (!result.success) {
    const validationErrors: ValidationError[] = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_ERROR",
        "Parameter validation failed",
        400,
        validationErrors
      ),
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const query = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(query);
  
  if (!result.success) {
    const validationErrors: ValidationError[] = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_ERROR",
        "Query parameter validation failed",
        400,
        validationErrors
      ),
    };
  }
  
  return { success: true, data: result.data };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  details?: ValidationError[],
  path?: string
): NextResponse {
  const errorResponse: ApiError = {
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path,
    details,
  };
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  message?: string
): NextResponse {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Wraps an API handler with common error handling
 */
export function withErrorHandling(
  handler: (request: Request, context: any) => Promise<NextResponse>
) {
  return async (request: Request, context: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle known error types
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Request validation failed",
          400,
          validationErrors,
          request.url
        );
      }
      
      // Handle database errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string; message: string };
        
        switch (dbError.code) {
          case '23505': // Unique constraint violation
            return createErrorResponse(
              "DUPLICATE_RESOURCE",
              "Resource already exists",
              409,
              undefined,
              request.url
            );
          case '23503': // Foreign key constraint violation
            return createErrorResponse(
              "INVALID_REFERENCE",
              "Referenced resource does not exist",
              400,
              undefined,
              request.url
            );
          default:
            return createErrorResponse(
              "DATABASE_ERROR",
              "Database operation failed",
              500,
              undefined,
              request.url
            );
        }
      }
      
      // Generic error
      return createErrorResponse(
        "INTERNAL_ERROR",
        "An unexpected error occurred",
        500,
        undefined,
        request.url
      );
    }
  };
}

/**
 * Validates environment variables at startup
 */
export function validateEnvironment(schema: z.ZodSchema<any>) {
  const result = schema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Environment validation failed:');
    result.error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  
  return result.data;
}