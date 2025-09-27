import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@medsas/database';
import { verifyJWT } from '../../../../../lib/jwt-edge';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    // JWT token doğrulama
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Request body'den user ID'leri al
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Güvenlik kontrolü: Super admin kendini silemez
    if (userIds.includes(decoded.userId)) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Kullanıcıları veritabanından sil
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        },
        // Güvenlik: Sadece SUPER_ADMIN olmayan kullanıcıları sil
        role: {
          not: 'SUPER_ADMIN'
        }
      }
    });

    console.log(`Bulk delete: ${deleteResult.count} users deleted`);

    return NextResponse.json({
      message: `${deleteResult.count} users deleted successfully`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}