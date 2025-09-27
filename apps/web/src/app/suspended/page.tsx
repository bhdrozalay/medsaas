'use client';

import { useRouter } from 'next/navigation';
import { ShieldX, Clock, AlertTriangle, Calendar, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';

interface SuspensionData {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    status: string;
  };
  suspension: {
    id: string;
    reason: string;
    durationType: string;
    durationDays?: number;
    suspendedUntil?: string;
    canAppeal: boolean;
    canAppealNow: boolean;
    appealDeadline?: string;
    hasAppealed: boolean;
    appealReason?: string;
    appealedAt?: string;
    appealStatus?: string;
    appealReviewedAt?: string;
    appealReviewedBy?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    createdAt: string;
    suspendedBy: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    remainingDays?: number;
    remainingHours?: number;
    isExpired: boolean;
  };
}

export default function SuspendedPage() {
  const router = useRouter();
  const [suspensionData, setSuspensionData] = useState<SuspensionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication first
      const meResponse = await fetch('/api/auth/me');
      
      if (!meResponse.ok) {
        router.push('/auth/login');
        return;
      }
      
      const userData = await meResponse.json();
      setUserInfo(userData.user);
      
      // If user is not suspended, redirect to dashboard
      if (userData.user.status !== 'SUSPENDED') {
        router.push('/dashboard');
        return;
      }

      // Fetch suspension details
      await fetchSuspensionDetails();
      
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const fetchSuspensionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/suspension');
      
      if (response.status === 410) {
        // Suspension expired, refresh the page
        window.location.reload();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch suspension details');
      }

      const data = await response.json();
      setSuspensionData(data.data);

    } catch (err) {
      console.error('Error fetching suspension details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!userInfo || userInfo.status !== 'SUSPENDED') {
    return null;
  }

  if (error || !suspensionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bir Hata Oluştu</h1>
            <p className="text-gray-600 mb-6">
              {error || 'Askı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyiniz.'}
            </p>
            <Button onClick={() => window.location.reload()} className="mr-3">
              Yenile
            </Button>
            <Button variant="outline" onClick={() => handleSignOut()}>
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { suspension } = suspensionData;
  
  // Format suspended by name
  const suspendedByName = suspension.suspendedBy.firstName && suspension.suspendedBy.lastName
    ? `${suspension.suspendedBy.firstName} ${suspension.suspendedBy.lastName}`
    : suspension.suspendedBy.email;

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const handleAppeal = () => {
    // TODO: Open appeal modal or redirect to appeal page
    console.log('Appeal button clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hesap Askıya Alındı
          </h1>
          <p className="text-gray-600">
            Hesabınıza erişim geçici olarak kısıtlanmıştır
          </p>
        </div>

        <div className="space-y-6">
          {/* Main suspension card */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Askı Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suspension Type */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Askı Türü:</span>
                <Badge className={suspension.durationType === 'TEMPORARY' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
                  {suspension.durationType === 'TEMPORARY' ? 'Geçici' : 'Kalıcı'}
                </Badge>
              </div>

              {/* Duration */}
              {suspension.durationType === 'TEMPORARY' && suspension.remainingDays !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Kalan Süre:</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {suspension.remainingDays || 0} gün {suspension.remainingHours || 0} saat
                    </div>
                    {suspension.suspendedUntil && (
                      <div className="text-xs text-gray-500">
                        {new Date(suspension.suspendedUntil).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} tarihinde sona erecek
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suspension Date */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Askıya Alınma Tarihi:</span>
                <span className="text-sm text-gray-900">
                  {new Date(suspension.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Suspended By */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Askıya Alan:</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {suspendedByName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {suspension.suspendedBy.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <FileText className="h-5 w-5 mr-2" />
                Askı Nedeni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {suspension.reason}
              </p>
            </CardContent>
          </Card>

          {/* Appeal Section */}
          {suspension.canAppeal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <User className="h-5 w-5 mr-2" />
                  İtiraz Hakkı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suspension.canAppealNow ? (
                  <>
                    <Alert className="border-blue-200 bg-blue-50">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>İtiraz edebilirsiniz.</strong> İtiraz hakkınız{' '}
                        {suspension.appealDeadline && new Date(suspension.appealDeadline).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        tarihine kadar geçerlidir.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={handleAppeal}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      İtiraz Et
                    </Button>
                  </>
                ) : suspension.hasAppealed ? (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>İtirazınız değerlendirilmektedir.</strong> Sonuç hakkında en kısa sürede bilgilendirileceksiniz.
                      {suspension.appealedAt && (
                        <div className="mt-2 text-xs">
                          İtiraz tarihi: {new Date(suspension.appealedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-gray-200 bg-gray-50">
                    <AlertTriangle className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-gray-800">
                      <strong>İtiraz süresi dolmuştur.</strong> İtiraz hakkınız{' '}
                      {suspension.appealDeadline && new Date(suspension.appealDeadline).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}{' '}
                      tarihinde sona ermiştir.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">
                  Yardıma mı ihtiyacınız var?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Askı durumunuz hakkında detaylı bilgi almak için destek ekibimiz ile iletişime geçebilirsiniz.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>📧 destek@medsas.com</div>
                  <div>📞 0 850 123 45 67</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Button */}
          <div className="text-center">
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}