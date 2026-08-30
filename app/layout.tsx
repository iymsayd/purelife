import type { Metadata } from "next";
import { Cairo } from 'next/font/google';
import { Suspense } from 'react';
import "./globals.css";

// استيراد المكون الوسيط
import ConditionalLayout from '@/components/ConditionalLayout'; 
import { CartProvider } from './context/CartContext'; 
import AnalyticsInitializer from '@/lib/AnalyticsInitializer';

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ['arabic'] 
});

export const metadata: Metadata = {
  title: "بيورلايف للتكييفات وفلاتر المياة",
  description: "حلول ذكية متكاملة في أنظمة التكييف",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning> 
      <body className={`${cairo.className} bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 min-h-screen flex flex-col`}>
        <CartProvider>
          <AnalyticsInitializer />
          {/* المكون الوسيط هو اللي هيتحكم في الهيدر والفوتر */}
          <ConditionalLayout>
            <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center">جاري التحميل...</div>}>
              <main className="flex-grow">{children}</main>
            </Suspense>
          </ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}