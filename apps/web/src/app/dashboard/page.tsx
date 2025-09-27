'use client';

import { 
  Activity,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Heart,
  AlertCircle,
  CheckCircle,
  BarChart3,
  MessageSquare,
  Bell,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Dashboard metrics interface
interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingReports: number;
  unreadMessages: number;
}

// Recent activity interface
interface RecentActivity {
  id: string;
  type: 'appointment' | 'report' | 'message';
  title: string;
  description: string;
  time: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

export default function DashboardPage() {
  // Mock data - production'da API'den gelecek
  const stats: DashboardStats = {
    totalPatients: 1247,
    todayAppointments: 8,
    pendingReports: 3,
    unreadMessages: 12
  };

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'appointment',
      title: 'Ahmet Yılmaz - Kontrol',
      description: 'Kardiyoloji kontrolü tamamlandı',
      time: '2 saat önce',
      status: 'completed'
    },
    {
      id: '2',
      type: 'report',
      title: 'Laboratuvar Sonucu',
      description: 'Kan tahlili sonucu hazır',
      time: '4 saat önce',
      status: 'pending'
    },
    {
      id: '3',
      type: 'message',
      title: 'Dr. Mehmet Kaya',
      description: 'Hasta konsültasyonu hakkında mesaj',
      time: '6 saat önce'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'report': return FileText;
      case 'message': return MessageSquare;
      default: return Activity;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Hoşgeldin! İşte sisteminizin güncel durumu.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Randevu
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Hasta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+12% bu ay</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Bugünkü Randevu</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-600">5 tamamlandı, 3 bekliyor</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Bekleyen Rapor</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-yellow-600">Acil: 1 rapor</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Okunmamış Mesaj</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Bell className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600">2 acil mesaj</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Son Aktiviteler</CardTitle>
                  <Button variant="ghost" size="sm">
                    Tümünü Gör <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-xs text-gray-400">{activity.time}</span>
                            {activity.status && (
                              <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                                {activity.status === 'completed' ? 'Tamamlandı' :
                                 activity.status === 'pending' ? 'Bekliyor' : 'İptal'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Health Overview */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Hasta Kayıt
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Randevu Oluştur
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Rapor Hazırla
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    İstatistikleri Gör
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Sistem Sağlığı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Server Performansı</span>
                      <span className="text-sm text-gray-500">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Veritabanı Bağlantısı</span>
                      <span className="text-sm text-gray-500">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Depolama Alanı</span>
                      <span className="text-sm text-gray-500">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="flex items-center justify-center pt-2">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Tüm sistemler çalışıyor</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}