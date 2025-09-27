import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

// GET - Cari hesap hareketlerini listele
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const documentType = searchParams.get('documentType');
    const offset = (page - 1) * limit;

    // Build where clause
    let where: any = {
      currentAccountId: params.id,
      tenantId: payload.tenantId,
    };

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    if (documentType && documentType !== 'all') {
      where.documentType = documentType;
    }

    const [transactions, total] = await Promise.all([
      prisma.currentAccountTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.currentAccountTransaction.count({ where }),
    ]);

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map((transaction) => {
      runningBalance += Number(transaction.debitAmount) - Number(transaction.creditAmount);
      return {
        ...transaction,
        runningBalance,
      };
    }).reverse(); // Reverse to show oldest first for correct balance calculation

    return NextResponse.json({
      success: true,
      data: transactionsWithBalance.reverse(), // Reverse back to show newest first
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching current account transactions:', error);
    return NextResponse.json(
      { error: 'Cari hesap hareketleri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni cari hesap hareketi oluştur
export async function POST(
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
      transactionDate,
      description,
      referenceNo,
      documentType,
      debitAmount,
      creditAmount,
      dueDate,
      currency,
      exchangeRate,
      projectId,
      tenderId,
    } = body;

    // Validation
    if (!transactionDate || !description) {
      return NextResponse.json(
        { error: 'Tarih ve açıklama alanları zorunludur' },
        { status: 400 }
      );
    }

    if ((!debitAmount || debitAmount <= 0) && (!creditAmount || creditAmount <= 0)) {
      return NextResponse.json(
        { error: 'Borç veya alacak tutarından en az biri girilmelidir' },
        { status: 400 }
      );
    }

    if (debitAmount > 0 && creditAmount > 0) {
      return NextResponse.json(
        { error: 'Aynı anda hem borç hem alacak tutarı girilemez' },
        { status: 400 }
      );
    }

    // Check if current account exists and belongs to tenant
    const currentAccount = await prisma.currentAccount.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId,
      },
    });

    if (!currentAccount) {
      return NextResponse.json(
        { error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate current balance
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

    const currentBalance = (balanceResult._sum.debitAmount || 0) - (balanceResult._sum.creditAmount || 0);
    const newBalance = currentBalance + Number(debitAmount || 0) - Number(creditAmount || 0);

    const transaction = await prisma.currentAccountTransaction.create({
      data: {
        currentAccountId: params.id,
        transactionDate: new Date(transactionDate),
        description,
        referenceNo: referenceNo || null,
        documentType: documentType || null,
        debitAmount: debitAmount || 0,
        creditAmount: creditAmount || 0,
        balance: newBalance,
        dueDate: dueDate ? new Date(dueDate) : null,
        currency: currency || 'TRY',
        exchangeRate: exchangeRate || 1,
        projectId: projectId || null,
        tenderId: tenderId || null,
        tenantId: payload.tenantId,
        createdBy: payload.userId,
      },
      include: {
        currentAccount: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Create due tracking record if there's a due date and amount
    if (dueDate && debitAmount && debitAmount > 0) {
      await prisma.dueTracking.create({
        data: {
          currentAccountId: params.id,
          transactionId: transaction.id,
          dueDate: new Date(dueDate),
          originalAmount: debitAmount,
          remainingAmount: debitAmount,
          tenantId: payload.tenantId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Cari hesap hareketi başarıyla oluşturuldu',
    });

  } catch (error) {
    console.error('Error creating current account transaction:', error);
    return NextResponse.json(
      { error: 'Cari hesap hareketi oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}