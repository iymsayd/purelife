import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const products: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // تنظيف كامل لأي خصائص تحتوي على toJSON أو تزيد عن الحد لضمان نقلها بسلاسة للـ Client Components
      const cleanedData = JSON.parse(JSON.stringify({
        id: doc.id,
        ...data,
        image: data.image || data.imageUrl || data.img || '',
        imageUrl: data.imageUrl || data.image || data.img || '',
        createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : null,
        updatedAt: data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : null,
      }));

      products.push(cleanedData);
    });

    return products;

  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    return [];
  }
}