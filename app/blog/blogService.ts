import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';

export async function getBlogs(category?: string) {
  try {
    const blogsRef = collection(db, 'articles');
    const q = query(blogsRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    let posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    }) as any[];

    // فلترة التصنيفات مع دعم مرن للأسماء بالعربي
    if (category && category !== 'الكل') {
      posts = posts.filter(post => {
        const postCat = (post.category || '').trim().toLowerCase();
        const targetCat = category.trim().toLowerCase();
        
        const categoryMap: { [key: string]: string[] } = {
          'filters': ['فلاتر', 'filters'],
          'airconditioners': ['تكييفات', 'airconditioners', 'acs', 'air conditioners'],
          'general': ['عام', 'general']
        };

        for (const [key, values] of Object.entries(categoryMap)) {
          if (values.includes(targetCat) && values.includes(postCat)) {
            return true;
          }
        }

        return postCat === targetCat;
      });
    }

    return posts;
  } catch (error) {
    console.error("Error fetching blogs: ", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const blogsRef = collection(db, 'articles');
    let q = query(blogsRef, where('slug', '==', slug), limit(1));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      q = query(blogsRef, where('__name__', '==', slug), limit(1));
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    return { 
      id: docSnap.id, 
      ...data,
    };
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

export async function getRelatedArticles(category: string, currentId: string) {
  try {
    const blogsRef = collection(db, 'articles');
    const q = query(blogsRef, orderBy('createdAt', 'desc'), limit(15));
    const querySnapshot = await getDocs(q);
    
    let posts = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      })
      .filter((post: any) => {
        if (post.id === currentId) return false;
        const postCat = (post.category || '').trim().toLowerCase();
        const targetCat = (category || '').trim().toLowerCase();
        return postCat === targetCat;
      });

    return posts;
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return [];
  }
}