'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Briefcase,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { useTurkishPhoneInput, TurkishPhoneUtil } from '@medsas/utils/phone';

interface DemoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationName: string;
  organizationType: string;
  jobTitle: string;
  city: string;
  district: string;
  requestedFeatures: string[];
  source: string;
}

const organizationTypes = [
  { value: 'hospital', label: 'Hastane' },
  { value: 'clinic', label: 'Klinik / Poliklinik' },
  { value: 'medical_center', label: 'Tıp Merkezi' },
  { value: 'pharmacy', label: 'Eczane' },
  { value: 'laboratory', label: 'Laboratuvar' },
  { value: 'dental', label: 'Diş Kliniği' },
  { value: 'veterinary', label: 'Veteriner Kliniği' },
  { value: 'health_center', label: 'Sağlık Ocağı' },
  { value: 'other', label: 'Diğer' },
];

const features = [
  { id: 'patient_management', label: 'Hasta Yönetimi', description: 'Hasta kayıtları ve takibi' },
  { id: 'appointment', label: 'Randevu Sistemi', description: 'Online randevu alma' },
  { id: 'inventory', label: 'Stok Yönetimi', description: 'İlaç ve malzeme takibi' },
  { id: 'billing', label: 'Fatura Yönetimi', description: 'SGK ve özel fatura' },
  { id: 'reporting', label: 'Raporlama', description: 'Detaylı analiz ve raporlar' },
  { id: 'telemedicine', label: 'Teletıp', description: 'Uzaktan hasta takibi' },
];

