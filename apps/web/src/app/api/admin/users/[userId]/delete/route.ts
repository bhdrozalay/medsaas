import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@medsas/database';

export async function DELETE(
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

    // Önce kullanıcının var olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // SUPER_ADMIN silinmesini engelle
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super admin kullanıcısı silinemez' },
        { status: 400 }
      );
    }

    // Kullanıcıyı sil (cascade ile ilgili veriler de silinecek)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: 'Kullanıcı ve ilgili tüm veriler başarıyla silindi',
      deletedUserId: userId,
      userRole: user.role
    });

  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}