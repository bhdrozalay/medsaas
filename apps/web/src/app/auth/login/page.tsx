'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Heart, Shield, Stethoscope, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parametrelerini kontrol et ve uygun mesajları göster
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error === 'session-expired') {
      toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
    } else if (error === 'unauthorized') {
      toast.error('Bu sayfaya erişim yetkiniz yok.');
    } else if (error === 'invalid-token') {
      toast.error('Oturum bilginiz geçersiz. Lütfen tekrar giriş yapın.');
    } else if (message === 'logged-out') {
      toast.success('Başarıyla çıkış yaptınız.');
    } else if (message === 'account-approved') {
      toast.success('🎉 Tebrikler! Hesabınız onaylandı. Giriş yapabilirsiniz.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('🚀 Login form submitted'); // Debug
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('📡 API Response status:', response.status); // Debug
      
      if (response.ok) {
        const result = await response.json();
        console.log('Login result:', result); // Debug log
        toast.success('Giriş başarılı! MedSAS\'a hoş geldiniz. \u{1F389}');
        
        // Kullanıcı durumuna ve rolüne göre yönlendirme
        console.log('User role:', result.user.role); // Debug log
        console.log('Approval status:', result.user.approvalStatus); // Debug log
        
        // Super Admin her durumda admin paneline yönlendiriliyor
        if (result.user.role === 'SUPER_ADMIN') {
          console.log('Redirecting to admin dashboard'); // Debug log
          setTimeout(() => {
            window.location.href = '/admin';
          }, 500);
        } else {
          // Diğer kullanıcılar için durum kontrolü
          // Login API'sinde 'PENDING' olarak döndürülüyor ama aslında 'PENDING_APPROVAL' olmalı
          switch (result.user.approvalStatus) {
            case 'PENDING':
            case 'PENDING_APPROVAL':
              router.push('/pending-approval');
              break;
            case 'ACTIVE':
            case 'APPROVED':
              if (result.user.role === 'TENANT_ADMIN') {
                router.push('/tenant-admin');
              } else if (result.user.role === 'USER' || result.user.role === 'TENANT_USER') {
                router.push('/dashboard');
              } else {
                router.push('/dashboard');
              }
              break;
            case 'TRIAL_EXPIRED':
              router.push('/subscription');
              break;
            case 'REJECTED':
              router.push('/auth/rejected');
              break;
            case 'SUSPENDED':
              router.push('/auth/suspended');
              break;
            default:
              router.push('/pending-approval');
              break;
          }
        }
      } else {
        console.log('Login failed with status:', response.status); // Debug
        const error = await response.json();
        console.log('Error response:', error); // Debug
        
        // Trial expired error kontrolü
        if (response.status === 403 && error.error === 'TRIAL_EXPIRED') {
          console.log('🔴 TRIAL EXPIRED DETECTED!');
          console.log('Error object:', JSON.stringify(error, null, 2));
          
          // DIRECT REDIRECT - SIMPLE AND CLEAN
          console.log('🚀 REDIRECTING TO SUBSCRIPTION NOW!');
          window.location.href = '/subscription';
          console.log('✅ Redirect command executed');
          
          // Show simple toast message
          toast.error(error.message || 'Demo süreniz sona ermiştir. Yönlendiriliyorsunuz...');
          
          return;
        }
        
        console.log('Regular error, showing toast');
        toast.error(error.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
      }
    } catch (fetchError) {
      console.error('🚫 Login fetch error:', fetchError);
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">MedSAS</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Tekrar Hoş Geldiniz</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sağlık yönetim hesabınıza güvenli giriş yapın
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="E-posta adresinizi giriniz"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi giriniz"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Controller
                  name="rememberMe"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Beni hatırla
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Hesabınız yok mu?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                >
                  Hesap oluşturun
                </Link>
              </p>
              
              {/* Demo Link */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Sadece demo denemek istiyorsunuz?
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-600 hover:bg-green-50 transition duration-150 ease-in-out"
                >
                  Ücretsiz Demo Talebi
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative h-full flex flex-col justify-center items-center text-white px-12">
            <div className="text-center">
              <Shield className="mx-auto h-16 w-16 mb-8" />
              <h1 className="text-4xl font-bold mb-6">
                Kurumsal Sağlık Yönetimi
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-md">
                Modern tıbbi uygulamalar için güvenli, ölçeklenebilir ve kapsamlı sağlık çözümleri.
              </p>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">10/10</div>
                  <div className="opacity-75">Güvenlik Skoru</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99.99%</div>
                  <div className="opacity-75">Aktiflik Oranı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">KVKK</div>
                  <div className="opacity-75">Uyumlu</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">7/24</div>
                  <div className="opacity-75">Destek</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
