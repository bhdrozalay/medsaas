import { z } from 'zod';

// Re-export common validators from types package
export * from '@medsas/types';

// Database-specific validators

// User validators
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_USER']),
  tenantId: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
  preferences: z.record(z.any()).optional(),
  profile: z.record(z.any()).optional(),
});

// Tenant validators
export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  settings: z.record(z.any()).optional(),
  limits: z.record(z.any()).optional(),
});

// Subscription validators
export const CreateSubscriptionSchema = z.object({
  tenantId: z.string(),
  plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  trialEnd: z.date().optional(),
});

// Invoice validators
export const CreateInvoiceSchema = z.object({
  tenantId: z.string(),
  subscriptionId: z.string().optional(),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.string().default('USD'),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    amount: z.number().min(0),
  })),
});

// Notification validators
export const CreateNotificationSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP']),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  metadata: z.record(z.any()).default({}),
  scheduledAt: z.date().optional(),
});

// Report validators
export const CreateReportSchema = z.object({
  tenantId: z.string().optional(),
  createdById: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  query: z.record(z.any()),
  parameters: z.record(z.any()).default({}),
  schedule: z.record(z.any()).optional(),
});

// API Key validators
export const CreateApiKeySchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.date().optional(),
});

// File upload validators
export const CreateFileSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().min(0),
  path: z.string().min(1),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).default({}),
});

// Audit log validators
export const CreateAuditLogSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT']),
  resource: z.enum(['USER', 'TENANT', 'SUBSCRIPTION', 'INVOICE', 'NOTIFICATION', 'REPORT']),
  resourceId: z.string().optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  metadata: z.record(z.any()).default({}),
});

// Pagination validators
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search validators
export const SearchSchema = z.object({
  q: z.string().min(1).max(255),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).default({}),
}).merge(PaginationSchema);

// Database query helpers
export const IdParamSchema = z.object({
  id: z.string().cuid(),
});

export const SlugParamSchema = z.object({
  slug: z.string().min(1).max(50),
});

// Type inference
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type CreateFileInput = z.infer<typeof CreateFileSchema>;
export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;