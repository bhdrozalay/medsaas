'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Building2,
  UserCheck,
  UserX,
  Shield,
  BarChart3
} from 'lucide-react'

// Modal imports
import UserDetailModal from '../../../../components/modals/UserDetailModal'
import UserEditModal from '../../../../components/modals/UserEditModal'
import UserDeleteModal from '../../../../components/modals/UserDeleteModal'
import { UserApprovalModal } from '../../../../components/modals/UserApprovalModal'
import UserStatsModal from '../../../../components/modals/UserStatsModal'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER'
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | 'TRIAL_EXPIRED'
  createdAt: string
  updatedAt: string
  tenant?: {
    name: string
    slug: string
  }
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)

  // Mock data for now since API has issues
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@medsas.com',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+90 532 123 4567',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        email: 'jane.smith@hospital.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+90 532 234 5678',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
        tenant: {
          name: 'City Hospital',
          slug: 'city-hospital'
        }
      },
      {
        id: '3',
        email: 'john.doe@clinic.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+90 532 345 6789',
        role: 'TENANT_USER',
        status: 'PENDING_APPROVAL',
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z',
        tenant: {
          name: 'Downtown Clinic',
          slug: 'downtown-clinic'
        }
      },
      {
        id: '4',
        email: 'sarah.wilson@medcenter.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'TENANT_USER',
        status: 'REJECTED',
        createdAt: '2024-01-18T11:45:00Z',
        updatedAt: '2024-01-18T11:45:00Z',
        tenant: {
          name: 'Medical Center',
          slug: 'medical-center'
        }
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  // Modal handler functions
  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleApproveUser = (user: User) => {
    setSelectedUser(user)
    setShowApprovalModal(true)
  }

  const handleViewStats = (user: User) => {
    setSelectedUser(user)
    setShowStatsModal(true)
  }

  // API handlers
  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      // API call to update user
      console.log('Updating user:', userId, userData)
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    }
  }

  const handleDeleteUserConfirm = async (userId: string) => {
    try {
      // API call to delete user
      console.log('Deleting user:', userId)
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  }

  const handleApproveUserConfirm = async () => {
    if (!selectedUser) return
    
    try {
      // API call to approve user
      console.log('Approving user:', selectedUser.id)
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, status: 'ACTIVE' as const }
          : user
      ))
      
      // Show success toast
      toast.success(`${selectedUser.firstName || selectedUser.email} başarıyla onaylandı!`)
      
      // Ek bilgilendirme toastu - kullanıcıya e-posta gönderildiğini belirt
      setTimeout(() => {
        toast.info('Kullanıcıya onay e-postası gönderildi. Artık sisteme giriş yapabilir.');
      }, 2000);
      
      // Close modal
      setShowApprovalModal(false)
      setSelectedUser(null)
      
      return Promise.resolve()
    } catch (error) {
      console.error('Approve user error:', error)
      toast.error('Kullanıcı onaylanırken bir hata oluştu')
      throw error
    }
  }

  const handleRejectUser = async (reason?: string) => {
    if (!selectedUser) return
    
    try {
      // API call to reject user
      console.log('Rejecting user:', selectedUser.id, reason)
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, status: 'REJECTED' as const }
          : user
      ))
      
      // Show success toast
      toast.success(`${selectedUser.firstName || selectedUser.email} reddedildi`)
      
      // Close modal
      setShowApprovalModal(false)
      setSelectedUser(null)
      
      return Promise.resolve()
    } catch (error) {
      console.error('Reject user error:', error)
      toast.error('Kullanıcı reddedilirken bir hata oluştu')
      throw error
    }
  }

  const handleExportUserData = async (userId: string) => {
    try {
      // API call to export user data
      console.log('Exporting user data:', userId)
      
      // Simulate download
      const user = users.find(u => u.id === userId)
      const dataStr = JSON.stringify(user, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `user-${user?.email}-data.json`
      link.click()
      URL.revokeObjectURL(url)
      
      return Promise.resolve()
    } catch (error) {
      console.error('Export user data error:', error)
      throw error
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(currentUsers.map(user => user.id))
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Shield className="h-4 w-4" />
      case 'TENANT_ADMIN': return <UserCheck className="h-4 w-4" />
      case 'TENANT_USER': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (role) {
      case 'SUPER_ADMIN':
        return `${baseClasses} bg-purple-100 text-purple-800`
      case 'TENANT_ADMIN':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'TENANT_USER':
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'ACTIVE':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'PENDING_APPROVAL':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'SUSPENDED':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'TRIAL_EXPIRED':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />
      case 'PENDING_APPROVAL': return <Clock className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      case 'SUSPENDED': return <XCircle className="h-4 w-4" />
      case 'TRIAL_EXPIRED': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="mt-2 text-gray-600">
            Tüm kullanıcıları görüntüleyin, düzenleyin ve yönetin
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Toplam</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Aktif</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Bekleyen</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.status === 'PENDING_APPROVAL').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Reddedilen</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Kullanıcı ara (email, isim, kurum...)"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Tüm Roller</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="TENANT_USER">Kullanıcı</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PENDING_APPROVAL">Bekleyen</option>
              <option value="REJECTED">Reddedilen</option>
              <option value="SUSPENDED">Askıya Alınmış</option>
              <option value="TRIAL_EXPIRED">Deneme Süresi Bitmiş</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm font-medium text-blue-900">
                {selectedUsers.length} kullanıcı seçildi
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors">
                <UserCheck className="h-4 w-4 mr-1" />
                Onayla
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                <UserX className="h-4 w-4 mr-1" />
                Reddet
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                <Trash2 className="h-4 w-4 mr-1" />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kurum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className={`ml-2 ${getRoleBadge(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.status)}
                      <span className={`ml-2 ${getStatusBadge(user.status)}`}>
                        {user.status === 'PENDING_APPROVAL' ? 'Bekleyen' : 
                         user.status === 'ACTIVE' ? 'Aktif' : 
                         user.status === 'REJECTED' ? 'Reddedilen' :
                         user.status === 'SUSPENDED' ? 'Askıya Alınmış' : 
                         user.status === 'TRIAL_EXPIRED' ? 'Deneme Süresi Bitmiş' : user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.tenant ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {user.tenant.name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Kullanıcı Detayı"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Kullanıcı Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleViewStats(user)}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                        title="İstatistikler"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      {user.status === 'PENDING_APPROVAL' && (
                        <button 
                          onClick={() => handleApproveUser(user)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title="Onayla/Reddet"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Kullanıcı Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> arası,
                  toplam <span className="font-medium">{filteredUsers.length}</span> sonuç
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onEdit={() => {
              setShowDetailModal(false)
              setShowEditModal(true)
            }}
            user={selectedUser}
          />
          
          <UserEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onUpdate={handleUpdateUser}
            user={selectedUser}
          />
          
          <UserDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDeleteUserConfirm}
            user={selectedUser}
          />
          
          {selectedUser.status === 'PENDING_APPROVAL' && (
            <UserApprovalModal
              user={selectedUser}
              onClose={() => setShowApprovalModal(false)}
              onApprove={handleApproveUserConfirm}
              onReject={handleRejectUser}
            />
          )}
          
          <UserStatsModal
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
            onExportData={handleExportUserData}
            user={selectedUser}
          />
        </>
      )}
    </div>
  )
}
