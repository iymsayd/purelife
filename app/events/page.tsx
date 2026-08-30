import Link from 'next/link';
import { CalendarDays, ArrowUpRight, MapPin } from 'lucide-react';
import { getEvents } from './eventService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// تفعيل الكاش لـ Next.js مع إعادة التحديث كل ساعة (ISR) لضمان مجانية الفايربيز
export const revalidate = 3600;

export async function generateMetadata() {
  let headerData = {
    title: "فعاليات بيورلايف | Pure Life Events",
    description: "اطلع على أحدث ورش العمل والندوات وفعاليات الصيانة."
  };

  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'events_page_header'));
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
    keywords: ["فعاليات بيورلايف", "ورش عمل صيانة الفلاتر", "ندوات بيورلايف طنطا", "Pure Life Events"],
    alternates: {
      canonical: 'https://purelife-eg.com/events',
    },
    openGraph: {
      title: headerData.title,
      description: headerData.description,
      url: 'https://purelife-eg.com/events',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

export default async function EventsPage() {
  let events = [];
  try {
    const res = await getEvents();
    events = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Failed to fetch events:", error);
    events = [];
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center space-y-12 max-w-7xl" dir="rtl">
      <div className="mb-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-border bg-muted text-secondary-foreground">
          <CalendarDays size={18} className="animate-pulse text-[var(--secondary)]" />
          <span className="text-[var(--secondary)]">فعاليات لفترة محدودة</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 text-foreground">
          الأحداث والفعاليات
        </h1>

        <p className="font-bold max-w-3xl text-lg md:text-xl leading-relaxed text-[var(--secondary)]">
          اطلع على أحدث ورش العمل والندوات وفترات الصيانة الدورية المصممة خصيصاً لعملائنا.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm">
          <p className="text-muted-foreground text-lg font-semibold">
            لا توجد فعاليات متاحة حالياً، انتظرونا قريباً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
          {events.map((event: any) => {
            const eventSlug = event.slug || event.id;

            return (
              <Link href={`/events/${eventSlug}`} key={eventSlug} className="group flex">
                <div className="w-full bg-card rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border flex flex-col justify-between group hover:-translate-y-1.5 relative">
                  
                  {event.date && (
                    <span className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-md text-[var(--secondary)] text-xs md:text-sm px-4 py-2 rounded-2xl font-black shadow-md border border-border">
                      {event.date}
                    </span>
                  )}

                  <div className="h-60 bg-muted overflow-hidden relative">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl bg-muted">📅</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="text-white text-sm font-bold flex items-center gap-1">
                        اطلع على تفاصيل الحدث <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex flex-col flex-grow justify-between gap-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black mb-3 line-clamp-1 group-hover:text-[var(--secondary)] transition-colors text-right text-foreground">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="text-xs font-bold mb-3 flex items-center gap-1.5 text-muted-foreground text-right justify-start">
                          <MapPin size={14} className="text-[var(--secondary)]" /> {event.location}
                        </p>
                      )}
                      <p className="text-muted-foreground mb-6 text-sm md:text-base line-clamp-2 leading-relaxed text-right">
                        {event.desc}
                      </p>
                    </div>

                    <div className="w-full py-4 rounded-2xl font-extrabold text-center transition-all duration-300 shadow-sm flex items-center justify-center gap-2 border border-border bg-background text-[var(--secondary)] group-hover:bg-[var(--secondary)] group-hover:text-white group-hover:border-[var(--secondary)]">
                      <span>عرض التفاصيل والحجز</span>
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