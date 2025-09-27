import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { PrismaClient } from '@medsas/database';

const prisma = new PrismaClient();

// GET - Tek modül detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const module = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        tenantModules: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          orderBy: { activatedAt: 'desc' }
        },
        packageModules: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Modül bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate detailed stats
    const stats = {
      totalSubscriptions: module.tenantModules.length,
      activeSubscriptions: module.tenantModules.filter(tm => tm.status === 'ACTIVE').length,
      trialSubscriptions: module.tenantModules.filter(tm => tm.status === 'TRIAL').length,
      expiredSubscriptions: module.tenantModules.filter(tm => tm.status === 'EXPIRED').length,
      totalRevenue: module.tenantModules
        .filter(tm => tm.paymentStatus === 'PAID')
        .reduce((sum, tm) => sum + Number(tm.monthlyAmount), 0),
      averageUsage: 0, // Could calculate from usageStats JSON
    };

    // Recent subscription activities
    const recentActivities = module.tenantModules
      .slice(0, 10)
      .map(tm => ({
        id: tm.id,
        tenant: tm.tenant,
        status: tm.status,
        activatedAt: tm.activatedAt,
        expiresAt: tm.expiresAt,
        monthlyAmount: tm.monthlyAmount,
        isTrialModule: tm.isTrialModule
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...module,
        stats,
        recentActivities,
        requirements: JSON.parse(module.requirements),
        permissions: JSON.parse(module.permissions),
        features: JSON.parse(module.features)
      }
    });

  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Modül detayları alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Modül güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      name,
      description,
      category,
      price,
      billingType,
      isCore,
      isActive,
      sortOrder,
      requirements,
      permissions,
      features
    } = body;

    // Check if module exists
    const existingModule = await prisma.module.findUnique({
      where: { id: params.id }
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Modül bulunamadı' },
        { status: 404 }
      );
    }

    // Validation
    if (!name || !category) {
      return NextResponse.json(
        { error: 'İsim ve kategori alanları zorunludur' },
        { status: 400 }
      );
    }

    const updatedModule = await prisma.module.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        category,
        price: price || 0,
        billingType: billingType || 'monthly',
        isCore: isCore || false,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
        requirements: JSON.stringify(requirements || []),
        permissions: JSON.stringify(permissions || []),
        features: JSON.stringify(features || [])
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedModule,
      message: 'Modül başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Modül güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Modül sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if module exists and has active subscriptions
    const module = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tenantModules: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Modül bulunamadı' },
        { status: 404 }
      );
    }

    // Core modüller silinemez
    if (module.isCore) {
      return NextResponse.json(
        { error: 'Core modüller silinemez' },
        { status: 400 }
      );
    }

    // Aktif abonelikleri olan modüller silinemez
    if (module._count.tenantModules > 0) {
      return NextResponse.json(
        { error: 'Bu modülün aktif abonelikleri bulunduğu için silinemez. Önce tüm abonelikleri iptal edin.' },
        { status: 400 }
      );
    }

    await prisma.module.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Modül başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Modül silinirken hata oluştu' },
      { status: 500 }
    );
  }
}