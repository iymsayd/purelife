import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';

const cleanDoc = (doc: any) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
  };
};

export async function getOffers() {
  try {
    const offersRef = collection(db, 'offers');
    const q = query(offersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(cleanDoc);
  } catch (error) {
    console.error("Error fetching offers: ", error);
    return [];
  }
}

export async function getOfferBySlug(slug: string) {
  try {
    const offersRef = collection(db, 'offers');
    const q = query(offersRef, where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return cleanDoc(querySnapshot.docs[0]);
  } catch (error) {
    console.error("Error fetching offer by slug:", error);
    return null;
  }
}