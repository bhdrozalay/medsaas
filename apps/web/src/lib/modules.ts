import { prisma } from '@medsas/database';

// Sistem modül kodları
export const MODULE_CODES = {
  // Core modüller (zorunlu)
  CORE_DASHBOARD: 'CORE_DASHBOARD',
  CORE_USERS: 'CORE_USERS',

  // Muhasebe modülleri
  ACCOUNTING_BASIC: 'ACCOUNTING_BASIC',
  ACCOUNTING_CURRENT_ACCOUNTS: 'ACCOUNTING_CURRENT_ACCOUNTS',
  ACCOUNTING_ADVANCED: 'ACCOUNTING_ADVANCED',

  // İhale modülleri
  TENDER_BASIC: 'TENDER_BASIC',
  TENDER_ANALYSIS: 'TENDER_ANALYSIS',

  // Satış modülleri
  SALES_CRM: 'SALES_CRM',
  SALES_FIELD: 'SALES_FIELD',
} as const;

export type ModuleCode = typeof MODULE_CODES[keyof typeof MODULE_CODES];

// Paket kodları
export const PACKAGE_CODES = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type PackageCode = typeof PACKAGE_CODES[keyof typeof PACKAGE_CODES];

// Modül kategorileri
export const MODULE_CATEGORIES = {
  CORE: 'core',
  ACCOUNTING: 'accounting',
  TENDER: 'tender',
  SALES: 'sales',
} as const;

// Modül durumları
export const MODULE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL',
} as const;

// Tenant'ın aktif modüllerini getir
export async function getTenantActiveModules(tenantId: string): Promise<string[]> {
  try {
    const tenantModules = await prisma.tenantModule.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        module: {
          select: {
            code: true,
            isCore: true,
          }
        }
      }
    });

    // Core modüller her zaman aktif
    const coreModules = Object.values(MODULE_CODES).filter(code =>
      code.startsWith('CORE_')
    );

    const activeModuleCodes = tenantModules.map(tm => tm.module.code);

    return [...new Set([...coreModules, ...activeModuleCodes])];
  } catch (error) {
    console.error('Error fetching tenant modules:', error);
    // Hata durumunda sadece core modülleri döndür
    return Object.values(MODULE_CODES).filter(code => code.startsWith('CORE_'));
  }
}

