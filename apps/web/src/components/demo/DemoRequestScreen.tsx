'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Heart, 
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface DemoRequestData {
  organizationType: string;
  organizationSize: string;
  currentSolution: string;
  specificNeeds: string;
  implementationTimeline: string;
  contactPerson: string;
  contactPhone: string;
  additionalNotes: string;
}

const DemoRequestScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<DemoRequestData>({
    organizationType: '',
    organizationSize: '',
    currentSolution: '',
    specificNeeds: '',
    implementationTimeline: '',
    contactPerson: '',
    contactPhone: '',
    additionalNotes: '',
  });

  // Check for registration success message
  useEffect(() => {
    const registered = searchParams.get('registered');
    const message = searchParams.get('message');
    
    if (registered === 'true' && message) {
      toast.success(decodeURIComponent(message), {
        duration: 5000,
        icon: '🎉',
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast.success('Demo talebiniz başarıyla gönderildi!', {
        duration: 4000,
        icon: '✅',
      });
      
    } catch (error) {
      console.error('Demo request error:', error);
      toast.error('Demo talebi gönderilirken bir hata oluştu.', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof DemoRequestData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Talebiniz Alındı!
              </h2>
              <p className="text-gray-600">
                Demo talebiniz başarıyla gönderildi. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Yanıt süresi: 24 saat içinde</span>
              </div>
              <div className="flex items-center justify-center">
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                <span>30 günlük ücretsiz deneme hakkınız aktif!</span>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="bg-white mb-4">
            <Heart className="h-4 w-4 mr-2 text-red-500" />
            30 Günlük Demo Süreciniz Başladı!
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Demo Talebinizi Tamamlayın
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            MedSAS ekibi size özel bir demo hazırlamak için organizasyonunuz hakkında birkaç bilgiye ihtiyaç duyuyor.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Demo Talep Formu</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Organization Type */}
                  <div className="space-y-2">
                    <Label htmlFor="organizationType">Kuruluş Türü *</Label>
                    <Select 
                      value={formData.organizationType} 
                      onValueChange={(value) => handleChange('organizationType', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kuruluşunuzun türünü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hastane</SelectItem>
                        <SelectItem value="clinic">Klinik</SelectItem>
                        <SelectItem value="medical_center">Tıp Merkezi</SelectItem>
                        <SelectItem value="polyclinic">Poliklinik</SelectItem>
                        <SelectItem value="laboratory">Laboratuvar</SelectItem>
                        <SelectItem value="pharmacy">Eczane</SelectItem>
                        <SelectItem value="healthcare_group">Sağlık Grubu</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Organization Size */}
                  <div className="space-y-2">
                    <Label htmlFor="organizationSize">Kuruluş Büyüklüğü *</Label>
                    <Select 
                      value={formData.organizationSize} 
                      onValueChange={(value) => handleChange('organizationSize', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Çalışan sayısını seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 çalışan</SelectItem>
                        <SelectItem value="11-50">11-50 çalışan</SelectItem>
                        <SelectItem value="51-100">51-100 çalışan</SelectItem>
                        <SelectItem value="101-500">101-500 çalışan</SelectItem>
                        <SelectItem value="500+">500+ çalışan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Current Solution */}
                  <div className="space-y-2">
                    <Label htmlFor="currentSolution">Mevcut Çözüm</Label>
                    <Input
                      id="currentSolution"
                      value={formData.currentSolution}
                      onChange={(e) => handleChange('currentSolution', e.target.value)}
                      placeholder="Şu anda kullandığınız sistem varsa belirtin"
                    />
                  </div>

                  {/* Specific Needs */}
                  <div className="space-y-2">
                    <Label htmlFor="specificNeeds">Özel İhtiyaçlar *</Label>
                    <Textarea
                      id="specificNeeds"
                      value={formData.specificNeeds}
                      onChange={(e) => handleChange('specificNeeds', e.target.value)}
                      placeholder="Hangi konularda demo görmek istiyorsunuz? (Hasta yönetimi, randevu sistemi, faturalandırma, raporlama vb.)"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Implementation Timeline */}
                  <div className="space-y-2">
                    <Label htmlFor="implementationTimeline">Uygulama Zaman Çizelgesi</Label>
                    <Select 
                      value={formData.implementationTimeline} 
                      onValueChange={(value) => handleChange('implementationTimeline', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ne zaman uygulamayı planlıyorsunuz?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Hemen</SelectItem>
                        <SelectItem value="1-3_months">1-3 ay içinde</SelectItem>
                        <SelectItem value="3-6_months">3-6 ay içinde</SelectItem>
                        <SelectItem value="6-12_months">6-12 ay içinde</SelectItem>
                        <SelectItem value="not_decided">Henüz karar vermedim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">İletişim Kişisi *</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                        placeholder="Demo için iletişim kurulacak kişi"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">İletişim Telefonu *</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        placeholder="+90 555 123 45 67"
                        required
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Ek Notlar</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => handleChange('additionalNotes', e.target.value)}
                      placeholder="Eklemek istediğiniz başka bilgiler varsa..."
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Gönderiliyor...</span>
                      </div>
                    ) : (
                      <>
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Demo Talebimi Gönder
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What to Expect */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sizi Neler Bekliyor?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Güvenli ve KVKK Uyumlu</h4>
                    <p className="text-sm text-gray-600">Verileriniz en yüksek güvenlik standartlarıyla korunur</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Hızlı Kurulum</h4>
                    <p className="text-sm text-gray-600">Dakikalar içinde sistemi kullanmaya başlayın</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">7/24 Destek</h4>
                    <p className="text-sm text-gray-600">Uzman ekibimiz her zaman yanınızda</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Demo İçeriği</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Hasta Yönetim Sistemi</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Randevu Planlama</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Elektronik Tıbbi Kayıt</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Faturalandırma Modülü</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Raporlama ve Analitik</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Mobil Uygulama</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">İletişim</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p className="mb-2">Sorularınız için bizimle iletişime geçin:</p>
                <p className="font-medium">demo@medsas.com</p>
                <p className="font-medium">+90 212 555 0123</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoRequestScreen;