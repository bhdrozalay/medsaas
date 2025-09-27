'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight,
  Calendar,
  CreditCard,
  Mail,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Ödeme Başarılı!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Aboneliğiniz aktifleştirildi. MedSAS'a hoş geldiniz!
          </p>
        </div>

        {/* Success Details */}
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Aboneliğiniz Aktif
                    </p>
                    <p className="text-xs text-green-600">
                      Sisteme tam erişim sağlayabilirsiniz
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">
                  Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Sonraki Adımlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Dashboard'a Gidin</h4>
                    <p className="text-sm text-gray-600">
                      Ana panel üzerinden sistemi keşfetmeye başlayın
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Profili Tamamlayın</h4>
                    <p className="text-sm text-gray-600">
                      Klinik bilgilerinizi ekleyin ve ayarlarınızı yapılandırın
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">İlk Hastanızı Ekleyin</h4>
                    <p className="text-sm text-gray-600">
                      Hasta kayıt sistemini kullanmaya başlayın
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Fatura & Destek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">E-posta Faturası:</span>
                  <span className="text-green-600 font-medium">✓ Gönderildi</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Destek Erişimi:</span>
                  <span className="text-blue-600 font-medium">destek@medsas.com</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Telefon Desteği:</span>
                  <span className="text-blue-600 font-medium">0850 123 45 67</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Faturayı İndir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              Dashboard'a Git
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/help')}
              className="flex-1 py-3"
            >
              Yardım Merkezi
            </Button>
          </div>

          {/* Auto Redirect Notice */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              {countdown} saniye içinde otomatik olarak dashboard'a yönlendirileceksiniz...
            </p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-12 text-center bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 MedSAS Ailesine Hoş Geldiniz!
          </h3>
          <p className="text-blue-700 text-sm">
            Binlerce sağlık profesyonelinin güvendiği platform ile 
            hasta yönetimi artık çok daha kolay!
          </p>
        </div>
      </div>
    </div>
  );
}