'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Eye, X, Calendar, FileText } from 'lucide-react';

interface ActivitiesListProps {
  user: User;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ user }) => {
  const [filter, setFilter] = useState('all');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const requestTypes = [
    { id: 'all', label: 'الكل' },
    { id: 'maintenance', label: 'الصيانة' },
    { id: 'jobs', label: 'التوظيف' },
    { id: 'complaints', label: 'الشكاوى' },
    { id: 'offers', label: 'العروض' },
    { id: 'events', label: 'الأحداث' },
    { id: 'contact', label: 'تواصل معنا' },
  ];

  const collectionsMap: Record<string, string> = {
    maintenance: 'maintenance_requests',
    complaints: 'complaints',
    jobs: 'job_applications',
    contact: 'contact_messages',
    events: 'event_bookings',
    offers: 'offer_requests',
  };

  const parseSafeDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      try {
        return timestamp.toDate();
      } catch (e) {
        return new Date();
      }
    }
    if (timestamp instanceof Date) return timestamp;
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user || !user.uid) {
        setLoading(false);
        setActivities([]);
        return;
      }

      setLoading(true);
      try {
        let allFetchedItems: any[] = [];

        for (const [key, colName] of Object.entries(collectionsMap)) {
          try {
            const querySnapshot = await getDocs(collection(db, colName));

            querySnapshot.forEach((docSnap) => {
              const data = docSnap.id ? docSnap.data() : null;
              if (!data) return;

              const isOwner = 
                data.userId === user.uid || 
                data.uid === user.uid || 
                (data.email && user.email && data.email.toLowerCase() === user.email.toLowerCase());

              if (isOwner) {
                allFetchedItems.push({
                  id: docSnap.id,
                  sourceCollection: key,
                  typeLabel: 
                    key === 'maintenance' ? 'طلب صيانة' :
                    key === 'complaints' ? 'شكوى / اقتراح' :
                    key === 'jobs' ? 'طلب توظيف' :
                    key === 'offers' ? 'طلب عرض' :
                    key === 'events' ? 'حجز حدث' : 'رسالة تواصل',
                  ...data,
                  parsedDate: parseSafeDate(data.createdAt || data.date || data.timestamp),
                });
              }
            });
          } catch (err) {
            console.error(`Error fetching from ${colName}:`, err);
          }
        }

        allFetchedItems.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
        setActivities(allFetchedItems);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter((item) => item.sourceCollection === filter);

  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-6 sm:p-10 transition-all duration-300" dir="rtl">
      <div className="text-center sm:text-right mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">طلبات الخدمات والأنشطة</h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0ea5e9]">
          تتبع حالة طلبات الصيانة، التوظيف، والشكاوى بكل سهولة. (انقر على أي طلب لعرض تفاصيله الكاملة)
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-8">
        {requestTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilter(type.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filter === type.id
                ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-card text-card-foreground rounded-3xl p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-muted-foreground animate-pulse">جاري جلب الأنشطة والطلبات...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/80 rounded-3xl bg-muted/20">
          <p className="text-foreground font-bold text-base mb-2">لا توجد طلبات مسجلة بهذا القسم.</p>
          <p className="text-xs text-muted-foreground">لم تقم بإرسال أي طلبات تطابق هذا التصنيف حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              onClick={() => setSelectedActivity(activity)}
              className="bg-background border border-border/80 rounded-2xl p-5 sm:p-6 transition-all hover:border-[#0ea5e9]/70 hover:shadow-md cursor-pointer space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-xl text-xs font-black">
                    {activity.typeLabel}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar size={13} />
                    {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(activity.parsedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                    activity.status === 'completed' || activity.status === 'مكتمل' || activity.status === 'resolved' || activity.status === 'read'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : activity.status === 'rejected' || activity.status === 'مرفوض'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {activity.status === 'resolved' ? 'تمت المتابعة' : activity.status === 'read' ? 'مقروء' : activity.status || 'جديد / قيد المراجعة'}
                  </span>
                  <span className="text-xs text-[#0ea5e9] font-bold group-hover:underline flex items-center gap-1">
                    <Eye size={14} />
                    التفاصيل
                  </span>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-sm text-foreground/90 font-medium space-y-2">
                <p className="leading-relaxed line-clamp-2">
                  <strong className="text-muted-foreground ml-1">التفاصيل:</strong> 
                  {activity.message || activity.note || activity.details || activity.coverLetter || 'لا توجد تفاصيل إضافية مسجلة.'}
                </p>
                {(activity.phone || activity.email || activity.phoneNumber) && (
                  <div className="flex gap-4 pt-2 border-t border-border/50">
                    {(activity.phone || activity.phoneNumber) && <p className="text-xs text-muted-foreground font-bold" dir="ltr">هاتف: {activity.phone || activity.phoneNumber}</p>}
                    {activity.email && <p className="text-xs text-muted-foreground font-bold" dir="ltr">إيميل: {activity.email}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة تفاصيل الطلب (أسود ثابت تماماً Light/Dark) */}
      {selectedActivity && (
        <div onClick={() => setSelectedActivity(null)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-neutral-900 border border-neutral-700 text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto" dir="rtl">
            <button onClick={() => setSelectedActivity(null)} className="absolute top-5 left-5 text-neutral-400 hover:text-white p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-[#0ea5e9] font-black text-lg sm:text-xl border-b pb-4 border-neutral-800">
              <FileText size={24} />
              <span>تفاصيل الطلب الكاملة</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-800 p-4 rounded-2xl">
                <div>
                  <span className="text-neutral-400 text-xs block mb-1">نوع الطلب / القسم:</span>
                  <span className="font-bold text-white">{selectedActivity.typeLabel}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs block mb-1">حالة الطلب:</span>
                  <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                    selectedActivity.status === 'completed' || selectedActivity.status === 'مكتمل' || selectedActivity.status === 'resolved' || selectedActivity.status === 'read'
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : selectedActivity.status === 'rejected' || selectedActivity.status === 'مرفوض'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedActivity.status === 'resolved' ? 'تمت المتابعة' : selectedActivity.status === 'read' ? 'مقروء' : selectedActivity.status || 'جديد / قيد المراجعة'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-800 p-4 rounded-2xl">
                <div>
                  <span className="text-neutral-400 text-xs block mb-1">الاسم المسجل:</span>
                  <span className="font-bold text-white">{selectedActivity.name || selectedActivity.fullName || selectedActivity.applicantName || 'غير متوفر'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs block mb-1">رقم الهاتف:</span>
                  <span className="font-bold text-white" dir="ltr">{selectedActivity.phone || selectedActivity.phoneNumber || selectedActivity.mobile || 'غير متوفر'}</span>
                </div>
              </div>

              {(selectedActivity.email || selectedActivity.address || selectedActivity.location || selectedActivity.city) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-800 p-4 rounded-2xl">
                  {selectedActivity.email && (
                    <div>
                      <span className="text-neutral-400 text-xs block mb-1">البريد الإلكتروني:</span>
                      <span className="font-bold text-white" dir="ltr">{selectedActivity.email}</span>
                    </div>
                  )}
                  {(selectedActivity.address || selectedActivity.location || selectedActivity.city) && (
                    <div>
                      <span className="text-neutral-400 text-xs block mb-1">العنوان / الموقع:</span>
                      <span className="font-bold text-white">{selectedActivity.address || selectedActivity.location || selectedActivity.city}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-neutral-800 p-4 rounded-2xl space-y-1">
                <span className="text-neutral-400 text-xs block font-bold">التفاصيل الكاملة / الرسالة:</span>
                <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedActivity.message || selectedActivity.note || selectedActivity.details || selectedActivity.coverLetter || 'لا توجد تفاصيل إضافية مسجلة.'}
                </p>
              </div>

              <div className="text-xs text-neutral-400 pt-2 text-left flex items-center justify-end gap-1">
                <Calendar size={13} />
                تاريخ الإنشاء: {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'medium' }).format(selectedActivity.parsedDate)}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedActivity(null)} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white transition-all cursor-pointer">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};