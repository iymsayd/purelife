import Link from 'next/link';
import { Tag, Sparkles, ArrowUpRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { getOffers } from './offerService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// تفعيل الكاش لـ Next.js مع إعادة التحديث كل ساعة (ISR)
export const revalidate = 3600;

export async function generateMetadata() {
  let headerData = {
    title: "عروض بيورلايف الحصرية | Pure Life Offers",
    description: "استمتع بأفضل العروض والخصومات الحصرية على خدماتنا ومنقيات المياه."
  };

  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'offers_page_header'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.title) headerData.title = data.title;
      if (data.description) headerData.description = data.description;
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  return {
    title: headerData.title,
    description: headerData.description,
    keywords: ["عروض تنقية المياه", "خصومات فلتر ماء", "عروض بيورلايف طنطا", "Pure Life Offers"],
    alternates: {
      canonical: 'https://purelife-eg.com/offers',
    },
    openGraph: {
      title: headerData.title,
      description: headerData.description,
      url: 'https://purelife-eg.com/offers',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

interface OffersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 10;

  let offers = [];
  try {
    const res = await getOffers();
    offers = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Failed to fetch offers:", error);
    offers = [];
  }

  const totalOffers = offers.length;
  const totalPages = Math.ceil(totalOffers / pageSize);
  const validCurrentPage = Math.min(currentPage, totalPages > 0 ? totalPages : 1);
  
  const startIndex = (validCurrentPage - 1) * pageSize;
  const currentOffers = offers.slice(startIndex, startIndex + pageSize);

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 text-center space-y-12 max-w-7xl" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-border bg-muted text-secondary-foreground">
          <Sparkles size={18} className="animate-pulse text-[var(--secondary)]" />
          <span className="text-[var(--secondary)]">عروض لفترة محدودة</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 text-foreground">
          العروض والخصومات
        </h1>

        <p className="font-bold max-w-3xl text-sm sm:text-lg md:text-xl leading-relaxed text-[var(--secondary)] px-2">
          استمتع بأفضل العروض والخصومات على خدماتنا ومنقيات المياه المصممة خصيصاً لتمنحك نقاءً لا مثيل له.
        </p>
      </div>

      {totalOffers === 0 ? (
        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm mx-2">
          <p className="text-muted-foreground text-base sm:text-lg font-semibold">
            لا توجد عروض متاحة حالياً، انتظرونا قريباً!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-right">
            {currentOffers.map((offer: any) => {
              const displayTitle = offer.title;
              const displayDesc = offer.desc;
              const offerSlug = offer.slug || offer.id;

              return (
                <Link href={`/offers/${offerSlug}`} key={offerSlug} className="group flex">
                  <div className="w-full bg-card rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border flex flex-col justify-between group hover:-translate-y-1.5 relative">
                    
                    {offer.discount && (
                      <span className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-md text-[var(--secondary)] text-xs md:text-sm px-4 py-2 rounded-2xl font-black shadow-md border border-border">
                        {offer.discount}
                      </span>
                    )}

                    <div className="h-56 sm:h-60 bg-muted overflow-hidden relative">
                      {offer.image ? (
                        <img src={offer.image} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-muted">🎁</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <span className="text-white text-sm font-bold flex items-center gap-1">
                          اكتشف تفاصيل العرض <ArrowUpRight size={16} />
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 flex flex-col flex-grow justify-between gap-6">
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-3 line-clamp-1 group-hover:text-[var(--secondary)] transition-colors text-right text-foreground">
                          {displayTitle}
                        </h3>
                        <p className="text-muted-foreground mb-6 text-xs sm:text-sm md:text-base line-clamp-2 leading-relaxed text-right">
                          {displayDesc}
                        </p>
                      </div>

                      <div className="w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-center transition-all duration-300 shadow-sm flex items-center justify-center gap-2 border border-border bg-background text-[var(--secondary)] group-hover:bg-[var(--secondary)] group-hover:text-white group-hover:border-[var(--secondary)] text-xs sm:text-sm">
                        <span>عرض التفاصيل والطلب</span>
                        <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>

          {/* نظام التقسيم (Pagination) يظهر فقط إذا تجاوز عدد العروض 10 */}
          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-10 pb-4" aria-label="Pagination">
              {/* زر السابق */}
              {validCurrentPage > 1 ? (
                <Link
                  href={`/offers?page=${validCurrentPage - 1}`}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-card border border-border text-foreground hover:bg-[var(--secondary)] hover:text-white hover:border-[var(--secondary)] transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                  <span>السابق</span>
                </Link>
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
                    <Link
                      key={pageNumber}
                      href={`/offers?page=${pageNumber}`}
                      className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm ${
                        isActive
                          ? 'bg-[var(--secondary)] text-white border border-[var(--secondary)] shadow-md scale-105'
                          : 'bg-card border border-border text-foreground hover:border-[var(--secondary)] hover:text-[var(--secondary)]'
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </div>

              {/* زر التالي */}
              {validCurrentPage < totalPages ? (
                <Link
                  href={`/offers?page=${validCurrentPage + 1}`}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-card border border-border text-foreground hover:bg-[var(--secondary)] hover:text-white hover:border-[var(--secondary)] transition-all shadow-sm"
                >
                  <span>التالي</span>
                  <ChevronLeft size={16} />
                </Link>
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
    </main>
  );
}