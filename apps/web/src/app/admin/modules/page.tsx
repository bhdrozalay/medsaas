'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Users,
  TrendingUp,
  MoreVertical,
  Settings,
  Crown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface ModuleWithStats {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  billingType: string;
  isCore: boolean;
  isActive: boolean;
  sortOrder: number;
  requirements: string[];
  permissions: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
  stats: {
    totalRevenue: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    totalSubscriptions: number;
  };
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleWithStats | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'core',
    price: 0,
    currency: 'TRY',
    billingType: 'monthly',
    isCore: false,
    isActive: true,
    sortOrder: 10,
    requirements: '',
    permissions: '',
    features: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchModules();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchModules = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter
      });

      const response = await fetch(`/api/super-admin/modules?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin');
          return;
        }
        throw new Error('Modüller alınamadı');
      }

      const data = await response.json();
      setModules(data.data);
    } catch (err) {
      console.error('Modules fetch error:', err);
      setError('Modüller alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      core: 'Temel',
      accounting: 'Muhasebe',
      tender: 'İhale',
      sales: 'Satış'
    };
    return labels[category] || category;
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

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Bu modülü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Silme işlemi başarısız');
      }

      fetchModules(); // Listeyi yenile
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'core',
      price: 0,
      currency: 'TRY',
      billingType: 'monthly',
      isCore: false,
      isActive: true,
      sortOrder: 10,
      requirements: '',
      permissions: '',
      features: ''
    });
    setEditingModule(null);
  };

  const handleAddModule = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditModule = (module: ModuleWithStats) => {
    setFormData({
      code: module.code,
      name: module.name,
      description: module.description || '',
      category: module.category,
      price: Number(module.price),
      currency: module.currency,
      billingType: module.billingType,
      isCore: module.isCore,
      isActive: module.isActive,
      sortOrder: module.sortOrder,
      requirements: JSON.stringify(module.requirements),
      permissions: JSON.stringify(module.permissions),
      features: JSON.stringify(module.features)
    });
    setEditingModule(module);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        sortOrder: Number(formData.sortOrder),
        requirements: formData.requirements ? JSON.parse(formData.requirements) : [],
        permissions: formData.permissions ? JSON.parse(formData.permissions) : [],
        features: formData.features ? JSON.parse(formData.features) : []
      };

      const url = editingModule
        ? `/api/super-admin/modules/${editingModule.id}`
        : '/api/super-admin/modules';

      const method = editingModule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'İşlem başarısız');
      }

      setShowAddModal(false);
      resetForm();
      fetchModules();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchModules}>Tekrar Dene</Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overview stats
  const totalModules = modules.length;
  const activeModules = modules.filter(m => m.isActive).length;
  const totalRevenue = modules.reduce((sum, m) => sum + m.stats.totalRevenue, 0);
  const totalSubscriptions = modules.reduce((sum, m) => sum + m.stats.totalSubscriptions, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modül Yönetimi</h1>
          <p className="text-gray-600">Sistem modüllerini yönetin ve durumlarını takip edin</p>
        </div>
        <Button onClick={handleAddModule}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Modül
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Toplam Modül</p>
                <p className="text-2xl font-bold text-gray-900">{totalModules}</p>
                <p className="text-xs text-green-600 mt-1">
                  {activeModules} aktif
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Toplam Abonelik</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubscriptions}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Tüm modüller
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aylık Gelir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +12% bu ay
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ortalama Fiyat</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(modules.length > 0 ? modules.filter(m => !m.isCore).reduce((sum, m) => sum + m.price, 0) / modules.filter(m => !m.isCore).length : 0)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Ücretli modüller
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Modül ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="core">Temel</option>
                <option value="accounting">Muhasebe</option>
                <option value="tender">İhale</option>
                <option value="sales">Satış</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card key={module.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(module.category)}`}>
                    {module.isCore ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{module.name}</h3>
                    <p className="text-sm text-gray-500">{module.code}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {module.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(module.category)}>
                    {getCategoryLabel(module.category)}
                  </Badge>
                  {module.isCore ? (
                    <Badge variant="outline" className="bg-gray-50">
                      Core Modül
                    </Badge>
                  ) : (
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(module.price)}/ay
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {module.description || 'Açıklama bulunmuyor'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {module.stats.activeSubscriptions}
                    </p>
                    <p className="text-xs text-gray-600">Aktif Abonelik</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(module.stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-600">Toplam Gelir</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/modules/${module.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detay
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditModule(module)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                </div>

                {!module.isCore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modules.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Modül bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun modül bulunamadı.'
              : 'Henüz hiç modül oluşturulmamış.'
            }
          </p>
          <Button onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            İlk Modülü Oluştur
          </Button>
        </div>
      )}

      {/* Add/Edit Module Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Modül Düzenle' : 'Yeni Modül Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingModule
                ? 'Mevcut modülün özelliklerini düzenleyin.'
                : 'Sisteme yeni bir modül ekleyin. Tüm alanları dikkatlice doldurun.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              {/* Modül Kodu */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Modül Kodu *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="col-span-3"
                  placeholder="ACCOUNTING_BASIC"
                  required
                  disabled={!!editingModule}
                />
              </div>

              {/* Modül Adı */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Modül Adı *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="Temel Muhasebe"
                  required
                />
              </div>

              {/* Açıklama */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Açıklama
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="Modülün detaylı açıklaması..."
                  rows={3}
                />
              </div>

              {/* Kategori */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Kategori *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Temel</SelectItem>
                    <SelectItem value="accounting">Muhasebe</SelectItem>
                    <SelectItem value="tender">İhale</SelectItem>
                    <SelectItem value="sales">Satış</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fiyat ve Para Birimi */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Fiyat</Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="flex-1"
                  />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Faturalama Türü */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Faturalama</Label>
                <Select
                  value={formData.billingType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, billingType: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="yearly">Yıllık</SelectItem>
                    <SelectItem value="one-time">Tek Seferlik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sıra Numarası */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sortOrder" className="text-right">
                  Sıra No
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  className="col-span-3"
                  min="1"
                />
              </div>

              {/* Temel Modül ve Aktiflik */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ayarlar</Label>
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isCore"
                      checked={formData.isCore}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCore: checked }))}
                    />
                    <Label htmlFor="isCore">Temel Modül</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Aktif</Label>
                  </div>
                </div>
              </div>

              {/* Gereksinimler */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="requirements" className="text-right">
                  Gereksinimler
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  className="col-span-3"
                  placeholder='["CORE_AUTH", "CORE_DASHBOARD"]'
                  rows={2}
                />
              </div>

              {/* İzinler */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="permissions" className="text-right">
                  İzinler
                </Label>
                <Textarea
                  id="permissions"
                  value={formData.permissions}
                  onChange={(e) => setFormData(prev => ({ ...prev, permissions: e.target.value }))}
                  className="col-span-3"
                  placeholder='["accounting.view", "accounting.create"]'
                  rows={2}
                />
              </div>

              {/* Özellikler */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="features" className="text-right">
                  Özellikler
                </Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                  className="col-span-3"
                  placeholder='["Cari hesap yönetimi", "Fatura oluşturma"]'
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit">
                {editingModule ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}