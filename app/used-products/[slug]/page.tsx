import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import ProductDetailsClient from './ProductDetailsClient';
import CartComponent from '@/components/layout/CartComponent';
import { Metadata } from 'next';

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getProductData(identifier: string) {
  const cleanId = identifier ? decodeURIComponent(identifier).trim() : '';
  if (!cleanId) return null;

  for (const colName of ['used-products', 'used_products']) {
    try {
      const docRef = doc(db, colName, cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : null),
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const colName of ['used-products', 'used_products']) {
    try {
      const q = query(collection(db, colName), where('slug', '==', cleanId), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        const data = foundDoc.data();
        return { 
          id: foundDoc.id, 
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : null),
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);

  if (!rawData) {
    return { title: 'المنتج المستعمل غير موجود' };
  }

  const title = rawData.nameAr || rawData.titleAr || rawData.title || '';
  const desc = rawData.descriptionAr || rawData.descAr || rawData.description || rawData.desc || 'تصفح عروض الأجهزة المستعملة بحالة ممتازة وبأسعار اقتصادية.';
  const productImage = rawData.image || rawData.imageUrl || 'https://purelife-eg.com/og-image.jpg';

  return {
    title: `${title} (مستعمل) | بيورلايف`,
    description: desc,
    alternates: {
      canonical: `https://purelife-eg.com/used-products/${slug}`,
    },
    openGraph: {
      title: `${title} (مستعمل) | بيورلايف`,
      description: desc,
      url: `https://purelife-eg.com/used-products/${slug}`,
      siteName: 'بيورلايف',
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: `${title} (مستعمل)`,
        },
      ],
      locale: 'ar_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} (مستعمل) | بيورلايف`,
      description: desc,
      images: [productImage],
    },
  };
}

export default async function UsedProductPage({ params }: Props) {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);

  if (!rawData) {
    return (
      <div className="p-20 text-center bg-background text-foreground text-lg font-bold min-h-screen flex items-center justify-center" dir="rtl">
        المنتج المستعمل غير موجود.
      </div>
    );
  }

  const product = {
    ...rawData,
    stock: typeof rawData.stock === 'number' ? rawData.stock : 99,
  };

  return (
    <div className="bg-background text-foreground min-h-screen transition-colors duration-300" dir="rtl">
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8">
            <ProductDetailsClient product={product} />
          </div>
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <CartComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}