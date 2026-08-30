'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

// دالة لاستخراج القيم الفريدة من البيانات
const getUnique = (arr: any[], key: string) => 
  Array.from(new Set(arr.map(p => p[key]).filter(Boolean)));

function SearchContent({ products = [] }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    // جلب الفلاتر من الـ URL عند تحميل الصفحة
    const params = Object.fromEntries(searchParams.entries());
    setFilters(params);
  }, [searchParams]);

  // تحديث الفلتر وإعادة التوجيه
  const update = (key: string, val: string) => {
    let newFilters = { ...filters, [key]: val };
    
    // إذا تغير القسم الرئيسي، نقوم بتصفير الفلاتر التابعة لتجنب تضارب البيانات
    if (key === 'category') {
      newFilters = { category: val };
    }
    
    setFilters(newFilters);
  };

  const handleSearch = () => {
    const q = new URLSearchParams(filters).toString();
    router.push(`/used-products?${q}`);
  };

  // الترتيب الثابت للأقسام
  const PREFERRED_CATEGORIES = ['فلاتر', 'تكييفات', 'قطع غيار فلاتر', 'قطع غيار تكييفات'];
  const availableCategories = getUnique(products, 'category');
  const categories = PREFERRED_CATEGORIES.filter(cat => availableCategories.includes(cat));

  // المنطق التراتبي للفلاتر
  const fCategory = filters.category ? products.filter(p => p.category === filters.category) : products;
  const fBrand = filters.brand ? fCategory.filter(p => p.brand === filters.brand) : fCategory;
  
  // استخراج القوائم ديناميكياً بناءً على ما سبق اختياره
  const brands = getUnique(fCategory, 'brand');
  const stages = getUnique(fBrand, 'stages');
  const sterilization = getUnique(fBrand, 'sterilization');
  const power = getUnique(fBrand, 'power');
  const cooling = getUnique(fBrand, 'cooling');

  const selectStyle = "w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] transition-all cursor-pointer shadow-sm";
  const optionStyle = "bg-[var(--card)] text-[var(--foreground)]";
  
  const isSpareParts = filters.category === 'قطع غيار فلاتر' || filters.category === 'قطع غيار تكييفات';
  const isFilter = filters.category === 'فلاتر';
  const isAC = filters.category === 'تكييفات';

  return (
    <section className="bg-[var(--background)] p-6 md:p-8 rounded-[2.5rem] shadow-md border border-[var(--border)] transition-colors duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        
        {/* بحث بالاسم */}
        <input 
          type="text" placeholder="ابحث بالاسم..." className={selectStyle} 
          value={filters.name || ""} onChange={(e) => update('name', e.target.value)} 
        />
        
        {/* القسم الرئيسي */}
        <select className={selectStyle} value={filters.category || ""} onChange={(e) => update('category', e.target.value)}>
          <option value="" className={optionStyle}>كل المنتجات المستعملة</option>
          {categories.map((cat: any) => <option key={cat} value={cat} className={optionStyle}>{cat}</option>)}
        </select>

        {/* --- الفلاتر الديناميكية بناءً على الاختيار --- */}
        
        {/* الماركة (تظهر فقط إذا تم اختيار قسم وليس من ضمن قطع الغيار) */}
        {filters.category && !isSpareParts && (
          <select className={selectStyle} value={filters.brand || ""} onChange={(e) => update('brand', e.target.value)}>
            <option value="" className={optionStyle}>الماركة</option>
            {brands.map((b: any) => <option key={b} value={b} className={optionStyle}>{b}</option>)}
          </select>
        )}

        {/* تفاصيل فلاتر المياه */}
        {isFilter && (
          <>
            <select className={selectStyle} value={filters.stages || ""} onChange={(e) => update('stages', e.target.value)}>
              <option value="" className={optionStyle}>المراحل</option>
              {stages.map((s: any) => <option key={s} value={s} className={optionStyle}>{s} مرحلة</option>)}
            </select>
            <select className={selectStyle} value={filters.sterilization || ""} onChange={(e) => update('sterilization', e.target.value)}>
              <option value="" className={optionStyle}>التعقيم</option>
              {sterilization.map((st: any) => <option key={st} value={st} className={optionStyle}>{st}</option>)}
            </select>
          </>
        )}

        {/* تفاصيل التكييفات */}
        {isAC && (
          <>
            <select className={selectStyle} value={filters.power || ""} onChange={(e) => update('power', e.target.value)}>
              <option value="" className={optionStyle}>القدرة (حصان)</option>
              {power.map((p: any) => <option key={p} value={p} className={optionStyle}>{p} حصان</option>)}
            </select>
            <select className={selectStyle} value={filters.cooling || ""} onChange={(e) => update('cooling', e.target.value)}>
              <option value="" className={optionStyle}>نظام التبريد</option>
              {cooling.map((c: any) => <option key={c} value={c} className={optionStyle}>{c}</option>)}
            </select>
          </>
        )}

        <button 
          onClick={handleSearch} 
          className="bg-[var(--secondary)] hover:opacity-90 text-white rounded-2xl font-black py-3.5 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Search size={18} /> <span>بحث</span>
        </button>
      </div>
    </section>
  );
}

export default function SearchComponent({ products = [] }: { products: any[] }) {
  return (
    <Suspense fallback={null}>
      <SearchContent products={products} />
    </Suspense>
  );
}