import { LOG_LEVEL, isDevelopment } from "@/lib/env";

export interface LogContext {
  userId?: string;
  orgId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: Error;
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: string;

  constructor(logLevel: string = LOG_LEVEL) {
    this.logLevel = logLevel;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };

    if (isDevelopment) {
      return JSON.stringify(baseLog, null, 2);
    }

    return JSON.stringify(baseLog);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Specific logging methods for common scenarios
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      ...context,
    });
  }

  apiResponse(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    this.info(`API Response: ${method} ${url} - ${statusCode} (${responseTime}ms)`, {
      method,
      url,
      statusCode,
      responseTime,
      ...context,
    });
  }

  apiError(method: string, url: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${method} ${url} - ${error.message}`, {
      method,
      url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  }

  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      event,
      userId,
      ...context,
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      event,
      severity,
      ...context,
    });
  }

  auditLog(action: string, resource: string, userId?: string, context?: LogContext): void {
    this.info(`Audit: ${action} ${resource}`, {
      action,
      resource,
      userId,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Helper functions
export const createRequestLogger = (req: Request) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();
  
  return {
    requestId,
    log: (message: string, context?: LogContext) => {
      logger.info(message, {
        requestId,
        method: req.method,
        url: req.url,
        ...context,
      });
    },
    logResponse: (statusCode: number, context?: LogContext) => {
      const responseTime = Date.now() - startTime;
      logger.apiResponse(req.method, req.url, statusCode, responseTime, {
        requestId,
        ...context,
      });
    },
    logError: (error: Error, context?: LogContext) => {
      logger.apiError(req.method, req.url, error, {
        requestId,
        ...context,
      });
    },
  };
};