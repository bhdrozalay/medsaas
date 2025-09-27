import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@medsas/database';

export async function GET(request: NextRequest) {
  try {
    // Kullanıcıları getir (SUPER_ADMIN'leri ve ödeme yapmış kullanıcıları hariç tut)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: {
              not: 'SUPER_ADMIN'
            }
          },
          {
            OR: [
              { status: { not: 'ACTIVE' } }, // Aktif olmayan kullanıcılar (PENDING_APPROVAL, REJECTED, vb.)
              {
                AND: [
                  { status: 'ACTIVE' },
                  { profile: { not: { contains: '"subscription"' } } } // Profile'da subscription bilgisi olmayan aktif kullanıcılar
                ]
              },
              {
                AND: [
                  { status: 'ACTIVE' },
                  { profile: { contains: '"isDemoTrial":true' } } // Demo trial kullanıcıları (onaylanmış ama ödeme yapmamış)
                ]
              }
            ]
          }
        ]
      },
      orderBy: [
        { role: 'desc' }, // TENANT_ADMIN'ler önce
        { createdAt: 'desc' }
      ]
    });

    // Sonuçları formatla
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantName: user.tenant?.name || 'Belirtilmemiş', // Tenant name'i al
      phone: user.phone,
      role: user.role,
      status: user.status,
      trialStartDate: user.trialStartDate?.toISOString(),
      trialEndDate: user.trialEndDate?.toISOString(),
      extraTrialDays: user.extraTrialDays || 0,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    // Helper function to check if trial is expired
    const isTrialExpired = (user: any) => {
      if (!user.trialEndDate) return false;
      const now = new Date();
      const endDate = new Date(user.trialEndDate);
      return now > endDate;
    };

    // İstatistikleri hesapla
    const stats = {
      total: users.length,
      pending: users.filter(u => u.status === 'PENDING_APPROVAL').length, // PENDING_APPROVAL için düzelt
      approved: users.filter(u => u.status === 'ACTIVE' && !isTrialExpired(u)).length,
      rejected: users.filter(u => u.status === 'REJECTED').length,
      active: users.filter(u => u.status === 'ACTIVE' && !isTrialExpired(u)).length,
      suspended: users.filter(u => u.status === 'SUSPENDED').length,
      expired: users.filter(u => u.status === 'TRIAL_EXPIRED' || (u.status === 'ACTIVE' && isTrialExpired(u))).length,
    };

    return NextResponse.json({
      users: formattedUsers,
      stats,
      message: 'Kullanıcılar başarıyla alındı'
    });

  } catch (error) {
    console.error('Kullanıcı listesi alınırken hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı listesi alınırken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}