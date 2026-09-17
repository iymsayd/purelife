'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// 1. استخدام Dynamic Import للتحميل الذكي (Code Splitting)
const Header = dynamic(() => import('@/components/layout/Header'), { 
  ssr: true, // بيخلي السيرفر يبنيه الأول SEO friendly
  loading: () => <div className="h-16 bg-transparent"></div> // شكل مؤقت لو احتجت
});

const Footer = dynamic(() => import('@/components/layout/Footer'), { 
  ssr: true 
});

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // الصفحات اللي مش عايز يظهر فيها هيدر أو فوتر
  const noLayoutRoutes = ['/login', '/register', '/admin'];
  const hideLayout = noLayoutRoutes.includes(pathname);

  return (
    <>
      {!hideLayout && <Header />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}