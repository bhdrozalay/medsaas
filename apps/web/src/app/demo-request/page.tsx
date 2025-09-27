import DemoRequestScreen from '@/components/demo/DemoRequestScreen';

export const metadata = {
  title: 'Demo Talep - MedSAS',
  description: 'MedSAS demo talebinizi tamamlayın ve deneme sürecinizi başlatın.',
  keywords: 'MedSAS, demo talep, deneme sürümü, sağlık yönetimi, hastane yazılımı',
  openGraph: {
    title: 'Demo Talep - MedSAS',
    description: 'Demo talebinizi tamamlayın ve deneme sürecinizi başlatın.',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function DemoRequestPage() {
  return <DemoRequestScreen />;
}