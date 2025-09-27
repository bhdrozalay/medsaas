'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Star, 
  Zap,
  Shield,
  Users,
  Database,
  BarChart3,
  Headphones,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    // Check authentication and get user info
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      console.log('🔍 Subscription page: Loading user info...');
      setLoading(true);
      
      // Subscription sayfası TAMAMEN SERBEST - Token kontrolü yapmadan yükle
      console.log('🟢 Subscription page: No token check - direct access allowed');
      
      // Generic user info - trial expired kullanıcılar için
      setUserInfo({
        id: 'subscription-user',
        email: 'expired-trial@user.com',
        role: 'TENANT_ADMIN',
        status: 'TRIAL_EXPIRED'
      });
      
      console.log('✅ Subscription page: User info set successfully');
      
    } catch (error) {
      console.error('❌ Subscription page error:', error);
      // Hata olsa bile sayfayı yükle - login'e yönlendirme
      setUserInfo({
        id: 'fallback-user',
        email: 'fallback@user.com', 
        role: 'USER',
        status: 'ERROR_FALLBACK'
      });
    } finally {
      console.log('🏁 Subscription page: Loading finished');
      setLoading(false);
    }
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Başlangıç Paketi',
      monthlyPrice: 149,
      yearlyPrice: 1490, // %17 indirim (12*149 = 1788, 1490 = 17% indirim)
      description: 'Küçük muayenehane ve klinikler için ideal çözüm',
      features: [
        '💾 100 hasta kaydı',
        '👥 3 kullanıcı hesabı',
        '📊 Temel raporlama araçları',
        '📧 E-posta destek hizmeti',
        '📱 Mobil uygulama erişimi',
        '☁️ 25GB bulut depolama',
        '🔒 SSL güvenlik sertifikası',
        '📋 Hasta takip sistemi',
        '💳 Online randevu sistemi'
      ]
    },
    {
      id: 'professional',
      name: 'Profesyonel Paket',
      monthlyPrice: 299,
      yearlyPrice: 2990, // %17 indirim (12*299 = 3588, 2990 = 17% indirim)
      description: 'Orta ölçekli klinik ve poliklinikler için gelişmiş özellikler',
      popular: true,
      badge: 'En Popüler Seçim',
      features: [
        '💾 500 hasta kaydı',
        '👥 10 kullanıcı hesabı',
        '📈 Gelişmiş analitik dashboard',
        '⚡ Öncelikli destek hattı',
        '📱 Gelişmiş mobil özellikler',
        '☁️ 100GB bulut depolama',
        '🔗 API entegrasyon desteği',
        '📝 Özelleştirilebilir formlar',
        '📊 Detaylı mali raporlar',
        '🎯 Hasta segmentasyonu',
        '📤 Otomatik SMS/E-posta',
        '🔄 Veri yedekleme sistemi'
      ]
    },
    {
      id: 'enterprise',
      name: 'Kurumsal Çözüm',
      monthlyPrice: 599,
      yearlyPrice: 5990, // %17 indirim (12*599 = 7188, 5990 = 17% indirim)
      description: 'Büyük hastane ve sağlık grupları için enterprise seviye platform',
      badge: 'Tam Donanım',
      features: [
        '♾️ Sınırsız hasta kaydı',
        '👥 Sınırsız kullanıcı hesabı',
        '🤖 AI destekli analitik',
        '📞 7/24 premium destek hattı',
        '📱 White-label mobil uygulama',
        '☁️ Sınırsız bulut depolama',
        '🔗 Tam API entegrasyon paketi',
        '🎨 Tamamen özel tasarım',
        '💼 Çoklu şube yönetimi',
        '👨‍💼 Özel hesap yöneticisi',
        '🎓 Kişisel eğitim programı',
        '🔧 Özel geliştirme desteği',
        '🏥 Hastane bilgi sistemi entegrasyonu',
        '📋 Kalite yönetim sistemi'
      ]
    }
  ];

  
  const handleSelectPlan = async (planId: string) => {
    const period = isYearly ? 'yearly' : 'monthly';
    console.log('💳 Plan seçildi:', planId, 'Dönem:', period);
    console.log('🚀 Checkout sayfasına yönlendiriliyor...');

    try {
      // Redirect to checkout page with selected plan and period
      const checkoutUrl = `/checkout?plan=${planId}&period=${period}`;
      console.log('Checkout URL:', checkoutUrl);

      router.push(checkoutUrl);
      console.log('✅ router.push executed for checkout');

      // Backup redirect method
      setTimeout(() => {
        console.log('🚑 Backup redirect to checkout');
        window.location.href = checkoutUrl;
      }, 1000);

    } catch (error) {
      console.error('❌ Plan selection error:', error);
      alert(`Hata: Plan seçimi başarısız. URL: /checkout?plan=${planId}&period=${period}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Demo Süreniz Sona Erdi
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Sistemi kaldığınız yerden devam ettirmek için bir plan seçin.
          </p>

          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Shield className="h-4 w-4 mr-2 text-blue-600" />
            <span>Verileriniz güvenli şekilde saklanıyor</span>
          </div>
        </div>


        {/* Pricing Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Size Uygun Planı Seçin
          </h2>

          {/* Monthly/Yearly Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-lg">
              <div className="relative flex">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                    !isYearly
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Aylık Ödeme
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all relative ${
                    isYearly
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yıllık Ödeme
                  <span className="absolute -top-1 -right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                    %17 İndirim
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.popular 
                    ? 'border-blue-500 shadow-lg scale-105' 
                    : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ₺{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600">
                      /{isYearly ? 'yıl' : 'ay'}
                    </span>
                    {isYearly && (
                      <div className="text-sm text-green-600 mt-1">
                        Aylık ₺{Math.round(plan.yearlyPrice / 12)} • %17 tasarruf
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bu Planı Seç
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Sıkça Sorulan Sorular
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="security" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        🔐 Verilerim güvende mi?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, tüm verileriniz şifrelenmiş olarak saklanır ve sadece siz erişebilirsiniz.
                      KVKK ve HIPAA standartlarına uygun güvenlik önlemleri alınmıştır.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="plan-change" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        🔄 Plan değiştirebilir miyim?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz.
                      Plan yükseltmeleri anında geçerli olur.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cancellation" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        ❌ İptal edebilir miyim?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, istediğiniz zaman aboneliğinizi iptal edebilirsiniz.
                      İptal sonrası verilerinize 30 gün daha erişebilirsiniz.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="support" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        🎧 Teknik destek var mı?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, tüm planlarımızda Türkçe teknik destek mevcuttur. 
                      Kurumsal planda 7/24 telefon desteği sunuyoruz.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Right Column */}
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="data-migration" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        📊 Mevcut verilerimi aktarabilir miyim?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, mevcut hasta kayıtlarınızı sisteme aktarabilirsiniz. 
                      Destek ekibimiz veri aktarım sürecinde yardımcı olur.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="training" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        🎓 Sistem eğitimi alabilir miyim?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, tüm planlarda online eğitim videoları mevcuttur. 
                      Kurumsal planlarda canlı eğitim seansları düzenlenmektedir.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="payment" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        💳 Hangi ödeme yöntemleri kabul edilir?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Kredi kartı, banka kartı, havale/EFT ve kurumsal fatura 
                      yöntemlerini kabul ediyoruz. Yıllık ödemede %15 indirim.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="mobile" className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-gray-900">
                        📱 Mobil uygulaması var mı?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      Evet, iOS ve Android için mobil uygulamalarımız mevcuttur. 
                      Web versiyonunuz ile otomatik senkronizasyon sağlanır.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Hala karar veremediniz mi?
          </h2>
          <p className="text-gray-600 mb-6">
            Size en uygun planı belirlemek için bizimle iletişime geçin.
          </p>
          <div className="space-y-2">
            <div className="text-gray-600">
              📞 <strong>Telefon:</strong> 0850 123 45 67
            </div>
            <div className="text-gray-600">
              📧 <strong>E-posta:</strong> satis@medsas.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}