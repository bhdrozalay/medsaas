import { z } from 'zod';
import { BaseEntity } from './common';

// Tenant status
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
}

// Subscription plans
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

// Tenant interface
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  settings: TenantSettings;
  billing: TenantBilling;
  limits: TenantLimits;
}

// Tenant settings
export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
  };
  features: {
    [key: string]: boolean;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number;
    mfaRequired: boolean;
    ipWhitelist?: string[];
  };
}

// Tenant billing
export interface TenantBilling {
  customerId?: string;
  subscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

// Tenant limits
export interface TenantLimits {
  users: number;
  storage: number; // in GB
  apiCalls: number; // per month
  features: string[];
}

// Validation schemas
export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  plan: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.FREE),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  plan: z.nativeEnum(SubscriptionPlan).optional(),
  settings: z.object({
    branding: z.object({
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      customDomain: z.string().optional(),
    }).optional(),
    features: z.record(z.boolean()).optional(),
    security: z.object({
      passwordPolicy: z.object({
        minLength: z.number().min(6).max(32),
        requireUppercase: z.boolean(),
        requireLowercase: z.boolean(),
        requireNumbers: z.boolean(),
        requireSymbols: z.boolean(),
      }).optional(),
      sessionTimeout: z.number().min(300).max(86400).optional(),
      mfaRequired: z.boolean().optional(),
      ipWhitelist: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

// Types from schemas
export type CreateTenantRequest = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantRequest = z.infer<typeof UpdateTenantSchema>;