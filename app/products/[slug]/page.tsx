import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import ProductDetailsClient from '@/app/products/[slug]/ProductDetailsClient';
import CartComponent from '@/components/layout/CartComponent'; 
import { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }>; };

async function getProductData(identifier: string) {
  const cleanId = identifier ? decodeURIComponent(identifier).trim() : '';
  if (!cleanId) return null;
  
  try {
    const docRef = doc(db, "products", cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };

    const q = query(collection(db, "products"), where("slug", "==", cleanId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (e) { 
    console.error("Error fetching product:", e); 
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);
  
  if (!rawData) {
    return { title: 'المنتج غير موجود' };
  }

  const title = rawData.nameAr || rawData.titleAr || rawData.title || 'متجر بيورلايف';
  const description = rawData.descriptionAr || rawData.description || 'تفاصيل المنتج من بيورلايف';
  const productImage = rawData.image || rawData.imageUrl || 'https://purelife-eg.com/og-image.jpg';

  return { 
    title: `${title} | بيورلايف`, 
    description,
    alternates: {
      canonical: `https://purelife-eg.com/products/${slug}`,
    },
    openGraph: {
      title: `${title} | بيورلايف`,
      description,
      url: `https://purelife-eg.com/products/${slug}`,
      siteName: 'بيورلايف',
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ar_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | بيورلايف`,
      description,
      images: [productImage],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const rawData: any = await getProductData(slug);

  if (!rawData) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold bg-background text-foreground" dir="rtl">
        المنتج غير موجود
      </div>
    );
  }

  // تحويل الكائن بالكامل إلى Plain Object خالي من ميثودات فايربيس (مثل toJSON أو Timestamps)
  const product = { 
    ...rawData,
    stock: typeof rawData.stock === 'number' ? rawData.stock : 99,
    createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate().toISOString() : (typeof rawData.createdAt === 'string' ? rawData.createdAt : null),
    updatedAt: rawData.updatedAt?.toDate ? rawData.updatedAt.toDate().toISOString() : (typeof rawData.updatedAt === 'string' ? rawData.updatedAt : null),
  };

  return (
    <div className="bg-background text-foreground min-h-screen transition-colors duration-300" dir="rtl">
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