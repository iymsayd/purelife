'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Wrench, 
  Briefcase, 
  PhoneCall, 
  RefreshCw,
  UserX,
  UserCheck
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    newProductsCount: 0,
    usedProductsCount: 0,
    newOrdersCount: 0,
    usedOrdersCount: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    cancelledRevenue: 0,
    totalRevenue: 0,
    messagesCount: 0,
    maintenanceCount: 0,
    jobsCount: 0,
    contactUsCount: 0,
    adminsCount: 0,
    moderatorsCount: 0,
    regularUsersCount: 0,
    totalUsersCount: 0,
    bannedUsersCount: 0
  });
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const currentLang = searchParams.get('lang') || 'ar';
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          productsSnap, 
          usedProductsSnap, 
          ordersSnap, 
          usersSnap,
          maintenanceSnap,
          complaintsSnap,
          jobsSnap,
          contactMessagesSnap,
          offersSnap
        ] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'used_products')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'maintenance_requests')),
          getDocs(collection(db, 'complaints')),
          getDocs(collection(db, 'job_applications')),
          getDocs(collection(db, 'contact_messages')),
          getDocs(collection(db, 'offer_requests'))
        ]);

        let completedRev = 0;
        let pendingRev = 0;
        let cancelledRev = 0;
        let newOrders = 0;
        let usedOrders = 0;
        let maintenanceFromOrders = 0;
        let jobsFromOrders = 0;
        let contactFromOrders = 0;

        ordersSnap.forEach((doc) => {
          const data = doc.data();
          const amount = Number(data.totalAmount) || Number(data.price) || 0;
          const status = (data.status || 'pending').toLowerCase().trim();
          const orderType = (data.type || data.category || data.productType || 'new').toLowerCase().trim();

          // فحص نوع الطلب داخل جدول orders لو الطلبات بتتسجل هناك
          if (orderType.includes('maintenance') || orderType.includes('صيانة')) {
            maintenanceFromOrders++;
          } else if (orderType.includes('job') || orderType.includes('وظيفة')) {
            jobsFromOrders++;
          } else if (orderType.includes('contact') || orderType.includes('رسالة')) {
            contactFromOrders++;
          } else if (orderType.includes('used') || orderType.includes('مستعمل')) {
            usedOrders++;
          } else {
            newOrders++;
          }

          if (['completed', 'delivered', 'shipped', 'approved', 'accepted', 'done', 'مكتمل', 'منتهي'].includes(status)) {
            completedRev += amount;
          } else if (['pending', 'processing', 'reviewing', 'waiting', 'قيد الانتظار', 'معلق'].includes(status)) {
            pendingRev += amount;
          } else if (['cancelled', 'canceled', 'rejected', 'declined', 'ملغي', 'مرفوض'].includes(status)) {
            cancelledRev += amount;
          } else {
            pendingRev += amount;
          }
        });

        let admins = 0;
        let moderators = 0;
        let regulars = 0;
        let banned = 0;

        usersSnap.forEach((doc) => {
          const data = doc.data();
          const role = (data.role || 'user').toLowerCase().trim();
          const isBanned = data.isBanned === true;

          if (isBanned) {
            banned++;
            return;
          }

          if (role === 'admin' || role === 'super_admin' || role === 'مسؤول') {
            admins++;
          } else if (role === 'moderator' || role === 'supervisor' || role === 'مشرف') {
            moderators++;
          } else {
            regulars++;
          }
        });

        // الدمج الذكي: حساب العدد سواء كان في الكوليكشن الخاص بيه أو جوه الـ orders
        const finalMaintenanceCount = (maintenanceSnap.size || 0) + maintenanceFromOrders;
        const finalJobsCount = (jobsSnap.size || 0) + jobsFromOrders;
        const finalContactCount = (contactMessagesSnap.size || 0) + contactFromOrders;
        
        // الرسائل والشكاوى الصافية (نحسب الشكاوى ورسائل التواصل فقط لو مفيش رسائل وهمية)
        const totalMessages = (complaintsSnap.size || 0);

        setStats({
          newProductsCount: productsSnap.size || 0,
          usedProductsCount: usedProductsSnap.size || 0,
          newOrdersCount: newOrders,
          usedOrdersCount: usedOrders,
          completedRevenue: completedRev,
          pendingRevenue: pendingRev,
          cancelledRevenue: cancelledRev,
          totalRevenue: completedRev + pendingRev,
          messagesCount: totalMessages,
          maintenanceCount: finalMaintenanceCount,
          jobsCount: finalJobsCount,
          contactUsCount: finalContactCount,
          adminsCount: admins,
          moderatorsCount: moderators,
          regularUsersCount: regulars,
          totalUsersCount: usersSnap.size || 0,
          bannedUsersCount: banned
        });
      } catch (err) {
        console.error("Error fetching stats from Firebase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-[var(--foreground)] font-bold">{isRtl ? 'جاري تحميل الإحصائيات التحليلية...' : 'Loading analytical statistics...'}</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترحيب */}
      <div className="bg-[var(--background)] p-6 md:p-10 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
        <h1 className="text-2xl md:text-4xl font-black text-[var(--foreground)]">
          {isRtl ? 'أهلاً بك في لوحة تحكم بيورلايف 🚀' : 'Welcome back, to PureLife Dashboard 🚀'}
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
          {isRtl ? 'نظرة عامة ومتابعة دقيقة لكل تفاصيل المتجر والمبيعات والعملاء والفريق.' : 'Overview and close monitoring of all store details, sales, customers, and team.'}
        </p>
      </div>

      {/* قسم المنتجات والطلبات والخدمات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-bold block mb-1">إجمالي المنتجات الجديدة</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.newProductsCount}</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl"><Package size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-cyan-600 dark:text-cyan-400 font-bold block mb-1">إجمالي المنتجات المستعملة</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.usedProductsCount}</span>
          </div>
          <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-2xl"><RefreshCw size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-green-600 dark:text-green-400 font-bold block mb-1">إجمالي طلبات الشراء الجديدة</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.newOrdersCount}</span>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl"><ShoppingBag size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold block mb-1">إجمالي طلبات الشراء المستعملة</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.usedOrdersCount}</span>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl"><ShoppingBag size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-rose-600 dark:text-rose-400 font-bold block mb-1">الرسائل والشكاوى</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.messagesCount}</span>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl"><MessageSquare size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-orange-600 dark:text-orange-400 font-bold block mb-1">طلبات الصيانة</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.maintenanceCount}</span>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl"><Wrench size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold block mb-1">طلبات الوظائف</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.jobsCount}</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl"><Briefcase size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-teal-600 dark:text-teal-400 font-bold block mb-1">عمليات تواصل معنا</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{stats.contactUsCount}</span>
          </div>
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl"><PhoneCall size={28} /></div>
        </div>

      </div>

      {/* قسم الحسابات وصلاحيات الفريق */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="bg-[var(--background)] p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-bold block mb-1">إجمالي الحسابات</span>
            <span className="text-xl font-black text-[var(--foreground)]">{stats.totalUsersCount}</span>
          </div>
          <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl"><Users size={24} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold block mb-1">المسؤولين</span>
            <span className="text-xl font-black text-[var(--foreground)]">{stats.adminsCount}</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl"><ShieldCheck size={24} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">المشرفين</span>
            <span className="text-xl font-black text-[var(--foreground)]">{stats.moderatorsCount}</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl"><UserCheck size={24} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-bold block mb-1">العملاء</span>
            <span className="text-xl font-black text-[var(--foreground)]">{stats.regularUsersCount}</span>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl"><Users size={24} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 rounded-3xl shadow-sm border border-red-200 dark:border-red-900/50 flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-red-600 dark:text-red-400 font-bold block mb-1">الحسابات المحظورة</span>
            <span className="text-xl font-black text-red-700 dark:text-red-400">{stats.bannedUsersCount}</span>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl"><UserX size={24} /></div>
        </div>
      </div>

      {/* قسم المبيعات والأموال */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold block mb-1">المبيعات الفعلية (المنتهية)</span>
            <span className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.completedRevenue} ج.م</span>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl"><TrendingUp size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-amber-600 dark:text-amber-400 font-bold block mb-1">مبيعات قيد الانتظار</span>
            <span className="text-2xl font-black text-[var(--foreground)]">{stats.pendingRevenue} ج.م</span>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl"><Clock size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors">
          <div>
            <span className="text-sm text-red-600 dark:text-red-400 font-bold block mb-1">المبيعات الملغية</span>
            <span className="text-2xl font-black text-[var(--foreground)]">{stats.cancelledRevenue} ج.م</span>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl"><XCircle size={28} /></div>
        </div>

        <div className="bg-[var(--background)] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between transition-colors md:col-span-3">
          <div>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-bold block mb-1">إجمالي الحجم المالي (المكتمل مع المعلق)</span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.totalRevenue} ج.م</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl"><TrendingUp size={28} /></div>
        </div>
      </div>

    </div>
  );
}