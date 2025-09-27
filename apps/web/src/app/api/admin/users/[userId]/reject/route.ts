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
    const { reason } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID\'si gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı reddet
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        updatedAt: new Date()
      }
    });


    return NextResponse.json({
      message: 'Kullanıcı başvurusu başarıyla reddedildi',
      user: updatedUser,
      reason
    });

  } catch (error) {
    console.error('Kullanıcı reddetme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı reddedilirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}