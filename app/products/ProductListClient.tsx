'use client';

import { ShoppingBag, Sparkles } from 'lucide-react';
import ProductCard from '@/components/layout/ProductCard';
import FilterSidebar from './FilterSidebar';
import SearchComponent from './SearchComponent';
import CartComponent from '@/components/layout/CartComponent';
import { useCart } from '@/app/context/CartContext';
import { useSearchParams } from 'next/navigation';

export default function ProductListClient({ 
  initialProducts = [], 
  searchParams 
}: { 
  initialProducts: any[]; 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const { isMounted } = useCart() || {};
  const clientSearchParams = useSearchParams();

  const getParam = (key: string) => {
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
  const priceSort = getParam('priceSort');

  let filtered = [...initialProducts].filter(p => {
    const searchTarget = (p.title || p.name || "").toLowerCase();
    return (
      searchTarget.includes(name.toLowerCase()) &&
      (category === "" || p.category === category) &&
      (brand === "" || p.brand === brand) &&
      (stages === "" || String(p.stages || "") === stages) &&
      (sterilization === "" || p.sterilization === sterilization) &&
      (power === "" || p.power === power) &&
      (cooling === "" || p.cooling === cooling)
    );
  });

  filtered.sort((a: any, b: any) => {
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;
    if (priceSort === 'asc') return priceA - priceB;
    if (priceSort === 'desc') return priceB - priceA;
    return 0;
  });

  return (
    <main className="container mx-auto px-4 py-10 md:py-16 max-w-7xl transition-colors duration-300" dir="rtl">
      {/* رأس الصفحة */}
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm border border-sky-500/30 bg-secondary/10 text-sky-500 backdrop-blur-md">
          <Sparkles size={16} className="animate-spin" />
          <span>متجر بيورلايف</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">منتجاتنا الحصرية</h1>
        <p className="font-bold max-w-4xl text-base md:text-lg text-[var(--secondary)] whitespace-nowrap overflow-hidden text-ellipsis px-4">
          استكشف أحدث منقيات المياه والتكييفات وقطع الغيار الأصلية بأفضل الأسعار وبجودة مضمونة.
        </p>
      </div>

      {/* شريط البحث */}
      <div className="mb-10">
        <SearchComponent products={initialProducts} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <section className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-black text-[var(--secondary)] flex items-center gap-2">
              <span>المنتجات المتاحة</span>
              <span className="text-sm px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] font-bold">
                {filtered.length} منتج
              </span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm flex flex-col items-center justify-center gap-3">
              <ShoppingBag size={48} className="text-muted-foreground/40 animate-bounce" />
              <p className="text-muted-foreground text-lg font-bold">عذراً، لا توجد منتجات مطابقة لبحثك الحالي.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {filtered.map(p => (
                <div key={p.id} className="w-full flex flex-col">
                  <ProductCard product={p} isUsed={false} />
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80 space-y-6 shrink-0">
          <div className="sticky top-24 space-y-6">
            <CartComponent />
            {isMounted && <FilterSidebar />}
          </div>
        </aside>
      </div>
    </main>
  );
}