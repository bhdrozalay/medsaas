'use client'

import { useState, useEffect } from 'react'
import { Users, Building2, UserCheck, AlertCircle, TrendingUp, Activity, Clock, Shield, Database, Zap, ArrowUpRight, ArrowDownRight, Calendar, BarChart3, PieChart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'

interface DashboardStats {
  totalUsers: number
  totalTenants: number
  pendingUsers: number
  activeUsers: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Dashboard istatistikleri alınamadı:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Sample data for charts
  const monthlyData = [
    { month: 'Oca', users: 45, tenants: 12 },
    { month: 'Şub', users: 52, tenants: 15 },
    { month: 'Mar', users: 61, tenants: 18 },
    { month: 'Nis', users: 74, tenants: 22 },
    { month: 'May', users: 89, tenants: 25 },
    { month: 'Haz', users: 103, tenants: 28 }
  ]

  const userStatusData = [
    { name: 'Aktif', value: stats?.activeUsers || 0, color: '#10B981' },
    { name: 'Bekleyen', value: stats?.pendingUsers || 0, color: '#F59E0B' },
    { name: 'Diğer', value: (stats?.totalUsers || 0) - (stats?.activeUsers || 0) - (stats?.pendingUsers || 0), color: '#6B7280' }
  ]

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats?.totalUsers || 0,
      icon: Users,
      change: '+12%',
      changeType: 'increase' as const,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Aktif Tenant',
      value: stats?.totalTenants || 0,
      icon: Building2,
      change: '+8%',
      changeType: 'increase' as const,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Bekleyen Onay',
      value: stats?.pendingUsers || 0,
      icon: Clock,
      change: '-3%',
      changeType: 'decrease' as const,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Aktif Kullanıcı',
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      change: '+15%',
      changeType: 'increase' as const,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">MedSAS sistem genel durumu ve performans metrikleri</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date().toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const ChangeIcon = card.changeType === 'increase' ? ArrowUpRight : ArrowDownRight
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`${card.bgColor} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <ChangeIcon className="h-4 w-4 mr-1" />
                  {card.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Büyüme</h3>
              <p className="text-sm text-gray-600">Kullanıcı ve tenant artışı</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" className="chart-container">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="users" name="Kullanıcılar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tenants" name="Tenantlar" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kullanıcı Durumu</h3>
              <p className="text-sm text-gray-600">Dağılım grafiği</p>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" className="chart-container">
              <RechartsPieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Pie data={userStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {userStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {userStatusData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hızlı Erişim */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Hızlı Erişim</h2>
            <p className="text-sm text-gray-600 mt-1">Sık kullanılan işlemler</p>
          </div>
          <div className="p-6 space-y-3">
            <a
              href="/admin/users"
              className="group flex items-center justify-between p-4 text-sm text-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 border border-yellow-200"
            >
              <div className="flex items-center">
                <div className="bg-yellow-500 rounded-lg p-2 mr-3">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Bekleyen Kullanıcılar</p>
                  <p className="text-xs text-gray-500">Onay bekleyen kayıtlar</p>
                </div>
              </div>
              <div className="flex items-center">
                {stats?.pendingUsers && stats.pendingUsers > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                    {stats.pendingUsers}
                  </span>
                )}
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </a>
            
            <a
              href="/admin/tenants"
              className="group flex items-center justify-between p-4 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200"
            >
              <div className="flex items-center">
                <div className="bg-green-500 rounded-lg p-2 mr-3">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tenant Yönetimi</p>
                  <p className="text-xs text-gray-500">Kurumsal hesaplar</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </a>
            
            <a
              href="/admin/users/all"
              className="group flex items-center justify-between p-4 text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200"
            >
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-lg p-2 mr-3">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tüm Kullanıcılar</p>
                  <p className="text-xs text-gray-500">Kullanıcı listesi</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </a>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
                <p className="text-sm text-gray-600 mt-1">Sistemdeki son hareketler</p>
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Yeni
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Henüz aktivite yok</p>
                <p className="text-xs text-gray-500">Sistem aktiviteleri burada görünecek</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sistem Durumu ve Performans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sistem Durumu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sistem Durumu</h2>
                <p className="text-sm text-gray-600 mt-1">Tüm sistemler çalışır durumda</p>
              </div>
              <Shield className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Veritabanı</p>
                    <p className="text-xs text-gray-600">PostgreSQL 15.0</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Çalışıyor</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">API Servisi</p>
                    <p className="text-xs text-gray-600">Next.js 14.2</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Çalışıyor</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Servisi</p>
                    <p className="text-xs text-gray-600">SMTP Aktif</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Hazır</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performans İstatistikleri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Performans</h2>
                <p className="text-sm text-gray-600 mt-1">Sistem performans metrikleri</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Kullanımı</span>
                  <span className="text-sm text-gray-900">23%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Bellek Kullanımı</span>
                  <span className="text-sm text-gray-900">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Disk Kullanımı</span>
                  <span className="text-sm text-gray-900">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Ortalama Yanıt Süresi</span>
                  <span className="text-sm font-bold text-green-600">127ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}