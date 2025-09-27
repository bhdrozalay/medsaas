'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldX, 
  Clock, 
  Mail, 
  Phone, 
  AlertTriangle,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  MessageSquare,
  Send,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SuspendedUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  suspendedAt: string;
  suspendedUntil?: string;
  suspensionReason: string;
  suspensionType: 'temporary' | 'permanent';
  suspendedBy?: string;
  canAppeal: boolean;
  appealDeadline?: string;
}

export default function SuspendedPage() {
  const [userData, setUserData] = useState<SuspendedUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealEmail, setAppealEmail] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSuspendedUserData = async () => {
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
        
        // Kullanıcı askıya alınmamışsa dashboard'a yönlendir
        if (user.status !== 'SUSPENDED') {
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
          } else if (user.status === 'REJECTED') {
            router.replace('/auth/rejected');
          } else {
            router.replace('/auth/login');
          }
          return;
        }
        
        // Mock suspended data - production'da API'den gelecek
        const suspendedData: SuspendedUserData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          suspendedAt: new Date().toISOString(),
          suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün sonra
          suspensionReason: 'Sistem kullanım kurallarının ihlali nedeniyle hesabınız geçici olarak askıya alınmıştır.',
          suspensionType: 'temporary',
          suspendedBy: 'System Administrator',
          canAppeal: true,
          appealDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 gün sonra
        };
        
        setUserData(suspendedData);
        setAppealEmail(user.email);
        setLoading(false);
        
      } catch (err) {
        console.error('Suspended user data fetch error:', err);
        setError('Kullanıcı bilgileri alınırken bir hata oluştu');
        setLoading(false);
      }
    };
    
    fetchSuspendedUserData();
  }, [router]);

  const handleAppealSubmit = async () => {
    if (!appealText.trim()) {
      alert('Lütfen itiraz gerekçenizi yazın');
      return;
    }

    setSubmittingAppeal(true);
    
    try {
      // Mock API call - production'da gerçek endpoint'e gönderilecek
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Appeal submitted:', {
        userId: userData?.id,
        email: appealEmail,
        appealText: appealText,
        submittedAt: new Date().toISOString()
      });
      
      setAppealSubmitted(true);
      setAppealText('');
      
    } catch (error) {
      console.error('Appeal submission error:', error);
      alert('İtiraz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const getRemainingDays = (until: string) => {
    const now = new Date();
    const endDate = new Date(until);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getAppealDeadlineDays = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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

  const remainingDays = userData.suspendedUntil ? getRemainingDays(userData.suspendedUntil) : 0;
  const appealDeadlineDays = userData.appealDeadline ? getAppealDeadlineDays(userData.appealDeadline) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-red-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                <ShieldX className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hesap Askıya Alındı</h1>
                <p className="text-xs text-gray-500">MedSAS Güvenlik</p>
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
          <ShieldX className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Hesabınız askıya alınmıştır.</strong> Sistem erişiminiz geçici olarak kısıtlanmıştır.
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

            {/* Suspension Details */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Askıya Alma Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Askıya Alma Nedeni:</label>
                  <p className="text-gray-900 mt-1">{userData.suspensionReason}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Askıya Alınma Tarihi:</label>
                    <p className="text-gray-900">{new Date(userData.suspendedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  
                  {userData.suspendedUntil && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bitiş Tarihi:</label>
                      <p className="text-gray-900">{new Date(userData.suspendedUntil).toLocaleDateString('tr-TR')}</p>
                    </div>
                  )}
                </div>

                {userData.suspendedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">İşlemi Yapan:</label>
                    <p className="text-gray-900">{userData.suspendedBy}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appeal Section */}
            {userData.canAppeal && !appealSubmitted && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    İtiraz Et
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appealDeadlineDays > 0 ? (
                    <>
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          İtiraz hakkınız <strong>{appealDeadlineDays} gün</strong> daha geçerlidir.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <label className="text-sm font-medium text-gray-700">E-posta Adresiniz:</label>
                        <Input
                          type="email"
                          value={appealEmail}
                          onChange={(e) => setAppealEmail(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">İtiraz Gerekçeniz:</label>
                        <Textarea
                          value={appealText}
                          onChange={(e) => setAppealText(e.target.value)}
                          placeholder="Lütfen hesabınızın neden askıdan alınması gerektiğini açıklayın..."
                          className="mt-1 min-h-[120px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          En az 50 karakter yazın. İtirazınız 24 saat içinde değerlendirilecektir.
                        </p>
                      </div>

                      <Button 
                        onClick={handleAppealSubmit}
                        disabled={submittingAppeal || appealText.length < 50}
                        className="w-full"
                      >
                        {submittingAppeal ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            İtiraz Gönderiliyor...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            İtiraz Gönder
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        İtiraz süreniz sona ermiştir. Destek ekibiyle iletişime geçebilirsiniz.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appeal Success */}
            {appealSubmitted && (
              <Card className="bg-white border border-green-200 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">İtirazınız Gönderildi</h3>
                  <p className="text-gray-600 mb-4">
                    İtirazınız başarıyla gönderildi. 24 saat içinde e-posta ile bilgilendirileceksiniz.
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    İnceleme Bekliyor
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suspension Status */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Askı Durumu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.suspensionType === 'temporary' ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {remainingDays}
                    </div>
                    <p className="text-sm text-gray-600">
                      {remainingDays > 0 ? 'gün kaldı' : 'bugün bitiyor'}
                    </p>
                    <Badge className="bg-orange-100 text-orange-800 mt-2">
                      Geçici Askı
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center">
                    <Badge className="bg-red-100 text-red-800">
                      Kalıcı Askı
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Bu askının bitiş tarihi bulunmamaktadır
                    </p>
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
                  <li>• Bu askı süresince sisteme erişiminiz kısıtlıdır</li>
                  <li>• Mevcut verileriniz korunmaktadır</li>
                  <li>• İtiraz hakkınızı kullanabilirsiniz</li>
                  <li>• Destek ekibiyle iletişime geçebilirsiniz</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}