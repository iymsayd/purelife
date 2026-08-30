'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function ProductsSection({ products = [] }: { products?: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const limitedProducts = products.slice(0, 10);

  return (
    <section className="py-14 px-4 container mx-auto max-w-6xl bg-[var(--background)] transition-colors duration-300">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[var(--secondary)]">أبرز المنتجات والأجهزة المميزة</h2>
        <p className="text-[var(--muted-foreground)] text-sm md:text-base">اخترنا لك الأفضل لتلبية احتياجات منزلك</p>
        <div className="mt-4">
          <Link href="/products" className="text-[var(--secondary)] font-bold text-sm hover:underline hover:opacity-80 transition inline-block cursor-pointer">
            عرض الكل
          </Link>
        </div>
      </div>

      {limitedProducts && limitedProducts.length > 0 ? (
        <div className="relative px-2 md:px-12">
          {/* أسهم التنقل ظاهرة في جميع الشاشات عشان السلايدر يفضل شغال */}
          <button 
            onClick={() => scroll('right')} 
            className="flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-xl cursor-pointer"
            aria-label="السابق"
            type="button"
          >
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={() => scroll('left')} 
            className="flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-xl cursor-pointer"
            aria-label="التالي"
            type="button"
          >
            <ChevronLeft size={20} />
          </button>

          {/* سلايدر أفقي متجاوب: منتج واحد للموبايل، منتجين للتابلت، متعدد للديسكتوب */}
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar" 
            style={{ 
              scrollbarWidth: 'none',
              maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
            }}
          >
            {limitedProducts.map((item: any) => {
              const itemTitle = item.nameAr || item.titleAr || item.name_ar || item.title_ar || item.title || '';
              const itemDesc = item.descAr || item.descriptionAr || item.desc_ar || item.desc || '';
              const itemImg = item.image || item.imageUrl || item.img || '';
              
              const isValidImage = itemImg && (itemImg.startsWith('http') || itemImg.startsWith('data:'));

              return (
                <div 
                  key={item.id || item.slug} 
                  className="min-w-[calc(100%-1rem)] sm:min-w-[calc(50%-12px)] md:min-w-[320px] md:max-w-[350px] snap-start flex-shrink-0"
                >
                  <Link href={`/products/${item.slug || item.id}`} className="group/card block h-full cursor-pointer">
                    <div className="bg-[var(--background)] rounded-2xl p-5 border border-[var(--border)] hover:border-[var(--secondary)] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1.5">
                      <div className="h-44 rounded-xl overflow-hidden mb-4 bg-[var(--background)] border border-[var(--border)] flex items-center justify-center relative">
                        {isValidImage ? (
                          <img src={itemImg} alt={itemTitle} className="w-full h-full object-cover group-hover/card:scale-110 transition duration-500" />
                        ) : (
                          <span className="text-5xl transition-transform duration-300 group-hover/card:scale-110">💧</span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1 group-hover/card:text-[var(--secondary)] transition line-clamp-1 text-[var(--foreground)]">{itemTitle}</h3>
                      <p className="text-[var(--muted-foreground)] text-xs line-clamp-2 mb-4 flex-grow">{itemDesc}</p>
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--border)] mt-auto">
                        <span className="text-[var(--secondary)] font-extrabold text-sm">{item.price ? `${item.price} ج.م` : 'متاح الان'}</span>
                        <span className="text-xs bg-[var(--secondary)]/10 text-[var(--secondary)] px-3 py-1.5 rounded-lg font-bold group-hover/card:bg-[var(--secondary)] group-hover/card:text-white transition-all duration-300">عرض المنتج</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--background)] rounded-2xl p-12 text-center border border-[var(--border)]">
          <p className="text-[var(--muted-foreground)] text-base">لا توجد منتجات مضافة حالياً</p>
        </div>
      )}
    </section>
  );
}