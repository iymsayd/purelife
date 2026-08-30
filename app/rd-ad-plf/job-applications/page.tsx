'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Briefcase, Trash2, Eye, CheckCircle, AlertTriangle, X, UserCheck, UserX } from 'lucide-react';

interface JobApplication {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  jobTitle?: string;
  experience?: string;
  message?: string;
  userId?: string | null;
  isRegistered: boolean;
  createdAt?: string;
  rawDate?: any;
  [key: string]: any; // تم تصحيح الـ Index Signature هنا بنجاح
}

export default function AdminJobsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const q = query(collection(db, 'job_applications'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const appsList: JobApplication[] = [];

        querySnapshot.forEach((document) => {
          const data = document.data();
          appsList.push({
            id: document.id,
            fullName: data.fullName || data.name || 'بدون اسم',
            phone: data.phone || 'غير محدد',
            email: data.email || 'بدون بريد',
            jobTitle: data.jobTitle || data.position || 'وظيفة عامة',
            experience: data.experience || 'غير محدد',
            message: data.message || data.coverLetter || 'لا توجد تفاصيل إضافية',
            userId: data.userId || null,
            isRegistered: !!data.userId,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'حديث',
            ...data
          });
        });

        setApplications(appsList);
      } catch (err) {
        console.error('Error fetching job applications:', err);
        setMessage({ text: 'حدث خطأ أثناء جلب طلبات التوظيف.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'job_applications', id));
      setApplications(applications.filter(app => app.id !== id));
      setMessage({ text: 'تم حذف الطلب بنجاح.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'فشل حذف الطلب.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
    setDeleteId(null);
  };

  if (loading) {
    return <div className="text-center py-20 font-bold text-[var(--foreground)]">جاري تحميل طلبات التوظيف...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--background)] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-3">
            <Briefcase size={32} />
            طلبات التوظيف المُقدمة
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            متابعة طلبات المتقدمين للوظائف، ومعرفة تفاصيل كل طلب وحالة حساب المُرسل.
          </p>
        </div>
        <div className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-800">
          إجمالي الطلبات: <span className="font-black">{applications.length}</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-600 text-white shadow-md'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      <div className="bg-[var(--background)] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 md:px-6">المتقدم</th>
                <th className="p-4 md:px-6">الوظيفة المطلوبة</th>
                <th className="p-4 md:px-6">حالة الحساب</th>
                <th className="p-4 md:px-6">تاريخ الإرسال</th>
                <th className="p-4 md:px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 font-bold">
                    لا توجد طلبات توظيف حتى الآن.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 md:px-6 font-bold text-[var(--foreground)]">
                      <div>{app.fullName}</div>
                      <div className="text-xs text-gray-400 font-normal" dir="ltr">{app.email}</div>
                    </td>
                    <td className="p-4 md:px-6 text-blue-600 dark:text-blue-400 font-medium">
                      {app.jobTitle}
                    </td>
                    <td className="p-4 md:px-6">
                      {app.isRegistered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <UserCheck size={14} /> مسجل بالموقع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <UserX size={14} /> زائر (Guest)
                        </span>
                      )}
                    </td>
                    <td className="p-4 md:px-6 text-gray-500 dark:text-gray-400 text-xs">
                      {app.createdAt}
                    </td>
                    <td className="p-4 md:px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
                        title="عرض تفاصيل الطلب"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(app.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-xl transition-colors"
                        title="حذف الطلب"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal تفاصيل الطلب */}
      {selectedApp && (
        <div onClick={() => setSelectedApp(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedApp(null)} className="absolute top-4 left-4 text-gray-400 hover:text-[var(--foreground)] transition-colors p-1">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-lg border-b pb-3 border-gray-100 dark:border-gray-800">
              <Briefcase size={22} />
              <span>تفاصيل طلب التوظيف</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <div>
                  <span className="text-gray-400 text-xs block">اسم المتقدم:</span>
                  <span className="font-bold text-[var(--foreground)]">{selectedApp.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">رقم الهاتف:</span>
                  <span className="font-bold text-[var(--foreground)]" dir="ltr">{selectedApp.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <div>
                  <span className="text-gray-400 text-xs block">البريد الإلكتروني:</span>
                  <span className="font-bold text-[var(--foreground)]" dir="ltr">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">الوظيفة المستهدفة:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedApp.jobTitle}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <span className="text-gray-400 text-xs block mb-1">نوع الحساب:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  selectedApp.isRegistered ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {selectedApp.isRegistered ? <UserCheck size={14} /> : <UserX size={14} />}
                  {selectedApp.isRegistered ? 'مستخدم مسجل بالموقع' : 'زائر (Guest بدون تسجيل)'}
                </span>
                {selectedApp.userId && (
                  <span className="text-[10px] text-gray-400 block mt-1" dir="ltr">User ID: {selectedApp.userId}</span>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <span className="text-gray-400 text-xs block mb-1">تفاصيل إضافية:</span>
                <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{selectedApp.message || selectedApp.experience || 'لا توجد تفاصيل'}</p>
              </div>

              <div className="text-xs text-gray-400 pt-2 text-left">
                تاريخ الإرسال: {selectedApp.createdAt}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedApp(null)} className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal تأكيد الحذف */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600 font-black text-lg">
              <AlertTriangle size={24} />
              <span>تأكيد الحذف</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              هل أنت متأكد من رغبتك في حذف طلب التوظيف هذا نهائياً؟
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                إغلاق
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}