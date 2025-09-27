import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

// GET - Cari hesapları listele (arama, filtreleme ile)
export async function GET(request: NextRequest) {
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
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    let where: any = {
      tenantId: payload.tenantId,
      status: status !== 'all' ? status : undefined,
    };

    if (type !== 'all') {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { taxNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Clean undefined values
    where = Object.fromEntries(
      Object.entries(where).filter(([_, value]) => value !== undefined)
    );

    const [currentAccounts, total] = await Promise.all([
      prisma.currentAccount.findMany({
        where,
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.currentAccount.count({ where }),
    ]);

    // Calculate balances for each account
    const accountsWithBalances = await Promise.all(
      currentAccounts.map(async (account) => {
        const balanceResult = await prisma.currentAccountTransaction.aggregate({
          where: {
            currentAccountId: account.id,
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

        return {
          ...account,
          balance,
          transactionCount: account._count.transactions,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: accountsWithBalances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching current accounts:', error);
    return NextResponse.json(
      { error: 'Cari hesaplar alınırken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni cari hesap oluştur
export async function POST(request: NextRequest) {
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
    } = body;

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

    // Generate unique code for tenant
    const lastAccount = await prisma.currentAccount.findFirst({
      where: { tenantId: payload.tenantId },
      orderBy: { code: 'desc' },
    });

    let nextNumber = 1;
    if (lastAccount) {
      const lastNumber = parseInt(lastAccount.code.replace(/[^\d]/g, '')) || 0;
      nextNumber = lastNumber + 1;
    }

    const code = `CA${nextNumber.toString().padStart(3, '0')}`;

    const currentAccount = await prisma.currentAccount.create({
      data: {
        code,
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
        tenantId: payload.tenantId,
        createdBy: payload.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: currentAccount,
      message: 'Cari hesap başarıyla oluşturuldu',
    });

  } catch (error) {
    console.error('Error creating current account:', error);
    return NextResponse.json(
      { error: 'Cari hesap oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}