import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import ProductListClient from './ProductListClient';

export const revalidate = 3600;

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  let headerData = {
    title: "منتجات بيورلايف",
    description: "اطلع على أحدث فلاتر المياه ومنقيات المياه وخدمات بيورلايف."
  };

  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'products_page_header'));
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
    keywords: ["فلاتر مياه", "منتجات بيورلايف", "شراء فلتر ماء طنطا", "Pure Life Products"],
    alternates: {
      canonical: currentPage > 1 ? `https://purelife-egypt.vercel.app/products?page=${currentPage}` : 'https://purelife-egypt.vercel.app/products',
    },
    openGraph: {
      title,
      description,
      url: 'https://purelife-egypt.vercel.app/products',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : null),
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const products = await getProducts();
  
  return <ProductListClient initialProducts={products} searchParams={resolvedSearchParams} />;
}