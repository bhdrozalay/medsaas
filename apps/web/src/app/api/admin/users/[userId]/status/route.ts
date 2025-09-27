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
    const { status } = body; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID\'si gerekli' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Durum bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Geçerli durum kontrolü
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz durum bilgisi' },
        { status: 400 }
      );
    }

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `Kullanıcı durumu başarıyla ${status === 'ACTIVE' ? 'aktif' : status === 'INACTIVE' ? 'pasif' : 'askıya alındı'} olarak güncellendi`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Kullanıcı durum güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı durumu güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}