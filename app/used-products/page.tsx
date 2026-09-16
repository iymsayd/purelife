import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductListClient from './ProductListClient';

export const revalidate = 3600; 

async function getUsedProducts() {
  const collectionNames = ['used_products', 'used-products'];
  let allProducts: any[] = [];

  for (const colName of collectionNames) {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      const docs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          nameAr: data.nameAr || data.title || '',
          categoryAr: data.categoryAr || data.category || 'غير محدد',
          conditionAr: data.conditionAr || data.condition || 'ممتازة',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
        };
      });
      allProducts = [...allProducts, ...docs];
    } catch (error) {
      console.error(`خطأ في جلب بيانات المنتجات من ${colName}:`, error);
    }
  }

  const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
  return uniqueProducts.filter((p: any) => p.isAvailable !== false);
}

export default async function UsedProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const products = await getUsedProducts();
  
  return <ProductListClient initialProducts={products} searchParams={resolvedSearchParams} />;
}