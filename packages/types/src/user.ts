import { z } from 'zod';
import { BaseEntity, EmailSchema } from './common';
import { UserRole } from './auth';

// User status
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// User interface
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  tenantId?: string;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  preferences: UserPreferences;
  profile: UserProfile;
}

// User preferences
export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

// User profile
export interface UserProfile {
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

// Validation schemas
export const CreateUserSchema = z.object({
  email: EmailSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.nativeEnum(UserRole),
  tenantId: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
  profile: z.object({
    phone: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    bio: z.string().max(500).optional(),
    socialLinks: z.object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      github: z.string().url().optional(),
    }).optional(),
  }).optional(),
});

export const UpdateUserPreferencesSchema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  dashboard: z.object({
    layout: z.string().optional(),
    widgets: z.array(z.string()).optional(),
  }).optional(),
});

// Types from schemas
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type UpdateUserPreferencesRequest = z.infer<typeof UpdateUserPreferencesSchema>;