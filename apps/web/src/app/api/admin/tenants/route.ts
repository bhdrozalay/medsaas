import { NextResponse } from 'next/server'
import { prisma } from '@medsas/database'

type SubscriptionStatus = 'subscribed' | 'expired' | 'pending' | 'demo'
type PaymentStatus = 'success' | 'pending' | 'failed' | 'unknown'

interface ProfileShape {
  subscription?: Record<string, unknown> | null
  subscriptionDetails?: Record<string, unknown> | null
  tenantName?: string
  tenantSlug?: string
  tenantId?: string
  tenantStatus?: string
  organizationName?: string
  organization?: {
    id?: string
    name?: string
    slug?: string
  }
  companyName?: string
}

interface TenantUserPayload {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  approvalStatus: string
  createdAt: string
  trialStartDate: string | null
  trialEndDate: string | null
  extraTrialDays: number
  subscriptionStatus: SubscriptionStatus
  subscriptionDetails: Record<string, unknown> | null
  paymentStatus: PaymentStatus
  tenantName: string
}

interface TenantAccumulator {
  tenantId: string
  tenantName: string
  tenantSlug: string
  userCount: number
  activeUsers: number
  pendingUsers: number
  suspendedUsers: number
  demoUsers: number
  expiredTrialUsers: number
  subscribedUsers: number
  status: string
  plan: string
  firstCreated: string
  lastActivity: string
  users: TenantUserPayload[]
}

type RawUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  status: string
  role: string
  trialStartDate: Date | null
  trialEndDate: Date | null
  extraTrialDays: number
  createdAt: Date
  updatedAt: Date
  profile: string
  tenantId: string | null
}

const SUPER_ADMIN_EMAILS = new Set(['admin@medsas.com', 'super-admin@domain.com'])

const toIso = (value?: Date | null): string | null => (value ? value.toISOString() : null)

const slugify = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') {
    return 'bireysel-kullanici'
  }

  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  return normalized || 'bireysel-kullanici'
}

const parseProfile = (profile: string | null): ProfileShape => {
  if (!profile) {
    return {}
  }

  try {
    const parsed = JSON.parse(profile) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as ProfileShape
    }
  } catch (error) {
    console.warn('Failed to parse user profile JSON', error)
  }

  return {}
}

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value) return undefined
  if (typeof value === 'object') {
    return value as Record<string, unknown>
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      return undefined
    }
  }
  return undefined
}

const buildSubscriptionDetails = (
  user: RawUser,
  profile: ProfileShape
): Record<string, unknown> | null => {
  const profileDetails = profile.subscription ?? profile.subscriptionDetails
  if (profileDetails && typeof profileDetails === 'object') {
    return profileDetails as Record<string, unknown>
  }

  if (!user.trialEndDate && !user.trialStartDate) {
    return null
  }

  const trialStartIso = toIso(user.trialStartDate)
  const trialEndIso = toIso(user.trialEndDate)
  const trialDurationDays = (() => {
    if (!user.trialStartDate || !user.trialEndDate) {
      return null
    }

    const diffMs = user.trialEndDate.getTime() - user.trialStartDate.getTime()
    return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : null
  })()

  const isYearly = trialDurationDays !== null && trialDurationDays >= 300

  return {
    planId: isYearly ? 'legacy_yearly_plan' : 'legacy_monthly_plan',
    planName: isYearly ? 'Yıllık Plan' : 'Aylık Plan',
    planDisplayName: isYearly ? 'Yıllık Plan (365 gün)' : 'Aylık Plan (30 gün)',
    duration: isYearly ? 'yearly' : 'monthly',
    durationText: isYearly ? '365 gün' : '30 gün',
    price: isYearly ? 1490 : 149,
    activatedAt: trialStartIso,
    trialEndDate: trialEndIso,
    extraTrialDays: user.extraTrialDays ?? 0
  }
}

const deriveSubscriptionStatus = (
  user: RawUser,
  subscriptionDetails: Record<string, unknown> | null
): SubscriptionStatus => {
  const normalizedStatus = user.status?.toUpperCase?.() ?? user.status
  if (
    normalizedStatus === 'PENDING_APPROVAL' ||
    normalizedStatus === 'PENDING_VERIFICATION'
  ) {
    return 'pending'
  }

  if (normalizedStatus === 'TRIAL_EXPIRED') {
    return 'expired'
  }

  const now = Date.now()
  const trialEnd = user.trialEndDate?.getTime()

  if (trialEnd && trialEnd < now) {
    return 'expired'
  }

  if (subscriptionDetails) {
    return 'subscribed'
  }

  if (normalizedStatus === 'ACTIVE') {
    return 'subscribed'
  }

  return 'demo'
}

