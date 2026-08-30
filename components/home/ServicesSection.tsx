import Link from 'next/link';
import { CheckCircle2, Wrench, MessageSquareWarning, Repeat, Tag, CalendarDays, ArrowLeft, ArrowRight } from 'lucide-react';

// تعريف شكل البيانات لتكون قابلة للإدارة بالكامل من الداشبورد (Firebase / DB)
interface ServiceItem {
  title: string;
  desc: string;
  link: string;
}

interface ServicesProps {
  isRtl?: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  services?: ServiceItem[];
  moreText?: string;
}

export default function ServicesSection({ 
  isRtl = true,
  sectionTitle = "خدمات وأقسام بيورلايف",
  sectionSubtitle = "كل ما تحتاجه لضمان نقاء المياه وصيانة أجهزتك في مكان واحد",
  services = [
    {
      title: "سياسة الجودة",
      desc: "هي وثيقة حية تمثل روح الفريق داخل شركة بيورلايف لتحقيق الهدف المنشود وهو التحسين والتطوير المستمر.",
      link: "/blog"
    },
    {
      title: "طلب صيانة",
      desc: "يسعدنا تلقي طلباتكم للصيانة والإصلاح أينما كنتم من خلال مركز الخدمة وأطقم فنية على أعلى مستوى.",
      link: "/maintenance"
    },
    {
      title: "شكاوى / مقترحات",
      desc: "نتفاعل بكل جدية مع كل شكوى أو مقترح لإيماننا بأن عميلنا هو شريك النجاح الأساسي في مسيرة تطورنا.",
      link: "/complaints"
    },
    {
      title: "سوق المستعمل",
      desc: "خدمة إعلانية مجانية لعملائنا يمكنك من خلال السوق عرض أو شراء الأجهزة المستعملة بكل سهولة.",
      link: "/used-products"
    },
    {
      title: "عروض / تخفيضات",
      desc: "استمتع معنا بآخر العروض والتخفيضات الكبرى التي نوفرها لفترة محدودة على كافة الأجهزة.",
      link: "/offers"
    },
    {
      title: "الأحداث والفعاليات",
      desc: "تابع معنا كل جديد في بيورلايف من خلال الصور والأخبار وآخر الفعاليات وورش العمل.",
      link: "/events"
    }
  ],
  moreText = "المزيد"
}: ServicesProps) {

  // دالة لاختيار الأيقونة المناسبة لكل خدمة بناءً على الترتيب
  const getServiceIcon = (index: number) => {
    const commonClasses = "text-[var(--secondary)] transition-transform duration-300 group-hover:scale-110";
    switch (index) {
      case 0: return <CheckCircle2 className={commonClasses} size={26} />;
      case 1: return <Wrench className={`${commonClasses} group-hover:rotate-45`} size={26} />;
      case 2: return <MessageSquareWarning className={commonClasses} size={26} />;
      case 3: return <Repeat className={`${commonClasses} group-hover:rotate-180`} size={26} />;
      case 4: return <Tag className={`${commonClasses} group-hover:-rotate-12`} size={26} />;
      case 5: return <CalendarDays className={commonClasses} size={26} />;
      default: return <CheckCircle2 className={commonClasses} size={26} />;
    }
  };

  return (
    <section className="py-14 px-4 container mx-auto max-w-6xl bg-[var(--background)] transition-colors duration-300">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[var(--secondary)]">{sectionTitle}</h2>
        <p className="text-[var(--muted-foreground)] text-sm md:text-base">{sectionSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, idx) => (
          <ServiceCard 
            key={idx}
            title={service.title}
            desc={service.desc}
            icon={getServiceIcon(idx)}
            link={service.link}
            moreText={moreText}
            isRtl={isRtl}
          />
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ title, desc, link, icon, moreText, isRtl }: any) {
  return (
    <Link href={link} className="group block h-full cursor-pointer">
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full border-t-4 border-t-[var(--secondary)] hover:-translate-y-1.5 hover:border-[var(--secondary)]">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[var(--background)] rounded-2xl border border-[var(--secondary)]/20 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h3 className="text-lg md:text-xl font-bold group-hover:text-[var(--secondary)] transition text-[var(--foreground)]">{title}</h3>
          </div>
          <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-6">{desc}</p>
        </div>
        <div className="flex items-center gap-2 text-[var(--secondary)] font-bold text-sm pt-4 border-t border-[var(--border)]">
          <span className="group-hover:translate-x-1 transition-transform duration-300">{moreText}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </span>
        </div>
      </div>
    </Link>
  );
}