'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // App Router uses next/navigation
import Link from 'next/link';
import { Button, Card, CardBody, Chip, Spinner } from '@heroui/react';
import { 
  CheckCircle, 
  Calendar, 
  Mail, 
  Phone, 
  Users, 
  ArrowRight,
  Shield,
  Star,
  Clock,
  MessageCircle
} from 'lucide-react';

const DemoSuccessPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [demoData, setDemoData] = useState<any>(null);

  useEffect(() => {
    // Get the ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
      // In a real app, you might fetch demo request details here
      // For now, we'll just simulate the data
      setTimeout(() => {
        setDemoData({
          id: id,
          organizationName: 'Örnek Hastanesi',
          email: 'demo@example.com',
          createdAt: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MedSAS</span>
            </Link>
            <div className="text-sm text-gray-600">
              Demo Talebi #{demoData?.id}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Demo Talebiniz Alındı! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            <strong>Demo kullanım talebiniz alınmıştır!</strong><br />
            En kısa sürede sizlerle iletişime geçeceğiz.
          </p>
          <Chip color="primary" variant="flat" size="lg" className="text-lg px-4 py-2">
            Talep No: #{demoData?.id}
          </Chip>
        </div>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Sonraki Adımlar
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardBody className="text-center p-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    24 Saat İçinde
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Satış temsilcimiz sizinle iletişime geçecek ve demo randevunuzu planlayacak
                  </p>
                </CardBody>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardBody className="text-center p-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Demo Randevusu
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Size uygun bir tarihte canlı demo oturumu gerçekleştireceğiz
                  </p>
                </CardBody>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardBody className="text-center p-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                    <MessageCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Detaylı Sunum
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Tüm özellikler ve kurumunuza özel çözümler hakkında bilgi alacaksınız
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Contact Information */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Acil Durumlarda Bize Ulaşın
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefon</p>
                      <p className="text-sm text-gray-600">+90 212 555 0123</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">E-posta</p>
                      <p className="text-sm text-gray-600">demo@medsas.com</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Demo Süresince Göreceğiniz Özellikler
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Hasta Kayıt ve Yönetimi',
              'Online Randevu Sistemi', 
              'Stok ve Envanter Yönetimi',
              'SGK ve Özel Faturalama',
              'Detaylı Raporlama',
              'Teletıp ve Uzaktan Takip',
              'Mobil Uygulama',
              'API Entegrasyonları',
              'Güvenlik ve Yedekleme'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-300 fill-current" />
              ))}
            </div>
            <blockquote className="text-lg font-medium mb-4">
              "MedSAS ile hasta yönetimimiz %70 daha verimli hale geldi. 
              Sistem kurulumu çok kolay ve destek ekibi muhteşem!"
            </blockquote>
            <div className="text-blue-200">
              <p className="font-semibold">Dr. Mehmet Özkan</p>
              <p className="text-sm">Başhekim, Özel Sağlık Hastanesi</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="bordered" size="lg">
                Ana Sayfaya Dön
              </Button>
            </Link>
            <Link href="/features">
              <Button color="primary" size="lg" endContent={<ArrowRight className="h-4 w-4" />}>
                Özellikler Hakkında Daha Fazla Bilgi
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-600">
            Demo randevunuz için bir onay e-postası <strong>{demoData?.email}</strong> adresine gönderilecektir.
          </p>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Demo Öncesi Hazırlık
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Demo için hazırlanın:</h4>
              <ul className="space-y-1">
                <li>• Mevcut sisteminizdeki sorunları not alın</li>
                <li>• Beklentilerinizi ve ihtiyaçlarınızı listeleyin</li>
                <li>• Kullanıcı sayınızı ve hasta hacminizi belirleyin</li>
                <li>• Entegrasyon gereksinimlerinizi düşünün</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Demo sonrası:</h4>
              <ul className="space-y-1">
                <li>• Özel fiyat teklifi alın</li>
                <li>• Kurulum planı hazırlayın</li>
                <li>• Eğitim programı planlayın</li>
                <li>• Pilot uygulama için tarih belirleyin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSuccessPage;