import Link from 'next/link';
import { Tag, Sparkles, ArrowUpRight } from 'lucide-react';
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

export default async function OffersPage() {
  let offers = [];
  try {
    const res = await getOffers();
    offers = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Failed to fetch offers:", error);
    offers = [];
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center space-y-12 max-w-7xl" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-border bg-muted text-secondary-foreground">
          <Sparkles size={18} className="animate-pulse text-[var(--secondary)]" />
          <span className="text-[var(--secondary)]">عروض لفترة محدودة</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 text-foreground">
          العروض والخصومات
        </h1>

        <p className="font-bold max-w-3xl text-lg md:text-xl leading-relaxed text-[var(--secondary)]">
          استمتع بأفضل العروض والخصومات على خدماتنا ومنقيات المياه المصممة خصيصاً لتمنحك نقاءً لا مثيل له.
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm">
          <p className="text-muted-foreground text-lg font-semibold">
            لا توجد عروض متاحة حالياً، انتظرونا قريباً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
          {offers.map((offer: any) => {
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

                  <div className="h-60 bg-muted overflow-hidden relative">
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

                  <div className="p-7 flex flex-col flex-grow justify-between gap-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black mb-3 line-clamp-1 group-hover:text-[var(--secondary)] transition-colors text-right text-foreground">
                        {displayTitle}
                      </h3>
                      <p className="text-muted-foreground mb-6 text-sm md:text-base line-clamp-2 leading-relaxed text-right">
                        {displayDesc}
                      </p>
                    </div>

                    <div className="w-full py-4 rounded-2xl font-extrabold text-center transition-all duration-300 shadow-sm flex items-center justify-center gap-2 border border-border bg-background text-[var(--secondary)] group-hover:bg-[var(--secondary)] group-hover:text-white group-hover:border-[var(--secondary)]">
                      <span>عرض التفاصيل والطلب</span>
                      <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}