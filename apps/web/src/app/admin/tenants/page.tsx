'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Download,
  User,
  Building,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Crown
} from 'lucide-react'
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
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast, Toaster } from 'sonner'
import { UserApprovalModal } from '../../../components/modals/UserApprovalModal'
import { UserDeleteModal } from '../../../components/modals/UserDeleteModal'
import { TrialDaysModal } from '../../../components/modals/TrialDaysModal'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  tenantName?: string
  phone?: string
  status: string
  trialStartDate?: string
  trialEndDate?: string
  extraTrialDays: number
  createdAt: string
  paymentStatus?: 'success' | 'pending' | 'failed' | 'unknown'
  subscriptionStatus?: 'demo' | 'subscribed' | 'expired'
  subscriptionDetails?: {
    planId?: string
    planName?: string
    planDisplayName?: string
    price?: number
    duration?: string
    durationText?: string
    activatedAt?: string
    trialEndDate?: string
    currentPeriodEnd?: string
    expiresAt?: string
    paymentStatus?: string
  }
}

interface TrialAction {
  userId: string
  days: number
  action: 'add' | 'subtract' | 'set'
}


export default function TenantManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTrialDaysModal, setShowTrialDaysModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'demo' | 'subscribed' | 'expired' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // New user creation states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    tenantName: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
    trialDays: 30
  })
  const [createUserLoading, setCreateUserLoading] = useState(false)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-muted-foreground" />
      : <ArrowDown className="h-4 w-4 text-muted-foreground" />
  }

  const resolveTenantName = (tenantPayload: any, userPayload: any): string => {
    const subscriptionDetails = userPayload?.subscriptionDetails ?? {}
    const subscriptionDetailsRecord =
      subscriptionDetails && typeof subscriptionDetails === 'object'
        ? (subscriptionDetails as Record<string, unknown>)
        : undefined

    const organizationRaw = subscriptionDetailsRecord?.['organization']
    const metadataRaw = subscriptionDetailsRecord?.['metadata']

    const organization =
      organizationRaw && typeof organizationRaw === 'object'
        ? (organizationRaw as Record<string, unknown>)
        : undefined

    const metadata =
      metadataRaw && typeof metadataRaw === 'object'
        ? (metadataRaw as Record<string, unknown>)
        : undefined

    const candidates = [
      userPayload?.tenantName,
      tenantPayload?.tenantName,
      subscriptionDetailsRecord?.['tenantName'],
      subscriptionDetailsRecord?.['organizationName'],
      subscriptionDetailsRecord?.['companyName'],
      organization?.['name'],
      organization?.['companyName'],
      metadata?.['organizationName'],
      metadata?.['companyName']
    ]

    for (const value of candidates) {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length > 0 && trimmed.toLowerCase() !== 'bireysel kullanıcı') {
          return trimmed
        }
      }
    }

    if (tenantPayload?.tenantName && tenantPayload.tenantName.trim().length > 0) {
      return tenantPayload.tenantName
    }

    if (userPayload?.tenantName && userPayload.tenantName.trim().length > 0) {
      return userPayload.tenantName
    }

    return 'Bireysel Kullanıcı'
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Doğru API'yi kullan - tenants API sadece ödeme yapmış kullanıcıları döndürüyor
      const response = await fetch('/api/admin/tenants')
      if (response.ok) {
        const data = await response.json()
        const tenants = data.tenants || []
        
        // Tenant'lardan kullanıcıları çıkar
        const usersWithSubscription: User[] = []

        for (const tenant of tenants) {
          for (const user of tenant.users || []) {
            const resolvedTenantName = resolveTenantName(tenant, user)
            const userWithTenantInfo = {
              id: user.id, // Use real user ID from database
              email: user.email,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              tenantName: resolvedTenantName,
              phone: user.phone || '',
              status: user.approvalStatus,
              trialStartDate: user.trialStartDate,
              trialEndDate: user.trialEndDate,
              extraTrialDays: user.extraTrialDays || 0,
              createdAt: user.createdAt,
              paymentStatus: user.paymentStatus || 'unknown',
              subscriptionStatus: user.subscriptionStatus,
              subscriptionDetails: user.subscriptionDetails
            }
            usersWithSubscription.push(userWithTenantInfo)
          }
        }
        
        setUsers(usersWithSubscription)
      }
    } catch (error) {
      console.error('Kullanıcılar alınırken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchUsers()
        const user = users.find(u => u.id === userId)
        toast.success(`${user?.firstName || user?.email} başarıyla onaylandı!`)
        
        // Ek bilgilendirme toastu
        setTimeout(() => {
          toast.info('Kullanıcıya onay e-postası gönderildi. Artık sisteme giriş yapabilir.');
        }, 2000);
        
        setShowApprovalModal(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Onaylama işlemi başarısız')
      }
    } catch (error) {
      console.error('Onaylama hatası:', error)
      toast.error('Onaylama işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string, reason?: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      
      if (response.ok) {
        await fetchUsers()
        const user = users.find(u => u.id === userId)
        toast.success(`${user?.firstName || user?.email} reddedildi`)
        setShowApprovalModal(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Reddetme işlemi başarısız')
      }
    } catch (error) {
      console.error('Reddetme hatası:', error)
      toast.error('Reddetme işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTrialDaysModalSave = async (userId: string, days: number, action: 'add' | 'subtract' | 'set') => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/trial-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, action })
      })
      
      if (response.ok) {
        await fetchUsers()
        setShowTrialDaysModal(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Süre güncelleme işlemi başarısız')
      }
    } catch (error) {
      console.error('Süre güncelleme hatası:', error)
      alert('Süre güncelleme işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateUser = async () => {
    try {
      setCreateUserLoading(true)
      
      // Basic validation
      if (!newUserData.email || !newUserData.firstName || !newUserData.lastName) {
        toast.error('Email, ad ve soyad alanları zorunludur!')
        return
      }
      
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Reset form first
        setNewUserData({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          tenantName: '',
          role: 'USER',
          trialDays: 30
        })
        
        // Close modal
        setShowCreateUserModal(false)
        
        // Refresh user data
        await fetchUsers()
        
        // Copy to clipboard and show success toast
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(result.tempPassword)
            toast.success(
              `Kullanıcı başarıyla oluşturuldu! Geçici şifre panoya kopyalandı.`,
              {
                description: `Geçici şifre: ${result.tempPassword}`,
                duration: 8000,
                action: {
                  label: 'Kopyala',
                  onClick: () => navigator.clipboard.writeText(result.tempPassword)
                }
              }
            )
          } catch (err) {
            toast.success(
              `Kullanıcı başarıyla oluşturuldu!`,
              {
                description: `Geçici şifre: ${result.tempPassword} (Lütfen not alın)`,
                duration: 10000
              }
            )
          }
        } else {
          toast.success(
            `Kullanıcı başarıyla oluşturuldu!`,
            {
              description: `Geçici şifre: ${result.tempPassword} (Lütfen not alın)`,
              duration: 10000
            }
          )
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kullanıcı oluşturma işlemi başarısız')
      }
    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error)
      toast.error('Kullanıcı oluşturma işlemi sırasında bir hata oluştu')
    } finally {
      setCreateUserLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Durum güncelleme işlemi başarısız')
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error)
      alert('Durum güncelleme işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchUsers()
        setShowDeleteModal(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('Silme işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setActionLoading('bulk')
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers })
      })
      
      if (response.ok) {
        await fetchUsers()
        setSelectedUsers([])
        setShowBulkDeleteModal(false)
        alert(`${selectedUsers.length} kullanıcı başarıyla silindi`)
      } else {
        const error = await response.json()
        alert(error.error || 'Toplu silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error)
      alert('Toplu silme işlemi sırasında bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }


  const getUserEndDate = (user: User): string | null => {
    if (user.subscriptionDetails?.trialEndDate) {
      return user.subscriptionDetails.trialEndDate
    }
    if (user.subscriptionDetails?.currentPeriodEnd) {
      return user.subscriptionDetails.currentPeriodEnd
    }
    if (user.subscriptionDetails?.expiresAt) {
      return user.subscriptionDetails.expiresAt
    }
    if (user.trialEndDate) {
      return user.trialEndDate
    }
    return null
  }

  const getDaysLeftFromDate = (dateString?: string | null): number | null => {
    if (!dateString) return null
    const target = new Date(dateString)
    if (Number.isNaN(target.getTime())) return null
    const diffTime = target.getTime() - Date.now()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getTrialDaysLeft = (user: User) => {
    if (user.paymentStatus === 'failed') {
      return -1
    }
    const endDate = getUserEndDate(user)
    return getDaysLeftFromDate(endDate)
  }

  const isUserTrialExpired = (user: User) => {
    if (user.status === 'TRIAL_EXPIRED' || user.paymentStatus === 'failed') return true
    const daysLeft = getTrialDaysLeft(user)
    return daysLeft !== null && daysLeft <= 0
  }

  const filteredAndSortedUsers = users.filter(user => {
    // Status filter - Tüm durumlar için filtreleme
    let statusMatch = true
    switch (filter) {
      case 'subscribed':
        statusMatch = user.paymentStatus === 'success'
        break
      case 'pending':
        statusMatch = user.status === 'PENDING_VERIFICATION'
        break
      case 'expired':
        statusMatch = user.paymentStatus === 'failed' || isUserTrialExpired(user)
        break
      case 'demo':
        // Bu sayfada demo kullanıcıları göstermiyoruz
        statusMatch = false
        break
      default:
        statusMatch = true
    }
    
    // Search filter
    const searchMatch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenantName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusMatch && searchMatch
  }).sort((a, b) => {
    if (!sortField) return 0
    
    let aValue: any
    let bValue: any
    
    switch (sortField) {
      case 'name':
        aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase()
        bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase()
        break
      case 'email':
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        break
      case 'tenantName':
        aValue = (a.tenantName || '').toLowerCase()
        bValue = (b.tenantName || '').toLowerCase()
        break
      case 'status':
        aValue = a.status.toLowerCase()
        bValue = b.status.toLowerCase()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'endDate': {
        const aDate = getUserEndDate(a)
        const bDate = getUserEndDate(b)
        const aTime = aDate ? new Date(aDate).getTime() : Number.POSITIVE_INFINITY
        const bTime = bDate ? new Date(bDate).getTime() : Number.POSITIVE_INFINITY
        aValue = aTime
        bValue = bTime
        break
      }
      default:
        return 0
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1
    }
    return 0
  })

  const getStatusBadge = (user: User) => {
    const daysLeft = getTrialDaysLeft(user)

    // Önce abonelik durumuna bak
    if (user.subscriptionDetails) {
      const planName = user.subscriptionDetails.planDisplayName || user.subscriptionDetails.planName
      const durationText = user.subscriptionDetails.durationText || ''
      if (planName) {
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <span className="flex items-center">
              <Crown className="h-3 w-3 mr-1" />
              <span>{planName} {durationText && `(${durationText})`}</span>
            </span>
          </Badge>
        )
      }
    }
    
    if (isUserTrialExpired(user)) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Süresi Doldu</Badge>
    }
    if (user.status === 'PENDING_VERIFICATION') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Bekliyor</Badge>
    }
    if (user.status === 'REJECTED') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Reddedildi</Badge>
    }
    if (user.status === 'ACTIVE' && daysLeft !== null) {
      if (daysLeft <= 0) {
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Süresi Geçti</Badge>
      } else if (daysLeft <= 3) {
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{daysLeft} gün kaldı</Badge>
      } else {
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Demo ({daysLeft} gün)</Badge>
      }
    }
    if (user.status === 'ACTIVE') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif</Badge>
    }
    return <Badge variant="outline">{user.status}</Badge>
  }

  const getPaymentStatusBadge = (user: User) => {
    const status = user.paymentStatus || 'unknown'

    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Ödeme Alındı
            </span>
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Ödeme Bekleniyor
            </span>
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Ödeme Başarısız
            </span>
          </Badge>
        )
      default: {
        if (user.subscriptionStatus === 'demo') {
          return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Demo Süreç
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Bilgi Yok
          </Badge>
        )
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Stats calculation - Tenant yönetimi için abonelik odaklı istatistikler
  const stats = {
    total: users.length,
    demo: users.filter(u => u.subscriptionStatus === 'demo').length,
    subscribed: users.filter(u => u.paymentStatus === 'success').length,
    expired: users.filter(u => u.paymentStatus === 'failed').length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING_VERIFICATION').length
  }

  // Chart data
  const pieChartData = [
    { name: 'Abonelik', value: stats.subscribed, color: '#8b5cf6' },
    { name: 'Bekleyen', value: stats.pending, color: '#6b7280' },
    { name: 'Süresi Dolan', value: stats.expired, color: '#ef4444' },
    { name: 'Demo', value: stats.demo, color: '#f59e0b' },
  ].filter(item => item.value > 0)

  // Helper function to generate mini chart data with realistic trends
  const generateMiniChartData = (currentValue: number, trendType: 'growth' | 'decline' | 'stable' = 'growth', points: number = 7) => {
    if (currentValue === 0) {
      return Array(points).fill({ value: 0 })
    }
    
    const data = []
    const maxVariation = Math.max(1, Math.floor(currentValue * 0.2)) // 20% max variation
    
    // Calculate starting value based on trend
    let startValue: number
    switch (trendType) {
      case 'growth':
        // Start from 60-80% of current value for growth trend
        startValue = Math.max(1, Math.floor(currentValue * (0.6 + Math.random() * 0.2)))
        break
      case 'decline':
        // Start from 120-150% of current value for decline trend
        startValue = Math.floor(currentValue * (1.2 + Math.random() * 0.3))
        break
      case 'stable':
        // Start close to current value for stable trend
        startValue = Math.max(1, currentValue + (Math.random() - 0.5) * maxVariation)
        break
    }
    
    // Generate points with trend
    for (let i = 0; i < points - 1; i++) {
      const progress = i / (points - 2) // 0 to 1
      let targetValue: number
      
      if (trendType === 'growth') {
        // Gradual increase from start to current
        targetValue = startValue + (currentValue - startValue) * progress
      } else if (trendType === 'decline') {
        // Gradual decrease from start to current
        targetValue = startValue - (startValue - currentValue) * progress
      } else {
        // Stable with small variations
        targetValue = currentValue + (Math.random() - 0.5) * maxVariation * 0.5
      }
      
      // Add some randomness but keep the trend
      const randomFactor = (Math.random() - 0.5) * maxVariation * 0.3
      const value = Math.max(0, Math.round(targetValue + randomFactor))
      data.push({ value })
    }
    
    // Last point is always the current value
    data.push({ value: currentValue })
    return data
  }

  // Mini chart data for stats cards
  const totalUsersChartData = generateMiniChartData(stats.total, 'growth')
  const demoChartData = generateMiniChartData(stats.demo, 'stable')
  const subscribedChartData = generateMiniChartData(stats.subscribed, 'growth')
  const expiredChartData = generateMiniChartData(stats.expired, 'decline')
  const activeChartData = generateMiniChartData(stats.active, 'growth')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tenant Yönetimi
              </h1>
              <p className="mt-2 text-gray-600 text-sm">
                Ödeme yapmış kullanıcıların abonelik durumlarını görüntüleyin ve yönetin
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedUsers.length > 0 && (
                <Button
                  onClick={() => setShowBulkDeleteModal(true)}
                  disabled={actionLoading === 'bulk'}
                  variant="destructive"
                  size="sm"
                  className="shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {selectedUsers.length} Kullanıcıyı Sil
                </Button>
              )}
              <Button
                onClick={fetchUsers}
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
              <Button
                onClick={() => setShowCreateUserModal(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Kullanıcı Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Toplam Abonelik */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Toplam Abonelik</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? (
                    <span className="text-blue-600">Ödeme yapmış kullanıcı</span>
                  ) : (
                    <span className="text-gray-500">Henüz abonelik yok</span>
                  )}
                </p>
              </div>
              {/* Mini Line Chart */}
              <div className="h-10 w-full mt-3">
                {stats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={totalUsersChartData}>
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


          {/* Abonelik Kullanıcılar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Abonelik Kullanıcı</p>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.subscribed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? (
                    <span className="text-purple-600">{Math.round((stats.subscribed / stats.total) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              {/* Mini Area Chart */}
              <div className="h-10 w-full mt-3">
                {stats.subscribed > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={subscribedChartData}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="currentColor" 
                        fill="currentColor"
                        className="fill-purple-200 stroke-purple-400"
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

          {/* Süresi Bitenler */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Süresi Dolan</p>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.expired}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? (
                    <span className="text-red-600">{Math.round((stats.expired / stats.total) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              {/* Mini Area Chart */}
              <div className="h-10 w-full mt-3">
                {stats.expired > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expiredChartData}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="currentColor" 
                        fill="currentColor"
                        className="fill-red-200 stroke-red-400"
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

          {/* Aktif Abonelikler */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Aktif Hesap</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? (
                    <span className="text-green-600">{Math.round((stats.active / stats.total) * 100)}%</span>
                  ) : (
                    <span className="text-gray-500">0%</span>
                  )} toplam
                </p>
              </div>
              {/* Mini Line Chart */}
              <div className="h-10 w-full mt-3">
                {stats.active > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeChartData}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="currentColor" 
                        strokeWidth={1}
                        dot={false}
                        className="stroke-green-400"
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kullanıcı, email veya şirket ara..."
                  className="pl-8"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 lg:ml-auto">
                <Button
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? "default" : "outline"}
                  size="sm"
                  className={filter === 'all' ? "bg-slate-900 text-white" : "hover:bg-slate-100"}
                >
                  Tüm Abonelikler ({stats.total})
                </Button>
                <Button
                  onClick={() => setFilter('subscribed')}
                  variant={filter === 'subscribed' ? "default" : "outline"}
                  size="sm"
                  className={filter === 'subscribed' 
                    ? "bg-purple-500 text-white hover:bg-purple-600" 
                    : "hover:bg-purple-50 border-purple-200 text-purple-700"}
                >
                  Aktif Abonelik ({stats.subscribed})
                </Button>
                <Button
                  onClick={() => setFilter('expired')}
                  variant={filter === 'expired' ? "default" : "outline"}
                  size="sm"
                  className={filter === 'expired' 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "hover:bg-red-50 border-red-200 text-red-700"}
                >
                  Süresi Dolan ({stats.expired})
                </Button>
                <Button
                  onClick={() => setFilter('pending')}
                  variant={filter === 'pending' ? "default" : "outline"}
                  size="sm"
                  className={filter === 'pending' 
                    ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                    : "hover:bg-yellow-50 border-yellow-200 text-yellow-700"}
                >
                  Bekleyen ({stats.pending})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table with shadcn/ui */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(filteredAndSortedUsers.map(u => u.id))
                        } else {
                          setSelectedUsers([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      Kullanıcı Bilgileri
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('tenantName')}>
                    <div className="flex items-center gap-2">
                      Firma Bilgileri
                      {getSortIcon('tenantName')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-2">
                      İletişim
                      {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">
                      Durum
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>Abonelik/Demo</TableHead>
                  <TableHead>Ödeme Durumu</TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-2">
                      Kayıt Tarihi
                      {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('endDate')}>
                    <div className="flex items-center gap-2">
                      Bitiş Süresi
                      {getSortIcon('endDate')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Spinner size="md" />
                        <span className="text-muted-foreground">Yüklenyor...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium mb-2">Kullanıcı bulunamadı</p>
                        <p className="text-sm">Bu filtrelere uygun kullanıcı bulunmuyor.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedUsers.map(user => (
                    <TableRow key={user.id}>
                      {/* Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                        />
                      </TableCell>
                      {/* User Info */}
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar>
                            <AvatarFallback>
                              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : 'İsim Belirtilmemiş'
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Company Info */}
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-muted-foreground mr-2" />
                          <div>
                            <div className="text-sm font-medium">
                              {user.tenantName || 'Belirtilmemiş'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Firma Adı
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-2" />
                            <span className="truncate max-w-[150px]">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-2" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>

                      {/* Subscription/Demo Info */}
                      <TableCell>
                        <div className="text-sm">
                          {user.subscriptionDetails ? (
                            <div className="space-y-1">
                              <div className="font-medium text-purple-600">
                                {user.subscriptionDetails.planDisplayName || user.subscriptionDetails.planName}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ₺{user.subscriptionDetails.price} / {user.subscriptionDetails.durationText || (user.subscriptionDetails.duration === 'yearly' ? 'yıllık' : 'aylık')}
                              </div>
                              {user.subscriptionDetails.activatedAt && (
                                <div className="text-green-600 text-xs font-medium flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {new Date(user.subscriptionDetails.activatedAt).toLocaleDateString('tr-TR')} tarihinden aktif
                                </div>
                              )}
                            </div>
                          ) : user.trialEndDate ? (
                            <div>
                              <div className="font-medium">
                                {getTrialDaysLeft(user) !== null 
                                  ? `${getTrialDaysLeft(user)} gün kaldı`
                                  : 'Süresi dolmuş'
                                }
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(user.trialEndDate).toLocaleDateString('tr-TR')}
                              </div>
                              {user.extraTrialDays > 0 && (
                                <div className="text-blue-600 text-xs font-medium">
                                  +{user.extraTrialDays} ek gün
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        {getPaymentStatusBadge(user)}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-2" />
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </TableCell>

                      {/* Expiry Date */}
                      <TableCell>
                        {(() => {
                          const endDateIso = getUserEndDate(user)
                          if (!endDateIso) {
                            return <span className="text-sm text-muted-foreground">Belirtilmemiş</span>
                          }

                          const formattedDate = new Date(endDateIso).toLocaleDateString('tr-TR')
                          const daysLeft = getDaysLeftFromDate(endDateIso)

                          let statusText = 'Tarih belirlenemedi'
                          let statusClass = 'text-muted-foreground'

                          if (daysLeft !== null) {
                            if (daysLeft > 0) {
                              statusText = `${daysLeft} gün kaldı`
                              statusClass = 'text-emerald-600'
                            } else if (daysLeft === 0) {
                              statusText = 'Bugün sona eriyor'
                              statusClass = 'text-orange-600'
                            } else {
                              statusText = `${Math.abs(daysLeft)} gün önce bitti`
                              statusClass = 'text-red-600'
                            }
                          }

                          return (
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-2" />
                                {formattedDate}
                              </div>
                              <div className={`font-medium ${statusClass}`}>
                                {statusText}
                              </div>
                            </div>
                          )
                        })()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'PENDING_VERIFICATION' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowApprovalModal(true)
                                }}
                                disabled={actionLoading === user.id}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowApprovalModal(true)
                                }}
                                disabled={actionLoading === user.id}
                                className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Reddet
                              </Button>
                            </>
                          )}
                          
                          {user.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowTrialDaysModal(true)
                              }}
                              disabled={actionLoading === user.id}
                              className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Süre
                            </Button>
                          )}
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal'lar */}
      {showApprovalModal && selectedUser && (
        <UserApprovalModal
          user={selectedUser}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedUser(null)
          }}
          onApprove={() => handleApprove(selectedUser.id)}
          onReject={(reason) => handleReject(selectedUser.id, reason)}
          loading={actionLoading === selectedUser.id}
        />
      )}

      {showDeleteModal && selectedUser && (
        <UserDeleteModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedUser(null)
          }}
          onConfirm={() => handleDelete(selectedUser.id)}
          loading={actionLoading === selectedUser.id}
        />
      )}

      {showTrialDaysModal && selectedUser && (
        <TrialDaysModal
          user={selectedUser}
          onClose={() => {
            setShowTrialDaysModal(false)
            setSelectedUser(null)
          }}
          onSave={handleTrialDaysModalSave}
          loading={actionLoading === selectedUser.id}
        />
      )}


      {/* Create User Modal */}
      {showCreateUserModal && (
        <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Yeni Kullanıcı Ekle
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Sisteme yeni bir kullanıcı ekleyin. Tüm zorunlu alanları doldurun.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad *</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData(prev => ({...prev, firstName: e.target.value}))}
                    placeholder="Kullanıcının adı"
                    disabled={createUserLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad *</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData(prev => ({...prev, lastName: e.target.value}))}
                    placeholder="Kullanıcının soyadı"
                    disabled={createUserLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({...prev, email: e.target.value}))}
                  placeholder="kullanici@ornek.com"
                  disabled={createUserLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+90 555 123 45 67"
                  disabled={createUserLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tenantName">Şirket/Kuruluş Adı</Label>
                <Input
                  id="tenantName"
                  value={newUserData.tenantName}
                  onChange={(e) => setNewUserData(prev => ({...prev, tenantName: e.target.value}))}
                  placeholder="ABC Şirketi"
                  disabled={createUserLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select 
                    value={newUserData.role} 
                    onValueChange={(value: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => 
                      setNewUserData(prev => ({...prev, role: value}))
                    }
                    disabled={createUserLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Kullanıcı</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Deneme Süresi (Gün)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="1"
                    max="365"
                    value={newUserData.trialDays}
                    onChange={(e) => setNewUserData(prev => ({...prev, trialDays: parseInt(e.target.value) || 30}))}
                    disabled={createUserLoading}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateUserModal(false)}
                disabled={createUserLoading}
              >
                İptal
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={createUserLoading || !newUserData.email || !newUserData.firstName || !newUserData.lastName}
                className="min-w-[120px] bg-green-600 hover:bg-green-700"
              >
                {createUserLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Oluşturuluyor...
                  </div>
                ) : (
                  <>Kullanıcı Ekle</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Toplu Kullanıcı Silme
            </h3>
            <p className="text-gray-600 mb-6">
              Seçili {selectedUsers.length} kullanıcıyı silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={actionLoading === 'bulk'}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={actionLoading === 'bulk'}
                className="min-w-[100px]"
              >
                {actionLoading === 'bulk' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Siliniyor...
                  </div>
                ) : (
                  <>Sil ({selectedUsers.length})</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center" 
        expand={true}
        richColors
        closeButton
      />
    </div>
  )
}
