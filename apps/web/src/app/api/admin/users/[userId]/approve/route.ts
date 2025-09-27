import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@medsas/database';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID\'si gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        trialStartDate: true,
        trialEndDate: true,
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Trial süresini aktifleştir - varsa mevcut tarihleri kullan, yoksa yeni oluştur
    const trialStartDate = user.trialStartDate || new Date();
    const trialEndDate = user.trialEndDate || (() => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 günlük demo
      return endDate;
    })();

    // Profile içine DEMO abonelik bilgisini ekle (sadece demo takibi için)
    let profileData: any = {}
    try { profileData = JSON.parse(user.profile || '{}') } catch { profileData = {} }
    profileData.subscription = profileData.subscription || {
      planId: 'demo-trial',
      planName: 'DEMO_TRIAL',
      planDisplayName: 'Demo Deneme',
      price: 0,
      duration: 'trial',
      durationText: '30 Günlük Demo',
      activatedAt: new Date().toISOString(),
      isDemoTrial: true // Bu demo subscription'ı, gerçek ödeme değil!
    }

    // Kullanıcıyı onayla ve deneme süresini aktifleştir + aboneliği ekle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE', // Demo-Aktif durumuna geç
        trialStartDate,
        trialEndDate,
        profile: JSON.stringify(profileData),
        updatedAt: new Date()
      },
      include: {
        tenant: true
      }
    });

    // Calculate trial days left
    const now = new Date();
    const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      message: 'Kullanıcı başarıyla onaylandı ve demo süresi aktifleştirildi',
      user: updatedUser,
      trialDaysLeft: daysLeft
    });

  } catch (error) {
    console.error('Kullanıcı onaylama hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı onaylanırken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}