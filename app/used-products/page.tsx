import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import ProductListClient from './ProductListClient';

export const revalidate = 3600; 

interface UsedProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: UsedProductsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  let headerData = {
    title: "المنتجات المستعملة",
    description: "تصفح أفضل العروض على المنتجات المستعملة بحالة ممتازة من بيورلايف."
  };

  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'used_products_page_header'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.title) headerData.title = data.title;
      if (data.description) headerData.description = data.description;
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  const title = currentPage > 1 ? `${headerData.title} - صفحة ${currentPage}` : headerData.title;
  const description = currentPage > 1 
    ? `${headerData.description} - صفحة رقم ${currentPage}.` 
    : headerData.description;

  return {
    title,
    description,
    keywords: ["فلاتر مستعملة", "أجهزة مستعملة بحالة ممتازة", "عروض بيورلايف المستعملة", "Pure Life Used"],
    alternates: {
      canonical: currentPage > 1 ? `https://purelife-egypt.vercel.app/used-products?page=${currentPage}` : 'https://purelife-egypt.vercal.app/used-products',
    },
    openGraph: {
      title,
      description,
      url: 'https://purelife-egypt.vercel.app/used-products',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

async function getUsedProducts() {
  const collectionNames = ['used_products', 'used-products'];
  let allProducts: any[] = [];

  for (const colName of collectionNames) {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      const docs = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          nameAr: data.nameAr || data.title || '',
          categoryAr: data.categoryAr || data.category || 'غير محدد',
          conditionAr: data.conditionAr || data.condition || 'ممتازة',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : null),
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

export default async function UsedProductsPage({ searchParams }: UsedProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const products = await getUsedProducts();
  
  return <ProductListClient initialProducts={products} searchParams={resolvedSearchParams} />;
}