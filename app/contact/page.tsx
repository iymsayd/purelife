import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ContactClient from './ContactClient';

// جلب الميتا داتا ديناميكياً من فايربيز (أو استخدام القيم الافتراضية)
export async function generateMetadata(): Promise<Metadata> {
  try {
    const docRef = doc(db, 'site_content', 'contact_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: data.metaTitle || 'تواصل معنا ',
        description: data.metaDescription || 'تواصل مع فريق عمل بيورلايف في فروع طنطا ومحلة مرحوم لمعالجة المياه، محطات الرواى، وفلاتر المياه والتكييفات.',
        keywords: data.keywords || ['فلاتر مياه طنطا', 'صيانة تكييفات الغربية', 'بيورلايف محلة مرحوم', 'تواصل معنا بيورلايف'],
        openGraph: {
          title: data.ogTitle || 'تواصل معنا ',
          description: data.ogDescription || 'تواصل مع فريق عمل بيورلايف لمعالجة المياه والتكييف.',
          locale: 'ar_EG',
          type: 'website',
        },
      };
    }
  } catch (e) {
    console.error("Error fetching contact metadata:", e);
  }

  return {
    title: 'تواصل معنا',
    description: 'تواصل مع فريق عمل بيورلايف في فروع طنطا ومحلة مرحوم لمعالجة المياه، محطات الرواى، وفلاتر المياه والتكييفات.',
    keywords: ['فلاتر مياه طنطا', 'صيانة تكييفات الغربية', 'بيورلايف محلة مرحوم', 'تواصل معنا بيورلايف'],
    openGraph: {
      title: 'تواصل معنا',
      description: 'تواصل مع فريق عمل بيورلايف لمعالجة المياه والتكييف.',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

export default function ContactPage() {
  return <ContactClient />;
}