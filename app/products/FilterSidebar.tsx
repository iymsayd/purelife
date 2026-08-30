'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/app/context/CartContext';
import { useEffect, useState } from 'react';

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useCart();
  
  // لضمان عدم حدوث Hydration Mismatch
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // مسح فلاتر السعر عند اختيار فلتر جديد أو العكس
    if (key === 'priceSort') {
      params.delete('priceSort');
    }
    
    params.set(key, value);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => router.push(`/products`);

  // لو لسه محملش، منعملش ريندر للـ Active states عشان الهيدريشن
  const isActive = (key: string, value: string) => isReady && searchParams.get(key) === value;

  return (
    <div className="bg-background p-6 rounded-[2.5rem] border border-secondary/20 shadow-md sticky top-24" dir="rtl">
      
      {/* 1. الفئة */}
      <h3 className="font-black mb-4 text-foreground text-lg">{dict.sidebarCategory}</h3>
      <div className="space-y-2.5 mb-8">
        {[
          { key: 'تكييفات', label: dict.airConditionersCategory },
          { key: 'فلاتر', label: dict.filtersCategory },
          { key: 'قطع غيار فلاتر', label: dict.filtersPartsCategory },
          { key: 'قطع غيار تكييفات', label: dict.acPartsCategory }
        ].map((cat) => (
          <button 
            key={cat.key} 
            onClick={() => updateFilter('category', cat.key)} 
            className={`block w-full text-right text-sm transition font-medium p-2 rounded-xl ${
              isActive('category', cat.key) 
                ? 'text-sky-500 bg-sky-500/10 font-black' 
                : 'hover:text-sky-500 hover:bg-secondary/5 text-foreground/70'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2. ترتيب حسب السعر */}
      <h3 className="font-black mb-4 text-foreground text-lg">{dict.priceSortTitle}</h3>
      <div className="space-y-2.5 mb-8">
        {[
          { key: 'desc', label: dict.highestPrice },
          { key: 'asc', label: dict.lowestPrice }
        ].map((sort) => (
          <button 
            key={sort.key}
            onClick={() => updateFilter('priceSort', sort.key)} 
            className={`block w-full text-right text-sm transition font-medium p-2 rounded-xl ${
              isActive('priceSort', sort.key) 
                ? 'text-sky-500 bg-sky-500/10 font-black' 
                : 'hover:text-sky-500 hover:bg-secondary/5 text-foreground/70'
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {/* زر مسح الفلاتر */}
      <button 
        onClick={clearFilters} 
        className="w-full bg-secondary/10 hover:bg-secondary/20 py-3.5 rounded-2xl text-sm font-black transition-all text-foreground/80 border border-secondary/20"
      >
        {dict.clearFilters}
      </button>
    </div>
  );
}