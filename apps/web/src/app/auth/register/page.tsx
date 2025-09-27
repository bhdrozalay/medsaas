import RegisterScreen from '@/components/auth/RegisterScreen';

export const metadata = {
  title: 'Hesap Oluştur - MedSAS',
  description: 'MedSAS sağlık yönetim sistemi için yeni hesap oluşturun.',
  keywords: 'MedSAS, hesap oluştur, kayıt ol, sağlık yönetimi, hastane yazılımı',
  openGraph: {
    title: 'Hesap Oluştur - MedSAS',
    description: 'Sağlık yönetim sistemi için yeni hesap oluşturun.',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function RegisterPage() {
  return <RegisterScreen />;
}
