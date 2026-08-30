import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import MaintenanceForm from './MaintenanceForm';

// جلب الميتا داتا ديناميكياً من فايربيز (أو استخدام القيم الافتراضية)
export async function generateMetadata(): Promise<Metadata> {
  try {
    const docRef = doc(db, 'site_content', 'maintenance_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: data.metaTitle || 'طلب صيانة | بيورلايف',
        description: data.metaDescription || 'اطلب صيانة فلاتر المياه أو التكييفات وسيقوم فريقنا بالتواصل معك في أسرع وقت.',
      };
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  return {
    title: 'طلب صيانة | بيورلايف',
    description: 'اطلب صيانة فلاتر المياه أو التكييفات وسيقوم فريقنا بالتواصل معك في أسرع وقت.',
  };
}

export default async function MaintenancePage() {
  // جلب المحتوى المخصص من فايربيز لعرضه مباشرة (Server-side rendering لأجل السيو)
  let initialContent = null;
  try {
    const docRef = doc(db, 'site_content', 'maintenance_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      initialContent = docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching initial maintenance content:", e);
  }

  return <MaintenanceForm initialContent={initialContent} />;
}