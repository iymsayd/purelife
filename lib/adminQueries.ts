import { collection, getDocs, getCountFromServer, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 1. جلب إحصائيات العملاء والعدد الكلي
export async function getUsersStats() {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCollection);
    const totalUsers = snapshot.data().count;

    const usersQuery = await getDocs(query(usersCollection, orderBy('createdAt', 'desc')));
    const usersList = usersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { totalUsers, usersList };
  } catch (error) {
    console.error('Error fetching users stats:', error);
    return { totalUsers: 0, usersList: [] };
  }
}

// 2. دالة عامة لجلب أي نوع من الطلبات بناءً على اسم الكولكشن
export async function getRequestsByType(collectionName: string) {
  try {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

// دوال مختصرة جاهزة للاستخدام الفوري في الداشبورد
export async function getMaintenanceRequests() {
  return await getRequestsByType('maintenance_requests');
}

export async function getComplaints() {
  return await getRequestsByType('complaints');
}

export async function getJobApplications() {
  return await getRequestsByType('job_applications');
}

export async function getContactMessages() {
  return await getRequestsByType('contact_messages');
}

export async function getEventBookings() {
  return await getRequestsByType('event_bookings');
}

export async function getOfferRequests() {
  return await getRequestsByType('offer_requests');
}

export async function getFooterMessages() {
  return await getRequestsByType('footer_messages');
}

// 3. جلب الأوردرات الخاصة بالمتجر
export async function getOrders() {
  return await getRequestsByType('orders');
}