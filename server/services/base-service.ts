/**
 * Base Service Class
 * 
 * This abstract class provides common functionality for all services
 * including logging, error handling, and response formatting.
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Creates a standardized successful response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Creates a standardized error response
   */
  protected error<T>(message: string, code?: string, details?: any): ServiceResponse<T> {
    console.error(`[${this.serviceName}] Error: ${message}`, details || '');
    
    return {
      success: false,
      error: {
        message,
        code,
        details
      }
    };
  }

  /**
   * Wraps an async function with standardized error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage = 'An unexpected error occurred'
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (err: any) {
      const message = err.message || errorMessage;
      const code = err.code || 'INTERNAL_ERROR';
      return this.error(message, code, err);
    }
  }

  /**
   * Logs an operation with timing information
   */
  protected async executeWithLogging<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    console.log(`[${this.serviceName}] Starting: ${operationName}`);
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] Completed: ${operationName} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${this.serviceName}] Failed: ${operationName} after ${duration}ms`, error);
      throw error;
    }
  }
}