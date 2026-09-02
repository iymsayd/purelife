import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// خريطة لتوجيه كل نوع فورم إلى الكولكشن المخصص له في فايربيس
const collectionsMap: Record<string, string> = {
  maintenance: 'maintenance_requests',
  complaints: 'complaints',
  jobs: 'job_applications',
  contact: 'contact_messages',
  events: 'event_bookings',
  offers: 'offer_requests',
  footer: 'footer_messages',
};

export async function saveUserMessage(type: string, data: any, userId?: string | null) {
  try {
    // تحديد الكولكشن المناسب بناءً على نوع الفورم، ولو مش موجود يروح لـ contact_messages كاحتياط
    const targetCollection = collectionsMap[type] || 'contact_messages';

    await addDoc(collection(db, targetCollection), {
      ...data, // فك بيانات الفورم مباشرة (الاسم، الهاتف، الرسالة، إلخ) عشان تقراها الداشبورد بوضوح
      type: type, // نوع الطلب
      userId: userId || null, // لو مسجل دخول بنحط الـ uid بتاعه، لو زائر بنسيبها null عشان الفلترة
      createdAt: serverTimestamp(), // الطابع الزمني الموثوق من السيرفر
      status: 'جديد' // الحالة الافتراضية للطلب
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving message to firestore:', error);
    return { success: false, error };
  }
}