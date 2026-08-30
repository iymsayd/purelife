import { getBlogs } from '@/app/blog/blogService';
import { getProducts } from '@/app/products/productService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import HeroSection from '@/components/home/HeroSection';
import ValueBanner from '@/components/home/ValueBanner';
import ProductsSection from '@/components/home/ProductsSection';
import WhyUsSection from '@/components/home/WhyUsSection';
import ServicesSection from '@/components/home/ServicesSection';
import BlogsSection from '@/components/home/BlogsSection';

// تفعيل الـ ISR للصفحة الرئيسية لتتحدث تلقائياً كل ساعة (3600 ثانية)
export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: "بيورلايف لتنقية المياه والتكييفات | الصفحة الرئيسية",
    description: "تسوق أونلاين أفضل ماركات وأنواع التكييفات وفلاتر المياه من بيور لايف بأفضل أسعار وأجود خدمة في مصر.",
  };
}

export default async function HomePage() {
  const isRtl = true;
  let blogs: any[] = [];
  let products: any[] = [];
  let homeData: any = {};

  try {
    // سحب بيانات الموقع والمنتجات والمقالات دفعة واحدة
    const [blogsRes, productsRes, homeDocSnap] = await Promise.all([
      getBlogs().catch(() => []),
      getProducts().catch(() => []),
      getDoc(doc(db, 'settings', 'home_content')).catch(() => null)
    ]);
    
    blogs = blogsRes || [];
    products = productsRes || [];
    
    if (homeDocSnap && homeDocSnap.exists()) {
      homeData = homeDocSnap.data();
    }
  } catch (error) {
    console.error("Error loading home data:", error);
  }

  // تنقية وتحويل بيانات المقالات لـ Plain Objects لتجنب أخطاء الـ Server to Client Components
  const serializedBlogs = blogs.map((blog: any) => ({
    ...blog,
    createdAt: blog.createdAt?.seconds 
      ? new Date(blog.createdAt.seconds * 1000).toISOString() 
      : blog.createdAt || null,
    updatedAt: blog.updatedAt?.seconds 
      ? new Date(blog.updatedAt.seconds * 1000).toISOString() 
      : blog.updatedAt || null,
  }));

  // تنقية بيانات المنتجات أيضاً لو تحتوي على Timestamps
  const serializedProducts = products.map((product: any) => ({
    ...product,
    createdAt: product.createdAt?.seconds 
      ? new Date(product.createdAt.seconds * 1000).toISOString() 
      : product.createdAt || null,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300" dir="rtl">
      <HeroSection 
        isRtl={isRtl}
        badgeText={homeData.badgeText}
        mainTitle={homeData.mainTitle}
        highlightedTitle={homeData.highlightedTitle}
        description={homeData.description}
        brands={homeData.brands}
        footerNote={homeData.footerNote}
      />
      
      <ValueBanner 
        bannerText={homeData.bannerText} 
      />
      
      <ProductsSection products={serializedProducts} />
      
      <WhyUsSection 
        sectionTitle={homeData.whyUsTitle}
        sectionSubtitle={homeData.whyUsSubtitle}
        features={homeData.features}
      />
      
      <ServicesSection 
        isRtl={isRtl}
        sectionTitle={homeData.servicesTitle}
        sectionSubtitle={homeData.servicesSubtitle}
        services={homeData.services}
        moreText={homeData.moreText}
      />
      
      <BlogsSection blogs={serializedBlogs} />
    </div>
  );
}