const turkishCities = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
  'İçel', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const DemoRegisterScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneInput = useTurkishPhoneInput();
  const [formData, setFormData] = useState<DemoFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organizationName: '',
    organizationType: '',
    jobTitle: '',
    city: '',
    district: '',
    requestedFeatures: [],
    source: 'website',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      requestedFeatures: prev.requestedFeatures.includes(featureId)
        ? prev.requestedFeatures.filter(id => id !== featureId)
        : [...prev.requestedFeatures, featureId],
    }));
  };

  const handlePhoneChange = (value: string) => {
    phoneInput.handleChange(value);
    setFormData(prev => ({ ...prev, phone: phoneInput.value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(formData.firstName && formData.lastName && formData.email && phoneInput.isValid);
      case 2:
        return Boolean(formData.organizationName && formData.organizationType && formData.city);
      case 3:
        return agreedToTerms;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error('Lütfen tüm gerekli alanları doldurunuz.', { icon: '⚠️' });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        phone: phoneInput.value,
        ipAddress: window.navigator.userAgent, // Gerçek uygulamada IP backend'den alınır
        userAgent: window.navigator.userAgent,
        language: 'tr',
        utmSource: searchParams.get('utm_source') || null,
        utmMedium: searchParams.get('utm_medium') || null,
        utmCampaign: searchParams.get('utm_campaign') || null,
      };

      const response = await fetch('/api/demo/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success(
          'Demo kullanım talebiniz alınmıştır! En kısa sürede sizlerle iletişime geçeceğiz.',
          {
            duration: 6000,
            icon: '🎉',
            style: {
              background: '#10B981',
              color: '#FFFFFF',
              fontWeight: '500',
            },
          }
        );

        // Success sayfasına yönlendir
        router.push(`/auth/success?id=${result.id}`);
      } else {
        const error = await response.json();
        
        if (response.status === 409) {
          toast.error('Bu e-posta adresi ile daha önce demo talebinde bulunulmuş. Lütfen farklı bir e-posta deneyiniz.', {
            duration: 5000,
            icon: '📧',
          });
        } else {
          toast.error(error.message || 'Demo talebi gönderilirken bir hata oluştu.', {
            duration: 4000,
            icon: '❌',
          });
        }
      }
    } catch (error) {
      toast.error('Bağlantı hatası! Lütfen tekrar deneyiniz.', {
        duration: 4000,
        icon: '🔌',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">MedSAS</span>
                <span className="text-xs text-gray-500">Sağlık Yönetim Sistemi</span>
              </div>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              Zaten hesabınız var mı? Giriş yapın
            </Link>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-800 text-sm font-medium mb-4">
            <Star className="h-4 w-4 mr-2" />
            Türkiye'nin #1 Sağlık Yönetim Platformu
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Sağlık Yönetiminizi
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dijitalleştirin</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Modern tıbbi uygulamalar için tasarlanmış güvenli, ölçeklenebilir ve kapsamlı sağlık çözümü ile ücretsiz demo deneyimi yaşayın.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <div className="text-2xl font-bold text-blue-600 mb-1">10,000+</div>
            <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
          </div>
          <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <div className="text-2xl font-bold text-green-600 mb-1">99.9%</div>
            <div className="text-sm text-gray-600">Aktiflik Oranı</div>
          </div>
          <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <div className="text-2xl font-bold text-purple-600 mb-1">KVKK</div>
            <div className="text-sm text-gray-600">Uyumlu</div>
          </div>
          <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <div className="text-2xl font-bold text-indigo-600 mb-1">7/24</div>
            <div className="text-sm text-gray-600">Teknik Destek</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    step >= stepNumber
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/70 text-gray-500 border-2 border-gray-200'
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${
                      step > stepNumber ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-24 text-sm font-medium">
            <span className={step >= 1 ? 'text-blue-600' : 'text-gray-500'}>Kişisel Bilgiler</span>
            <span className={step >= 2 ? 'text-blue-600' : 'text-gray-500'}>Kurum Bilgileri</span>
            <span className={step >= 3 ? 'text-blue-600' : 'text-gray-500'}>Özellikler</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Kişisel Bilgiler */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Bilgilerinizi Paylaşın
                  </h2>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    Demo deneyiminizi kişiselleştirebilmemiz için temel bilgilerinizi paylaşın
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ad */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Ad *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        name="firstName"
                        type="text"
                        required
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Adınızı giriniz"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Soyad */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Soyad *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        name="lastName"
                        type="text"
                        required
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Soyadınızı giriniz"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* E-posta */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      E-posta Adresi *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        name="email"
                        type="email"
                        required
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="ornek@hastane.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Telefon */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Telefon Numarası *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        required
                        className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                          phoneInput.formatted && !phoneInput.isValid
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        placeholder="+90 555 123 45 67"
                        value={phoneInput.formatted}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                    </div>
                    {phoneInput.formatted && !phoneInput.isValid && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Geçerli bir Türk cep telefonu numarası giriniz
                      </p>
                    )}
                    {phoneInput.operator && phoneInput.isValid && (
                      <p className="text-green-600 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Operatör: {phoneInput.operator}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-3 group"
                >
                  <span className="text-lg">Devam Et</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            )}

            {/* Step 2: Kurum Bilgileri */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Kurum Bilgileriniz
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Size en uygun demo içeriğini hazırlayabilmemiz için kurum bilgilerinizi paylaşın
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Kurum Adı */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kurum/Şirket Adı *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <input
                        name="organizationName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Örnek Hastanesi"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Kurum Türü */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kurum Türü *
                      </label>
                      <select
                        name="organizationType"
                        required
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.organizationType}
                        onChange={handleInputChange}
                      >
                        <option value="">Seçiniz</option>
                        {organizationTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Görev */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Göreviniz
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                          name="jobTitle"
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Doktor, Yönetici, IT Sorumlusu..."
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Şehir */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Şehir *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <select
                          name="city"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.city}
                          onChange={handleInputChange}
                        >
                          <option value="">Şehir seçiniz</option>
                          {turkishCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* İlçe */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İlçe
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                          name="district"
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="İlçe adı"
                          value={formData.district}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Devam Et</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Özellikler ve Onay */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    İlgilendiğiniz Özellikler
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Hangi özelliklere odaklanmamızı istiyorsunuz? (Opsiyonel)
                  </p>
                </div>

                {/* Özellikler */}
                <div className="grid md:grid-cols-2 gap-4">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.requestedFeatures.includes(feature.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleFeatureToggle(feature.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.requestedFeatures.includes(feature.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {formData.requestedFeatures.includes(feature.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{feature.label}</h4>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gizlilik Sözleşmesi */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <div className="text-sm text-gray-700">
                      <label htmlFor="terms" className="cursor-pointer">
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                          Gizlilik Sözleşmesi
                        </Link>{' '}
                        ve{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                          Kullanım Şartları
                        </Link>
                        'nı okudum, kabul ediyorum. Demo sürecinde paylaşacağım bilgilerin MedSAS tarafından 
                        sadece demo amaçlı kullanılacağını ve üçüncü kişilerle paylaşılmayacağını kabul ediyorum.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Avantajlar */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    Demo Sürecinde Sizlere Sunacaklarımız:
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Kurumunuza özel canlı demo oturumu</li>
                    <li>• Tüm özelliklerin detaylı tanıtımı</li>
                    <li>• Sorularınıza anında cevaplar</li>
                    <li>• Fiyatlandırma ve paket seçenekleri</li>
                    <li>• Ücretsiz kurulum desteği</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !agreedToTerms}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Demo Talebi Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        <span>Ücretsiz Demo Talebinde Bulun</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DemoRegisterScreen;