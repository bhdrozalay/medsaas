'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  BarChart3, 
  Calendar, 
  Clock,
  Eye, 
  TrendingUp,
  TrendingDown,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Loader2
} from 'lucide-react'
import Modal from '../ui/Modal'

interface UserStatsModalProps {
  isOpen: boolean
  onClose: () => void
  onExportData: (userId: string) => Promise<void>
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    createdAt: string
  }
}

interface UserStats {
  overview: {
    totalLogins: number
    lastLoginAt?: string
    totalSessionTime: number // in minutes
    accountAge: number // in days
  }
  activity: {
    loginsByMonth: Array<{ month: string; count: number }>
    sessionsByDevice: Array<{ device: string; count: number }>
    activityByHour: Array<{ hour: number; count: number }>
  }
  usage: {
    pagesVisited: number
    featuresUsed: string[]
    averageSessionTime: number // in minutes
    peakUsageHour: number
  }
  security: {
    failedLoginAttempts: number
    lastPasswordChange?: string
    twoFactorEnabled: boolean
    suspiciousActivity: number
  }
}

export default function UserStatsModal({ 
  isOpen, 
  onClose, 
  onExportData,
  user 
}: UserStatsModalProps) {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email

  // Mock data - gerçek API'den gelecek
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      // Simulated API call
      setTimeout(() => {
        setStats({
          overview: {
            totalLogins: 142,
            lastLoginAt: '2024-01-15T09:30:00Z',
            totalSessionTime: 2840, // 47.3 hours
            accountAge: 89
          },
          activity: {
            loginsByMonth: [
              { month: 'Oca', count: 45 },
              { month: 'Şub', count: 38 },
              { month: 'Mar', count: 42 },
              { month: 'Nis', count: 17 }
            ],
            sessionsByDevice: [
              { device: 'Desktop', count: 85 },
              { device: 'Mobile', count: 42 },
              { device: 'Tablet', count: 15 }
            ],
            activityByHour: [
              { hour: 8, count: 12 },
              { hour: 9, count: 18 },
              { hour: 10, count: 25 },
              { hour: 11, count: 22 },
              { hour: 14, count: 15 },
              { hour: 15, count: 20 },
              { hour: 16, count: 16 }
            ]
          },
          usage: {
            pagesVisited: 1247,
            featuresUsed: ['Raporlar', 'Kullanıcı Yönetimi', 'Dashboard', 'Ayarlar', 'Profil'],
            averageSessionTime: 20,
            peakUsageHour: 10
          },
          security: {
            failedLoginAttempts: 3,
            lastPasswordChange: '2023-12-01T00:00:00Z',
            twoFactorEnabled: true,
            suspiciousActivity: 0
          }
        })
        setLoading(false)
      }, 1000)
    }
  }, [isOpen])

  const handleExport = async () => {
    setExporting(true)
    try {
      await onExportData(user.id)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} dk`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}s ${remainingMinutes}dk`
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Desktop': return <Monitor className="h-4 w-4" />
      case 'Mobile': return <Smartphone className="h-4 w-4" />
      case 'Tablet': return <Globe className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const maxLoginCount = Math.max(...(stats?.activity.loginsByMonth.map(m => m.count) || [1]))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`İstatistikler - ${fullName}`}
      size="xl"
      showCloseButton
    >
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">İstatistikler yükleniyor...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Toplam Giriş</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.overview.totalLogins}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Toplam Süre</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatDuration(stats.overview.totalSessionTime)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Hesap Yaşı</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.overview.accountAge} gün</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Sayfa Ziyareti</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.usage.pagesVisited}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Login Trend */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Aylık Giriş Trendi</h3>
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                </div>
                <div className="space-y-3">
                  {stats.activity.loginsByMonth.map((month) => (
                    <div key={month.month} className="flex items-center">
                      <span className="w-8 text-sm text-gray-600">{month.month}</span>
                      <div className="flex-1 ml-3">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(month.count / maxLoginCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900 w-8">{month.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Usage */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cihaz Kullanımı</h3>
                  <Monitor className="h-5 w-5 text-gray-500" />
                </div>
                <div className="space-y-4">
                  {stats.activity.sessionsByDevice.map((device) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getDeviceIcon(device.device)}
                        <span className="ml-2 text-sm text-gray-900">{device.device}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{device.count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${(device.count / stats.overview.totalLogins) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Usage Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature Usage */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanılan Özellikler</h3>
                <div className="space-y-2">
                  {stats.usage.featuresUsed.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-700">{feature}</span>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">Aktif</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Durumu</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Başarısız Giriş</span>
                    <span className={`text-sm font-medium ${
                      stats.security.failedLoginAttempts > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {stats.security.failedLoginAttempts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">İki Faktörlü Doğrulama</span>
                    <span className={`text-sm font-medium ${
                      stats.security.twoFactorEnabled ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.security.twoFactorEnabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Şüpheli Aktivite</span>
                    <span className={`text-sm font-medium ${
                      stats.security.suspiciousActivity > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {stats.security.suspiciousActivity}
                    </span>
                  </div>
                  {stats.security.lastPasswordChange && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Son Şifre Değişikliği</span>
                      <span className="text-sm text-gray-600">
                        {new Date(stats.security.lastPasswordChange).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Ortalama Oturum</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(stats.usage.averageSessionTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">En Aktif Saat</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.usage.peakUsageHour}:00
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Son Giriş</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.overview.lastLoginAt 
                      ? new Date(stats.overview.lastLoginAt).toLocaleDateString('tr-TR')
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Güvenlik Skoru</p>
                  <p className="text-lg font-semibold text-green-600">
                    {stats.security.twoFactorEnabled && stats.security.suspiciousActivity === 0 ? 'Yüksek' : 'Orta'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Dışa Aktarılıyor...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Verileri Dışa Aktar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">İstatistik verileri yüklenemedi</p>
          </div>
        )}
      </div>
    </Modal>
  )
}