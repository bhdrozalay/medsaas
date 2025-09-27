'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Users,
  Search,
  Filter,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
  Settings,
  Eye,
  MoreVertical,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast, Toaster } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  createdAt: string;
  _count: {
    users: number;
  };
}

interface Module {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  isCore: boolean;
  isActive: boolean;
}

interface TenantModule {
  id: string;
  tenantId: string;
  moduleId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'EXPIRED';
  activatedAt: string;
  expiresAt: string | null;
  module: Module;
}

interface TenantWithModules {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  tenantModules: TenantModule[];
  _count: {
    users: number;
  };
}

export default function TenantModulesPage() {
  const [tenants, setTenants] = useState<TenantWithModules[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithModules | null>(null);
  const [moduleAssignments, setModuleAssignments] = useState<Record<string, boolean>>({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchTenantsWithModules();
    fetchModules();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-muted-foreground" />
      : <ArrowDown className="h-4 w-4 text-muted-foreground" />;
  };

  const fetchTenantsWithModules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/tenant-modules?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error('Tenant-modül bilgileri alınamadı');
      }

      const data = await response.json();
      setTenants(data.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Tenant-modül bilgileri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/super-admin/modules', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Modüller alınamadı');
      }

      const data = await response.json();
      setModules(data.data);
    } catch (err) {
      console.error('Modules fetch error:', err);
    }
  };

  const handleAssignModules = (tenant: TenantWithModules) => {
    setSelectedTenant(tenant);

    // Mevcut modül atamalarını state'e yükle
    const assignments: Record<string, boolean> = {};
    tenant.tenantModules.forEach(tm => {
      assignments[tm.moduleId] = tm.status === 'ACTIVE' || tm.status === 'TRIAL';
    });

    console.log('Loading module assignments for tenant:', tenant.name);
    console.log('Tenant modules:', tenant.tenantModules.map(tm => ({
      moduleId: tm.moduleId,
      status: tm.status,
      switchValue: tm.status === 'ACTIVE' || tm.status === 'TRIAL'
    })));
    console.log('Initial assignments state:', assignments);

    setModuleAssignments(assignments);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedTenant) return;

    try {
      setAssignmentLoading(true);

      // Debug: Console'da module assignments'ı göster
      console.log('Sending module assignments:', moduleAssignments);
      console.log('Selected tenant:', selectedTenant.name);

      const response = await fetch(`/api/super-admin/tenant-modules/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modules: moduleAssignments
        })
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Modül atamaları güncellenemedi');
      }

      toast.success('Modül atamaları başarıyla güncellendi!');
      setShowAssignModal(false);
      setSelectedTenant(null);
      setModuleAssignments({});
      fetchTenantsWithModules();
    } catch (err: any) {
      console.error('Assignment error:', err);
      toast.error(`Hata: ${err.message}`);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Aktif' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', label: 'İnaktif' },
      TRIAL: { color: 'bg-blue-100 text-blue-800', label: 'Deneme' },
      EXPIRED: { color: 'bg-red-100 text-red-800', label: 'Süresi Dolmuş' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: 'bg-gray-100 text-gray-800',
      accounting: 'bg-blue-100 text-blue-800',
      tender: 'bg-green-100 text-green-800',
      sales: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Helper function to generate mini chart data
  const generateMiniChartData = (currentValue: number, trendType: 'growth' | 'decline' | 'stable' = 'growth', points: number = 7) => {
    if (currentValue === 0) {
      return Array(points).fill({ value: 0 });
    }

    const data = [];
    const maxVariation = Math.max(1, Math.floor(currentValue * 0.2));

    let startValue: number;
    switch (trendType) {
      case 'growth':
        startValue = Math.max(1, Math.floor(currentValue * (0.6 + Math.random() * 0.2)));
        break;
      case 'decline':
        startValue = Math.floor(currentValue * (1.2 + Math.random() * 0.3));
        break;
      case 'stable':
        startValue = Math.max(1, currentValue + (Math.random() - 0.5) * maxVariation);
        break;
    }

    for (let i = 0; i < points - 1; i++) {
      const progress = i / (points - 2);
      let targetValue: number;

      if (trendType === 'growth') {
        targetValue = startValue + (currentValue - startValue) * progress;
      } else if (trendType === 'decline') {
        targetValue = startValue - (startValue - currentValue) * progress;
      } else {
        targetValue = currentValue + (Math.random() - 0.5) * maxVariation * 0.5;
      }

      const randomFactor = (Math.random() - 0.5) * maxVariation * 0.3;
      const value = Math.max(0, Math.round(targetValue + randomFactor));
      data.push({ value });
    }

    data.push({ value: currentValue });
    return data;
  };

  // Filter and sort tenants
  const filteredAndSortedTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'plan':
        aValue = a.plan.toLowerCase();
        bValue = b.plan.toLowerCase();
        break;
      case 'users':
        aValue = a._count.users;
        bValue = b._count.users;
        break;
      case 'modules':
        aValue = a.tenantModules.length;
        bValue = b.tenantModules.length;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Calculate stats
  const stats = {
    totalTenants: tenants.length,
    totalModules: modules.filter(m => m.isActive).length,
    totalAssignments: tenants.reduce((sum, t) => sum + t.tenantModules.filter(tm => tm.status === 'ACTIVE' || tm.status === 'TRIAL').length, 0),
    activeAssignments: tenants.reduce((sum, t) => sum + t.tenantModules.filter(tm => tm.status === 'ACTIVE').length, 0),
    trialAssignments: tenants.reduce((sum, t) => sum + t.tenantModules.filter(tm => tm.status === 'TRIAL').length, 0),
    cancelledAssignments: tenants.reduce((sum, t) => sum + t.tenantModules.filter(tm => tm.status === 'CANCELLED' || tm.status === 'EXPIRED').length, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTenantsWithModules}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tenant-Modül Yönetimi
              </h1>
              <p className="mt-2 text-gray-600 text-sm">
                Tenant'ların modül erişimlerini yönetin ve modül atamalarını kontrol edin
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchTenantsWithModules}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Rapor Al
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {/* Toplam Tenant */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Toplam Tenant</p>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTenants > 0 ? (
                    <span className="text-blue-600">Kayıtlı tenant</span>
                  ) : (
                    <span className="text-gray-500">Henüz tenant yok</span>
                  )}
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.totalTenants > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateMiniChartData(stats.totalTenants, 'growth')}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        strokeWidth={1}
                        dot={false}
                        className="stroke-blue-400"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aktif Modüller */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Aktif Modül</p>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalModules}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">Kullanılabilir modül</span>
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.totalModules > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMiniChartData(stats.totalModules, 'stable')}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        fill="currentColor"
                        className="fill-green-200 stroke-green-400"
                        strokeWidth={1}
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Toplam Atama */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Toplam Atama</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-purple-600">Aktif + Deneme</span>
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.totalAssignments > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateMiniChartData(stats.totalAssignments, 'growth')}>
                      <Bar
                        dataKey="value"
                        fill="currentColor"
                        className="fill-purple-400"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aktif Atama */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Aktif Atama</p>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAssignments > 0 ? (
                    <span className="text-green-600">{Math.round((stats.activeAssignments / stats.totalAssignments) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.activeAssignments > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMiniChartData(stats.activeAssignments, 'growth')}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        fill="currentColor"
                        className="fill-green-200 stroke-green-400"
                        strokeWidth={1}
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deneme Ataması */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Deneme Sürümü</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.trialAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAssignments > 0 ? (
                    <span className="text-orange-600">{Math.round((stats.trialAssignments / stats.totalAssignments) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.trialAssignments > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateMiniChartData(stats.trialAssignments, 'stable')}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        strokeWidth={1}
                        dot={false}
                        className="stroke-orange-400"
                        strokeDasharray="3 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* İptal Edilen Atamalar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">İptal Edilen</p>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.cancelledAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  {(stats.totalAssignments + stats.cancelledAssignments) > 0 ? (
                    <span className="text-red-600">{Math.round((stats.cancelledAssignments / (stats.totalAssignments + stats.cancelledAssignments)) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              <div className="h-10 w-full mt-3">
                {stats.cancelledAssignments > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateMiniChartData(stats.cancelledAssignments, 'decline')}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        strokeWidth={1}
                        dot={false}
                        className="stroke-red-400"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Veri yok</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tenant ara..."
                  className="pl-8"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 lg:ml-auto">
                <Button
                  onClick={() => setStatusFilter('all')}
                  variant={statusFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === 'all' ? "bg-slate-900 text-white" : "hover:bg-slate-100"}
                >
                  Tüm Tenantlar ({stats.totalTenants})
                </Button>
                <Button
                  onClick={() => setStatusFilter('active')}
                  variant={statusFilter === 'active' ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === 'active'
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "hover:bg-green-50 border-green-200 text-green-700"}
                >
                  Aktif ({tenants.filter(t => t.status.toLowerCase() === 'active').length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('trial')}
                  variant={statusFilter === 'trial' ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === 'trial'
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "hover:bg-orange-50 border-orange-200 text-orange-700"}
                >
                  Deneme ({tenants.filter(t => t.status.toLowerCase() === 'trial').length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('suspended')}
                  variant={statusFilter === 'suspended' ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === 'suspended'
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "hover:bg-red-50 border-red-200 text-red-700"}
                >
                  Askıdaki ({tenants.filter(t => t.status.toLowerCase() === 'suspended').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      Tenant Bilgileri
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('plan')}>
                    <div className="flex items-center gap-2">
                      Plan
                      {getSortIcon('plan')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('users')}>
                    <div className="flex items-center gap-2">
                      Kullanıcı Sayısı
                      {getSortIcon('users')}
                    </div>
                  </TableHead>
                  <TableHead>Durumu</TableHead>
                  <TableHead>Aktif Modüller</TableHead>
                  <TableHead>Deneme Modülleri</TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('modules')}>
                    <div className="flex items-center gap-2">
                      Toplam Modül
                      {getSortIcon('modules')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Spinner size="md" />
                        <span className="text-muted-foreground">Yüklenyor...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium mb-2">Tenant bulunamadı</p>
                        <p className="text-sm">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Arama kriterlerinize uygun tenant bulunamadı.'
                            : 'Henüz hiç tenant bulunmamaktadır.'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTenants.map((tenant) => {
                    const activeModules = tenant.tenantModules.filter(tm => tm.status === 'ACTIVE');
                    const trialModules = tenant.tenantModules.filter(tm => tm.status === 'TRIAL');

                    return (
                      <TableRow key={tenant.id}>
                        {/* Tenant Info */}
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar>
                              <AvatarFallback>
                                {tenant.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Plan */}
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {tenant.plan}
                          </Badge>
                        </TableCell>

                        {/* Users Count */}
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{tenant._count.users}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {(() => {
                            const status = tenant.status.toLowerCase();
                            if (status === 'active') {
                              return (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aktif
                                </Badge>
                              );
                            } else if (status === 'trial') {
                              return (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Deneme
                                </Badge>
                              );
                            } else if (status === 'suspended') {
                              return (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Askıda
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="outline">
                                  {tenant.status}
                                </Badge>
                              );
                            }
                          })()
                          }
                        </TableCell>

                        {/* Active Modules */}
                        <TableCell>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            <span className="font-medium text-green-700">{activeModules.length}</span>
                          </div>
                        </TableCell>

                        {/* Trial Modules */}
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-orange-600" />
                            <span className="font-medium text-orange-700">{trialModules.length}</span>
                          </div>
                        </TableCell>

                        {/* Total Modules */}
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-purple-600" />
                            <span className="font-medium text-purple-700">{tenant.tenantModules.length}</span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignModules(tenant)}
                            className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Modül Yönet
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* Module Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.name} - Modül Atamaları
            </DialogTitle>
            <DialogDescription>
              Bu tenant için hangi modüllerin aktif olacağını belirleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-gray-500">
                        <Badge className={getCategoryColor(module.category)}>
                          {module.category}
                        </Badge>
                        {!module.isCore && (
                          <span className="ml-2">
                            {formatCurrency(module.price)} / ay
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={moduleAssignments[module.id] || false}
                  onCheckedChange={(checked) => {
                    console.log(`Switch changed for ${module.name} (${module.id}):`, {
                      from: moduleAssignments[module.id] || false,
                      to: checked
                    });
                    setModuleAssignments(prev => ({ ...prev, [module.id]: checked }));
                  }}
                  disabled={module.isCore} // Core modüller her zaman aktif
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedTenant(null);
                setModuleAssignments({});
              }}
              disabled={assignmentLoading}
            >
              İptal
            </Button>
            <Button onClick={handleSaveAssignments} disabled={assignmentLoading}>
              {assignmentLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Kaydediliyor...
                </div>
              ) : (
                'Kaydet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        expand={true}
        richColors
        closeButton
      />
    </div>
  );
}