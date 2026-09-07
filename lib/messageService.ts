import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwRnGqhYAasRFLyT6r4bWzkIfKhbaydCeaqSELgMQTHg3KTzjll2cP9crt5OVODj6C0/exec';

const collectionsToMigrate = [
  'maintenance_requests',
  'complaints',
  'job_applications',
  'contact_messages',
  'event_bookings',
  'offer_requests',
  'footer_messages',
  'orders'
];

function getClientTypeDetails(userId: any) {
  const isRegistered = 
    userId && 
    typeof userId === 'string' && 
    userId.trim() !== '' && 
    userId !== 'anonymous' && 
    userId !== 'غير مسجل' &&
    userId !== 'زائر' &&
    !userId.startsWith('زائر');

  return {
    isRegistered,
    formattedUserId: isRegistered ? userId : 'زائر (بدون حساب)',
    clientType: isRegistered ? 'عميل مسجل' : 'زائر'
  };
}

export async function saveUserMessage(collectionName: string, data: any) {
  try {
    const { formattedUserId, clientType } = getClientTypeDetails(data.userId);
    const clientEmail = data.email && data.email.trim() !== '' ? data.email : 'لم يتم تسجيله';

    // 1. حفظ البيانات في فايربيس
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      userId: formattedUserId,
      clientType: clientType,
      createdAt: serverTimestamp()
    });

    // 2. إرسال البيانات المنسقة لجوجل شيت
    await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({
        sheetName: collectionName,
        rowData: {
          ...data,
          id: docRef.id,
          email: clientEmail,
          userId: formattedUserId,
          clientType: clientType,
          createdAt: new Date().toLocaleString()
        }
      })
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
}

export async function migrateOldDataToSheets() {
  console.log('🚀 Starting migration of old data to Google Sheets...');

  for (const collectionName of collectionsToMigrate) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`Found ${querySnapshot.size} documents in ${collectionName}`);

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();

        const { formattedUserId, clientType } = getClientTypeDetails(data.userId);
        const clientEmail = data.email && data.email.trim() !== '' ? data.email : 'لم يتم تسجيله';
        let cvInfo = data.cvBase64 || data.cv || 'لم يتم رفع ملف';

        let formattedDate = new Date().toLocaleString();
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          formattedDate = data.createdAt.toDate().toLocaleString();
        }

        const sheetRowData = {
          ...data,
          id: docSnap.id,
          email: clientEmail,
          userId: formattedUserId,
          clientType: clientType,
          cvBase64: cvInfo,
          createdAt: formattedDate,
        };

        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            sheetName: collectionName,
            rowData: sheetRowData
          })
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(`✅ Successfully migrated ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error migrating ${collectionName}:`, error);
    }
  }

  console.log('🎉 Migration completed successfully!');
}