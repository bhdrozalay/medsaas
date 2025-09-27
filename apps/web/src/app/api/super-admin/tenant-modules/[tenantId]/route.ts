import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    // Auth kontrolü
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId } = params;
    const { modules } = await request.json();

    console.log('PUT Request - TenantId:', tenantId);
    console.log('PUT Request - Modules:', modules);

    // Tenant'ın varlığını kontrol et
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 });
    }

    // Mevcut modül atamalarını getir
    const existingAssignments = await prisma.tenantModule.findMany({
      where: { tenantId },
      include: { module: true }
    });

    console.log('Existing assignments:', existingAssignments.map(ea => ({
      moduleId: ea.moduleId,
      code: ea.module.code,
      status: ea.status
    })));

    // Yeni atamalar için işlemler
    const moduleUpdates = [];

    for (const [moduleId, isAssigned] of Object.entries(modules)) {
      const existingAssignment = existingAssignments.find(tm => tm.moduleId === moduleId);

      console.log(`Processing module ${moduleId}:`, {
        isAssigned,
        hasExisting: !!existingAssignment,
        currentStatus: existingAssignment?.status || 'N/A'
      });

      // Get module info for price
      const moduleInfo = await prisma.module.findUnique({
        where: { id: moduleId }
      });

      if (isAssigned && !existingAssignment) {
        // Yeni modül ataması - aktif olarak ekle
        console.log('Creating new assignment');
        moduleUpdates.push(
          prisma.tenantModule.create({
            data: {
              tenantId,
              moduleId,
              status: 'ACTIVE',
              activatedAt: new Date(),
              expiresAt: null, // Süresiz aktif
              autoRenew: true,
              monthlyAmount: moduleInfo?.price || 0,
              paymentStatus: 'PAID',
              isTrialModule: false,
              trialDays: 0
            }
          })
        );
      } else if (!isAssigned && existingAssignment && existingAssignment.status === 'ACTIVE') {
        // Mevcut aktif atamanın durumunu CANCELLED yap
        console.log('Cancelling active assignment');
        moduleUpdates.push(
          prisma.tenantModule.update({
            where: { id: existingAssignment.id },
            data: {
              status: 'CANCELLED',
              autoRenew: false
            }
          })
        );
      } else if (isAssigned && existingAssignment && (existingAssignment.status === 'CANCELLED' || existingAssignment.status === 'EXPIRED')) {
        // Cancelled/Expired modülü tekrar aktifleştir
        console.log('Reactivating cancelled/expired assignment');
        moduleUpdates.push(
          prisma.tenantModule.update({
            where: { id: existingAssignment.id },
            data: {
              status: 'ACTIVE',
              activatedAt: new Date(),
              autoRenew: true,
              paymentStatus: 'PAID',
              monthlyAmount: moduleInfo?.price || existingAssignment.monthlyAmount
            }
          })
        );
      }
    }

    // Transaction ile tüm güncellemeleri yap
    if (moduleUpdates.length > 0) {
      await prisma.$transaction(moduleUpdates);
    }

    return NextResponse.json({
      success: true,
      message: 'Modül atamaları başarıyla güncellendi',
      debug: {
        processedModules: Object.keys(modules).length,
        updatesExecuted: moduleUpdates.length
      }
    });

  } catch (error) {
    console.error('Tenant module assignment error:', error);
    return NextResponse.json(
      { error: 'Modül atamaları güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}