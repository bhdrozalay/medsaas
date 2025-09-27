'use client'

import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Shield, 
  UserCheck, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Globe,
  MapPin,
  Edit
} from 'lucide-react'
import Modal from '../ui/Modal'

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER'
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | 'TRIAL_EXPIRED'
    createdAt: string
    updatedAt?: string
    tenant?: {
      name: string
      slug: string
    }
  }
}

export default function UserDetailModal({ 
  isOpen, 
  onClose, 
  onEdit,
  user 
}: UserDetailModalProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Shield className="h-5 w-5 text-purple-600" />
      case 'TENANT_ADMIN': return <UserCheck className="h-5 w-5 text-blue-600" />
      case 'TENANT_USER': return <Users className="h-5 w-5 text-gray-600" />
      default: return <Users className="h-5 w-5 text-gray-600" />
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'TENANT_ADMIN': return 'Tenant Admin'
      case 'TENANT_USER': return 'Kullanıcı'
      default: return role
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'TENANT_USER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'PENDING_APPROVAL': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-600" />
      case 'SUSPENDED': return <XCircle className="h-5 w-5 text-orange-600" />
      case 'TRIAL_EXPIRED': return <Clock className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif'
      case 'PENDING_APPROVAL': return 'Onay Bekliyor'
      case 'REJECTED': return 'Reddedildi'
      case 'SUSPENDED': return 'Askıya Alınmış'
      case 'TRIAL_EXPIRED': return 'Deneme Süresi Bitmiş'
      default: return status
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800'
      case 'TRIAL_EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kullanıcı Detayları"
      size="lg"
    >
      <div className="p-6">
        {/* User Avatar and Basic Info */}
        <div className="flex items-start space-x-6 mb-8">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{fullName}</h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {getRoleIcon(user.role)}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                  {getRoleText(user.role)}
                </span>
              </div>
              <div className="flex items-center">
                {getStatusIcon(user.status)}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                  {getStatusText(user.status)}
                </span>
              </div>
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </button>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
            
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">E-posta</p>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefon</p>
                  <p className="text-sm text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            {user.tenant && (
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Kurum</p>
                  <p className="text-sm text-gray-900">{user.tenant.name}</p>
                  <p className="text-xs text-gray-500">({user.tenant.slug})</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h3>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Kayıt Tarihi</p>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {user.updatedAt && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Son Güncelleme</p>
                  <p className="text-sm text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Kullanıcı ID</p>
                <p className="text-sm text-gray-900 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivite Özeti</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Son Giriş</p>
                  <p className="text-lg font-bold text-gray-900">2 saat önce</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Toplam Giriş</p>
                  <p className="text-lg font-bold text-gray-900">127</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Aktif Günler</p>
                  <p className="text-lg font-bold text-gray-900">45</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Kapat
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Düzenle
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}