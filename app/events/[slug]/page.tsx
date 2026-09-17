import { notFound } from 'next/navigation';
import { getEventBySlug, getEvents } from '../eventService';
import EventClient from './EventClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// تفعيل ISR لإعادة التحديث كل ساعة
export const revalidate = 3600;

// توليد الروابط مسبقاً لتوفير قراءات الفايربيز
export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((event: any) => ({
    slug: event.slug || event.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const event: any = await getEventBySlug(slug);

  return {  
    title: event?.title ? `${event.title} | فعاليات بيورلايف` : "الحدث | بيورلايف",  
    description: event?.desc || "تفاصيل الحدث وورش العمل من بيورلايف",
    alternates: {
      canonical: `https://purelife-eg.com/events/${slug}`,
    },
    openGraph: {
      title: event?.title ? `${event.title} | فعاليات بيورلايف` : "الحدث | بيورلايف",
      description: event?.desc || "تفاصيل الحدث وورش العمل من بيورلايف",
      url: `https://purelife-eg.com/events/${slug}`,
      siteName: 'بيورلايف',
      images: [
        {
          url: event?.imageUrl || event?.image || 'https://purelife-eg.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: event?.title || 'فعاليات بيورلايف',
        },
      ],
      locale: 'ar_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event?.title ? `${event.title} | فعاليات بيورلايف` : "الحدث | بيورلايف",
      description: event?.desc || "تفاصيل الحدث وورش العمل من بيورلايف",
      images: [event?.imageUrl || event?.image || 'https://purelife-eg.com/og-image.jpg'],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  
  const event: any = await getEventBySlug(slug);
  if (!event) notFound();

  const allEvents = await getEvents();
  const initialUserData = null; 

  return <EventClient event={event} allEvents={allEvents} initialUserData={initialUserData} />;
}