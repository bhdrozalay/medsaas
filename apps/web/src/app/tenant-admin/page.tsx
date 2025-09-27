'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Heart,
  Clock,
  CheckCircle,
  CreditCard,
  Crown,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  UserPlus,
  Activity,
  DollarSign,
  ChevronRight,
  Home,
  LogOut,
  ChevronLeft,
  Package,
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
  tenant?: {
    name: string;
    slug: string;
  };
  trialEndDate?: string;
  subscription?: {
    planId: string;
    planName: string;
    planDisplayName: string;
    duration: string;
    price: number;
    activatedAt: string;
  };
}

export default function TenantAdminPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/auth/login?error=session-expired');
            return;
          }
          if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.error === 'TRIAL_EXPIRED') {
              router.replace('/subscription');
              return;
            }
          }
          throw new Error('Kullanıcı verisi alınamadı');
        }
        
        const data = await response.json();
        const user = data.user;
        
        // Sadece TENANT_ADMIN ve ADMIN'lerin bu sayfaya erişebileceğinden emin ol
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'ADMIN') {
          console.log('User role is not TENANT_ADMIN or ADMIN:', user.role, 'redirecting to dashboard')
          router.replace('/dashboard');
          return;
        }
        
        console.log('Tenant-admin page: Access granted for user:', user.email, 'role:', user.role)
        
        setUserData(user);
        setLoading(false);
        
      } catch (err) {
        console.error('User data fetch error:', err);
        setError('Kullanıcı verisi alınırken bir hata oluştu');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  // Calculate remaining days
  const getRemainingDays = () => {
    if (userData?.subscription) {
      // For premium users, calculate from activation date + duration
      const activationDate = new Date(userData.subscription.activatedAt);
      const today = new Date();

      // Add duration to activation date
      let endDate = new Date(activationDate);
      if (userData.subscription.duration === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (userData.subscription.duration === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }

    if (userData?.trialEndDate) {
      const endDate = new Date(userData.trialEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }

    return null;
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
          <Button onClick={() => router.push('/auth/login')}>
            Giriş Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', href: '/tenant-admin' },
    { icon: DollarSign, label: 'Muhasebe', href: '/tenant-admin/accounting' },
    { icon: Users, label: 'Hasta Yönetimi', href: '/tenant-admin/patients' },
    { icon: Calendar, label: 'Randevular', href: '/tenant-admin/appointments' },
    { icon: FileText, label: 'Raporlar', href: '/tenant-admin/reports' },
    { icon: BarChart3, label: 'Analitik', href: '/tenant-admin/analytics' },
    { icon: Settings, label: 'Ayarlar', href: '/tenant-admin/settings' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0 lg:static lg:inset-0`}>

        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-blue-600 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="ml-2 text-xl font-bold text-gray-800 whitespace-nowrap">MedSAS</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex-1">
          {sidebarItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center px-3 py-3 mb-1 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors group ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`h-5 w-5 group-hover:text-blue-600 flex-shrink-0 ${
                sidebarCollapsed ? '' : 'mr-3'
              }`} />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </a>
          ))}
        </nav>

        {/* Package Info at Bottom */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center mb-3">
                {userData?.subscription ? (
                  <Crown className="h-5 w-5 mr-2 text-yellow-200" />
                ) : (
                  <Package className="h-5 w-5 mr-2 text-orange-200" />
                )}
                <span className="text-sm font-semibold">
                  {userData?.subscription ? 'Premium Aktif' : 'Demo Hesabı'}
                </span>
              </div>

              {userData?.subscription ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-100">Plan:</span>
                    <span className="text-xs font-medium">
                      {userData.subscription.planDisplayName || userData.subscription.planName}
                    </span>
                  </div>
                  {(() => {
                    const remainingDays = getRemainingDays();
                    return remainingDays !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-100">Kalan Süre:</span>
                        <span className="text-xs font-medium">
                          {remainingDays} gün
                        </span>
                      </div>
                    );
                  })()}
                  <div className="mt-2 pt-2 border-t border-white border-opacity-20">
                    <p className="text-xs text-blue-100">
                      Aktifleşme: {new Date(userData.subscription.activatedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const remainingDays = getRemainingDays();
                    return (
                      <>
                        <p className="text-xs text-blue-100 leading-relaxed">
                          Premium özellikler için abonelik seçin
                        </p>
                        {remainingDays !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-100">Kalan Süre:</span>
                            <span className="text-xs font-medium">
                              {remainingDays} gün
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={() => router.push('/subscription')}
                          size="sm"
                          className="w-full mt-2 bg-white text-blue-700 hover:bg-gray-100 text-xs font-medium"
                        >
                          Yükselt
                        </Button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Package Info */}
        {sidebarCollapsed && (
          <div className="absolute bottom-4 left-2 right-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 text-white text-center">
              {userData?.subscription ? (
                <Crown className="h-6 w-6 text-yellow-200 mx-auto" />
              ) : (
                <Package className="h-6 w-6 text-orange-200 mx-auto" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {userData?.tenant?.name} - Tenant Yönetimi
                </h1>
                <p className="text-sm text-gray-500">Hoşgeldiniz, {userData?.firstName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ara..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-blue-500 text-white rounded-full p-2">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{userData?.role}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.firstName} {userData?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">{userData?.email}</p>
                      <Badge variant="outline" className="text-xs">
                        {userData?.role === 'TENANT_ADMIN' ? 'Tenant Admin' : userData?.role}
                      </Badge>
                    </div>

                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-500 mb-1">Tenant</p>
                      <p className="text-sm font-medium">{userData?.tenant?.name}</p>
                    </div>

                    <div className="border-t pt-2">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          // Add profile navigation here
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profil Ayarları
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Welcome Banner */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 bg-white bg-opacity-10 rounded-full"></div>

              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-3">
                  Hoşgeldiniz, {userData?.firstName}! 👋
                </h2>
                <p className="text-blue-100 mb-6 text-lg">
                  {userData?.subscription
                    ? `${userData.subscription.planDisplayName || userData.subscription.planName} aboneliğiniz aktif. Tüm premium özellikler kullanımınızda.`
                    : 'Demo süreniz devam ediyor. Premium özelliklere geçiş yapmak için abonelik planlarını inceleyin.'
                  }
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    {userData?.subscription ? (
                      <Crown className="h-5 w-5 mr-2" />
                    ) : (
                      <Clock className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">
                      {userData?.subscription
                        ? `${userData.subscription.planDisplayName} - ₺${userData.subscription.price}/${userData.subscription.duration === 'monthly' ? 'ay' : 'yıl'}`
                        : 'Demo Hesabı Aktif'
                      }
                    </span>
                  </div>

                  {!userData?.subscription && (
                    <Button
                      className="bg-white text-blue-700 hover:bg-gray-100"
                      onClick={() => router.push('/subscription')}
                    >
                      Premium'a Geç
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Toplam Hasta</p>
                    <p className="text-3xl font-bold text-gray-900">24</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">+12%</span>
                      <span className="text-sm text-gray-500 ml-1">bu ay</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Bu Ay Randevu</p>
                    <p className="text-3xl font-bold text-gray-900">47</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">+8%</span>
                      <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
                    </div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Aktif Tedavi</p>
                    <p className="text-3xl font-bold text-gray-900">18</p>
                    <div className="flex items-center mt-2">
                      <Activity className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600 font-medium">+5</span>
                      <span className="text-sm text-gray-500 ml-1">yeni hasta</span>
                    </div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Aylık Gelir</p>
                    <p className="text-3xl font-bold text-gray-900">₺18,750</p>
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-4 w-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-600 font-medium">+24%</span>
                      <span className="text-sm text-gray-500 ml-1">bu ay</span>
                    </div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full transition-colors">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Hasta Yönetimi</h3>
                <p className="text-gray-600">Hasta kayıtlarını görüntüleyin, düzenleyin ve yeni hasta ekleyin</p>
                <div className="mt-4 flex items-center text-sm text-blue-600">
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span>Yeni hasta ekle</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 group-hover:bg-green-200 p-3 rounded-full transition-colors">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Randevu Sistemi</h3>
                <p className="text-gray-600">Randevuları planlayın, düzenleyin ve hasta takibi yapın</p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Bugün 8 randevu</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 group-hover:bg-purple-200 p-3 rounded-full transition-colors">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Raporlar & Analitik</h3>
                <p className="text-gray-600">Detaylı raporları görüntüleyin ve performans analizi yapın</p>
                <div className="mt-4 flex items-center text-sm text-purple-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Aylık rapor hazır</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Sistem Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sistem Performansı</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Mükemmel
                      </Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Veri Güvenliği</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktif
                      </Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Otomatik Yedekleme</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Son 2 saat önce
                      </Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Son Aktiviteler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Yeni hasta kaydı</p>
                      <p className="text-xs text-gray-500">Ahmet Yılmaz - 2 saat önce</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Randevu onaylandı</p>
                      <p className="text-xs text-gray-500">Fatma Özkan - 4 saat önce</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Rapor oluşturuldu</p>
                      <p className="text-xs text-gray-500">Aylık özet raporu - 6 saat önce</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}