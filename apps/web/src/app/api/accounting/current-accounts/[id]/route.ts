import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

// GET - Tek cari hesap detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const currentAccount = await prisma.currentAccount.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId,
      },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50, // Son 50 hareket
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!currentAccount) {
      return NextResponse.json(
        { error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate balance
    const balanceResult = await prisma.currentAccountTransaction.aggregate({
      where: {
        currentAccountId: params.id,
        tenantId: payload.tenantId,
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const totalDebit = balanceResult._sum.debitAmount || 0;
    const totalCredit = balanceResult._sum.creditAmount || 0;
    const balance = totalDebit - totalCredit;

    // Calculate overdue amounts
    const overdueResult = await prisma.currentAccountTransaction.aggregate({
      where: {
        currentAccountId: params.id,
        tenantId: payload.tenantId,
        dueDate: {
          lt: new Date(),
        },
        // Only unpaid transactions (assuming positive balance means debt)
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const overdueAmount = (overdueResult._sum.debitAmount || 0) - (overdueResult._sum.creditAmount || 0);

    return NextResponse.json({
      success: true,
      data: {
        ...currentAccount,
        balance,
        overdueAmount: overdueAmount > 0 ? overdueAmount : 0,
        transactionCount: currentAccount._count.transactions,
      },
    });

  } catch (error) {
    console.error('Error fetching current account:', error);
    return NextResponse.json(
      { error: 'Cari hesap detayı alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Cari hesap güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      taxNumber,
      taxOffice,
      address,
      city,
      phone,
      email,
      contactPerson,
      paymentTerm,
      creditLimit,
      currency,
      notes,
      status,
    } = body;

    // Check if account exists and belongs to tenant
    const existingAccount = await prisma.currentAccount.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'İsim ve tip alanları zorunludur' },
        { status: 400 }
      );
    }

    if (!['customer', 'supplier', 'both'].includes(type)) {
      return NextResponse.json(
        { error: 'Geçersiz cari hesap tipi' },
        { status: 400 }
      );
    }

    const updatedAccount = await prisma.currentAccount.update({
      where: { id: params.id },
      data: {
        name,
        type,
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
        address: address || null,
        city: city || null,
        phone: phone || null,
        email: email || null,
        contactPerson: contactPerson || null,
        paymentTerm: paymentTerm || 0,
        creditLimit: creditLimit || 0,
        currency: currency || 'TRY',
        notes: notes || null,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAccount,
      message: 'Cari hesap başarıyla güncellendi',
    });

  } catch (error) {
    console.error('Error updating current account:', error);
    return NextResponse.json(
      { error: 'Cari hesap güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Cari hesap sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if account exists and belongs to tenant
    const existingAccount = await prisma.currentAccount.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Check if account has transactions
    if (existingAccount._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Bu cari hesabın hareketleri bulunduğu için silinemez. Önce durumunu pasif yapabilirsiniz.' },
        { status: 400 }
      );
    }

    await prisma.currentAccount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cari hesap başarıyla silindi',
    });

  } catch (error) {
    console.error('Error deleting current account:', error);
    return NextResponse.json(
      { error: 'Cari hesap silinirken hata oluştu' },
      { status: 500 }
    );
  }
}