'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface BlogPost {
  id: string | number;
  slug: string;
  title: string;
  desc: string;
  image?: string;
}

interface BlogsSectionProps {
  sectionTitle?: string;
  sectionSubtitle?: string;
  allBlogsText?: string;
  readMoreText?: string;
  blogs?: BlogPost[];
}

export default function BlogsSection({
  sectionTitle = "أحدث المقالات والنصائح",
  sectionSubtitle = "اقرأ أحدث المواضيع المتخصصة في تنقية المياه والصيانة",
  allBlogsText = "عرض كل المقالات",
  readMoreText = "قراءة المقال ←",
  blogs = [
    {
      id: 1,
      slug: "water-purifier-maintenance-guide",
      title: "دليل شامل لصيانة فلاتر المياه المنزلية في مصر",
      desc: "تعرف على الخطوات الأساسية للحفاظ على كفاءة جهاز تنقية المياه الخاص بك وضمان مياه نقية وصحية طوال العام.",
      image: "https://images.alborsaanews.com/2021/01/1552463410_757_199060_img_778.jpg"
    },
    {
      id: 2,
      slug: "how-to-choose-best-ac",
      title: "كيف تختار التكييف المناسب لمساحة منزلك؟",
      desc: "معايير هامة يجب مراعاتها عند اختيار القدرة الحصانية المناسبة للتكييف لتوفير الكهرباء والحصول على تبريد مثالي.",
      image: "https://cairocart.com/media/codazon_cache/brand/250x/Manufacturer/DDD.png"
    },
    {
      id: 3,
      slug: "importance-of-water-filtering",
      title: "لماذا أصبحت فلاتر المياه ضرورة وليست رفاهية؟",
      desc: "الأسباب الصحية والبيئية التي تجعل وجود وحدة معالجة مياه في منزلك أمراً لا غنى عنه لصحة عائلتك.",
      image: "https://almania-group.com/wp-content/uploads/2020/07/unionaire.png"
    }
  ]
}: BlogsSectionProps) {
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

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-14 px-4 bg-[var(--background)] border-t border-[var(--border)] transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[var(--secondary)]">{sectionTitle}</h2>
          <p className="text-[var(--muted-foreground)] text-sm md:text-base">{sectionSubtitle}</p>
          <div className="mt-4">
            <Link href="/blog" className="text-[var(--secondary)] font-bold hover:underline text-sm hover:opacity-80 transition cursor-pointer inline-block">
              {allBlogsText}
            </Link>
          </div>
        </div>

        <div className="relative px-2 md:px-12">
          {/* أسهم التنقل للسلايدر */}
          <button 
            onClick={() => scroll('right')} 
            className="flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-xl cursor-pointer"
            aria-label="السابق"
          >
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={() => scroll('left')} 
            className="flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-xl cursor-pointer"
            aria-label="التالي"
          >
            <ChevronLeft size={20} />
          </button>

          {/* حاوية السلايدر المتجاوب (منتج واحد للموبايل، منتجين للتابلت، متعدد للديسكتوب) */}
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar" 
            style={{ 
              scrollbarWidth: 'none',
              maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
            }}
          >
            {blogs.map((post) => {
              const postTitle = post.title || '';
              const postDesc = post.desc || '';

              return (
                <div 
                  key={post.slug || post.id} 
                  className="min-w-[calc(100%-1rem)] sm:min-w-[calc(50%-12px)] md:min-w-[320px] md:max-w-[350px] snap-start flex-shrink-0"
                >
                  <Link href={`/blog/${post.slug || post.id}`} className="group block h-full cursor-pointer">
                    <div className="bg-[var(--background)] rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--secondary)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                      {post.image && (
                        <div className="h-40 rounded-xl overflow-hidden mb-4 bg-[var(--background)] border border-[var(--border)]">
                          <img src={post.image} alt={postTitle} className="w-full h-full object-cover group-hover:scale-115 transition duration-500" />
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--secondary)] transition line-clamp-1 text-[var(--foreground)]">{postTitle}</h3>
                      <p className="text-[var(--muted-foreground)] text-sm line-clamp-2 mb-4 flex-grow">{postDesc}</p>
                      <span className="text-xs font-bold text-[var(--secondary)] group-hover:translate-x-1 transition-transform duration-300 inline-block">{readMoreText}</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}