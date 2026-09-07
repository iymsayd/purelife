'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, X, Calendar, FileText } from 'lucide-react';

interface ActivitiesListProps {
  user: User;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ user }) => {
  const [filter, setFilter] = useState('all');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  // حالات التقسيم إلى صفحات (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const requestTypes = [
    { id: 'all', label: 'الكل' },
    { id: 'maintenance', label: 'الصيانة' },
    { id: 'jobs', label: 'التوظيف' },
    { id: 'complaints', label: 'الشكاوى' },
    { id: 'offers', label: 'العروض' },
    { id: 'events', label: 'الأحداث' },
    { id: 'footer', label: 'رسائل الفوتر' },
    { id: 'contact', label: 'تواصل معنا' },
  ];

  const collectionsMap: Record<string, string[]> = {
    maintenance: ['maintenance_requests', 'maintenance'],
    complaints: ['complaints', 'suggestions'],
    jobs: ['job_applications', 'jobs', 'careers'],
    contact: ['contact_messages', 'contact', 'messages'],
    events: ['event_bookings', 'events', 'eventRequests'],
    offers: ['offer_requests', 'offers', 'offerRequests'],
    footer: ['footer_messages', 'footerMessages', 'footer'],
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
      if (!user || (!user.uid && !user.email)) {
        setLoading(false);
        setActivities([]);
        return;
      }

      setLoading(true);
      try {
        let allFetchedItems: any[] = [];
        const userEmail = user.email ? user.email.toLowerCase().trim() : '';
        const processedCollections = new Set<string>();

        for (const [key, colNames] of Object.entries(collectionsMap)) {
          for (const colName of colNames) {
            if (processedCollections.has(colName)) continue;
            processedCollections.add(colName);

            try {
              const colRef = collection(db, colName);
              let querySnapshot;

              try {
                if (key === 'footer' && userEmail) {
                  const qEmail = query(colRef, where('email', '==', userEmail));
                  querySnapshot = await getDocs(qEmail);
                } else {
                  querySnapshot = await getDocs(colRef);
                }
              } catch (innerErr) {
                continue;
              }

              if (querySnapshot) {
                querySnapshot.forEach((docSnap) => {
                  const data = docSnap.data();
                  if (!data) return;

                  const dataEmail = data.email ? String(data.email).toLowerCase().trim() : '';
                  const dataUid = data.userId || data.uid || '';

                  const isOwner = 
                    (user.uid && dataUid === user.uid) || 
                    (userEmail && dataEmail === userEmail);

                  if (isOwner) {
                    allFetchedItems.push({
                      id: docSnap.id,
                      sourceCollection: key,
                      originalCollection: colName,
                      typeLabel: 
                        key === 'maintenance' ? 'طلب صيانة' :
                        key === 'complaints' ? 'شكوى / اقتراح' :
                        key === 'jobs' ? 'طلب توظيف' :
                        key === 'offers' ? 'طلب عرض' :
                        key === 'events' ? 'حجز حدث' :
                        key === 'footer' ? 'رسالة الفوتر' : 'رسالة تواصل',
                      ...data,
                      parsedDate: parseSafeDate(data.createdAt || data.date || data.timestamp),
                    });
                  }
                });
              }
            } catch (err) {
              console.error(`Error fetching from ${colName}:`, err);
            }
          }
        }

        const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());
        uniqueItems.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
        setActivities(uniqueItems);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  // دعم إغلاق المودال بزر Esc من لوحة المفاتيح لمنع تسريب الذاكرة وتحسين الاستجابة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedActivity) {
        setSelectedActivity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActivity]);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter((item) => item.sourceCollection === filter);

  // حساب العناصر والصفحات الحالية
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (typeId: string) => {
    setFilter(typeId);
    setCurrentPage(1);
  };

  const excludeFields = ['id', 'sourceCollection', 'originalCollection', 'typeLabel', 'userId', 'uid', 'createdAt', 'date', 'timestamp', 'status', 'parsedDate', 'email', 'name', 'fullName', 'applicantName', 'phone', 'phoneNumber', 'mobile', 'message', 'note', 'details', 'coverLetter', 'address', 'location', 'city'];

  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-5 sm:p-8 md:p-10 transition-all duration-300 w-full max-w-full overflow-hidden" dir="rtl">
      <div className="text-center sm:text-right mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">طلبات الخدمات والأنشطة</h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0ea5e9] leading-relaxed">
          تتبع حالة طلبات الصيانة، التوظيف، العروض، الأحداث، رسائل الفوتر، والشكاوى بكل سهولة عبر سجلك المرتبط بالبريد الإلكتروني.
        </p>
      </div>

      {/* أزرار الفلترة متجاوبة مع الأجهزة المختلفة */}
      <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border/60">
        {requestTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleFilterChange(type.id)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
          <p className="text-sm text-muted-foreground animate-pulse">جاري جلب سجل الأنشطة والطلبات...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/80 rounded-3xl bg-muted/20">
          <p className="text-foreground font-bold text-base mb-2">لا توجد طلبات مسجلة بهذا القسم.</p>
          <p className="text-xs text-muted-foreground">لم تقم بإرسال أي طلبات مطابقة لهذا التصنيف حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentActivities.map((activity) => (
            <div 
              key={activity.id} 
              onClick={() => setSelectedActivity(activity)}
              className="bg-background border border-border/80 rounded-2xl p-4 sm:p-6 transition-all hover:border-[#0ea5e9]/70 hover:shadow-md cursor-pointer space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5 flex-wrap">
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

              <div className="bg-muted/40 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-foreground/90 font-medium space-y-2">
                <p className="leading-relaxed line-clamp-2">
                  <strong className="text-muted-foreground ml-1">التفاصيل:</strong> 
                  {activity.message || activity.note || activity.details || activity.coverLetter || activity.eventTitle || activity.offerName || 'لا توجد تفاصيل إضافية مسجلة.'}
                </p>
              </div>
            </div>
          ))}

          {/* نظام التنقل بين الصفحات (Pagination) متجاوب تماماً */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/60 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                السابق
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#0ea5e9] text-white shadow-md shadow-[#0ea5e9]/20'
                        : 'bg-muted/40 hover:bg-muted text-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}

      {/* نافذة التفاصيل (Modal) بستايل موحد ومتوافق مع وضع الدارك والوايت */}
      {selectedActivity && (
        <div 
          onClick={() => setSelectedActivity(null)} 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto" 
            dir="rtl"
          >
            <button 
              onClick={() => setSelectedActivity(null)} 
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-[#0ea5e9] font-black text-lg sm:text-xl border-b pb-4 border-slate-800">
              <FileText size={24} />
              <span>تفاصيل الطلب الكاملة</span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-xs block mb-1">نوع الطلب / القسم:</span>
                  <span className="font-bold text-white">{selectedActivity.typeLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-1">حالة الطلب:</span>
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

              {(selectedActivity.name || selectedActivity.fullName || selectedActivity.applicantName || selectedActivity.phone || selectedActivity.phoneNumber) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                  {selectedActivity.name || selectedActivity.fullName || selectedActivity.applicantName ? (
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">الاسم المسجل:</span>
                      <span className="font-bold text-white">{selectedActivity.name || selectedActivity.fullName || selectedActivity.applicantName}</span>
                    </div>
                  ) : null}
                  {selectedActivity.phone || selectedActivity.phoneNumber || selectedActivity.mobile ? (
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">رقم الهاتف:</span>
                      <span className="font-bold text-white" dir="ltr">{selectedActivity.phone || selectedActivity.phoneNumber || selectedActivity.mobile}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {Object.keys(selectedActivity).some(key => !excludeFields.includes(key)) && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <span className="text-[#0ea5e9] text-xs block font-black border-b border-slate-800 pb-2">الخيارات والحقول الإضافية المختارة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedActivity).map(([key, value]) => {
                      if (excludeFields.includes(key)) return null;
                      if (value === null || value === undefined) return null;

                      let displayValue = '';
                      if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                      } else if (typeof value === 'object') {
                        try {
                          displayValue = JSON.stringify(value);
                        } catch (e) {
                          displayValue = '[بيانات معقدة]';
                        }
                      } else {
                        displayValue = String(value);
                      }

                      if (!displayValue.trim()) return null;

                      return (
                        <div key={key} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px] block capitalize mb-0.5">{key}:</span>
                          <span className="font-bold text-white text-xs">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                <span className="text-slate-400 text-xs block font-bold mb-1">التفاصيل الكاملة / الرسالة:</span>
                <p className="text-white whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {selectedActivity.message || selectedActivity.note || selectedActivity.details || selectedActivity.coverLetter || selectedActivity.eventTitle || selectedActivity.offerName || 'لا توجد تفاصيل إضافية مسجلة.'}
                </p>
              </div>

              <div className="text-xs text-slate-400 pt-2 text-left flex items-center justify-end gap-1">
                <Calendar size={13} />
                تاريخ الإنشاء: {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'medium' }).format(selectedActivity.parsedDate)}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedActivity(null)} 
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white transition-all cursor-pointer shadow-md shadow-[#0ea5e9]/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};