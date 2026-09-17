import type { Metadata } from "next";
import { Cairo } from 'next/font/google';
import { Suspense } from 'react';
import "./globals.css";

// استيراد المكون الوسيط
import ConditionalLayout from '@/components/ui/ConditionalLayout'; 
import { CartProvider } from './context/CartContext'; 
import AnalyticsInitializer from '@/lib/AnalyticsInitializer';

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ['arabic'] 
});

// إعدادات الـ SEO والـ OpenGraph المركزية للموقع كله
export const metadata: Metadata = {
  metadataBase: new URL('https://purelife-egypt.vercel.app'), // رابط الموقع الأساسي المحدث لـ Vercel
  title: {
    default: "بيورلايف | التكييفات وتنقية المياه في مصر",
    template: "%s | بيورلايف" // دا بيخلي عنوان أي صفحة يظهر كدة: "اسم الصفحة | بيورلايف" أوتوماتيكياً
  },
  description: "وكيل حصري وأفضل الحلول الذكية المتكاملة في أنظمة التكييف وفلاتر تنقية المياه في مصر.",
  keywords: ["تكييفات", "فلاتر مياه", "صيانة تكييف", "بيورلايف", "تنقية المياه مصر"],
  authors: [{ name: "PureLife" }],
  creator: "PureLife",
  publisher: "PureLife",
  // إعدادات السوشيال ميديا (OpenGraph) لما حد يشير اللينك على فيسبوك، واتساب، إلخ
  openGraph: {
    title: "بيورلايف للتكييفات وفلاتر المياة",
    description: "حلول ذكية متكاملة في أنظمة التكييف وتنقية المياه بأعلى جودة في مصر.",
    url: 'https://purelife-egypt.vercel.app',
    siteName: 'بيورلايف - PureLife',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // حط صورة تعبيرية للموقع في مجلد public باسم og-image.jpg
        width: 1200,
        height: 630,
        alt: 'بيورلايف للتكييفات وفلاتر المياه',
      },
    ],
  },
  // إعدادات محركات البحث وتويتر
  twitter: {
    card: 'summary_large_image',
    title: "بيورلايف للتكييفات وفلاتر المياة",
    description: "حلول ذكية متكاملة في أنظمة التكييف وتنقية المياه",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // بيانات الهيكلة (JSON-LD Schema) الخاصة بالنشاط التجاري لمحركات البحث
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "بيورلايف - Pure Life",
    "image": "https://purelife-egypt.vercel.app/og-image.jpg",
    "@id": "https://purelife-egypt.vercel.app",
    "url": "https://purelife-egypt.vercel.app",
    "telephone": "+201000000000", // يمكنك استبداله برقم هاتفك الحقيقي لاحقاً
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "طنطا",
      "addressCountry": "EG"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Saturday",
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday"
      ],
      "opens": "09:00",
      "closes": "21:00"
    },
    "sameAs": [
      "https://purelife-egypt.vercel.app"
    ]
  };

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning> 
      <head>
        {/* حقن سكربت الـ Schema أوتوماتيكياً في رأس الصفحة لكل الموقع */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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