const extractPlanLabel = (
  details: Record<string, unknown> | null
): string => {
  if (details && typeof details === 'object') {
    const displayName = details['planDisplayName']
    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      return displayName
    }

    const planName = details['planName']
    if (typeof planName === 'string' && planName.trim().length > 0) {
      return planName
    }
  }

  return 'STANDARD'
}

const getTenantNameFromProfile = (profile: ProfileShape): string | null => {
  const organizationRecord = asRecord(profile.organization)
  const subscriptionRecord = asRecord(profile.subscription)
  const subscriptionDetailsRecord = asRecord(profile.subscriptionDetails)
  const metadataRecord = asRecord(subscriptionRecord?.['metadata'])
  const subscriptionOrgRecord = asRecord(subscriptionRecord?.['organization'])

  const candidates: Array<unknown> = [
    profile.tenantName,
    profile.organizationName,
    profile.companyName,
    organizationRecord?.['name'],
    organizationRecord?.['organizationName'],
    subscriptionRecord?.['tenantName'],
    subscriptionRecord?.['organizationName'],
    subscriptionRecord?.['companyName'],
    subscriptionDetailsRecord?.['organizationName'],
    subscriptionDetailsRecord?.['companyName'],
    subscriptionOrgRecord?.['name'],
    metadataRecord?.['organizationName'],
    metadataRecord?.['companyName']
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  try {
    const serialized = JSON.stringify(profile)
    const regex = /"(tenantName|organizationName|companyName)"\s*:\s*"([^"]+)"/i
    const match = serialized.match(regex)
    if (match && match[2]) {
      const name = match[2].trim()
      if (name.length > 0 && name.toLowerCase() !== 'bireysel kullanıcı') {
        return name
      }
    }
  } catch {
    // ignore serialization issues
  }

  return null
}

const getTenantSlugFromProfile = (profile: ProfileShape): string | null => {
  const organizationRecord = asRecord(profile.organization)
  const subscriptionRecord = asRecord(profile.subscription)
  const subscriptionDetailsRecord = asRecord(profile.subscriptionDetails)

  const candidates: Array<unknown> = [
    profile.tenantSlug,
    organizationRecord?.['slug'],
    organizationRecord?.['tenantSlug'],
    subscriptionRecord?.['tenantSlug'],
    subscriptionRecord?.['slug'],
    subscriptionDetailsRecord?.['slug']
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  try {
    const serialized = JSON.stringify(profile)
    const regex = /"(tenantSlug|slug)"\s*:\s*"([^"]+)"/i
    const match = serialized.match(regex)
    if (match && match[2]) {
      const slug = match[2].trim()
      if (slug.length > 0) {
        return slug
      }
    }
  } catch {
    // ignore serialization issues
  }

  return null
}

const readStatusField = (source: unknown): string | null => {
  if (!source || typeof source !== 'object') {
    return null
  }

  const record = source as Record<string, unknown>
  const candidates = [
    'paymentStatus',
    'payment_status',
    'status',
    'state',
    'paymentState',
    'payment_state',
    'subscriptionStatus'
  ]

  for (const key of candidates) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return null
}

const extractRawPaymentStatus = (
  profile: ProfileShape,
  details: Record<string, unknown> | null
): string | null => {
  const fromDetails = readStatusField(details)
  if (fromDetails) {
    return fromDetails
  }

  const profileRecord = profile as unknown as Record<string, unknown>
  const potentialSources = [
    profileRecord.subscription,
    profileRecord.subscriptionDetails,
    profileRecord.payment,
    profileRecord.billing,
    profileRecord.invoice
  ]

  for (const source of potentialSources) {
    const status = readStatusField(source)
    if (status) {
      return status
    }
  }

  return readStatusField(profileRecord)
}

const normalizePaymentStatus = (
  subscriptionStatus: SubscriptionStatus,
  rawStatus: string | null,
  userStatus: string
): PaymentStatus => {
  const normalizedRaw = rawStatus?.trim().toLowerCase() ?? ''

  if (
    [
      'success',
      'succeeded',
      'paid',
      'paid_out',
      'complete',
      'completed',
      'active'
    ].includes(normalizedRaw)
  ) {
    return 'success'
  }

  if (
    [
      'pending',
      'awaiting_payment',
      'processing',
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'incomplete',
      'trialing'
    ].includes(normalizedRaw)
  ) {
    return 'pending'
  }

  if (
    [
      'failed',
      'declined',
      'canceled',
      'cancelled',
      'past_due',
      'unpaid',
      'overdue',
      'error'
    ].includes(normalizedRaw)
  ) {
    return 'failed'
  }

  if (subscriptionStatus === 'subscribed') {
    return 'success'
  }

  if (subscriptionStatus === 'pending') {
    return 'pending'
  }

  if (subscriptionStatus === 'expired' || userStatus === 'TRIAL_EXPIRED') {
    return 'failed'
  }

  return 'unknown'
}

