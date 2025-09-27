'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

const planDetails: { [key: string]: PlanInfo } = {
  basic: {
    id: 'basic',
    name: 'Başlangıç Paketi',
    monthlyPrice: 149,
    yearlyPrice: 1490
  },
  professional: {
    id: 'professional',
    name: 'Profesyonel Paket',
    monthlyPrice: 299,
    yearlyPrice: 2990
  },
  enterprise: {
    id: 'enterprise',
    name: 'Kurumsal Çözüm',
    monthlyPrice: 599,
    yearlyPrice: 5990
  }
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const period = searchParams.get('period') || 'monthly';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    billingAddress: {
      fullName: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'TR'
    }
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Helper function to get current plan details
  const getCurrentPlanDetails = () => {
    if (!planId || !planDetails[planId]) return null;
    const plan = planDetails[planId];
    return {
      ...plan,
      price: period === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      periodText: period === 'yearly' ? 'yıllık' : 'aylık'
    };
  };

  useEffect(() => {
    if (!planId || !planDetails[planId]) {
      toast.error('Geçersiz plan seçimi');
      router.push('/subscription');
      return;
    }
    fetchUserInfo();
  }, [planId, period]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        // User has valid session
        const data = await response.json();
        setUserInfo(data.user);
        setFormData(prev => ({
          ...prev,
          email: data.user.email,
          billingAddress: {
            ...prev.billingAddress,
            fullName: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()
          }
        }));
      } else if (response.status === 403) {
        // Check if this is a trial expired user
        try {
          const errorData = await response.json();
          if (errorData.error === 'TRIAL_EXPIRED') {
            console.log('🔄 Trial expired user accessing checkout - allowing access');
            // Allow trial expired users to access checkout for payment
            // Set minimal user info to allow checkout to proceed
            setUserInfo({
              id: 'trial-expired-user',
              email: 'trial@expired.com',
              firstName: 'Trial',
              lastName: 'User',
              role: 'TENANT_ADMIN',
              status: 'TRIAL_EXPIRED'
            });
            setFormData(prev => ({
              ...prev,
              email: 'trial@expired.com',
              billingAddress: {
                ...prev.billingAddress,
                fullName: 'Trial User'
              }
            }));
            return;
          }
        } catch (parseError) {
          console.error('Error parsing 403 response:', parseError);
        }
        // Non-trial-expired 403, redirect to login
        router.push('/auth/login');
      } else if (response.status === 401) {
        // Handle 401 (No token) - could be trial expired users accessing checkout directly
        console.log('🔄 No token found - need to get temporary checkout token');
        // Redirect to a login form for getting checkout token
        await handleCheckoutTokenRequest();
        return;
      } else {
        // Other authentication errors
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutTokenRequest = async () => {
    console.log('🎫 Requesting temporary checkout token');
    setNeedsAuth(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authData.email || !authData.password) {
      setAuthError('E-posta ve şifre gereklidir');
      return;
    }

    try {
      console.log('🎫 Attempting to get checkout token for:', authData.email);
      const response = await fetch('/api/auth/checkout-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Checkout token obtained successfully');
        toast.success('Ödeme için giriş başarılı!');
        
        // Set user info and retry fetching
        setUserInfo(data.user);
        setFormData(prev => ({
          ...prev,
          email: data.user.email,
          billingAddress: {
            ...prev.billingAddress,
            fullName: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()
          }
        }));
        
        setNeedsAuth(false);
      } else {
        const error = await response.json();
        console.error('❌ Checkout token request failed:', error);
        setAuthError(error.message || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('❌ Checkout token request error:', error);
      setAuthError('Bağlantı hatası oluştu');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBillingAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value
      }
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Geçerli bir kart numarası giriniz';
    }

    if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Geçerli bir son kullanma tarihi giriniz (MM/YY)';
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Geçerli bir CVV kodu giriniz';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Kart sahibinin adını giriniz';
    }

    if (!formData.billingAddress.fullName.trim()) {
      newErrors.billingFullName = 'Fatura adresinde ad soyad giriniz';
    }

    if (!formData.billingAddress.address.trim()) {
      newErrors.billingAddress = 'Fatura adresini giriniz';
    }

    if (!formData.billingAddress.city.trim()) {
      newErrors.billingCity = 'Şehir giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen eksik bilgileri tamamlayınız');
      return;
    }

    setProcessing(true);

    try {
      console.log('Submitting payment with data:', {
        plan: planId,
        period: period,
        planDuration: selectedPlan.periodText,
        paymentData: formData
      });
      
      // Call payment processing API
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          period: period,
          planDuration: selectedPlan.periodText,
          paymentData: formData
        }),
      });
      
      console.log('API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payment successful:', result);
        
        toast.success('Ödemeniz başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz.', {
          duration: 4000,
          icon: '🎉',
        });
        
        // Redirect to login after successful payment
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Payment failed:', error);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        let errorMessage = 'Ödeme işlemi başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.';
        if (response.status === 401) {
          errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
          setTimeout(() => router.push('/auth/login'), 2000);
        } else if (response.status === 400) {
          errorMessage = error.error || 'Geçersiz ödeme bilgileri. Lütfen kontrol ediniz.';
        } else if (response.status === 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.';
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.', {
        duration: 4000,
        icon: '🔌',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show authentication form if needed
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                🔒 Ödeme için Giriş Gerekli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center mb-6">
                Ödeme işlemini tamamlayabilmek için lütfen hesap bilgilerinizi girin.
              </p>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="auth-email">E-posta</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="auth-password">Şifre</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="Şifrenizi girin"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                
                {authError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {authError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full">
                  🔒 Giriş Yap ve Ödemeye Devam Et
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push('/subscription')}
                >
                  ← Paketlere Geri Dön
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userInfo || !planId || !planDetails[planId]) {
    return null;
  }

  const selectedPlan = getCurrentPlanDetails();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/subscription')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Paketlere Geri Dön
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ödeme Sayfası
          </h1>
          <p className="text-gray-600">
            Güvenli ödeme ile aboneliğinizi aktifleştirin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Sipariş Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedPlan.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPlan.periodText} abonelik {period === 'yearly' && '(12 ay)'}
                    </p>
                    {period === 'yearly' && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        ⭐ 2 ay ücretsiz! (₺{selectedPlan.monthlyPrice * 12} yerine ₺{selectedPlan.price})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      ₺{selectedPlan.price}
                    </span>
                    <p className="text-sm text-gray-600">
                      {period === 'yearly' ? '/yıl' : '/ay'}
                      {period === 'yearly' && (
                        <span className="block text-xs text-gray-500">
                          (₺{Math.round(selectedPlan.price / 12)}/ay)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KDV (%20)</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₺{Math.round(selectedPlan.price * 0.2)}
                  </span>
                </div>

                {period === 'yearly' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Yıllık İndirim</span>
                      <span className="text-sm font-medium text-green-600">
                        -₺{(selectedPlan.monthlyPrice * 12) - selectedPlan.price}
                      </span>
                    </div>
                  </>
                )}

                <hr className="border-gray-200" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Toplam</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₺{Math.round(selectedPlan.price * 1.2)}
                  </span>
                </div>

                {period === 'yearly' && (
                  <p className="text-xs text-center text-green-600 font-medium mt-2">
                    💰 Yıllık ödeme ile 2 ay ücretsiz kazanıyorsunuz!
                  </p>
                )}
              </div>

              <Alert className="mt-6">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Ödemeniz güvenli 256-bit SSL şifreleme ile korunmaktadır.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Card Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    Kredi Kartı Bilgileri
                  </h3>
                  
                  <div>
                    <Label htmlFor="cardNumber">Kart Numarası</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      maxLength={19}
                      className={errors.cardNumber ? 'border-red-500' : ''}
                    />
                    {errors.cardNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Son Kullanma Tarihi</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className={errors.expiryDate ? 'border-red-500' : ''}
                      />
                      {errors.expiryDate && (
                        <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className={errors.cvv ? 'border-red-500' : ''}
                      />
                      {errors.cvv && (
                        <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardholderName">Kart Sahibinin Adı</Label>
                    <Input
                      id="cardholderName"
                      type="text"
                      placeholder="Ad Soyad"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value.toUpperCase())}
                      className={errors.cardholderName ? 'border-red-500' : ''}
                    />
                    {errors.cardholderName && (
                      <p className="text-sm text-red-500 mt-1">{errors.cardholderName}</p>
                    )}
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    Fatura Adresi
                  </h3>
                  
                  <div>
                    <Label htmlFor="billingFullName">Ad Soyad</Label>
                    <Input
                      id="billingFullName"
                      type="text"
                      placeholder="Ad Soyad"
                      value={formData.billingAddress.fullName}
                      onChange={(e) => handleBillingAddressChange('fullName', e.target.value)}
                      className={errors.billingFullName ? 'border-red-500' : ''}
                    />
                    {errors.billingFullName && (
                      <p className="text-sm text-red-500 mt-1">{errors.billingFullName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="billingAddress">Adres</Label>
                    <Input
                      id="billingAddress"
                      type="text"
                      placeholder="Tam adres"
                      value={formData.billingAddress.address}
                      onChange={(e) => handleBillingAddressChange('address', e.target.value)}
                      className={errors.billingAddress ? 'border-red-500' : ''}
                    />
                    {errors.billingAddress && (
                      <p className="text-sm text-red-500 mt-1">{errors.billingAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingCity">Şehir</Label>
                      <Input
                        id="billingCity"
                        type="text"
                        placeholder="Şehir"
                        value={formData.billingAddress.city}
                        onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                        className={errors.billingCity ? 'border-red-500' : ''}
                      />
                      {errors.billingCity && (
                        <p className="text-sm text-red-500 mt-1">{errors.billingCity}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode">Posta Kodu</Label>
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="34000"
                        value={formData.billingAddress.postalCode}
                        onChange={(e) => handleBillingAddressChange('postalCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ödeme İşleniyor...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      ₺{Math.round(selectedPlan.price * 1.2)} Öde
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Ödemeyi tamamlayarak{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Kullanım Koşulları
                  </a>{' '}
                  ve{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Gizlilik Politikası
                  </a>
                  'nı kabul etmiş olursunuz.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
