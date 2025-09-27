'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  Mail, 
  Phone,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowLeft,
  ExternalLink,
  User,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string; // PENDING_APPROVAL, ACTIVE, REJECTED, etc.
  tenant?: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export default function PendingApprovalPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/user/status', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token yok veya geçersiz - login'e yönlendir
            router.replace('/auth/login?error=session-expired');
            return;
          }
          throw new Error('Kullanıcı durumu alınamadı');
        }
        
        const user = await response.json();
        
        // Kullanıcı durumuna göre yönlendirme
        switch (user.status) {
          case 'ACTIVE':
            // Kullanıcı onaylanmış - role'üne göre dashboard'a yönlendir
            if (user.role === 'SUPER_ADMIN') {
              router.replace('/admin');
            } else if (user.role === 'TENANT_ADMIN') {
              router.replace('/tenant-admin');
            } else if (user.role === 'USER' || user.role === 'TENANT_USER') {
              router.replace('/dashboard');
            } else {
              router.replace('/dashboard');
            }
            return;
            
          case 'REJECTED':
            // Kullanıcı reddedilmiş - rejection page'e yönlendir
            router.replace('/auth/rejected');
            return;
            
          case 'SUSPENDED':
            // Kullanıcı askıya alınmış - suspended page'e yönlendir
            router.replace('/auth/suspended');
            return;
            
          case 'PENDING_APPROVAL':
          default:
            // Kullanıcı hala beklemede - bu sayfada kal
            setUserData(user);
            setLoading(false);
            break;
        }
        
      } catch (err) {
        console.error('User status check error:', err);
        setError('Kullanıcı durumu kontrol edilirken bir hata oluştu');
        setLoading(false);
      }
    };
    
    checkUserStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Kullanıcı durumu kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link href="/auth/login">
              Giriş Sayfasına Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  MedSAS
                </h1>
                <p className="text-xs text-gray-500">Sağlık Bilgi Sistemi</p>
              </div>
            </div>
            {userData && (
              <div className="text-sm text-gray-600">
                Hoşgeldin, {userData.firstName || userData.email}
              </div>
            )}
            <Button 
              asChild
              variant="outline"
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Giriş
              </Link>
            </Button>
          </div>
        </div>
      </header>


      {/* Main Content - Side by Side Layout */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Status Header Card */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">İnceleme Aşamasında</h2>
                <p className="text-sm text-gray-600">Başvurunuz uzmanlarımız tarafından titizlikle incelenmektedir</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Timeline Status */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Başvuru Timeline</h3>
                
                {/* Timeline */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-8">
                    {/* Step 1 - Completed */}
                    <div className="relative flex items-start">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-md relative z-10">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">Başvuru Alındı</h4>
                          <Badge className="bg-green-100 text-green-800 text-xs">Tamamlandı</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Hesap bilgileriniz başarıyla kaydedildi ve işleme alındı</p>
                        <p className="text-xs text-gray-400">
                          {userData ? new Date(userData.createdAt).toLocaleString('tr-TR') : 'Bugün - 09:30'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 - In Progress */}
                    <div className="relative flex items-start">
                      <div className="flex items-center justify-center w-12 h-12 bg-yellow-500 rounded-full border-4 border-white shadow-md relative z-10">
                        <Clock className="h-6 w-6 text-white animate-pulse" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">İnceleme Yapılıyor</h4>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Devam Ediyor</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Bilgileriniz uzman ekibimiz tarafından titizlikle inceleniyor</p>
                        <p className="text-xs text-gray-400">Tahmini süre: 24 saat</p>
                      </div>
                    </div>
                    
                    {/* Step 3 - Pending */}
                    <div className="relative flex items-start">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-full border-4 border-white shadow-md relative z-10">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-500">Hesap Aktivasyonu</h4>
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">Beklemede</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">Onay sonrası sisteme tam erişim sağlanacak</p>
                        <p className="text-xs text-gray-400">Bekleniyor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Side - Important Info */}
          <div className="space-y-6">

            {/* Important Information */}
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Önemli Bilgiler</h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-gray-900">İnceleme süresi:</span> Ortalama 24 saat içinde tamamlanıp sonuç e-posta ile bildirilecek</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-gray-900">Onay sonrası:</span> Sisteme tam erişim sağlanıp tüm özellikleri kullanabileceksiniz</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-gray-900">Bildirimler:</span> Tüm güncellemeler kayıtlı e-posta adresinize gönderilecek</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-gray-900">Destek:</span> Acil durumlar için telefon desteğimiz 7/24 hizmetinizde</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-gray-900">Ek belgeler:</span> İnceleme sürecinde gerekirse ek belge talep edilebilir</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

          {/* Refresh Status Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.reload()}
            variant="outline" 
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Durumu Kontrol Et
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Onay durumunuz güncellendiğini düşünüyorsanız bu butona tıklayın
          </p>
        </div>

        {/* Support Contact Footer */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-center font-medium text-gray-900 mb-4">Destek İletişim</h4>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a 
              href="mailto:destek@medsas.com"
              className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group border border-blue-200"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">E-posta Destek</p>
                <p className="text-xs text-blue-600">destek@medsas.com</p>
              </div>
            </a>
            
            <a 
              href="tel:+902125550123"
              className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group border border-green-200"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Telefon Destek</p>
                <p className="text-xs text-green-600">+90 212 555 0123</p>
              </div>
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              MedSAS - Sağlık Bilgi Yönetim Sistemi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}