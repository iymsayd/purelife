import { notFound } from 'next/navigation';
import { getOfferBySlug, getOffers } from '../offerService';
import OfferClient from './OfferClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// إعادة التحديث كل ساعة لكل صفحات العروض الفرعية
export const revalidate = 3600;

// توليد روابط جميع العروض مسبقاً لمنع أي استعلامات مباشر للفايربيز وقت التصفح
export async function generateStaticParams() {
  const offers = await getOffers();
  return offers.map((offer: any) => ({
    slug: offer.slug || offer.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const offer: any = await getOfferBySlug(slug);

  return { 
    title: offer?.title ? `${offer.title} | عروض بيورلايف` : "العرض | بيورلايف", 
    description: offer?.desc || "استمتع بأفضل العروض والخصومات الحصرية من بيورلايف.",
    alternates: {
      canonical: `https://purelife-eg.com/offers/${slug}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const offer: any = await getOfferBySlug(slug);
  if (!offer) notFound();

  const allOffers = await getOffers();

  return <OfferClient offer={offer} slug={slug} allOffers={allOffers} />;
}