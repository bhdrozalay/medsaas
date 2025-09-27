/**
 * Security Configuration
 * Centralizes security policies and settings
 */

export interface SecurityConfig {
  // Authentication policies
  auth: {
    maxFailedAttempts: number;
    lockoutDuration: number; // minutes
    passwordMinLength: number;
    requireMFA: boolean;
    sessionTimeout: number; // minutes
  };

  // Logging policies
  logging: {
    enableDebugLogs: boolean;
    enableSecurityLogs: boolean;
    logSensitiveData: boolean;
    logRetentionDays: number;
  };

  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    maxRequestsPerMinute: number;
    maxLoginAttemptsPerMinute: number;
  };

  // CORS and security headers
  security: {
    enableCSRF: boolean;
    enableHSTS: boolean;
    enableContentTypeNosniff: boolean;
    enableFrameOptions: boolean;
  };
}

const PRODUCTION_CONFIG: SecurityConfig = {
  auth: {
    maxFailedAttempts: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    requireMFA: false,
    sessionTimeout: 60
  },
  logging: {
    enableDebugLogs: false,           // ❌ No debug logs in production
    enableSecurityLogs: true,         // ✅ Security events only
    logSensitiveData: false,          // ❌ No sensitive data
    logRetentionDays: 90
  },
  rateLimiting: {
    enabled: true,
    maxRequestsPerMinute: 100,
    maxLoginAttemptsPerMinute: 5
  },
  security: {
    enableCSRF: true,
    enableHSTS: true,
    enableContentTypeNosniff: true,
    enableFrameOptions: true
  }
};

const DEVELOPMENT_CONFIG: SecurityConfig = {
  auth: {
    maxFailedAttempts: 10,            // More lenient for development
    lockoutDuration: 5,               // Shorter lockout
    passwordMinLength: 6,             // Shorter for testing
    requireMFA: false,
    sessionTimeout: 480               // 8 hours for development
  },
  logging: {
    enableDebugLogs: true,            // ✅ Full debug logging
    enableSecurityLogs: true,
    logSensitiveData: true,           // ✅ For debugging
    logRetentionDays: 7
  },
  rateLimiting: {
    enabled: false,                   // Disabled for development
    maxRequestsPerMinute: 1000,
    maxLoginAttemptsPerMinute: 50
  },
  security: {
    enableCSRF: false,                // Disabled for easier testing
    enableHSTS: false,
    enableContentTypeNosniff: true,
    enableFrameOptions: false
  }
};

// Export the appropriate config based on environment
export const securityConfig: SecurityConfig =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_CONFIG
    : DEVELOPMENT_CONFIG;

/**
 * Security Logger - Environment aware logging
 */
export class SecurityLogger {
  private static config = securityConfig.logging;

  static logSecurityEvent(event: string, data: any, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableSecurityLogs) return;

    const sanitizedData = this.config.logSensitiveData
      ? data
      : this.sanitizeLogData(data);

    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      level,
      ...sanitizedData
    };

    console[level](`[SECURITY] ${event}:`, logEntry);
  }

  static logDebug(message: string, data?: any) {
    if (!this.config.enableDebugLogs) return;

    const sanitizedData = this.config.logSensitiveData
      ? data
      : this.sanitizeLogData(data);

    console.log(`[DEBUG] ${message}:`, sanitizedData);
  }

  private static sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Mask email addresses
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    }

    return sanitized;
  }
}

/**
 * Security headers middleware
 */
export function applySecurityHeaders(response: Response): Response {
  if (!securityConfig.security.enableHSTS) return response;

  const headers = new Headers(response.headers);

  if (securityConfig.security.enableHSTS) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (securityConfig.security.enableContentTypeNosniff) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }

  if (securityConfig.security.enableFrameOptions) {
    headers.set('X-Frame-Options', 'DENY');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}