import DemoSuccessPage from '@/components/demo/DemoSuccessPage';

export default function DemoSuccessPageRoute() {
  return <DemoSuccessPage />;
}

export const metadata = {
  title: 'Demo Talebiniz Alındı - MedSAS',
  description: 'Demo kullanım talebiniz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.',
  robots: 'noindex, nofollow', // Success sayfası arama motorlarında görünmesin
};