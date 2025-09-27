import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt-edge';
import { prisma } from '@medsas/database';

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

    // Parallel queries for better performance
    const [
      totalReceivables,
      totalPayables,
      overdueReceivables,
      recentTransactions,
      topCustomers,
      topSuppliers,
      accountCounts,
    ] = await Promise.all([
      // Total Receivables (Toplam Alacak)
      prisma.currentAccountTransaction.aggregate({
        where: {
          tenantId: payload.tenantId,
          currentAccount: {
            type: { in: ['customer', 'both'] },
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      }),

      // Total Payables (Toplam Borç)
      prisma.currentAccountTransaction.aggregate({
        where: {
          tenantId: payload.tenantId,
          currentAccount: {
            type: { in: ['supplier', 'both'] },
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      }),

      // Overdue Receivables (Vadesi Geçen Alacaklar)
      prisma.currentAccountTransaction.aggregate({
        where: {
          tenantId: payload.tenantId,
          dueDate: {
            lt: new Date(),
          },
          debitAmount: {
            gt: 0,
          },
          currentAccount: {
            type: { in: ['customer', 'both'] },
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      }),

      // Recent Transactions (Son Hareketler)
      prisma.currentAccountTransaction.findMany({
        where: {
          tenantId: payload.tenantId,
        },
        include: {
          currentAccount: {
            select: {
              name: true,
              code: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Top Customers by Balance (En Büyük Alacaklılar)
      prisma.$queryRaw`
        SELECT
          ca.id,
          ca.name,
          ca.code,
          COALESCE(SUM(cat.debit_amount), 0) - COALESCE(SUM(cat.credit_amount), 0) as balance
        FROM current_accounts ca
        LEFT JOIN current_account_transactions cat ON ca.id = cat.current_account_id
        WHERE ca.tenant_id = ${payload.tenantId}
          AND ca.type IN ('customer', 'both')
          AND ca.status = 'ACTIVE'
        GROUP BY ca.id, ca.name, ca.code
        HAVING COALESCE(SUM(cat.debit_amount), 0) - COALESCE(SUM(cat.credit_amount), 0) > 0
        ORDER BY balance DESC
        LIMIT 5
      `,

      // Top Suppliers by Balance (En Büyük Borçlular)
      prisma.$queryRaw`
        SELECT
          ca.id,
          ca.name,
          ca.code,
          COALESCE(SUM(cat.credit_amount), 0) - COALESCE(SUM(cat.debit_amount), 0) as balance
        FROM current_accounts ca
        LEFT JOIN current_account_transactions cat ON ca.id = cat.current_account_id
        WHERE ca.tenant_id = ${payload.tenantId}
          AND ca.type IN ('supplier', 'both')
          AND ca.status = 'ACTIVE'
        GROUP BY ca.id, ca.name, ca.code
        HAVING COALESCE(SUM(cat.credit_amount), 0) - COALESCE(SUM(cat.debit_amount), 0) > 0
        ORDER BY balance DESC
        LIMIT 5
      `,

      // Account Counts (Hesap Sayıları)
      prisma.currentAccount.groupBy({
        by: ['type'],
        where: {
          tenantId: payload.tenantId,
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Calculate KPIs
    const totalReceivableAmount = Number(totalReceivables._sum.debitAmount || 0) - Number(totalReceivables._sum.creditAmount || 0);
    const totalPayableAmount = Number(totalPayables._sum.creditAmount || 0) - Number(totalPayables._sum.debitAmount || 0);
    const netCashPosition = totalReceivableAmount - totalPayableAmount;
    const overdueAmount = Number(overdueReceivables._sum.debitAmount || 0) - Number(overdueReceivables._sum.creditAmount || 0);

    // Process account counts
    const accountStats = accountCounts.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate cash flow trend (simple monthly calculation)
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const thisMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const [lastMonthFlow, thisMonthFlow] = await Promise.all([
      prisma.currentAccountTransaction.aggregate({
        where: {
          tenantId: payload.tenantId,
          transactionDate: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      }),
      prisma.currentAccountTransaction.aggregate({
        where: {
          tenantId: payload.tenantId,
          transactionDate: {
            gte: thisMonth,
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      }),
    ]);

    const lastMonthNet = Number(lastMonthFlow._sum.debitAmount || 0) - Number(lastMonthFlow._sum.creditAmount || 0);
    const thisMonthNet = Number(thisMonthFlow._sum.debitAmount || 0) - Number(thisMonthFlow._sum.creditAmount || 0);
    const monthlyTrend = thisMonthNet - lastMonthNet;
    const monthlyTrendPercentage = lastMonthNet !== 0 ? (monthlyTrend / Math.abs(lastMonthNet)) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalReceivables: totalReceivableAmount,
          totalPayables: totalPayableAmount,
          netCashPosition,
          overdueReceivables: overdueAmount > 0 ? overdueAmount : 0,
          monthlyTrend: monthlyTrendPercentage,
        },
        accountStats: {
          customers: accountStats.customer || 0,
          suppliers: accountStats.supplier || 0,
          both: accountStats.both || 0,
          total: (accountStats.customer || 0) + (accountStats.supplier || 0) + (accountStats.both || 0),
        },
        recentTransactions,
        topCustomers,
        topSuppliers,
      },
    });

  } catch (error) {
    console.error('Error fetching accounting dashboard:', error);
    return NextResponse.json(
      { error: 'Dashboard verileri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}