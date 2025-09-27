'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DashboardData {
  kpis: {
    totalReceivables: number;
    totalPayables: number;
    netCashPosition: number;
    overdueReceivables: number;
    monthlyTrend: number;
  };
  accountStats: {
    customers: number;
    suppliers: number;
    both: number;
    total: number;
  };
  recentTransactions: any[];
  topCustomers: any[];
  topSuppliers: any[];
}

interface CurrentAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  phone?: string;
  email?: string;
  balance: number;
  transactionCount: number;
  status: string;
}

export default function AccountingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentAccounts, setCurrentAccounts] = useState<CurrentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    fetchCurrentAccounts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/accounting/dashboard', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Dashboard verileri alınamadı');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Dashboard verileri alınırken hata oluştu');
    }
  };

  const fetchCurrentAccounts = async () => {
    try {
      const response = await fetch(`/api/accounting/current-accounts?limit=10&search=${searchTerm}&type=${filterType}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Cari hesaplar alınamadı');
      }

      const data = await response.json();
      setCurrentAccounts(data.data);
    } catch (err) {
      console.error('Current accounts error:', err);
      setError('Cari hesaplar alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer: 'Müşteri',
      supplier: 'Tedarikçi',
      both: 'Her İkisi'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800',
      supplier: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Muhasebe</h1>
          <p className="text-gray-600">Finansal durum ve cari hesap yönetimi</p>
        </div>
        <Button onClick={() => router.push('/tenant-admin/accounting/current-accounts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Cari Hesap
        </Button>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Toplam Alacak</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.kpis.totalReceivables)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Toplam Borç</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(dashboardData.kpis.totalPayables)}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Net Nakit</p>
                  <p className={`text-2xl font-bold ${
                    dashboardData.kpis.netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(dashboardData.kpis.netCashPosition)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Vadesi Geçen</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(dashboardData.kpis.overdueReceivables)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Accounts List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Cari Hesaplar</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => router.push('/tenant-admin/accounting/current-accounts')}
                >
                  Tümünü Gör
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Cari hesap ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Tipler</option>
                  <option value="customer">Müşteri</option>
                  <option value="supplier">Tedarikçi</option>
                  <option value="both">Her İkisi</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {currentAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/tenant-admin/accounting/current-accounts/${account.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{account.name}</span>
                        <Badge className={getTypeColor(account.type)}>
                          {getTypeLabel(account.type)}
                        </Badge>
                        <span className="text-sm text-gray-500">({account.code})</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {account.phone && <span>{account.phone}</span>}
                        {account.email && <span>{account.email}</span>}
                        <span>{account.transactionCount} hareket</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(account.balance)}
                      </p>
                      <p className="text-xs text-gray-500">Bakiye</p>
                    </div>
                  </div>
                ))}

                {currentAccounts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz cari hesap bulunmuyor</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => router.push('/tenant-admin/accounting/current-accounts/new')}
                    >
                      İlk Cari Hesabı Oluştur
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Recent Activity */}
        <div className="space-y-6">
          {/* Account Stats */}
          {dashboardData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Hesap İstatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri</span>
                    <span className="font-medium">{dashboardData.accountStats.customers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tedarikçi</span>
                    <span className="font-medium">{dashboardData.accountStats.suppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Her İkisi</span>
                    <span className="font-medium">{dashboardData.accountStats.both}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Toplam</span>
                      <span>{dashboardData.accountStats.total}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          {dashboardData && dashboardData.recentTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Son Hareketler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{transaction.currentAccount.name}</p>
                        <p className="text-xs text-gray-500">{transaction.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.debitAmount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.debitAmount > 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.debitAmount || transaction.creditAmount))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.transactionDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}