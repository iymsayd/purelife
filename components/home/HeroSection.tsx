'use client';
import Link from 'next/link';
import { Tag, ArrowLeft, ArrowRight, Award } from 'lucide-react';

interface Brand {
  src: string;
  alt: string;
}

interface HeroProps {
  isRtl?: boolean;
  badgeText?: string;
  mainTitle?: string;
  highlightedTitle?: string;
  description?: string;
  brands?: Brand[];
  footerNote?: string;
}

export default function HeroSection({ 
  isRtl = true, 
  badgeText = "🥇 خيارك الأول لصيانة وتركيب الأجهزة",
  mainTitle = "المعيار الأفضل في عالم",
  highlightedTitle = "التكييفات وتنقية المياه",
  description = "مهندسين فنيين على أعلى مستوى من الخبرة والكفاءة تعمل من أجلك على مدار اليوم لصيانه و اصلاح أعطال جميع انواع التكييفات و فلاتر المياة.",
  brands = [
    { src: "https://images.alborsaanews.com/2021/01/1552463410_757_199060_img_778.jpg", alt: "Carrier" },
    { src: "https://cairocart.com/media/codazon_cache/brand/250x/Manufacturer/DDD.png", alt: "Sharp" },
    { src: "https://almania-group.com/wp-content/uploads/2020/07/unionaire.png", alt: "Unionaire" },
    { src: "https://cdn.salla.sa/RxKan/LWr0sTh1RBEBGrHOjpPLMADmb9tF6OzJoAtiXFuJ.jpg", alt: "PureLife" }
  ],
  footerNote = "وكيل حصري لأفضل أنواع أجهزة التكييف وفلاتر تنقية المياة"
}: HeroProps) {
  
  const renderFormattedDescription = (text: string) => {
    const targetPhrase = "أعلى مستوى من الخبرة والكفاءة";
    if (text.includes(targetPhrase)) {
      const parts = text.split(targetPhrase);
      return (
        <>
          {parts[0]}
          <span className="text-[var(--secondary)] font-bold">{targetPhrase}</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  return (
    <section className="relative bg-gradient-to-b from-[var(--secondary)]/10 via-[var(--background)] to-[var(--background)] py-10 md:py-20 px-4 overflow-hidden transition-colors duration-300">
      <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
        
        {/* الجزء النصي */}
        <div className="space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
          <span className="bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs md:text-sm px-4 py-1.5 rounded-full font-bold inline-block shadow-sm border border-[var(--secondary)]/25">
            {badgeText}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-snug sm:leading-tight text-[var(--foreground)]">
            {mainTitle} <span className="text-[var(--secondary)]">{highlightedTitle}</span>
          </h1>
          <p className="text-xs sm:text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed">
            {renderFormattedDescription(description)}
          </p>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <Link href="/offers" className="bg-[var(--secondary)] text-white px-5 sm:px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:opacity-90 hover:scale-105 transition-all duration-300 flex items-center gap-2">
              <span>تصفح العروض الحصرية</span>
              <Tag size={16} />
            </Link>
            <Link href="/products" className="bg-[var(--card)] text-[var(--foreground)] px-5 sm:px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md border border-[var(--border)] transition-all duration-300 flex items-center gap-2">
              <span>تصفح المنتجات</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </div>

        {/* كارت الماركات - تم التعديل بـ flex-col و gap منتظم لضمان احتواء كافة العناصر وظهور النص السفلي بالكامل */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-[var(--background)] border border-[var(--border)] flex flex-col justify-between p-6 sm:p-8 text-center transition-colors duration-300">
          
          {/* شارة التوكيلات المعتمدة */}
          <div className="self-end bg-[var(--secondary)]/10 text-[var(--secondary)] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-[var(--secondary)]/20 mb-4">
            <Award size={14} /> توكيلات معتمدة رسمية
          </div>
          
          {/* شبكة الماركات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full items-center my-4">
            {brands.map((brand, idx) => (
              <div key={idx} className="p-3 bg-[var(--card)]/80 backdrop-blur-xs rounded-xl border border-[var(--border)] flex items-center justify-center h-20 shadow-sm hover:border-[var(--secondary)] transition-all duration-300 group/brand overflow-hidden">
                <img 
                  src={brand.src} 
                  alt={brand.alt} 
                  className="max-h-12 max-w-full object-contain dark:brightness-95 bg-transparent mix-blend-normal transition-transform duration-300 group-hover/brand:scale-110" 
                />
              </div>
            ))}
          </div>

          {/* النص السفلي (وكيل حصري...) ظاهر تماماً على جميع الشاشات */}
          <p className="text-xs sm:text-sm text-[var(--secondary)] font-bold mt-4 w-full text-center">
            {footerNote}
          </p>
        </div>

      </div>
    </section>
  );
}