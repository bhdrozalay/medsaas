import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

// GET - Tüm modülleri listele
export async function GET(request: NextRequest) {
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';

    // Build where clause
    let where: any = {};

    if (category !== 'all') {
      where.category = category;
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const modules = await prisma.module.findMany({
      where,
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
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    // Calculate usage stats for each module
    const modulesWithStats = await Promise.all(
      modules.map(async (module) => {
        // Get total revenue from this module
        const revenueResult = await prisma.tenantModule.aggregate({
          where: {
            moduleId: module.id,
            paymentStatus: 'PAID'
          },
          _sum: {
            monthlyAmount: true
          }
        });

        // Get active subscriptions count
        const activeSubscriptions = await prisma.tenantModule.count({
          where: {
            moduleId: module.id,
            status: 'ACTIVE'
          }
        });

        // Get trial subscriptions count
        const trialSubscriptions = await prisma.tenantModule.count({
          where: {
            moduleId: module.id,
            status: 'TRIAL'
          }
        });

        return {
          ...module,
          stats: {
            totalRevenue: revenueResult._sum.monthlyAmount || 0,
            activeSubscriptions,
            trialSubscriptions,
            totalSubscriptions: activeSubscriptions + trialSubscriptions
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: modulesWithStats
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Modüller alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni modül oluştur
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
      code,
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

    // Validation
    if (!code || !name || !category) {
      return NextResponse.json(
        { error: 'Kod, isim ve kategori alanları zorunludur' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingModule = await prisma.module.findUnique({
      where: { code }
    });

    if (existingModule) {
      return NextResponse.json(
        { error: 'Bu kod ile bir modül zaten mevcut' },
        { status: 400 }
      );
    }

    const module = await prisma.module.create({
      data: {
        code,
        name,
        description: description || null,
        category,
        price: price || 0,
        billingType: billingType || 'monthly',
        isCore: isCore || false,
        isActive: isActive !== false, // default true
        sortOrder: sortOrder || 0,
        requirements: JSON.stringify(requirements || []),
        permissions: JSON.stringify(permissions || []),
        features: JSON.stringify(features || [])
      }
    });

    return NextResponse.json({
      success: true,
      data: module,
      message: 'Modül başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Modül oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}