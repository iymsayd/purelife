import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import ProductDetailsClient from '@/app/used-products/[slug]/ProductDetailsClient';
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
    const docRef = doc(db, colName, cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  }

  for (const colName of ['used-products', 'used_products']) {
    try {
      const q = query(collection(db, colName), where('slug', '==', cleanId), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        return { id: foundDoc.id, ...foundDoc.data() };
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
  const desc = rawData.descriptionAr || rawData.descAr || rawData.description || rawData.desc || '';

  return {
    title: `${title} (مستعمل) | متجر فلاتر المياه`,
    description: desc || 'تصفح عروض الأجهزة المستعملة بحالة ممتازة وبأسعار اقتصادية.',
    openGraph: {
      title: `${title} (مستعمل)`,
      description: desc,
      images: rawData.image ? [{ url: rawData.image }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);

  if (!rawData) {
    return (
      <div className="p-20 text-center bg-[var(--background)] text-[var(--foreground)] text-lg font-bold" dir="rtl">
        المنتج المستعمل غير موجود.
      </div>
    );
  }

  const product = {
    ...rawData,
    createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate().toISOString() : null,
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen transition-colors duration-300" dir="rtl">
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