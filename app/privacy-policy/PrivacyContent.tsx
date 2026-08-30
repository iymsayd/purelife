'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Database, Eye } from 'lucide-react';

export default function PrivacyContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <article className="max-w-4xl mx-auto space-y-12">
        
        {/* الهيدر */}
        <header className="text-center space-y-6">
          <div className="inline-flex p-6 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-xl mb-4 backdrop-blur-md">
            <ShieldAlert size={64} className="text-[var(--secondary)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">سياسة الخصوصية</h1>
          <p className="text-xl text-[var(--secondary)] font-bold">لأن ثقتكم هي مستقبلنا، خصوصيتكم أمانة نعتز بحمايتها.</p>
        </header>

        {/* المقدمة */}
        <section className="p-8 md:p-10 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-lg leading-relaxed transition-colors">
          <p className="text-lg md:text-xl">
            في شركة <strong>بيورلايف</strong>، نحن ندرك تماماً أن ثقتكم بنا لا تتوقف عند جودة أجهزة التكييف أو فلاتر المياه التي نقدمها، بل تمتد لتشمل بياناتكم الشخصية التي نعتبرها أمانة. تهدف هذه السياسة لتوضيح كيف نقوم بجمع، استخدام، وحماية معلوماتك عند تعاملك معنا.
          </p>
        </section>

        {/* المحتوى التفصيلي */}
        <div className="grid gap-8">
          {[
            { icon: <Database size={28} />, title: "المعلومات التي نجمعها", text: "نقوم بجمع البيانات الضرورية فقط لخدمتك (مثل: الاسم، رقم الهاتف، العنوان) لضمان وصول خدمات التركيب والصيانة إليك بأفضل شكل." },
            { icon: <Lock size={28} />, title: "حماية بياناتك", text: "نستخدم أحدث تقنيات التشفير لضمان أن بياناتك في أمان تام، ولا نقوم أبداً بمشاركة أو بيع معلوماتك لأي طرف خارجي." },
            { icon: <Eye size={28} />, title: "استخدام البيانات", text: "نستخدم معلوماتك حصرياً لتحسين تجربتك، التواصل معك بشأن الصيانة الدورية، وإطلاعك على أحدث عروضنا التي تناسب احتياجاتك." }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-6 p-8 rounded-3xl bg-[var(--background)] border border-[var(--border)] transition-all shadow-md">
              <div className="text-[var(--secondary)] shrink-0 p-3 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="opacity-90 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* الخاتمة */}
        <section className="p-8 md:p-10 rounded-3xl bg-[var(--background)] border border-[var(--border)] text-center shadow-lg transition-colors space-y-6">
          <p className="text-lg font-bold leading-relaxed">
            باستمرارك في استخدام موقع بيورلايف، فأنت توافق على سياسة الخصوصية الخاصة بنا. نحن نعدك بأن نظل دائماً عند حسن ظنكم، وأن نضع خصوصيتكم في مقدمة أولوياتنا.
          </p>
          <div className="pt-6 border-t border-[var(--border)]">
            <p className="text-xl font-black text-[var(--secondary)]">بيورلايف - اسم تثق به في عالم التكييف والمياه</p>
          </div>
        </section>

      </article>
    </main>
  );
}