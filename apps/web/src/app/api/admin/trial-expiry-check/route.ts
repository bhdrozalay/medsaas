import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // Deneme süresi bitmiş aktif kullanıcıları bul
    const expiredUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        trialEndDate: {
          lt: now
        }
      },
      include: {
        tenant: true
      }
    });

    let updatedUsersCount = 0;
    let updatedTenantsCount = 0;
    const results = [];

    for (const user of expiredUsers) {
      try {
        // Kullanıcıyı askıya al
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'TRIAL_EXPIRED',
            updatedAt: now
          }
        });

        // Tenant'ı askıya al
        if (user.tenantId) {
          await prisma.tenant.update({
            where: { id: user.tenantId },
            data: {
              status: 'SUSPENDED',
              updatedAt: now
            }
          });
          updatedTenantsCount++;

          // Alt kullanıcıları da askıya al
          const subUsersResult = await prisma.user.updateMany({
            where: {
              tenantId: user.tenantId,
              id: { not: user.id },
              status: 'ACTIVE'
            },
            data: {
              status: 'TRIAL_EXPIRED',
              updatedAt: now
            }
          });

          results.push({
            userId: user.id,
            email: user.email,
            tenantName: user.tenantName,
            trialEndDate: user.trialEndDate,
            subUsersAffected: subUsersResult.count
          });
        }

        updatedUsersCount++;

      } catch (error) {
        console.error(`Kullanıcı ${user.id} güncellenirken hata:`, error);
      }
    }

    // Logla
    console.log(`Deneme süresi kontrolü tamamlandı: ${updatedUsersCount} kullanıcı ve ${updatedTenantsCount} tenant askıya alındı`);

    return NextResponse.json({
      message: `Deneme süresi kontrolü tamamlandı`,
      expiredUsersCount: updatedUsersCount,
      expiredTenantsCount: updatedTenantsCount,
      checkDate: now,
      results
    });

  } catch (error) {
    console.error('Deneme süresi kontrolü hatası:', error);
    return NextResponse.json(
      { error: 'Deneme süresi kontrolü sırasında bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint'i de ekleyelim - manuel kontrol için
export async function GET() {
  try {
    const now = new Date();
    
    // Deneme süresi yakında bitecek kullanıcıları da dahil edelim (2 gün kala)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const expiredUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        trialEndDate: {
          lt: now
        }
      },
      select: {
        id: true,
        email: true,
        tenantName: true,
        trialEndDate: true,
        extraTrialDays: true
      }
    });

    const expiringSoon = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        trialEndDate: {
          gte: now,
          lt: twoDaysFromNow
        }
      },
      select: {
        id: true,
        email: true,
        tenantName: true,
        trialEndDate: true,
        extraTrialDays: true
      }
    });

    return NextResponse.json({
      currentTime: now,
      expiredUsers: expiredUsers.length,
      expiringSoonUsers: expiringSoon.length,
      expiredUsersList: expiredUsers,
      expiringSoonList: expiringSoon
    });

  } catch (error) {
    console.error('Deneme süresi raporu hatası:', error);
    return NextResponse.json(
      { error: 'Deneme süresi raporu alınırken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}