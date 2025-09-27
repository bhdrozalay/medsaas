import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { activateModuleForTenant, deactivateModuleForTenant } from '@/lib/modules';
import { prisma } from '@medsas/database';

// GET - Tenant'ları modüllerle birlikte getir
export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const token = request.cookies.get('access_token')?.value;
    console.log('Token exists:', !!token);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    try {
      const decoded = await verifyJWT(token);
      console.log('Decoded token:', { userId: decoded.userId, role: decoded.role, tenantId: decoded.tenantId });

      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json({
          error: 'Forbidden - Role is ' + decoded.role + ', need SUPER_ADMIN'
        }, { status: 403 });
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({
        error: 'Invalid token',
        details: jwtError instanceof Error ? jwtError.message : 'JWT error'
      }, { status: 401 });
    }

    // Tenant'ları modüllerle birlikte getir
    const tenants = await prisma.tenant.findMany({
      include: {
        tenantModules: {
          include: {
            module: true
          }
        },
        users: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response with active user count
    const formattedTenants = tenants.map(tenant => ({
      ...tenant,
      _count: {
        users: tenant.users.length
      },
      users: undefined // Remove full user data from response
    }));

    return NextResponse.json({
      success: true,
      data: formattedTenants
    });

  } catch (error) {
    console.error('Tenant-modules fetch error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });

    return NextResponse.json(
      {
        error: 'Tenant-modül bilgileri alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Tenant'a modül aktifleştir
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tenantId,
      moduleCode,
      isTrialModule,
      trialDays,
      autoRenew,
      notes
    } = body;

    // Validation
    if (!tenantId || !moduleCode) {
      return NextResponse.json(
        { error: 'Tenant ID ve modül kodu zorunludur' },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant bulunamadı' },
        { status: 404 }
      );
    }

    // Activate module
    const success = await activateModuleForTenant(tenantId, moduleCode as any, {
      isTrialModule: isTrialModule || false,
      trialDays: trialDays || 0,
      autoRenew: autoRenew !== false,
      paymentDetails: {
        activatedBy: 'SUPER_ADMIN',
        activatedByUserId: payload.userId,
        notes: notes || 'Super admin tarafından aktifleştirildi'
      }
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Modül aktifleştirilirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Modül başarıyla aktifleştirildi'
    });

  } catch (error) {
    console.error('Error activating tenant module:', error);
    return NextResponse.json(
      { error: 'Modül aktifleştirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Tenant modülünü deaktifleştir
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const moduleCode = searchParams.get('moduleCode');

    // Validation
    if (!tenantId || !moduleCode) {
      return NextResponse.json(
        { error: 'Tenant ID ve modül kodu zorunludur' },
        { status: 400 }
      );
    }

    // Deactivate module
    const success = await deactivateModuleForTenant(tenantId, moduleCode as any);

    if (!success) {
      return NextResponse.json(
        { error: 'Modül deaktifleştirilirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Modül başarıyla deaktifleştirildi'
    });

  } catch (error) {
    console.error('Error deactivating tenant module:', error);
    return NextResponse.json(
      { error: 'Modül deaktifleştirilirken hata oluştu' },
      { status: 500 }
    );
  }
}