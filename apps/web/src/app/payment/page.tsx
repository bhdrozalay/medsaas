'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  Shield,
  Calendar,
  Building,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
  billingAddress: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    postalCode: string;
    taxNumber?: string;
  };
}

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    billingAddress: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      postalCode: '',
      taxNumber: ''
    }
  });

  const plans = [
    {
      id: 'basic',
      name: 'Başlangıç Paketi',
      price: 149,
      period: 'aylık',
      description: 'Küçük muayenehane ve klinikler için ideal çözüm',
      features: ['💾 100 hasta kaydı', '👥 3 kullanıcı hesabı', '📊 Temel raporlama']
    },
    {
      id: 'professional',
      name: 'Profesyonel Paket',
      price: 299,
      period: 'aylık',
      description: 'Orta ölçekli klinik ve poliklinikler için gelişmiş özellikler',
      features: ['💾 500 hasta kaydı', '👥 10 kullanıcı hesabı', '📈 Gelişmiş analitik']
    },
    {
      id: 'enterprise',
      name: 'Kurumsal Çözüm',
      price: 599,
      period: 'aylık',
      description: 'Büyük hastane ve sağlık grupları için enterprise seviye platform',
      features: ['♾️ Sınırsız hasta kaydı', '👥 Sınırsız kullanıcı', '🤖 AI destekli analitik']
    }
  ];

  useEffect(() => {
    // Get user info
    fetchUserInfo();
    
    // Set selected plan
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      setSelectedPlan(plan || null);
    }
  }, [planId]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        
        // Pre-fill billing info with user data
        setPaymentInfo(prev => ({
          ...prev,
          billingAddress: {
            ...prev.billingAddress,
            name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
            email: data.user.email || ''
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    setLoading(true);

    try {
      // API call to process payment and activate subscription
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentInfo
        })
      });

      if (response.ok) {
        // Payment successful, redirect to success page
        router.push('/payment/success');
      } else {
        const error = await response.json();
        alert(error.message || 'Ödeme işlemi başarısız oldu');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
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
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan bulunamadı</h2>
          <Button onClick={() => router.push('/subscription')}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ödeme Bilgileri
          </h1>
          <p className="text-gray-600">
            Seçtiğiniz paketi onaylamak için ödeme bilgilerinizi girin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePaymentSubmit}>
              {/* Billing Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Fatura Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        value={paymentInfo.billingAddress.name}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, name: e.target.value }
                        }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={paymentInfo.billingAddress.email}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, email: e.target.value }
                        }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={paymentInfo.billingAddress.phone}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Kurum/Şirket</Label>
                      <Input
                        id="company"
                        value={paymentInfo.billingAddress.company}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, company: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={paymentInfo.billingAddress.address}
                      onChange={(e) => setPaymentInfo(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, address: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Şehir</Label>
                      <Input
                        id="city"
                        value={paymentInfo.billingAddress.city}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Posta Kodu</Label>
                      <Input
                        id="postalCode"
                        value={paymentInfo.billingAddress.postalCode}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, postalCode: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxNumber">Vergi No</Label>
                      <Input
                        id="taxNumber"
                        value={paymentInfo.billingAddress.taxNumber}
                        onChange={(e) => setPaymentInfo(prev => ({
                          ...prev,
                          billingAddress: { ...prev.billingAddress, taxNumber: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Kart Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardHolder">Kart Sahibi *</Label>
                    <Input
                      id="cardHolder"
                      value={paymentInfo.cardHolder}
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardHolder: e.target.value }))}
                      placeholder="Kart üzerindeki isim"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Kart Numarası *</Label>
                    <Input
                      id="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Son Kullanma *</Label>
                      <Input
                        id="expiryDate"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    İşlem Yapılıyor...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Güvenli Ödeme Yap (₺{selectedPlan.price})
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                  </div>

                  <div className="space-y-2">
                    {selectedPlan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan Ücreti</span>
                      <span>₺{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KDV (%18)</span>
                      <span>₺{Math.round(selectedPlan.price * 0.18)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Toplam</span>
                    <span>₺{Math.round(selectedPlan.price * 1.18)}</span>
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    <Shield className="h-3 w-3 inline mr-1" />
                    256-bit SSL ile güvenli ödeme
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}