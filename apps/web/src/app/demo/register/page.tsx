import DemoRegisterScreen from '@/components/auth/DemoRegisterScreen';

export const metadata = {
  title: 'Demo Talebinde Bulun - MedSAS',
  description: 'Sağlık yönetim sistemi demosunu deneyimlemek için ücretsiz demo talebinde bulunun.',
  keywords: 'MedSAS, demo, sağlık yönetimi, hastane yazılımı, demo talep',
  openGraph: {
    title: 'Ücretsiz Demo Talebinde Bulun - MedSAS',
    description: 'Sağlık yönetim sistemi demosunu deneyimlemek için bilgilerinizi paylaşın.',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function DemoRegisterPage() {
  return <DemoRegisterScreen />;
}