'use client';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // بنحدد إن أي مسار بيبدأ بـ rd-ad-plf هيتم إخفاء العناصر فيه
  const isAdminRoute = pathname.startsWith('/rd-ad-plf');

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && <Sidebar />}
      {!isAdminRoute && <Footer />}
    </>
  );
}