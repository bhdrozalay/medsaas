import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-edge';
import { hasModuleAccess, MODULE_CODES, ModuleCode } from '@/lib/modules';
import { authService } from '@/lib/auth-service';

// Route-Module mapping
const ROUTE_MODULE_MAP: Record<string, ModuleCode> = {
  // Muhasebe modül rotaları
  '/tenant-admin/accounting': MODULE_CODES.ACCOUNTING_BASIC,
  '/api/accounting': MODULE_CODES.ACCOUNTING_BASIC,
  '/tenant-admin/accounting/current-accounts': MODULE_CODES.ACCOUNTING_CURRENT_ACCOUNTS,
  '/api/accounting/current-accounts': MODULE_CODES.ACCOUNTING_CURRENT_ACCOUNTS,
  '/tenant-admin/accounting/advanced': MODULE_CODES.ACCOUNTING_ADVANCED,
  '/api/accounting/advanced': MODULE_CODES.ACCOUNTING_ADVANCED,

  // İhale modül rotaları
  '/tenant-admin/tenders': MODULE_CODES.TENDER_BASIC,
  '/api/tenders': MODULE_CODES.TENDER_BASIC,
  '/tenant-admin/tenders/analysis': MODULE_CODES.TENDER_ANALYSIS,
  '/api/tenders/analysis': MODULE_CODES.TENDER_ANALYSIS,

  // Satış modül rotaları
  '/tenant-admin/sales/crm': MODULE_CODES.SALES_CRM,
  '/api/sales/crm': MODULE_CODES.SALES_CRM,
  '/tenant-admin/sales/field': MODULE_CODES.SALES_FIELD,
  '/api/sales/field': MODULE_CODES.SALES_FIELD,
};

// Genel modül kategorisi mapping (daha esnek)
const ROUTE_CATEGORY_MAP: Record<string, ModuleCode> = {
  '/tenant-admin/accounting': MODULE_CODES.ACCOUNTING_BASIC,
  '/tenant-admin/tenders': MODULE_CODES.TENDER_BASIC,
  '/tenant-admin/sales': MODULE_CODES.SALES_CRM,
};

/**
 * Modül erişim kontrolü middleware
 */
export async function moduleAccessMiddleware(
  request: NextRequest,
  moduleCode?: ModuleCode
): Promise<NextResponse | null> {
  try {
    const { pathname } = request.nextUrl;

    // Determine required module
    let requiredModule = moduleCode;

    if (!requiredModule) {
      // Exact match önce
      requiredModule = ROUTE_MODULE_MAP[pathname];

      // Eğer exact match yoksa, path based check
      if (!requiredModule) {
        for (const [routePattern, module] of Object.entries(ROUTE_CATEGORY_MAP)) {
          if (pathname.startsWith(routePattern)) {
            requiredModule = module;
            break;
          }
        }
      }
    }

    // Eğer modül gereksinimi yoksa geç
    if (!requiredModule) {
      return null; // Continue to next middleware/handler
    }

    // Core modüller her zaman erişilebilir
    if (requiredModule.startsWith('CORE_')) {
      return null;
    }

    // Auth token kontrolü
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return redirectToLogin(request);
    }

    // JWT verify using secure auth service
    const payload = await authService.verifyToken(token);
    if (!payload || !payload.tenantId) {
      return redirectToLogin(request);
    }

    // Modül erişim kontrolü
    const hasAccess = await hasModuleAccess(payload.tenantId, requiredModule);

    if (!hasAccess) {
      return redirectToUpgrade(request, requiredModule);
    }

    // Access granted, continue
    return null;
  } catch (error) {
    console.error('Module access middleware error:', error);
    return redirectToLogin(request);
  }
}

/**
 * Login sayfasına yönlendir
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Upgrade sayfasına yönlendir
 */
function redirectToUpgrade(request: NextRequest, moduleCode: ModuleCode): NextResponse {
  const upgradeUrl = new URL('/tenant-admin/modules/upgrade', request.url);
  upgradeUrl.searchParams.set('module', moduleCode);
  upgradeUrl.searchParams.set('redirect', request.nextUrl.pathname);

  // API request ise JSON response döndür
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: 'MODULE_ACCESS_DENIED',
        message: 'Bu özellik için modül aboneliği gerekiyor',
        moduleCode,
        upgradeUrl: upgradeUrl.toString()
      },
      { status: 403 }
    );
  }

  return NextResponse.redirect(upgradeUrl);
}

/**
 * Component/Page level modül kontrolü için hook
 */
export function useModuleAccess(moduleCode: ModuleCode) {
  // Bu client-side hook olacak, şimdilik sadece type tanımı
  return {
    hasAccess: true, // Placeholder
    loading: false,
    error: null
  };
}

/**
 * Server component için modül kontrolü
 */
export async function checkModuleAccess(
  tenantId: string,
  moduleCode: ModuleCode
): Promise<{
  hasAccess: boolean;
  redirectUrl?: string;
}> {
  try {
    const hasAccess = await hasModuleAccess(tenantId, moduleCode);

    if (!hasAccess) {
      return {
        hasAccess: false,
        redirectUrl: `/tenant-admin/modules/upgrade?module=${moduleCode}`
      };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Module access check error:', error);
    return {
      hasAccess: false,
      redirectUrl: '/auth/login'
    };
  }
}

/**
 * Modül gereksinimi decorator (API routes için)
 */
export function requireModule(moduleCode: ModuleCode) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0] as NextRequest;

      // Modül kontrolü yap
      const middlewareResponse = await moduleAccessMiddleware(request, moduleCode);
      if (middlewareResponse) {
        return middlewareResponse;
      }

      // Orijinal method'u çalıştır
      return method.apply(this, args);
    };

    return descriptor;
  };
}