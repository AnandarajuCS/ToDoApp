export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  todoId?: string;
  [key: string]: any;
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };
    return JSON.stringify(logEntry);
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    console.error(this.formatMessage('ERROR', message, errorContext));
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}