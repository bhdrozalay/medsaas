'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone,
  Lock,
  Building,
  Eye,
  EyeOff,
  Heart,
  Check,
  Shield,
  Users,
  Star
} from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır').optional(),
  organizationName: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır'),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir sayı içermelidir')
    .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermelidir'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'Kullanım şartlarını kabul etmelisiniz'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  
  const passwordStrength = {
    hasMinLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password || ''),
    hasNumber: /[0-9]/.test(password || ''),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password || ''),
  };
  
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          organizationName: data.organizationName,
          password: data.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Demo hesabınız başarıyla oluşturuldu!', {
          duration: 4000,
          icon: '🎉',
        });
        
        // Show success details
        console.log('Registration successful:', result.data);
        
        // Redirect to demo-request page after 2 seconds
        setTimeout(() => {
          router.push('/demo-request?registered=true&message=Demo+hesabınız+başarıyla+oluşturuldu.+Lütfen+demo+talebinizi+tamamlayın.');
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Server error:', error);
        console.error('Response status:', response.status);
        
        if (response.status === 409) {
          toast.error('Bu e-posta adresi zaten kullanımda.', {
            duration: 4000,
            icon: '📧',
          });
        } else {
          toast.error(error.error || error.message || 'Hesap oluşturulurken bir hata oluştu.', {
            duration: 4000,
            icon: '❌',
          });
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Bağlantı hatası! Lütfen tekrar deneyiniz.', {
        duration: 4000,
        icon: '🔌',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Hesabınızı oluşturun</h2>
            <p className="mt-2 text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
              >
                Giriş yapın
              </Link>
            </p>
          </div>

          {/* Register Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Ad ve Soyad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      type="text"
                      placeholder="Adınız"
                      className="pl-10"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    type="text"
                    placeholder="Soyadınız"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* E-posta */}
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="ornek@hastane.com"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    {...register('phone')}
                    type="tel"
                    placeholder="+90 555 123 45 67"
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Firma Adı */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">Firma Adı</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="organizationName"
                    {...register('organizationName')}
                    type="text"
                    placeholder="Firma adınızı giriniz"
                    className="pl-10"
                  />
                </div>
                {errors.organizationName && (
                  <p className="text-sm text-red-600">{errors.organizationName.message}</p>
                )}
              </div>

              {/* Şifre */}
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Güçlü bir şifre oluşturun"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Şifre güvenlik göstergeleri */}
                {password && (
                  <Card className="mt-2">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Şifre Güvenliği</span>
                          <span className="text-gray-500">
                            {Object.values(passwordStrength).filter(Boolean).length}/4
                          </span>
                        </div>
                        <Progress 
                          value={(Object.values(passwordStrength).filter(Boolean).length / 4) * 100}
                          className="h-2"
                        />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <Check className={`w-3 h-3 ${passwordStrength.hasMinLength ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}>8+ karakter</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className={`w-3 h-3 ${passwordStrength.hasUppercase ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-500'}>Büyük harf</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className={`w-3 h-3 ${passwordStrength.hasNumber ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}>Sayı</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Check className={`w-3 h-3 ${passwordStrength.hasSpecialChar ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}>Özel karakter</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Şifre Tekrarı */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrarı</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi tekrar giriniz"
                    className="pl-10 pr-20"
                  />
                  <div className="absolute right-3 top-3 flex items-center space-x-2">
                    {passwordsMatch && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Kullanım Şartları */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  onCheckedChange={(checked) => {
                    setValue('agreeToTerms', !!checked)
                  }}
                  className="mt-0.5"
                />
                <Label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-5">
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Kullanım Şartları
                  </Link>{' '}
                  ve{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Gizlilik Politikası
                  </Link>
                  'nı okudum ve kabul ediyorum.
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}
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
                  <span>Hesap oluşturuluyor...</span>
                </div>
              ) : (
                '30 günlük ücretsiz demo başlat'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-white px-12">
            <div className="text-center">
              <Heart className="mx-auto h-16 w-16 mb-8" />
              <h1 className="text-4xl font-bold mb-6">
                Bugün MedSAS'a Katılın
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-md">
                En güvenilir sağlık yönetimi platformu ile yolculuğunuza başlayın.
              </p>
              <div className="space-y-4 text-left max-w-sm">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-300" />
                  <span>KVKK Uyumlu Güvenlik</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-300" />
                  <span>Çok Kiracılı Mimari</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-300" />
                  <span>Gerçek Zamanlı Analitik</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-300" />
                  <span>7/24 Uzman Destek</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;