const upsertTenant = (
  tenants: Map<string, TenantAccumulator>,
  tenantId: string,
  tenantName: string,
  tenantSlug: string,
  status: string,
  plan: string
): TenantAccumulator => {
  const existing = tenants.get(tenantId)
  if (existing) {
    if (!existing.plan || existing.plan === 'STANDARD') {
      existing.plan = plan
    }
    return existing
  }

  const nowIso = new Date().toISOString()
  const accumulator: TenantAccumulator = {
    tenantId,
    tenantName,
    tenantSlug,
    userCount: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    demoUsers: 0,
    expiredTrialUsers: 0,
    subscribedUsers: 0,
    status,
    plan,
    firstCreated: nowIso,
    lastActivity: nowIso,
    users: []
  }

  tenants.set(tenantId, accumulator)
  return accumulator
}

export async function GET() {
  try {
    const rawUsers: RawUser[] = await prisma.user.findMany({
      where: {
        role: { not: 'SUPER_ADMIN' },
        email: { notIn: Array.from(SUPER_ADMIN_EMAILS) }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        role: true,
        trialStartDate: true,
        trialEndDate: true,
        extraTrialDays: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        tenantId: true
      }
    })

    if (rawUsers.length === 0) {
      return NextResponse.json({ tenants: [], totalTenants: 0, totalUsers: 0 })
    }

    const tenants = new Map<string, TenantAccumulator>()
    const expiredUserIds = new Set<string>()
    const expiredTenantIds = new Set<string>()
    const now = new Date()

    for (const user of rawUsers) {
      const profile = parseProfile(user.profile)
      const subscriptionDetails = buildSubscriptionDetails(user, profile)
      const subscriptionStatus = deriveSubscriptionStatus(user, subscriptionDetails)

      const tenantId = (
        profile.organization?.id ||
        profile.tenantId ||
        user.tenantId ||
        'individual-' + user.id
      ) as string

      const tenantName =
        getTenantNameFromProfile(profile) || 'Bireysel Kullanıcı'

      const tenantSlug =
        getTenantSlugFromProfile(profile) || slugify(tenantName)

      const tenantStatus =
        typeof profile.tenantStatus === 'string'
          ? profile.tenantStatus
          : 'ACTIVE'

      const tenantPlan = extractPlanLabel(subscriptionDetails)

      const tenantRecord = upsertTenant(
        tenants,
        tenantId,
        tenantName,
        tenantSlug,
        tenantStatus,
        tenantPlan
      )

      const rawPaymentStatus = extractRawPaymentStatus(
        profile,
        subscriptionDetails
      )
      const paymentStatus = normalizePaymentStatus(
        subscriptionStatus,
        rawPaymentStatus,
        user.status
      )

      if (subscriptionDetails && typeof subscriptionDetails === 'object') {
        ;(subscriptionDetails as Record<string, unknown>).paymentStatus = paymentStatus
      }

      const tenantAlreadyExpired =
        tenantRecord.status === 'SUSPENDED' ||
        (user.tenantId ? expiredTenantIds.has(user.tenantId) : false)

      const hasRealTenantName =
        tenantName && tenantName.trim().length > 0 && tenantName !== 'Bireysel Kullanıcı'

      if (hasRealTenantName && tenantRecord.tenantName === 'Bireysel Kullanıcı') {
        tenantRecord.tenantName = tenantName
      }

      if (
        tenantRecord.tenantSlug === 'bireysel-kullanici' &&
        tenantSlug &&
        tenantSlug !== 'bireysel-kullanici'
      ) {
        tenantRecord.tenantSlug = tenantSlug
      }

      if (tenantRecord.status === 'ACTIVE' && tenantStatus && tenantStatus !== 'ACTIVE') {
        tenantRecord.status = tenantStatus
      }

      let approvalStatus = user.status
      const isExpired =
        subscriptionStatus === 'expired' ||
        tenantAlreadyExpired ||
        approvalStatus === 'TRIAL_EXPIRED' ||
        paymentStatus === 'failed'

      if (isExpired && approvalStatus !== 'TRIAL_EXPIRED') {
        approvalStatus = 'TRIAL_EXPIRED'
        expiredUserIds.add(user.id)
      }

      if (isExpired) {
        if (user.tenantId) {
          expiredTenantIds.add(user.tenantId)
        }
        tenantRecord.status = 'SUSPENDED'

        if (tenantRecord.users.length > 0) {
          for (const existingUser of tenantRecord.users) {
            if (existingUser.approvalStatus !== 'TRIAL_EXPIRED') {
              existingUser.approvalStatus = 'TRIAL_EXPIRED'
              existingUser.subscriptionStatus = 'expired'
              existingUser.paymentStatus = 'failed'
              expiredUserIds.add(existingUser.id)
            }
          }
        }
      }

      const createdIso = toIso(user.createdAt) ?? new Date().toISOString()
      const lastActivitySource = user.updatedAt ?? user.createdAt
      const lastActivityIso = toIso(lastActivitySource) ?? createdIso

      if (!tenantRecord.firstCreated || tenantRecord.firstCreated > createdIso) {
        tenantRecord.firstCreated = createdIso
      }
      if (!tenantRecord.lastActivity || tenantRecord.lastActivity < lastActivityIso) {
        tenantRecord.lastActivity = lastActivityIso
      }

      tenantRecord.users.push({
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        approvalStatus,
        createdAt: createdIso,
        trialStartDate: toIso(user.trialStartDate),
        trialEndDate: toIso(user.trialEndDate),
        extraTrialDays: user.extraTrialDays ?? 0,
        subscriptionStatus: isExpired ? 'expired' : subscriptionStatus,
        subscriptionDetails,
        paymentStatus: isExpired ? 'failed' : paymentStatus,
        tenantName
      })
    }

    for (const tenantRecord of tenants.values()) {
      tenantRecord.userCount = tenantRecord.users.length
      tenantRecord.activeUsers = tenantRecord.users.filter(
        (user) => user.approvalStatus === 'ACTIVE'
      ).length
      tenantRecord.pendingUsers = tenantRecord.users.filter((user) =>
        user.approvalStatus === 'PENDING_APPROVAL' ||
        user.approvalStatus === 'PENDING_VERIFICATION'
      ).length
      tenantRecord.suspendedUsers = tenantRecord.users.filter(
        (user) => user.approvalStatus === 'SUSPENDED'
      ).length

      const expiredUsers = tenantRecord.users.filter(
        (user) =>
          user.paymentStatus === 'failed' ||
          user.subscriptionStatus === 'expired' ||
          user.approvalStatus === 'TRIAL_EXPIRED'
      )

      tenantRecord.expiredTrialUsers = expiredUsers.length
      tenantRecord.demoUsers = tenantRecord.users.filter(
        (user) =>
          user.subscriptionStatus === 'demo' &&
          user.approvalStatus !== 'TRIAL_EXPIRED' &&
          user.paymentStatus !== 'success'
      ).length
      tenantRecord.subscribedUsers = tenantRecord.users.filter(
        (user) =>
          user.paymentStatus === 'success' &&
          user.approvalStatus !== 'TRIAL_EXPIRED'
      ).length

      if (expiredUsers.length > 0) {
        tenantRecord.status = 'SUSPENDED'
      }
    }

    if (expiredUserIds.size > 0) {
      try {
        await prisma.user.updateMany({
          where: {
            id: { in: Array.from(expiredUserIds) },
            status: { not: 'TRIAL_EXPIRED' }
          },
          data: {
            status: 'TRIAL_EXPIRED',
            updatedAt: now
          }
        })
      } catch (error) {
        console.error('Failed to update expired users', error)
      }
    }

    if (expiredTenantIds.size > 0) {
      const tenantIdList = Array.from(expiredTenantIds)
      try {
        await prisma.tenant.updateMany({
          where: { id: { in: tenantIdList } },
          data: {
            status: 'SUSPENDED',
            updatedAt: now
          }
        })
      } catch (error) {
        console.error('Failed to suspend tenants for expired subscriptions', error)
      }

      try {
        await prisma.user.updateMany({
          where: {
            tenantId: { in: tenantIdList },
            status: { in: ['ACTIVE', 'PENDING_APPROVAL', 'PENDING_VERIFICATION'] }
          },
          data: {
            status: 'TRIAL_EXPIRED',
            updatedAt: now
          }
        })
      } catch (error) {
        console.error('Failed to expire tenant users', error)
      }
    }

    const tenantsList = Array.from(tenants.values()).sort(
      (a, b) => b.userCount - a.userCount
    )

    return NextResponse.json({
      tenants: tenantsList,
      totalTenants: tenantsList.length,
      totalUsers: rawUsers.length
    })
  } catch (error) {
    console.error('Tenants API error', error)
    return NextResponse.json(
      { error: 'Tenant verileri alınamadı' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
