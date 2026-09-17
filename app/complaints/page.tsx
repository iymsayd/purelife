import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ComplaintsForm from './ComplaintsForm';

// جلب الميتا داتا ديناميكياً من فايربيز (أو استخدام القيم الافتراضية)
export async function generateMetadata(): Promise<Metadata> {
  try {
    const docRef = doc(db, 'site_content', 'complaints_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: data.metaTitle || 'شكاوى ومقترحات',
        description: data.metaDescription || 'نحن نهتم برأيكم. تواصل معنا لإرسال شكواك أو مقترحاتك لتحسين خدماتنا.',
      };
    }
  } catch (e) {
    console.error("Error fetching complaints metadata:", e);
  }

  return {
    title: 'شكاوى ومقترحات',
    description: 'نحن نهتم برأيكم. تواصل معنا لإرسال شكواك أو مقترحاتك لتحسين خدماتنا.',
  };
}

export default async function ComplaintsPage() {
  // جلب المحتوى المخصص من فايربيز لعرضه مباشرة (Server-side rendering لأجل السيو)
  let initialContent = null;
  try {
    const docRef = doc(db, 'site_content', 'complaints_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      initialContent = docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching initial complaints content:", e);
  }

  return <ComplaintsForm initialContent={initialContent} />;
}