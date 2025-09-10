/**
 * Logger estruturado para produção
 * Segue padrão JSON para melhor observabilidade
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  service: string;
  operation: string;
  paymentId?: string;
  userId?: string;
  [key: string]: unknown;
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown): string {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } : {})
    };
    
    return JSON.stringify(logEntry);
  }
  
  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }
  
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }
  
  error(message: string, context?: LogContext, error?: unknown): void {
    console.error(this.formatLog('error', message, context, error));
  }
  
  debug(_message: string, _context?: LogContext): void {
    // Debug logs desabilitados em produção
    // Para habilitar em dev local, descomentar linha abaixo:
    // console.log(this.formatLog(_message, 'debug', _context));
  }
  
  // Log específico para pagamentos
  payment(operation: string, paymentId: string, details: Record<string, unknown>): void {
    this.info(`Payment ${operation}`, {
      service: 'payment',
      operation,
      paymentId,
      ...details
    });
  }
  
  // Log específico para webhooks
  webhook(operation: string, details: Record<string, unknown>): void {
    this.info(`Webhook ${operation}`, {
      service: 'webhook',
      operation,
      ...details
    });
  }
}

export const logger = new StructuredLogger();