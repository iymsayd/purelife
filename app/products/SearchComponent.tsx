'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const getUnique = (arr: any[], key: string) => 
  Array.from(new Set(arr.map(p => p[key]).filter(Boolean)));

function SearchContent({ products = [] }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setFilters(params);
  }, [searchParams]);

  // 1. الترتيب الثابت للأقسام
  const PREFERRED_CATEGORIES = ['فلاتر', 'تكييفات', 'قطع غيار فلاتر', 'قطع غيار تكييفات'];
  const availableCategories = getUnique(products, 'category');
  const categories = PREFERRED_CATEGORIES.filter(cat => availableCategories.includes(cat));

  // 2. منطق الفلترة التراتبي بناءً على الاختيارات
  const fCategory = filters.category ? products.filter(p => p.category === filters.category) : products;
  const fBrand = filters.brand ? fCategory.filter(p => p.brand === filters.brand) : fCategory;
  const fStages = filters.stages ? fBrand.filter(p => String(p.stages) === filters.stages) : fBrand;
  const fFiltrationType = filters.filtrationType ? fStages.filter(p => p.filtrationType === filters.filtrationType) : fStages;

  // 3. استخراج القيم ديناميكياً حسب التسلسل
  const brands = getUnique(fCategory, 'brand');
  const stages = getUnique(fBrand, 'stages');
  const filtrationTypes = getUnique(fStages, 'filtrationType'); // نوع التصفية / الفلتر
  const sterilization = getUnique(fFiltrationType, 'sterilization');
  const origins = getUnique(fBrand, 'origin');
  
  // تكييفات
  const power = getUnique(fBrand, 'power');
  const deviceType = getUnique(fBrand, 'deviceType');
  const cooling = getUnique(fBrand, 'cooling');

  const update = (key: string, val: string) => {
    if (key === 'category') {
      setFilters({ category: val });
    } else {
      setFilters((prev: any) => ({ ...prev, [key]: val }));
    }
  };

  const handleSearch = () => {
    const q = new URLSearchParams(filters).toString();
    router.push(`/products?${q}`);
  };

  const selectStyle = "w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3.5 text-sm focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] transition-all cursor-pointer";
  const noOptionMsg = (label: string) => <option disabled className="text-[var(--secondary)]">لا يوجد {label} متاح</option>;

  const isSpareParts = filters.category === 'قطع غيار فلاتر' || filters.category === 'قطع غيار تكييفات';

  return (
    <section className="bg-[var(--background)] p-6 md:p-8 rounded-[2.5rem] shadow-md border border-[var(--border)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* بحث بالاسم */}
        <input type="text" placeholder="ابحث بالاسم..." className={selectStyle} value={filters.name || ""} onChange={(e) => update('name', e.target.value)} />
        
        {/* القسم الرئيسي */}
        <select className={selectStyle} value={filters.category || ""} onChange={(e) => update('category', e.target.value)}>
          <option value="">كل المنتجات</option>
          {categories.map((cat: any) => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        {/* --- حالة قطع الغيار: بلد المنشأ فقط --- */}
        {isSpareParts && (
          <select className={selectStyle} value={filters.origin || ""} onChange={(e) => update('origin', e.target.value)}>
            <option value="">بلد المنشأ</option>
            {origins.length > 0 ? origins.map((o: any) => <option key={o} value={o}>{o}</option>) : noOptionMsg('منشأ')}
          </select>
        )}

        {/* --- حالة الفلاتر والتكييفات: الماركة أولاً --- */}
        {!isSpareParts && filters.category && (
          <select className={selectStyle} value={filters.brand || ""} onChange={(e) => update('brand', e.target.value)}>
            <option value="">الماركة</option>
            {brands.length > 0 ? brands.map((b: any) => <option key={b} value={b}>{b}</option>) : noOptionMsg('ماركة')}
          </select>
        )}

        {/* --- تفاصيل فلاتر المياه (ماركة -> مراحل -> نوع التصفية -> تعقيم -> بلد المنشأ) --- */}
        {filters.category === 'فلاتر' && (
          <>
            <select className={selectStyle} value={filters.stages || ""} onChange={(e) => update('stages', e.target.value)}>
              <option value="">المراحل</option>
              {stages.length > 0 ? stages.map((s: any) => <option key={s} value={s}>{s} مرحلة</option>) : noOptionMsg('مراحل')}
            </select>

            <select className={selectStyle} value={filters.filtrationType || ""} onChange={(e) => update('filtrationType', e.target.value)}>
              <option value="">نوع التصفية</option>
              {filtrationTypes.length > 0 ? filtrationTypes.map((ft: any) => <option key={ft} value={ft}>{ft}</option>) : noOptionMsg('نوع التصفية')}
            </select>

            <select className={selectStyle} value={filters.sterilization || ""} onChange={(e) => update('sterilization', e.target.value)}>
              <option value="">التعقيم</option>
              {sterilization.length > 0 ? sterilization.map((st: any) => <option key={st} value={st}>{st}</option>) : noOptionMsg('تعقيم')}
            </select>

            <select className={selectStyle} value={filters.origin || ""} onChange={(e) => update('origin', e.target.value)}>
              <option value="">بلد المنشأ</option>
              {origins.length > 0 ? origins.map((o: any) => <option key={o} value={o}>{o}</option>) : noOptionMsg('منشأ')}
            </select>
          </>
        )}

        {/* --- تفاصيل التكييفات --- */}
        {filters.category === 'تكييفات' && (
          <>
            <select className={selectStyle} value={filters.power || ""} onChange={(e) => update('power', e.target.value)}>
              <option value="">القدرة</option>
              {power.length > 0 ? power.map((p: any) => <option key={p} value={p}>{p} حصان</option>) : noOptionMsg('قدرة')}
            </select>
            <select className={selectStyle} value={filters.deviceType || ""} onChange={(e) => update('deviceType', e.target.value)}>
              <option value="">نوع الجهاز</option>
              {deviceType.length > 0 ? deviceType.map((d: any) => <option key={d} value={d}>{d}</option>) : noOptionMsg('نوع الجهاز')}
            </select>
            <select className={selectStyle} value={filters.cooling || ""} onChange={(e) => update('cooling', e.target.value)}>
              <option value="">نظام التبريد</option>
              {cooling.length > 0 ? cooling.map((c: any) => <option key={c} value={c}>{c}</option>) : noOptionMsg('التبريد')}
            </select>
            <select className={selectStyle} value={filters.origin || ""} onChange={(e) => update('origin', e.target.value)}>
              <option value="">بلد المنشأ</option>
              {origins.length > 0 ? origins.map((o: any) => <option key={o} value={o}>{o}</option>) : noOptionMsg('منشأ')}
            </select>
          </>
        )}

        <button onClick={handleSearch} className="bg-[var(--secondary)] text-white rounded-2xl font-black py-3.5 flex items-center justify-center gap-2">
          <Search size={18} /> بحث
        </button>
      </div>
    </section>
  );
}

export default function SearchComponent({ products = [] }: { products: any[] }) {
  return <Suspense fallback={null}><SearchContent products={products} /></Suspense>;
}