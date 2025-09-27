'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity,
  BarChart3,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Settings,
  Users,
  Heart,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Search,
  Shield,
  Database,
  Stethoscope,
  Clipboard,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    status: string;
  };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Ana Sayfa',
    href: '/dashboard',
    icon: Home,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Hastalar',
    href: '/dashboard/patients',
    icon: Users,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Randevular',
    href: '/dashboard/appointments',
    icon: Calendar,
    badge: '3',
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Tıbbi Kayıtlar',
    href: '/dashboard/medical-records',
    icon: FileText,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Teşhisler',
    href: '/dashboard/diagnostics',
    icon: Stethoscope,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Raporlar',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Mesajlar',
    href: '/dashboard/messages',
    icon: MessageSquare,
    badge: '12',
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  },
  {
    label: 'Kullanıcı Yönetimi',
    href: '/dashboard/user-management',
    icon: UserCheck,
    roles: ['TENANT_ADMIN']
  },
  {
    label: 'Ayarlar',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['USER', 'TENANT_USER', 'TENANT_ADMIN']
  }
];

export default function Sidebar({ user, collapsed = false, onToggleCollapse, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login?message=logged-out');
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || 'USER')
  );

  const userDisplayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN': return 'Yönetici';
      case 'TENANT_USER': return 'Kullanıcı';
      case 'USER': return 'Kullanıcı';
      default: return role;
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-4' : 'justify-between px-6'} py-4 border-b border-gray-200`}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MedSAS
              </h1>
              <p className="text-xs text-gray-500">Sağlık Yönetimi</p>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Heart className="h-5 w-5 text-white" />
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Mobile Close */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className={`${collapsed ? 'px-4' : 'px-6'} py-4 border-b border-gray-200 bg-gray-50`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
              <AvatarFallback className="bg-blue-600 text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userDisplayName}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={`text-xs ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {user.status === 'ACTIVE' ? 'Aktif' : user.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-red-500 text-white text-xs ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center px-3' : 'justify-start'} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}
            asChild
          >
            <Link href="/dashboard/profile">
              <User className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
              {!collapsed && 'Profil'}
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full ${collapsed ? 'justify-center px-3' : 'justify-start'} text-red-600 hover:text-red-700 hover:bg-red-50`}
          >
            <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && 'Çıkış'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${collapsed ? 'lg:w-20' : 'lg:w-80'}`}>
        <div className="flex flex-col w-full">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}