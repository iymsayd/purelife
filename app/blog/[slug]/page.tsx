import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getRelatedArticles, getBlogs } from '@/app/blog/blogService';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

// تفعيل ISR لإعادة التحديث كل ساعة
export const revalidate = 3600;

// توليد روابط المقالات مسبقاً لتوفير قراءات الفايربيز
export async function generateStaticParams() {
  const posts = await getBlogs();
  return posts.map((post: any) => ({
    slug: post.slug || post.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post: any = await getBlogPostBySlug(slug);
  
  return { 
    title: post ? `${post.title} | مدونة بيورلايف` : "مقال غير موجود", 
    description: post?.summary || "تفاصيل المقال التقنية",
    alternates: {
      canonical: `https://purelife-eg.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post: any = await getBlogPostBySlug(slug);
  
  if (!post) notFound();

  const relatedPosts = await getRelatedArticles(post.category, post.id);

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl w-full" dir="rtl">
      {/* شريط التنقل العلوي */}
      <div className="mb-8 flex justify-between items-center">
        <Link href="/blog" className="text-sm font-bold text-sky-500 hover:underline inline-flex items-center gap-1">
          ← العودة للمدونة
        </Link>
        <span className="bg-sky-500/10 text-sky-500 text-xs px-4 py-1.5 rounded-full font-black border border-sky-500/20">
          {post.category}
        </span>
      </div>

      {/* عنوان المقال والصورة */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-5xl font-black mb-8 leading-tight tracking-tight text-right sm:text-center" style={{ color: 'var(--secondary)' }}>
          {post.title}
        </h1>
        {post.image && (
          <div className="w-full h-[350px] sm:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-secondary/20 bg-secondary/10">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      
      {/* محتوى المقال (مُنسق باحترافية عبر التيبوجرافي) */}
      <article className="bg-background text-foreground p-8 sm:p-14 rounded-3xl shadow-sm border border-secondary/20 mb-20">
        <div className="prose prose-blue prose-lg dark:prose-invert max-w-none text-right">
          <div className="leading-relaxed text-foreground/90 font-medium space-y-6">
            {(post.content || post.summary).split('\n').map((paragraph: string, index: number) => (
              paragraph.trim() ? (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ) : <br key={index} />
            ))}
          </div>
        </div>
      </article>

      {/* قسم المقالات المقترحة (الأفقي المنسق) */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-secondary/20">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-foreground">
              مقالات ذات صلة
            </h3>
            <span className="text-xs text-foreground/60 font-bold">
              اسحب للتصفح ←
            </span>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-sky-500 scrollbar-track-secondary/10 snap-x">
            {relatedPosts.map((related: any) => {
              const relatedSlug = related.slug || related.id;
              return (
                <div 
                  key={related.id} 
                  className="min-w-[300px] sm:min-w-[350px] max-w-[350px] bg-background rounded-3xl shadow-md border border-secondary/20 flex flex-col snap-start shrink-0 overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="h-48 bg-secondary/10 overflow-hidden relative">
                    {related.image ? (
                      <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h4 className="font-black text-lg text-foreground mb-2 line-clamp-1 group-hover:text-sky-500 transition-colors text-right">
                      {related.title}
                    </h4>
                    <p className="text-foreground/70 text-xs line-clamp-2 mb-4 flex-grow text-right">
                      {related.summary}
                    </p>
                    <Link 
                      href={`/blog/${relatedSlug}`} 
                      className="text-sky-500 text-sm font-bold inline-flex items-center gap-1 hover:underline mt-auto text-right"
                    >
                      اقرأ المقال ←
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}