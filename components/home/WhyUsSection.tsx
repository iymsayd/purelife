import { ShieldCheck, Zap, Headphones } from 'lucide-react';

// تعريف شكل البيانات لتكون قابلة للإدارة بالكامل من الداشبورد (Firebase / DB)
interface Feature {
  title: string;
  desc: string;
  iconName?: string;
}

interface WhyUsProps {
  sectionTitle?: string;
  sectionSubtitle?: string;
  features?: Feature[];
}

export default function WhyUsSection({
  sectionTitle = "لماذا تختار بيورلايف؟",
  sectionSubtitle = "نلتزم بتقديم أعلى معايير الجودة لراحة وتلبية احتياجات عملائنا",
  features = [
    {
      title: "وكلاء وموزعون معتمدون",
      desc: "نضمن لك الحصول على أجهزة أصلية معتمدة ومضمونة بالكامل.",
    },
    {
      title: "خدمة مميزة على مدار اليوم",
      desc: "دعم فني واستجابة سريعة لطلباتك في أي وقت طوال أيام الأسبوع.",
    },
    {
      title: "نصلك أينما كنت",
      desc: "فروعنا المنتشرة تضمن لك خدمة قريبة وسريعة وفريق فني محترف.",
    },
  ],
}: WhyUsProps) {
  // دالة لاختيار الأيقونة المناسبة بناءً على الترتيب أو البيانات
  const getIcon = (index: number) => {
    const iconProps = {
      size: 36,
      className: "text-[var(--secondary)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
    };
    if (index === 0) return <ShieldCheck {...iconProps} />;
    if (index === 1) return <Zap {...iconProps} />;
    return <Headphones {...iconProps} />;
  };

  return (
    <section className="py-14 px-4 bg-[var(--background)] my-4 border-y border-[var(--border)] transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[var(--secondary)]">
            {sectionTitle}
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm md:text-base">
            {sectionSubtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-6 md:p-8 rounded-3xl bg-[var(--background)] border border-[var(--border)] flex flex-col items-center hover:shadow-xl hover:border-[var(--secondary)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
            >
              <div className="p-4 bg-[var(--background)] rounded-2xl shadow-sm mb-4 border border-[var(--border)] group-hover:scale-110 transition-transform duration-300">
                {getIcon(idx)}
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--secondary)] transition-colors text-[var(--foreground)]">
                {feature.title}
              </h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}