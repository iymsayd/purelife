import Link from 'next/link';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { getBlogs } from '@/app/blog/blogService';

// تفعيل الكاش لـ Next.js مع إعادة التحديث كل ساعة (ISR) لضمان مجانية الفايربيز
export const revalidate = 3600;

export const metadata = {
  title: "مدونة بيورلايف | أحدث النصائح والدراسات الفنية",
  description: "أحدث النصائح والدراسات الفنية للصيانة ومياه الشرب من بيورلايف.",
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params.category || "الكل";
  const filteredPosts = await getBlogs(category);

  const categories = ["الكل", "فلاتر", "تكييفات", "عام"];

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center space-y-12 max-w-7xl" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-border bg-muted text-secondary-foreground">
          <BookOpen size={18} className="text-[var(--secondary)]" />
          <span className="text-[var(--secondary)]">المدونة والمعلومات</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 text-foreground">
          مدونة بيورلايف
        </h1>

        <p className="font-bold max-w-3xl text-lg md:text-xl leading-relaxed text-[var(--secondary)]">
          أحدث النصائح والدراسات الفنية للصيانة ومياه الشرب من بيورلايف.
        </p>
      </div>

      {/* الفلترة */}
      <div className="flex gap-3 justify-center mb-12 flex-wrap">
        {categories.map((cat) => (
          <Link 
            key={cat} 
            href={`/blog?category=${cat}`} 
            className={`px-6 py-3 rounded-2xl font-bold transition-all border ${category === cat ? 'bg-[var(--secondary)] text-white border-[var(--secondary)] shadow-lg' : 'bg-card border-border hover:border-[var(--secondary)]'}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm">
          <p className="text-muted-foreground text-lg font-semibold">
            لا توجد مقالات متاحة في هذا القسم حالياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
          {filteredPosts.map((post: any) => (
            <div key={post.id} className="w-full bg-card rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border flex flex-col justify-between hover:-translate-y-1.5 relative group">
              
              <div className="h-60 bg-muted overflow-hidden relative">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white text-sm font-bold flex items-center gap-1">
                    اقرأ المقال <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>

              <div className="p-7 flex flex-col flex-grow justify-between gap-6">
                <div>
                  <span className="text-[var(--secondary)] text-xs font-black mb-3 block">{post.category}</span>
                  <h3 className="text-xl md:text-2xl font-black mb-3 line-clamp-1 group-hover:text-[var(--secondary)] transition-colors text-right text-foreground">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base line-clamp-2 leading-relaxed text-right">
                    {post.summary}
                  </p>
                </div>

                <Link href={`/blog/${post.slug}`} className="w-full py-4 rounded-2xl font-extrabold text-center transition-all duration-300 shadow-sm flex items-center justify-center gap-2 border border-border bg-background text-[var(--secondary)] group-hover:bg-[var(--secondary)] group-hover:text-white group-hover:border-[var(--secondary)]">
                  <span>قراءة المزيد</span>
                  <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}