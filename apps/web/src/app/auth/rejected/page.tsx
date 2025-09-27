'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  XCircle, 
  Mail, 
  Phone, 
  AlertTriangle,
  FileText,
  Clock,
  User,
  ArrowLeft,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RejectedUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  rejectedAt: string;
  rejectionReason: string;
  rejectedBy?: string;
  canReapply: boolean;
  reapplicationAvailableAt?: string;
  submittedAt: string;
}

export default function RejectedPage() {
  const [userData, setUserData] = useState<RejectedUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRejectedUserData = async () => {
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
        
        // Kullanıcı reddedilmemişse uygun sayfaya yönlendir
        if (user.status !== 'REJECTED') {
          if (user.status === 'ACTIVE') {
            if (user.role === 'SUPER_ADMIN') {
              router.replace('/admin');
            } else if (user.role === 'TENANT_ADMIN') {
              router.replace('/tenant-admin');
            } else {
              router.replace('/dashboard');
            }
          } else if (user.status === 'PENDING_APPROVAL') {
            router.replace('/pending-approval');
          } else if (user.status === 'SUSPENDED') {
            router.replace('/auth/suspended');
          } else {
            router.replace('/auth/login');
          }
          return;
        }
        
        // Mock rejected data - production'da API'den gelecek
        const rejectedData: RejectedUserData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          rejectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
          rejectionReason: 'Sağlanan belgeler yetersiz veya eksik bulunmuştur. Lütfen gerekli belgeleri tamamlayıp tekrar başvuru yapınız.',
          rejectedBy: 'System Administrator',
          canReapply: true,
          reapplicationAvailableAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün sonra
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 gün önce başvuru
        };
        
        setUserData(rejectedData);
        setLoading(false);
        
      } catch (err) {
        console.error('Rejected user data fetch error:', err);
        setError('Kullanıcı bilgileri alınırken bir hata oluştu');
        setLoading(false);
      }
    };
    
    fetchRejectedUserData();
  }, [router]);

  const getRemainingDays = (until: string) => {
    const now = new Date();
    const availableDate = new Date(until);
    const diffTime = availableDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const canReapplyNow = () => {
    if (!userData?.reapplicationAvailableAt) return false;
    const now = new Date();
    const availableDate = new Date(userData.reapplicationAvailableAt);
    return now >= availableDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
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

  if (!userData) {
    return null;
  }

  const remainingDays = userData.reapplicationAvailableAt ? getRemainingDays(userData.reapplicationAvailableAt) : 0;
  const canReapply = canReapplyNow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-red-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Başvuru Reddedildi</h1>
                <p className="text-xs text-gray-500">MedSAS Onay Sistemi</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Giriş
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Alert */}
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Başvurunuz reddedilmiştir.</strong> Aşağıdaki bilgileri inceleyerek yeni başvuru yapabilirsiniz.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kullanıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-lg">
                      {userData.firstName?.charAt(0) || userData.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData.email
                      }
                    </p>
                    <p className="text-sm text-gray-600">{userData.email}</p>
                    <Badge className="bg-red-100 text-red-800 mt-1">
                      {userData.role === 'TENANT_ADMIN' ? 'Yönetici' : 'Kullanıcı'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Details */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Red Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Red Nedeni:</label>
                  <p className="text-gray-900 mt-1">{userData.rejectionReason}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Başvuru Tarihi:</label>
                    <p className="text-gray-900">{new Date(userData.submittedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Red Tarihi:</label>
                    <p className="text-gray-900">{new Date(userData.rejectedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {userData.rejectedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">İşlemi Yapan:</label>
                    <p className="text-gray-900">{userData.rejectedBy}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reapplication Section */}
            {userData.canReapply && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Yeniden Başvuru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canReapply ? (
                    <div>
                      <Alert className="border-green-200 bg-green-50 mb-4">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Yeniden başvuru yapabilirsiniz. Lütfen eksik belgelerinizi tamamladığınızdan emin olun.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Yeniden Başvuru İçin Gerekli Adımlar:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Eksik belgeleri tamamlayın</li>
                          <li>• Kimlik doğrulama belgelerini hazırlayın</li>
                          <li>• Kurum yetki belgelerini güncelleyin</li>
                          <li>• Tüm bilgileri doğru ve eksiksiz doldurun</li>
                        </ul>
                      </div>

                      <Button asChild className="w-full">
                        <Link href="/auth/register">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Yeni Başvuru Yap
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Yeniden başvuru için <strong>{remainingDays} gün</strong> daha beklemeniz gerekiyor.
                        </AlertDescription>
                      </Alert>
                      
                      <p className="text-sm text-gray-600 mt-3">
                        {userData.reapplicationAvailableAt && 
                          `${new Date(userData.reapplicationAvailableAt).toLocaleDateString('tr-TR')} tarihinden itibaren yeniden başvuru yapabilirsiniz.`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reapplication Status */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Yeniden Başvuru Durumu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canReapply ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Başvuru Yapabilirsiniz
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Artık yeni bir başvuru yapabilirsiniz
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {remainingDays}
                    </div>
                    <p className="text-sm text-gray-600">
                      gün kaldı
                    </p>
                    <Badge className="bg-orange-100 text-orange-800 mt-2">
                      Bekleme Süresi
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Contact */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Destek İletişim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="mailto:destek@medsas.com"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">E-posta</p>
                    <p className="text-xs text-blue-600">destek@medsas.com</p>
                  </div>
                </a>
                
                <a 
                  href="tel:+902125550123"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Telefon</p>
                    <p className="text-xs text-green-600">+90 212 555 0123</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Information */}
            <Card className="bg-blue-50 border border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">Önemli Bilgiler</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Red nedeni detaylı olarak açıklanmıştır</li>
                  <li>• Eksik belgelerinizi tamamlayabilirsiniz</li>
                  <li>• Yeniden başvuru hakkınız bulunmaktadır</li>
                  <li>• Destek ekibimizden yardım alabilirsiniz</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}