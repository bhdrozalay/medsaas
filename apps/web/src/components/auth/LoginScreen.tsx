import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        
        toast.success('Başarıyla giriş yaptınız!', {
          duration: 3000,
          icon: '✅',
        });
        
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Giriş başarısız!', {
          duration: 4000,
          icon: '❌',
        });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            MedSAS'a Hoş Geldiniz
          </h2>
          <p className="text-gray-600">
            Hesabınıza giriş yapın ve sağlık yönetim sisteminize erişin
          </p>
        </div>

        {/* Giriş Formu */}
        <form className="bg-white rounded-2xl shadow-xl p-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Alanı */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="ornek@hastane.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Şifre Alanı */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Beni Hatırla ve Şifremi Unuttum */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Beni hatırla
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Şifremi unuttum
            </Link>
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Giriş yapılıyor...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Giriş Yap</span>
              </>
            )}
          </button>

          {/* Demo Hesap Bilgisi */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Hesap Bilgileri:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>E-posta:</strong> demo@medsas.com</p>
              <p><strong>Şifre:</strong> Demo123!</p>
            </div>
          </div>

          {/* Kayıt Ol Linki */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Henüz hesabınız yok mu?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                Ücretsiz demo talebinde bulunun
              </Link>
            </p>
          </div>
        </form>

        {/* Alt Bilgi */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 MedSAS. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;