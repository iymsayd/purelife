'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AboutContentProps {
  initialContent?: any;
}

export default function AboutContent({ initialContent }: AboutContentProps) {
  const [mounted, setMounted] = useState(false);

  // المحتوى الافتراضي القابل للتحديث من الداشبورد عبر فايربيز (مع النصوص الأصلية كاملة)
  const [content, setContent] = useState(initialContent || {
    badgeTitle: "عن بيورلايف",
    subTitle: "مجموعة من الخبراء المتخصصين",
    paragraphOne: "تعتبر شركة بيورلايف مجموعة من الخبراء المتخصصين فى عالم التكييف والتبريد وتكنولوجيا معالجة المياة والبيئة داخل مصر وخارجها منذ أكثر من خمسة عشر عام قررنا تأسيس شركة بيور لايف بمفاهيم حديثة تعتمد على دراسة السوق ومتطلباته ومعالجة السلبيات الموجودة بالإعتماد على الأسس العلمية والمعاير المتبعة فى جميع دول العالم. ومن أهم نتائج البحث والدراسة وجدنا أن خدمة ما بعد البيع المتميزة هى الوسيلة الوحيدة والضمان لتقدم الشركة.",
    paragraphTwo: "ولكن لأننا لا نريد فقط التمييز بل نطمح أن نكون الأفضل وجدنا أن طريقنا يبدأ من خدمة البيع أولا ثم خدمة ما بعد البيع. فأنتقينا مجموعة من أفضل أجهزة التكييف، فلاتر المياة وأكثرها كفاءة ومنتجات لشركات ذات ثقل فى المجال لتساعدنا فى ما نطمح اليه ولم ننجرف نحو الأجهزة الأقل كفاءة حتى لو كانت الأكثر ربحا.",
    quoteText: "ولما كانت ثقتكم هي غايتنا، استعنا بخبرتنا العلمية والعملية لنعمل على خدمتكم بأقصى جهد...",
    footerMotto: "خبرتنا ماضينا... خدمتكم حاضرنا... ثقتكم مستقبلنا"
  });

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    // الاستماع الفوري للتحديثات من لوحة التحكم (Dashboard Live Sync) لمستند 'about_page'
    const unsubscribe = onSnapshot(doc(db, 'site_content', 'about_page'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)]">
      <article className="max-w-4xl mx-auto space-y-12">
        
        {/* رأس الصفحة */}
        <header className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="p-5 rounded-3xl bg-[var(--background)] text-[var(--secondary)] transition-all duration-300 hover:-translate-y-2 shadow-lg border border-[var(--border)] backdrop-blur-md">
              <ShieldCheck size={56} strokeWidth={1.8} />
            </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight transition-colors">
              {content?.badgeTitle || 'عن بيورلايف'}
            </h1>
            
            <p className="text-lg md:text-2xl font-bold text-[var(--secondary)] pt-2 transition-colors">
              {content?.subTitle || 'مجموعة من الخبراء المتخصصين'}
            </p>
          </div>
        </header>

        {/* الفقرات التعريفية */}
        <div className="space-y-8">
          <div className="p-8 md:p-10 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-md hover:shadow-2xl hover:border-[var(--secondary)] transition-all duration-300 border-t-4 border-t-[var(--secondary)] backdrop-blur-md">
            <p className="text-[var(--foreground)] leading-relaxed text-base md:text-lg lg:text-xl font-normal transition-colors">
              {content?.paragraphOne}
            </p>
          </div>
          
          <div className="p-8 md:p-10 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-md hover:shadow-2xl hover:border-[var(--secondary)] transition-all duration-300 border-t-4 border-t-[var(--secondary)] backdrop-blur-md">
            <p className="text-[var(--foreground)] leading-relaxed text-base md:text-lg lg:text-xl font-normal transition-colors">
              {content?.paragraphTwo}
            </p>
          </div>
        </div>

        {/* قسم الاقتباس والرسالة الجوهرية */}
        <section className="bg-[var(--background)] p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-xl border-2 border-[var(--border)] transition-all duration-300 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-2 bg-[var(--secondary)] opacity-70"></div>
            
          <p className="text-base md:text-xl leading-relaxed text-[var(--foreground)] font-bold relative z-10 transition-colors">
            {content?.quoteText}
          </p>
          <p className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[var(--secondary)] pt-6 border-t border-[var(--border)] tracking-wide relative z-10">
            {content?.footerMotto}
          </p>
        </section>

      </article>
    </main>
  );
}