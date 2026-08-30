'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const dict = {
  category: "الفئة",
  condition: "حالة المنتج",
  priceSort: "ترتيب حسب السعر",
  highestPrice: "الأعلى سعراً",
  lowestPrice: "الأقل سعراً",
  clearFilters: "مسح جميع الفلاتر"
};

const sidebarData = {
  categories: [
    { label: 'تكييفات', value: 'تكييفات' },
    { label: 'فلاتر', value: 'فلاتر' },
    { label: 'قطع غيار فلاتر', value: 'قطع غيار فلاتر' },
    { label: 'قطع غيار تكييفات', value: 'قطع غيار تكييفات' },
  ],
  conditions: [
    { label: 'ممتاز', value: 'ممتاز' },
    { label: 'جيد جداً', value: 'جيد جداً' },
    { label: 'جيد', value: 'جيد' },
    { label: 'مقبول', value: 'مقبول' },
  ]
};

function FilterSidebarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // إذا كان الترتيب حسب السعر، نقوم بتحديث القيمة مباشرة
    params.set(key, value);
    router.push(`/used-products?${params.toString()}`);
  };

  const clearFilters = () => router.push(`/used-products`);

  const isActive = (key: string, value: string) => searchParams.get(key) === value;

  return (
    <div className="bg-[var(--background)] p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm sticky top-20 transition-colors duration-300 text-right" dir="rtl">
      
      {/* 1. والفئة */}
      <h3 className="font-black mb-4 text-[var(--foreground)] text-lg">{dict.category}</h3>
      <div className="space-y-2.5 mb-8">
        {sidebarData.categories.map((cat) => (
          <button 
            key={cat.value} 
            type="button"
            onClick={() => updateFilter('category', cat.value)} 
            className={`block w-full text-right text-sm transition font-medium p-2 rounded-xl cursor-pointer ${
              isActive('category', cat.value) 
                ? 'text-[var(--secondary)] bg-[var(--secondary)]/10 font-black' 
                : 'hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/5 text-[var(--muted-foreground)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2. حالة المنتج */}
      <h3 className="font-black mb-4 text-[var(--foreground)] text-lg">{dict.condition}</h3>
      <div className="space-y-2.5 mb-8">
        {sidebarData.conditions.map((cond) => (
          <button 
            key={cond.value} 
            type="button"
            onClick={() => updateFilter('condition', cond.value)} 
            className={`block w-full text-right text-sm transition font-medium p-2 rounded-xl cursor-pointer ${
              isActive('condition', cond.value) 
                ? 'text-[var(--secondary)] bg-[var(--secondary)]/10 font-black' 
                : 'hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/5 text-[var(--muted-foreground)]'
            }`}
          >
            {cond.label}
          </button>
        ))}
      </div>

      {/* 3. السعر */}
      <h3 className="font-black mb-4 text-[var(--foreground)] text-lg">{dict.priceSort}</h3>
      <div className="space-y-2.5 mb-8">
        {[
          { key: 'desc', label: dict.highestPrice },
          { key: 'asc', label: dict.lowestPrice }
        ].map((sort) => (
          <button 
            key={sort.key}
            type="button"
            onClick={() => updateFilter('priceSort', sort.key)} 
            className={`block w-full text-right text-sm transition font-medium p-2 rounded-xl cursor-pointer ${
              isActive('priceSort', sort.key) 
                ? 'text-[var(--secondary)] bg-[var(--secondary)]/10 font-black' 
                : 'hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/5 text-[var(--muted-foreground)]'
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {/* زر مسح الفلاتر */}
      <button 
        type="button"
        onClick={clearFilters} 
        className="w-full bg-[var(--secondary)]/10 hover:bg-[var(--secondary)]/20 py-3.5 rounded-2xl text-sm font-black transition-all text-[var(--foreground)] border border-[var(--secondary)]/20 cursor-pointer"
      >
        {dict.clearFilters}
      </button>
    </div>
  );
}

export default function FilterSidebar() {
  return (
    <Suspense fallback={null}>
      <FilterSidebarContent />
    </Suspense>
  );
}