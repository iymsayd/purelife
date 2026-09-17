import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

// دالة توليد الـ Metadata مع منع الأرشفة تماماً (NoIndex, NoFollow)
export async function generateMetadata(): Promise<Metadata> {
  const storeName = 'بيورلايف';
  
  return {
    title: `إتمام الشراء ومراجعة الطلب | ${storeName}`,
    description: 'أكمل بيانات الشحن الخاصة بك وتأكيد طلبات منتجات معالجة المياه والمنتجات المنزلية بكل سهولة وأمان عبر منصة بيورلايف.',
    robots: {
      index: false,  // بيمنع محركات البحث (زي جوجل) من أرشفة هذه الصفحة
      follow: false, // بيمنع تتبع الروابط الموجودة داخل صفحة الـ Checkout لأسباب أمنية
      nocache: true, // يمنع تخزين نسخة مؤقتة للصفحة في نتائج البحث
    },
    openGraph: {
      title: `إتمام الشراء ومراجعة الطلب | ${storeName}`,
      description: 'أكمل بيانات الشحن الخاصة بك وتأكيد طلبات منتجات معالجة المياه.',
      type: 'website',
    },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}