// Tenant'ın paket modüllerini getir
export async function getTenantPackageModules(tenantId: string): Promise<string[]> {
  try {
    const tenantPackages = await prisma.tenantPackage.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        package: {
          include: {
            packageModules: {
              where: {
                isIncluded: true
              },
              include: {
                module: {
                  select: {
                    code: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const packageModuleCodes: string[] = [];

    for (const tenantPackage of tenantPackages) {
      for (const packageModule of tenantPackage.package.packageModules) {
        packageModuleCodes.push(packageModule.module.code);
      }
    }

    return [...new Set(packageModuleCodes)];
  } catch (error) {
    console.error('Error fetching tenant package modules:', error);
    return [];
  }
}

// Tenant'ın tüm erişilebilir modüllerini getir (paket + ala carte)
export async function getTenantAllModules(tenantId: string): Promise<string[]> {
  const [activeModules, packageModules] = await Promise.all([
    getTenantActiveModules(tenantId),
    getTenantPackageModules(tenantId)
  ]);

  return [...new Set([...activeModules, ...packageModules])];
}

// Modül erişim kontrolü
export async function hasModuleAccess(
  tenantId: string,
  moduleCode: ModuleCode
): Promise<boolean> {
  try {
    // Core modüller her zaman erişilebilir
    if (moduleCode.startsWith('CORE_')) {
      return true;
    }

    const tenantModules = await getTenantAllModules(tenantId);
    return tenantModules.includes(moduleCode);
  } catch (error) {
    console.error('Error checking module access:', error);
    // Hata durumunda sadece core modüllere erişim ver
    return moduleCode.startsWith('CORE_');
  }
}

// Modül kullanım istatistiklerini güncelle
export async function updateModuleUsage(
  tenantId: string,
  moduleCode: ModuleCode,
  action: string = 'page_view'
): Promise<void> {
  try {
    // Core modüller için istatistik tutma
    if (moduleCode.startsWith('CORE_')) {
      return;
    }

    await prisma.tenantModule.updateMany({
      where: {
        tenantId,
        module: {
          code: moduleCode
        }
      },
      data: {
        lastUsedAt: new Date(),
        // usageStats JSON güncellenmesi daha karmaşık, şimdilik sadece lastUsedAt
      }
    });
  } catch (error) {
    console.error('Error updating module usage:', error);
    // Usage tracking hatası kritik değil, sessizce devam et
  }
}

// Modül bilgilerini getir
export async function getModuleInfo(moduleCode: ModuleCode) {
  try {
    return await prisma.module.findUnique({
      where: { code: moduleCode }
    });
  } catch (error) {
    console.error('Error fetching module info:', error);
    return null;
  }
}

// Tenant için modül mağazası (satın alınabilir modüller)
export async function getAvailableModulesForTenant(tenantId: string) {
  try {
    const [allModules, tenantModules] = await Promise.all([
      prisma.module.findMany({
        where: {
          isActive: true,
          isCore: false // Core modüller zaten dahil
        },
        orderBy: [
          { category: 'asc' },
          { sortOrder: 'asc' }
        ]
      }),
      getTenantAllModules(tenantId)
    ]);

    // Tenant'ın sahip olmadığı modülleri filtrele
    const availableModules = allModules.filter(module =>
      !tenantModules.includes(module.code)
    );

    return availableModules;
  } catch (error) {
    console.error('Error fetching available modules:', error);
    return [];
  }
}

// Modül aktivasyon
export async function activateModuleForTenant(
  tenantId: string,
  moduleCode: ModuleCode,
  options: {
    isTrialModule?: boolean;
    trialDays?: number;
    autoRenew?: boolean;
    paymentDetails?: object;
  } = {}
): Promise<boolean> {
  try {
    const module = await getModuleInfo(moduleCode);
    if (!module) {
      throw new Error('Module not found');
    }

    // Mevcut abonelik var mı kontrol et
    const existingSubscription = await prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId: module.id
        }
      }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      // Zaten aktif
      return true;
    }

    const now = new Date();
    let expiresAt: Date | null = null;

    if (options.isTrialModule && options.trialDays) {
      expiresAt = new Date(now.getTime() + (options.trialDays * 24 * 60 * 60 * 1000));
    } else if (module.billingType === 'monthly') {
      expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    if (existingSubscription) {
      // Mevcut aboneliği reaktive et
      await prisma.tenantModule.update({
        where: { id: existingSubscription.id },
        data: {
          status: options.isTrialModule ? 'TRIAL' : 'ACTIVE',
          activatedAt: now,
          expiresAt,
          autoRenew: options.autoRenew ?? true,
          isTrialModule: options.isTrialModule ?? false,
          trialDays: options.trialDays ?? 0,
          paymentStatus: options.isTrialModule ? 'PAID' : 'PENDING',
          paymentDetails: JSON.stringify(options.paymentDetails || {}),
          monthlyAmount: module.price,
          lastUsedAt: now,
        }
      });
    } else {
      // Yeni abonelik oluştur
      await prisma.tenantModule.create({
        data: {
          tenantId,
          moduleId: module.id,
          status: options.isTrialModule ? 'TRIAL' : 'ACTIVE',
          activatedAt: now,
          expiresAt,
          autoRenew: options.autoRenew ?? true,
          isTrialModule: options.isTrialModule ?? false,
          trialDays: options.trialDays ?? 0,
          paymentStatus: options.isTrialModule ? 'PAID' : 'PENDING',
          paymentDetails: JSON.stringify(options.paymentDetails || {}),
          monthlyAmount: module.price,
          lastUsedAt: now,
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error activating module:', error);
    return false;
  }
}

// Modül deaktivasyonu
export async function deactivateModuleForTenant(
  tenantId: string,
  moduleCode: ModuleCode
): Promise<boolean> {
  try {
    const module = await getModuleInfo(moduleCode);
    if (!module) {
      return false;
    }

    await prisma.tenantModule.updateMany({
      where: {
        tenantId,
        moduleId: module.id
      },
      data: {
        status: 'CANCELLED',
        autoRenew: false
      }
    });

    return true;
  } catch (error) {
    console.error('Error deactivating module:', error);
    return false;
  }
}