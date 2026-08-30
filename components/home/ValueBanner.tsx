interface ValueBannerProps {
  bannerText?: string;
}

export default function ValueBanner({ bannerText }: ValueBannerProps) {
  const defaultText = "تسوق أونلاين أفضل ماركات وأنواع التكييفات وفلاتر المياه من بيور لايف بأفضل أسعار وأجود خدمة في مصر";

  return (
    <section className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="bg-gradient-to-r from-[var(--secondary)] to-blue-600 text-white p-6 md:p-8 rounded-3xl text-center shadow-lg relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <h2 className="text-lg md:text-2xl font-extrabold leading-snug">
          {bannerText || defaultText}
        </h2>
      </div>
    </section>
  );
}