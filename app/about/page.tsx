import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AboutContent from './AboutContent';

// تفعيل الكاش لـ Next.js مع إعادة التحديث كل ساعة (ISR) لضمان الأداء الفائق
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let headerData = {
    title: 'عن بيورلايف | من نحن',
    description: 'تعرف على شركة بيورلايف ورؤيتنا في تقديم أفضل خدمات فلاتر المياه والتكييفات بجودة عالية واحترافية بخبرة أكثر من 15 عاماً.',
  };

  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'about_page_header'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.title) headerData.title = data.title;
      if (data.description) headerData.description = data.description;
    }
  } catch (e) {
    console.error("Error fetching metadata for about page:", e);
  }

  // فلترة ذكية لمنع تكرار اسم البراند لو مضاف أو غير مضاف
  const hasBrand = /بيورلايف|pure\s*life/i.test(headerData.title);
  const finalTitle = hasBrand ? headerData.title : `${headerData.title} | بيورلايف`;

  return {
    title: finalTitle,
    description: headerData.description,
    keywords: ["عن بيورلايف", "من نحن بيورلايف", "شركة فلاتر مياه طنطا", "Pure Life About Us"],
    alternates: {
      canonical: 'https://purelife-egypt.vercel.app/about',
    },
    openGraph: {
      title: finalTitle,
      description: headerData.description,
      url: 'https://purelife-egypt.vercel.app/about',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

export default function AboutPage() {
  return <AboutContent />;
}