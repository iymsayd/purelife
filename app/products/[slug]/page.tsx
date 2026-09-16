import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import ProductDetailsClient from '@/app/products/[slug]/ProductDetailsClient';
import CartComponent from '@/components/layout/CartComponent'; 
import { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }>; };

async function getProductData(identifier: string) {
  const cleanId = identifier ? decodeURIComponent(identifier).trim() : '';
  if (!cleanId) return null;
  const docRef = doc(db, "products", cleanId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  try {
    const q = query(collection(db, "products"), where("slug", "==", cleanId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (e) { console.error(e); }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);
  if (!rawData) return { title: 'المنتج غير موجود' };
  return { title: rawData.nameAr || rawData.titleAr || rawData.title, description: rawData.descriptionAr || rawData.description };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);

  if (!rawData) {
    return <div className="min-h-screen flex items-center justify-center font-bold">المنتج غير موجود</div>;
  }

  const product = { 
    ...rawData,
    createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate().toISOString() : null,
  };

  return (
    <div className="bg-[var(--background)] min-h-screen" dir="rtl">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <ProductDetailsClient product={product} />
          </div>
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <CartComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}