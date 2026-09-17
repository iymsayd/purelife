import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export async function generateMetadata(): Promise<Metadata> {
  // عنوان افتراضي ثابت للصفحة الشخصية
  const baseTitle = 'حسابي الشخصي';
  const description = 'إدارة حسابك الشخصي، متابعة طلبات الشراء، وتحديث بيانات الأمان الخاصة بك في متجر بيورلايف.';

  // التأكد من عدم تكرار اسم البراند لو تم تعديله مستقبلاً
  const hasBrand = /بيورلايف|pure\s*life/i.test(baseTitle);
  const finalTitle = hasBrand ? baseTitle : `${baseTitle} | بيورلايف`;

  return {
    title: finalTitle,
    description: description,
    robots: {
      index: false, // صفحات الحساب الشخصي يفضل عدم أرشفته في جوجل حفاظاً على الخصوصية والأمان
      follow: false,
    },
    openGraph: {
      title: finalTitle,
      description: description,
      url: 'https://purelife-egypt.vercel.app/profile',
      siteName: 'Pure Life Egypt',
      locale: 'ar_EG',
      type: 'website',
    },
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}