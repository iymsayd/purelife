'use client';
import { useState, useEffect } from 'react';
import { Award, CheckCircle2, Zap, Droplets, Wind } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function QualityContent() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onSnapshot(doc(db, 'site_content', 'quality_policy'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <article className="max-w-5xl mx-auto space-y-12">
        
        {/* الهيدر */}
        <header className="text-center space-y-6">
          <div className="inline-flex p-6 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-xl mb-4 backdrop-blur-md">
            <Award size={64} className="text-[var(--secondary)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">سياسة الجودة</h1>
          <p className="text-xl text-[var(--secondary)] font-bold">التزامنا تجاه عملائنا هو البوصلة التي توجه طريقنا نحو التميز</p>
        </header>

        {/* النص الرئيسي */}
        <section className="p-8 md:p-12 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-lg leading-relaxed text-lg md:text-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-2 h-full bg-[var(--secondary)]"></div>
          <p className="px-4">
            مجموعة من الخبراء المتخصصون فى عالم التكييف والتبريد وتكنولوجيا معالجة المياة والبيئة داخل مصر وخارجها منذ أكثر من خمسة عشر عام قررنا تأسيس شركة بيور لايف بمفاهيم حديثة تعتمد على دراسة السوق ومتطلباته ومعالجة السلبيات الموجودة بالإعتماد على الأسس العلمية والمعاير المتبعة فى جميع دول العالم. 
            <br /><br />
            ومن أهم نتائج البحث والدراسة وجدنا أن خدمة ما بعد البيع المتميزة هى الوسيلة الوحيدة والضمان لتقدم الشركة ولكن لأننا لا نريد فقط التمييز بل نطمح أن نكون الأفضل وجدنا أن طريقنا يبدأ من خدمة البيع أولا ثم خدمة ما بعد البيع فأنتقينا مجموعة من أفضل الأجهزة وأكثرها كفاءة ومنتجات لشركات ذات ثقل فى المجال سواء فى فلاتر المياه أو أجهزة التكييف لتساعدنا فى ما نطمح اليه ولم ننجرف نحو الأجهزة الأقل كفاءة حتى لو كانت الأكثر ربحا.
          </p>
        </section>

        {/* لماذا تكييف وفلاتر بيورلايف */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[var(--secondary)] flex items-center gap-2">
              <Zap className="fill-[var(--secondary)]" /> لماذا تكييف وفلاتر بيورلايف؟
            </h2>
            <ul className="space-y-4">
              {[
                "جميع الماركات العالمية والمحلية متوفرة.", 
                "خصومات هائلة وعروض مستمرة.", 
                "أنظمة تقسيط متعددة بدون فوائد وبدون مقدم.",
                "كفاءة وسرعة في الأداء والتركيب.", 
                "طاقم فني ومهندسون علي أعلي مستوي.", 
                "صيانة دورية بإستخدام أحدث الأجهزة."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] backdrop-blur-md">
                  <CheckCircle2 className="text-[var(--secondary)] shrink-0" size={20} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* شركاء النجاح والاعتماد (موسّط ومنسق) */}
          <div className="bg-[var(--background)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 text-[var(--secondary)]">
              <Wind size={32} />
              <Droplets size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[var(--secondary)]">شركاء النجاح والاعتماد</h3>
            <p className="text-[var(--foreground)] opacity-90 leading-relaxed">
              موزعون معتمدون لكبري شركات التكييف ومعالجة المياه: شارب – إل جي - ترين - برفكس – يونيون إير - كاريير - سامسونج، وأقوى أنظمة تنقية المياه المتطورة.
            </p>
          </div>
        </section>

        {/* المميزات التقنية (كارت كبير) */}
        <section className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-8 backdrop-blur-md">
          <h3 className="text-2xl md:text-3xl font-black text-[var(--secondary)]">
            نقدم لك أجهزة تكييف وفلاتر مياه تجمع بين كافة الميزات:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm md:text-base font-bold">
            {[
              'صوت بالغ الهدوء للتكييف', 
              'تبريد وتنقيه فائقة السرعة', 
              'هواء ومياه صحية ونقية تماماً', 
              'توفير في إستهلاك الكهرباء', 
              'ضمان مجاني شامل ومعتمد', 
              'شكل إنسيابي أنيق ومميز'
            ].map((feat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--secondary)] transition-all">
                {feat}
              </div>
            ))}
          </div>
        </section>

        {/* الخاتمة */}
        <footer className="text-center pt-8 border-t border-[var(--border)] space-y-4">
          <p className="text-xl md:text-2xl font-black text-[var(--secondary)]">
            خبرتنا ماضينا... خدمتكم حاضرنا... ثقتكم مستقبلنا
          </p>
          <p className="text-lg font-bold opacity-70">بيورلايف بيت التكييف وفلاتر المياه - وبأقل الأسعار!</p>
        </footer>

      </article>
    </main>
  );
}