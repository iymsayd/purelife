'use client';

import { ShieldCheck, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import ProductCard from '@/components/layout/ProductCard';
import FilterSidebar from './FilterSidebar';
import SearchComponent from './SearchComponent';
import CartComponent from '@/components/layout/CartComponent';
import { useCart } from '@/app/context/CartContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function UsedProductListClient({ 
  initialProducts = [], 
  searchParams 
}: { 
  initialProducts: any[]; 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const { isMounted } = useCart() || {};
  const clientSearchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
  const condition = getParam('condition');
  const priceSort = getParam('priceSort');
  const ratingSort = getParam('ratingSort');

  // استخراج ورقم الصفحة الحالية من الـ SearchParams
  const pageParam = clientSearchParams?.get('page') || searchParams?.page;
  const parsedPage = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
  const currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageSize = 10;

  // فلترة المنتجات المستعملة مع معالجة آمنة للبيانات
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

  // ترتيب المنتجات المستعملة
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

  // حسابات التقسيم (Pagination)
  const totalProducts = filtered.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const validCurrentPage = Math.min(currentPage, totalPages > 0 ? totalPages : 1);
  
  const startIndex = (validCurrentPage - 1) * pageSize;
  const currentProducts = filtered.slice(startIndex, startIndex + pageSize);

  // دالة لتغيير الصفحة مع الحفاظ على الفلاتر الأخرى
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(clientSearchParams?.toString() || '');
    if (pageNumber === 1) {
      params.delete('page');
    } else {
      params.set('page', pageNumber.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 max-w-7xl transition-colors duration-300" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm border border-sky-500/35 bg-secondary/10 text-sky-500 backdrop-blur-md">
          <ShieldCheck size={18} className="animate-pulse" />
          <span>سوق الأجهزة المستعملة</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">الأجهزة المستعملة المعتمدة</h1>
        <p className="font-bold max-w-4xl text-xs sm:text-base md:text-lg text-[var(--secondary)] leading-relaxed px-4">
          جميع الأجهزة المستعملة تخضع لفحص دقيق واختبار شامل لضمان أعلى كفاءة وأفضل قيمة مقابل السعر.
        </p>
      </div>

      {/* شريط البحث */}
      <div className="mb-10">
        <SearchComponent products={initialProducts} />
      </div>

      {/* تخطيط الصفحة: السلة والفلتر تظهر في الأعلى (order-1) على الموبايل، وتعود للجانب (order-2) في الشاشات الكبيرة */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* قسم الفلتر والسلة الجانبي */}
        <aside className="w-full lg:w-80 space-y-6 shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            <CartComponent />
            {isMounted && <FilterSidebar />}
          </div>
        </aside>

        {/* قسم عرض المنتجات المستعملة */}
        <section className="flex-1 w-full min-w-0 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--secondary)] flex items-center gap-2">
              <span>المنتجات المستعملة المتاحة</span>
              <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] font-bold">
                {totalProducts} منتج
              </span>
            </h2>
          </div>

          {currentProducts.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm flex flex-col items-center justify-center gap-3 mx-2">
              <ShoppingBag size={48} className="text-muted-foreground/40 animate-bounce" />
              <p className="text-muted-foreground text-base sm:text-lg font-bold">عذراً، لا توجد منتجات مستعملة مطابقة لبحثك.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {currentProducts.map(p => (
                  <div key={p.id} className="w-full flex flex-col">
                    <ProductCard product={p} isUsed={true} />
                  </div>
                ))}
              </div>

              {/* نظام التقسيم (Pagination) */}
              {totalPages > 1 && (
                <nav className="flex flex-wrap items-center justify-center gap-2 pt-12 pb-4" aria-label="Pagination">
                  {/* زر السابق */}
                  {validCurrentPage > 1 ? (
                    <button
                      onClick={() => router.push(createPageUrl(validCurrentPage - 1))}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-card border border-border text-foreground hover:bg-[var(--secondary)] hover:text-white hover:border-[var(--secondary)] transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronRight size={16} />
                      <span>السابق</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-muted/50 border border-border/50 text-muted-foreground cursor-not-allowed opacity-50">
                      <ChevronRight size={16} />
                      <span>السابق</span>
                    </span>
                  )}

                  {/* أرقام الصفحات */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                      const isActive = pageNumber === validCurrentPage;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => router.push(createPageUrl(pageNumber))}
                          className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                            isActive
                              ? 'bg-[var(--secondary)] text-white border border-[var(--secondary)] shadow-md scale-105'
                              : 'bg-card border border-border text-foreground hover:border-[var(--secondary)] hover:text-[var(--secondary)]'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* زر التالي */}
                  {validCurrentPage < totalPages ? (
                    <button
                      onClick={() => router.push(createPageUrl(validCurrentPage + 1))}
                      className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-card border border-border text-foreground hover:bg-[var(--secondary)] hover:text-white hover:border-[var(--secondary)] transition-all shadow-sm cursor-pointer"
                    >
                      <span>التالي</span>
                      <ChevronLeft size={16} />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-muted/50 border border-border/50 text-muted-foreground cursor-not-allowed opacity-50">
                      <span>التالي</span>
                      <ChevronLeft size={16} />
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </section>

      </div>
    </main>
  );
}