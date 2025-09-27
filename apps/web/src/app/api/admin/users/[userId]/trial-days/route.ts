import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { days, action } = body; // action: 'add' | 'subtract' | 'set'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID\'si gerekli' },
        { status: 400 }
      );
    }

    if (!days || !action) {
      return NextResponse.json(
        { error: 'Gün sayısı ve işlem tipi gerekli' },
        { status: 400 }
      );
    }

    // Mevcut kullanıcıyı al
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    let newTrialEndDate: Date;
    let extraTrialDays = user.extraTrialDays || 0;

    if (user.trialEndDate) {
      newTrialEndDate = new Date(user.trialEndDate);
      
      switch (action) {
        case 'add':
          newTrialEndDate.setDate(newTrialEndDate.getDate() + days);
          extraTrialDays += days;
          break;
        case 'subtract':
          newTrialEndDate.setDate(newTrialEndDate.getDate() - days);
          extraTrialDays -= days;
          break;
        case 'set':
          // Orijinal 15 günlük süreye göre yeni tarih belirle
          const originalEndDate = new Date(user.trialStartDate!);
          originalEndDate.setDate(originalEndDate.getDate() + 15);
          newTrialEndDate = new Date(originalEndDate);
          newTrialEndDate.setDate(newTrialEndDate.getDate() + days);
          extraTrialDays = days;
          break;
        default:
          return NextResponse.json(
            { error: 'Geçersiz işlem tipi' },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: 'Kullanıcının aktif bir deneme süresi yok' },
        { status: 400 }
      );
    }

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        trialEndDate: newTrialEndDate,
        extraTrialDays,
        updatedAt: new Date()
      }
    });

    // Eğer süre uzatıldıysa ve hesap askıdaysa aktif yap
    if (action === 'add' && user.status === 'TRIAL_EXPIRED' && newTrialEndDate > new Date()) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'ACTIVE'
        }
      });

    }

    return NextResponse.json({
      message: `Deneme süresi başarıyla ${action === 'add' ? 'uzatıldı' : action === 'subtract' ? 'kısaltıldı' : 'güncellendi'}`,
      user: updatedUser,
      newTrialEndDate,
      totalTrialDays: 15 + extraTrialDays
    });

  } catch (error) {
    console.error('Deneme süresi güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Deneme süresi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}