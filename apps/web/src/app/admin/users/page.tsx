'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye, AlertCircle, RefreshCw, Building2, Mail, Calendar } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  tenantName: string
  tenantId: string
  fullName?: string
  createdAt: string
  approvalStatus: string
}

export default function AdminPendingUsers() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/pending-users', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.users)
      }
    } catch (error) {
      console.error('Bekleyen kullanıcılar alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(userId)
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          action
        })
      })

      if (response.ok) {
        // Listeyi yenile
        await fetchPendingUsers()
        
        // Success mesajı (opsiyonel - toast notification)
        console.log(`Kullanıcı ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`)
      } else {
        console.error('İşlem başarısız')
      }
    } catch (error) {
      console.error('İşlem hatası:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bekleyen Kullanıcılar</h1>
          <p className="mt-2 text-gray-600">
            Onay bekleyen kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={fetchPendingUsers}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="bg-yellow-500 rounded-lg p-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Bekleyen Onay</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pendingUsers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bekleyen kullanıcı bulunmuyor
            </h3>
            <p className="text-gray-500">
              Tüm kullanıcı kayıtları işlenmiş durumda.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pendingUsers.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {user.tenantName}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Detay Butonu */}
                    <button
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        // Modal açma veya detay sayfasına yönlendirme
                        console.log('Detay:', user)
                      }}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Detay
                    </button>
                    
                    {/* Onay Butonu */}
                    <button
                      onClick={() => handleApproval(user.id, 'approve')}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {actionLoading === user.id ? (
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-3 w-3" />
                      )}
                      Onayla
                    </button>
                    
                    {/* Red Butonu */}
                    <button
                      onClick={() => handleApproval(user.id, 'reject')}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {actionLoading === user.id ? (
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      Reddet
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bulk Actions (Gelecekte eklenebilir) */}
      {pendingUsers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Toplu İşlemler</h3>
          <p className="text-xs text-gray-500">
            Gelecek sürümlerde toplu onay/red işlemleri eklenecek.
          </p>
        </div>
      )}
    </div>
  )
}