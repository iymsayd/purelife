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

export async function getEvents() {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(cleanDoc);
  } catch (error) {
    console.error("Error fetching events: ", error);
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const eventsRef = collection(db, 'events');
    let q = query(eventsRef, where('slug', '==', slug), limit(1));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      q = query(eventsRef, where('__name__', '==', slug), limit(1));
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) return null;
    return cleanDoc(querySnapshot.docs[0]);
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}