'use client';

import { ShieldCheck, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/layout/ProductCard';
import FilterSidebar from './FilterSidebar';
import SearchComponent from './SearchComponent';
import CartComponent from '@/components/layout/CartComponent';
import { useCart } from '@/app/context/CartContext';
import { useSearchParams } from 'next/navigation';

export default function UsedProductListClient({ 
  initialProducts = [], 
  searchParams 
}: { 
  initialProducts: any[]; 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // التأكد من حالة الريندر لتجنب مشاكل الـ Hydration
  const { isMounted } = useCart() || {};
  const clientSearchParams = useSearchParams();

  const getParam = (key: string) => {
    // دمج قيم الـ URL مع الـ SearchParams
    const val = clientSearchParams?.get(key) || searchParams?.[key];
    return typeof val === 'string' ? val : "";
  };

  const name = getParam('name');
  const category = getParam('category');
  const brand = getParam('brand');
  const stages = getParam('stages');
  const sterilization = getParam('sterilization');
  const power = getParam('power');
  const cooling = getParam('cooling');
  const condition = getParam('condition');
  const priceSort = getParam('priceSort');
  const ratingSort = getParam('ratingSort');

  // فلترة المنتجات مع معالجة آمنة للبيانات
  let filtered = [...initialProducts].filter(p => {
    const pTitle = p.nameAr || p.title || '';
    const pCategory = p.categoryAr || p.category || '';
    const pCondition = p.conditionAr || p.condition || '';
    const pBrand = p.brand || '';
    const pStages = String(p.stages || '');
    const pSterilization = p.sterilization || '';
    const pPower = String(p.power || '');
    const pCooling = p.cooling || '';

    const baseRating = Number(p.rating) || 0;
    let matchesRating = true;
    if (ratingSort && ratingSort !== 'desc' && ratingSort !== 'asc') {
      matchesRating = Math.round(baseRating) >= Number(ratingSort);
    }

    return (
      pTitle.toLowerCase().includes(name.toLowerCase()) &&
      (category === "" || pCategory.trim() === category.trim()) &&
      (brand === "" || pBrand.trim() === brand.trim()) &&
      (stages === "" || pStages.trim() === stages.trim()) &&
      (sterilization === "" || pSterilization.trim() === sterilization.trim()) &&
      (power === "" || pPower.trim() === power.trim()) &&
      (cooling === "" || pCooling.trim() === cooling.trim()) &&
      (condition === "" || pCondition.trim() === condition.trim()) &&
      matchesRating
    );
  });

  // ترتيب المنتجات
  filtered.sort((a: any, b: any) => {
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;
    const ratingA = Number(a.rating) || 0;
    const ratingB = Number(b.rating) || 0;
    
    if (priceSort === 'asc') return priceA - priceB;
    if (priceSort === 'desc') return priceB - priceA;
    if (ratingSort === 'asc') return ratingA - ratingB;
    if (ratingSort === 'desc' || ratingSort) return ratingB - ratingA;
    return 0;
  });

  return (
    <main className="container mx-auto px-4 py-10 md:py-16 max-w-7xl transition-colors duration-300" dir="rtl">
      
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm border border-sky-500/35 bg-secondary/10 text-sky-500 backdrop-blur-md">
          <ShieldCheck size={18} className="animate-pulse" />
          <span>سوق الأجهزة المستعملة</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">الأجهزة المستعملة المعتمدة</h1>
        <p className="font-bold max-w-4xl text-base md:text-lg text-[var(--secondary)] whitespace-nowrap overflow-hidden text-ellipsis px-4">
          جميع الأجهزة المستعملة تخضع لفحص دقيق واختبار شامل لضمان أعلى كفاءة وأفضل قيمة مقابل السعر.
        </p>
      </div>

      <div className="mb-10">
        <SearchComponent products={initialProducts} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <section className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-black text-[var(--secondary)] flex items-center gap-2">
              <span>المنتجات المستعملة المتاحة</span>
              <span className="text-sm px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] font-bold">
                {filtered.length} منتج
              </span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm flex flex-col items-center justify-center gap-3">
              <ShoppingBag size={48} className="text-muted-foreground/40 animate-bounce" />
              <p className="text-muted-foreground text-lg font-bold">عذراً، لا توجد منتجات مستعملة مطابقة لبحثك.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {filtered.map(p => (
                <div key={p.id} className="w-full flex flex-col">
                  {/* تمرير isUsed={true} لـ ProductCard */}
                  <ProductCard product={p} isUsed={true} />
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80 space-y-6 shrink-0">
          <div className="sticky top-24 space-y-6">
            <CartComponent />
            {/* التأكد من تحميل المكونات في الكلاينت فقط */}
            {isMounted && <FilterSidebar />}
          </div>
        </aside>
      </div>
    </main>
  );
}