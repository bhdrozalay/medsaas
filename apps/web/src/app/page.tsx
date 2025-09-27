import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Shield, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MedSAS
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/demo/register">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Ücretsiz Dene
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800">
              🚀 Yeni Nesil Sağlık Bilgi Sistemi
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sağlık Yönetiminde
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Dijital Dönüşüm
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              MedSAS ile hasta kayıtlarından randevu yönetimine, faturalamadan raporlamaya 
              kadar tüm sağlık süreçlerinizi tek platformda yönetin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
                >
                  Ücretsiz Başla
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                Demo İzle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Neden MedSAS?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern sağlık kurumlarının ihtiyaçlarını karşılamak için tasarlanmış 
              kapsamlı özellikler.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Güvenli & Uyumlu',
                description: 'KVKK ve HIPAA uyumlu, bank-level şifreleme ile verileriniz güvende.',
                color: 'bg-green-100 text-green-600'
              },
              {
                icon: Users,
                title: 'Hasta Yönetimi',
                description: 'Kapsamlı hasta kayıtları, tıbbi geçmiş ve randevu yönetimi.',
                color: 'bg-blue-100 text-blue-600'
              },
              {
                icon: BarChart3,
                title: 'Analitik & Raporlama',
                description: 'Gelişmiş raporlama ve analitik araçları ile performans takibi.',
                color: 'bg-purple-100 text-purple-600'
              },
              {
                icon: Clock,
                title: '7/24 Erişim',
                description: 'Cloud-based yapı ile her yerden, her zaman erişim imkanı.',
                color: 'bg-orange-100 text-orange-600'
              },
              {
                icon: Zap,
                title: 'Hızlı & Verimli',
                description: 'Optimize edilmiş iş akışları ile zamandan ve maliyetten tasarruf.',
                color: 'bg-yellow-100 text-yellow-600'
              },
              {
                icon: Globe,
                title: 'Multi-Tenant',
                description: 'Çoklu kurum desteği ile merkezi yönetim imkanı.',
                color: 'bg-indigo-100 text-indigo-600'
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Rakamlarla MedSAS
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '1000+', label: 'Aktif Kullanıcı' },
              { number: '50+', label: 'Sağlık Kurumu' },
              { number: '99.9%', label: 'Uptime Garantisi' },
              { number: '24/7', label: 'Teknik Destek' }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Dijital Dönüşüme Başlamaya Hazır mısınız?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            30 günlük ücretsiz deneme ile MedSAS'ı keşfedin. 
            Kurulum ücreti yok, taahhüt yok.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo/register">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
              >
                Hemen Başla
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                Mevcut Hesap
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">MedSAS</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 MedSAS. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
