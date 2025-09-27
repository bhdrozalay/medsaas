'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Settings, BarChart3, LogOut, Menu, X, Building2, UserCheck, ChevronLeft, ChevronRight, Package, GitBranch } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Geçici olarak hard-coded user bilgisi kullan
    setUser({
      id: '1',
      email: 'admin@medsas.com',
      role: 'SUPER_ADMIN'
    })
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('Çıkış hatası:', error)
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: BarChart3
    },
    {
      name: 'Modül Yönetimi',
      href: '/admin/modules',
      icon: Package
    },
    {
      name: 'Tenant-Modül Atama',
      href: '/admin/tenant-modules',
      icon: GitBranch
    },
    {
      name: 'Demo Talepler',
      href: '/admin/demo-requests',
      icon: UserCheck
    },
    {
      name: 'Tenant Yönetimi',
      href: '/admin/tenants',
      icon: Building2
    },
    {
      name: 'Kullanıcı Yönetimi',
      href: '/admin/users/all',
      icon: Users
    },
    {
      name: 'Ayarlar',
      href: '/admin/settings',
      icon: Settings
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="admin-layout bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'lg:w-16' : 'w-64'
      }`}>
        <div className={`flex items-center h-16 border-b border-gray-200 ${
          sidebarCollapsed ? 'justify-center px-4' : 'justify-between px-6'
        }`}>
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">MedSAS Admin</h1>
          )}
          <div className="flex items-center space-x-2">
            {/* Desktop collapse button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={sidebarCollapsed ? 'Sidebarı Aç' : 'Sidebarı Kapat'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className={`mt-6 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 mb-1 ${
                  sidebarCollapsed ? 'px-3 justify-center' : 'px-3'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 text-gray-400 group-hover:text-gray-500 ${
                  sidebarCollapsed ? '' : 'mr-3'
                }`} />
                {!sidebarCollapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* User info ve logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center" title={user.email}>
                <span className="text-white text-sm font-medium">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:text-red-600 transition-colors duration-200 rounded-md hover:bg-gray-50"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors duration-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="admin-main flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 bg-white shadow lg:z-10">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-sm text-gray-700">Hoş geldin, Super Admin!</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}