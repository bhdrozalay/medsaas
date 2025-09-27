import bcrypt from 'bcryptjs';
import { signJWT, verifyJWT } from './jwt-edge';
import { prisma } from '@medsas/database';
import { securityConfig, SecurityLogger } from './security-config';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
    tenantId: string | null;
    trialEndDate: Date | null;
  };
  token?: string;
  error?: string;
  redirectTo?: string;
}

/**
 * Centralized Authentication Service
 * Handles all authentication logic with security policies
 */
export class AuthService {
  private securityPolicy = securityConfig.auth;

  /**
   * Authenticate user with credentials
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { email, password, rememberMe } = credentials;

    try {
      console.log('[AUTH] Starting login for:', email);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      console.log('[AUTH] User found:', !!user);

      if (!user) {
        SecurityLogger.logSecurityEvent('LOGIN_ATTEMPT_FAILED', { email, reason: 'USER_NOT_FOUND' });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check account lockout
      if (await this.isAccountLocked(user.id)) {
        SecurityLogger.logSecurityEvent('LOGIN_ATTEMPT_BLOCKED', { email, reason: 'ACCOUNT_LOCKED' });
        return {
          success: false,
          error: 'Account temporarily locked due to too many failed attempts'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.recordFailedLogin(user.id);
        SecurityLogger.logSecurityEvent('LOGIN_ATTEMPT_FAILED', { email, reason: 'INVALID_PASSWORD' });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check account status
      const statusCheck = this.checkAccountStatus(user);
      if (!statusCheck.allowed) {
        SecurityLogger.logSecurityEvent('LOGIN_ATTEMPT_BLOCKED', { email, reason: statusCheck.reason });
        return {
          success: false,
          error: statusCheck.message,
          redirectTo: statusCheck.redirectTo
        };
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLogins(user.id);

      // Generate JWT token
      const tokenExpiry = rememberMe ? '7d' : '1h';
      const token = await signJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate?.toISOString() || null
      }, tokenExpiry);

      // Log successful login
      SecurityLogger.logSecurityEvent('LOGIN_SUCCESS', { email, userId: user.id });

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          tenantId: user.tenantId,
          trialEndDate: user.trialEndDate
        },
        token
      };

    } catch (error) {
      console.error('[AUTH] Critical error in login:', error);
      console.error('[AUTH] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
        name: error instanceof Error ? error.name : 'Unknown'
      });

      SecurityLogger.logSecurityEvent('LOGIN_ERROR', { email, error: error instanceof Error ? error.message : 'Unknown' }, 'error');
      return { success: false, error: 'Authentication service error' };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string) {
    try {
      return await verifyJWT(token);
    } catch (error) {
      SecurityLogger.logSecurityEvent('TOKEN_VERIFICATION_FAILED', { error: error instanceof Error ? error.message : 'Unknown' }, 'warn');
      return null;
    }
  }

  /**
   * Check if account is locked
   */
  private async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true }
    });

    if (!user?.lockedUntil) return false;

    const now = new Date();
    if (user.lockedUntil > now) {
      return true;
    }

    // Unlock account if lockout period has expired
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0
      }
    });

    return false;
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true }
    });

    const attempts = (user?.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: attempts };

    // Lock account if max attempts reached
    if (attempts >= this.securityPolicy.maxFailedAttempts) {
      const lockoutEnd = new Date();
      lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.securityPolicy.lockoutDuration);
      updateData.lockedUntil = lockoutEnd;

      SecurityLogger.logSecurityEvent('ACCOUNT_LOCKED', { userId, attempts }, 'warn');
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLogins(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  /**
   * Check account status and restrictions
   */
  private checkAccountStatus(user: any): { allowed: boolean; reason?: string; message?: string; redirectTo?: string } {
    // Suspended account
    if (user.status === 'SUSPENDED') {
      return {
        allowed: false,
        reason: 'USER_SUSPENDED',
        message: 'Account has been suspended. Please contact administrator.',
        redirectTo: '/suspended'
      };
    }

    // Trial expired
    if (user.status === 'TRIAL_EXPIRED') {
      return {
        allowed: false,
        reason: 'TRIAL_EXPIRED',
        message: 'Trial period has expired. Please select a subscription plan.',
        redirectTo: '/subscription'
      };
    }

    // Check trial expiration for TENANT_ADMIN
    if (user.role === 'TENANT_ADMIN' && user.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);

      // Check for active subscription
      let hasActiveSubscription = false;
      try {
        const profile = JSON.parse(user.profile || '{}');
        hasActiveSubscription = profile.subscription && profile.subscription.activatedAt;
      } catch {
        // Profile parse error, no subscription
      }

      if (!hasActiveSubscription && trialEnd < now) {
        return {
          allowed: false,
          reason: 'TRIAL_EXPIRED',
          message: 'Demo period has expired. Please select a subscription plan.',
          redirectTo: '/subscription'
        };
      }
    }

    return { allowed: true };
  }

}

// Singleton instance
export const authService = new AuthService();