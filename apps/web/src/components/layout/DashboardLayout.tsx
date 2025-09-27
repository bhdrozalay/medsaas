'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
  tenantId?: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/status', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/auth/login?error=session-expired');
            return;
          }
          throw new Error('Kullanıcı bilgileri alınamadı');
        }
        
        const user = await response.json();

        // Demo süresi kontrolü - API'den gelen trialExpired flag'ini kontrol et
        if (user.trialExpired && user.redirectTo) {
          console.log('Demo trial expired, redirecting to:', user.redirectTo);
          router.replace(user.redirectTo);
          return;
        }

        // Kullanıcı aktif değilse uygun sayfaya yönlendir
        if (user.status !== 'ACTIVE') {
          if (user.status === 'PENDING_APPROVAL') {
            router.replace('/pending-approval');
          } else if (user.status === 'REJECTED') {
            router.replace('/auth/rejected');
          } else {
            router.replace('/auth/login');
          }
          return;
        }
        
        // Rolü kontrol et - sadece normal kullanıcılar dashboard'a erişebilir
        if (user.role === 'SUPER_ADMIN') {
          router.replace('/admin');
          return;
        }
        
        setUserData(user);
        setLoading(false);
        
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        router.replace('/auth/login');
      }
    };
    
    fetchUserData();
  }, [router]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    setUserData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null; // Router.replace çalışırken boş döndür
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        user={userData}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Mobile Only */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.email
                }
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'} lg:mr-0`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}