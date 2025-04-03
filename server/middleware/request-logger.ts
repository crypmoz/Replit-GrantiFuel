/**
 * Request Logger Middleware
 * 
 * Logs incoming requests and outgoing responses for debugging and monitoring
 */

import { Request, Response, NextFunction } from 'express';

interface RequestLoggerOptions {
  excludePaths?: string[];
  logHeaders?: boolean;
  logBody?: boolean; 
  logQueryParams?: boolean;
  maskSensitiveData?: boolean;
}

const defaultOptions: RequestLoggerOptions = {
  excludePaths: ['/health', '/favicon.ico'],
  logHeaders: false,
  logBody: true,
  logQueryParams: true,
  maskSensitiveData: true
};

// Sensitive fields that should be masked in logs
const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'api_key', 'apiKey'];

/**
 * Masks sensitive data in objects
 */
const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const maskedData = { ...data };
  
  Object.keys(maskedData).forEach(key => {
    const lowerCaseKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerCaseKey.includes(field))) {
      maskedData[key] = '[REDACTED]';
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  });
  
  return maskedData;
};

export const requestLogger = (customOptions: RequestLoggerOptions = {}) => {
  const options = { ...defaultOptions, ...customOptions };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for excluded paths
    if (options.excludePaths?.some(path => req.path.includes(path))) {
      return next();
    }
    
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Prepare request data for logging
    const requestData: any = {
      id: requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    if (options.logQueryParams && Object.keys(req.query).length > 0) {
      requestData.query = options.maskSensitiveData 
        ? maskSensitiveData(req.query) 
        : req.query;
    }
    
    if (options.logBody && req.body && Object.keys(req.body).length > 0) {
      requestData.body = options.maskSensitiveData 
        ? maskSensitiveData(req.body) 
        : req.body;
    }
    
    if (options.logHeaders) {
      requestData.headers = options.maskSensitiveData 
        ? maskSensitiveData(req.headers) 
        : req.headers;
    }
    
    // Log the request
    console.log(`[REQUEST] ${requestId} ${req.method} ${req.path}`, requestData);
    
    // Capture and log the response
    const originalSend = res.send;
    
    res.send = function(body?: any): Response {
      const responseTime = Date.now() - startTime;
      
      const responseData = {
        id: requestId,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: body ? Buffer.byteLength(body, 'utf8') : 0
      };
      
      console.log(`[RESPONSE] ${requestId} ${res.statusCode} ${responseTime}ms`, responseData);
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};