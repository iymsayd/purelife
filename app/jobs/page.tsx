import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import JobsForm from './JobsForm';

// جلب الميتا داتا ديناميكياً من فايربيز (أو استخدام القيم الافتراضية)
export async function generateMetadata(): Promise<Metadata> {
  try {
    const docRef = doc(db, 'site_content', 'jobs_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: data.metaTitle || 'الوظائف | انضم لفريق العمل',
        description: data.metaDescription || 'انضم إلى فريق شركة بيورلايف وقدم طلب توظيف في مجال خدمة العملاء، المبيعات، الصيانة، والفنيين.',
      };
    }
  } catch (e) {
    console.error("Error fetching jobs metadata:", e);
  }

  return {
    title: 'الوظائف | انضم لفريق العمل',
    description: 'انضم إلى فريق شركة بيورلايف وقدم طلب توظيف في مجال خدمة العملاء، المبيعات، الصيانة، والفنيين.',
  };
}

export default async function JobsPage() {
  // جلب المحتوى المخصص من فايربيز لعرضه مباشرة (Server-side rendering لأجل السيو)
  let initialContent = null;
  try {
    const docRef = doc(db, 'site_content', 'jobs_page');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      initialContent = docSnap.data();
    }
  } catch (e) {
    console.error("Error fetching initial jobs content:", e);
  }

  return <JobsForm initialContent={initialContent} />;
}