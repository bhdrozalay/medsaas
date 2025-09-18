import { z } from 'zod';
import { BaseEntity, EmailSchema, PasswordSchema } from './common';

// User roles enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER',
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

// JWT payload
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Login/Register schemas
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
  tenantId: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  tenantId: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: PasswordSchema,
});

// Types from schemas
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

// Auth responses
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId?: string;
  };
  tokens: AuthTokens;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId?: string;
    permissions: Permission[];
  };
}