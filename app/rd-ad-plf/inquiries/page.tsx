'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MessageSquareText, Trash2, Eye, CheckCircle, AlertTriangle, X, ShieldAlert, Loader2, Search } from 'lucide-react';

interface ComplaintMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export default function AdminComplaintsPage() {
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'super_admin' | 'moderator' | 'user'>('user');
  const [unauthorized, setUnauthorized] = useState(false);

  const [selectedMsg, setSelectedMsg] = useState<ComplaintMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [appMessage, setAppMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      try {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        if (userDocSnap.exists()) {
          const role = userDocSnap.data().role || 'user';
          if (role === 'admin' || role === 'super_admin' || role === 'moderator') {
            setUserRole(role);
            await fetchMessages();
          } else {
            setUnauthorized(true);
          }
        } else {
          setUnauthorized(true);
        }
      } catch (error) {
        console.error("Error checking role:", error);
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchMessages = async () => {
    try {
      let querySnapshot;
      try {
        const q = query(collection(db, 'complaints_messages'), orderBy('createdAt', 'desc'));
        querySnapshot = await getDocs(q);
      } catch (orderErr) {
        // Fallback في حال عدم وجود Index للترتيب
        querySnapshot = await getDocs(collection(db, 'complaints_messages'));
      }

      const list: ComplaintMessage[] = [];
      querySnapshot.forEach((document) => {
        const data = document.data();
        list.push({
          id: document.id,
          name: data.name || 'بدون اسم',
          phone: data.phone || 'غير محدد',
          email: data.email || 'بدون بريد',
          message: data.message || 'لا توجد رسالة',
          userId: data.userId || 'anonymous',
          status: data.status || 'new',
          createdAt: data.createdAt?.seconds 
            ? new Date(data.createdAt.seconds * 1000).toLocaleString('ar-EG') 
            : 'حديث',
          ...data
        });
      });

      setMessages(list);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setAppMessage({ text: 'حدث خطأ أثناء جلب الشكاوى والرسائل.', type: 'error' });
    }
  };

  const toggleStatus = async (id: string, currentStatus?: string) => {
    try {
      const newStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
      await updateDoc(doc(db, 'complaints_messages', id), { status: newStatus });
      setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
      setAppMessage({ text: 'تم تحديث حالة الرسالة بنجاح.', type: 'success' });
      setTimeout(() => setAppMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setAppMessage({ text: 'فشل تحديث الحالة بسبب الصلاحيات.', type: 'error' });
      setTimeout(() => setAppMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      setAppMessage({ text: 'عذراً، صلاحية الحذف مقتصرة على الأدمن فقط!', type: 'error' });
      setTimeout(() => setAppMessage(null), 3000);
      setDeleteId(null);
      return;
    }

    try {
      await deleteDoc(doc(db, 'complaints_messages', id));
      setMessages(messages.filter(m => m.id !== id));
      setAppMessage({ text: 'تم حذف الرسالة بنجاح.', type: 'success' });
      setTimeout(() => setAppMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setAppMessage({ text: 'فشل حذف الرسالة.', type: 'error' });
      setTimeout(() => setAppMessage(null), 3000);
    }
    setDeleteId(null);
  };

  const filteredMessages = messages.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[var(--background)]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-[var(--background)] text-[var(--foreground)]">
        <ShieldAlert size={64} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">هذه الصفحة مخصصة للأدمن والمشرفين فقط.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--background)] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-3">
            <MessageSquareText size={32} />
            إدارة الشكاوى والمقترحات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {userRole === 'admin' || userRole === 'super_admin' ? 'صلاحيات كاملة (عرض، تحديث الحالة، وحذف)' : 'صلاحيات متابعة (عرض وتحديث الحالة)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث بالاسم، الهاتف، المحتوى..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
          <div className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold border border-blue-200 dark:border-blue-800 shrink-0">
            الرسائل: <span className="font-black">{messages.length}</span>
          </div>
        </div>
      </div>

      {appMessage && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          appMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-600 text-white shadow-md'
        }`}>
          {appMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {appMessage.text}
        </div>
      )}

      <div className="bg-[var(--background)] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 md:px-6">المُرسل</th>
                <th className="p-4 md:px-6">محتوى الرسالة</th>
                <th className="p-4 md:px-6">الحالة</th>
                <th className="p-4 md:px-6">تاريخ الإرسال</th>
                <th className="p-4 md:px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 font-bold">
                    لا توجد رسائل أو شكاوى حتى الآن.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 md:px-6 font-bold text-[var(--foreground)]">
                      <div>{msg.name}</div>
                      <div className="text-xs text-gray-400 font-normal" dir="ltr">{msg.phone}</div>
                    </td>
                    <td className="p-4 md:px-6 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {msg.message}
                    </td>
                    <td className="p-4 md:px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                        msg.status === 'resolved' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {msg.status === 'resolved' ? 'تم الحل / المتابعة' : 'رسالة جديدة'}
                      </span>
                    </td>
                    <td className="p-4 md:px-6 text-gray-400 text-xs">
                      {msg.createdAt}
                    </td>
                    <td className="p-4 md:px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedMsg(msg)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
                        title="عرض تفاصيل الرسالة"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => toggleStatus(msg.id, msg.status)}
                        className={`p-2 rounded-xl transition-colors ${
                          msg.status === 'resolved' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                        }`}
                        title={msg.status === 'resolved' ? 'إعادة فتح' : 'تعيين كـ تم الحل'}
                      >
                        <CheckCircle size={16} />
                      </button>
                      {(userRole === 'admin' || userRole === 'super_admin') && (
                        <button
                          onClick={() => setDeleteId(msg.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-xl transition-colors"
                          title="حذف الرسالة (للأدمن فقط)"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal تفاصيل الرسالة */}
      {selectedMsg && (
        <div onClick={() => setSelectedMsg(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedMsg(null)} className="absolute top-4 left-4 text-gray-400 hover:text-[var(--foreground)] transition-colors p-1">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-lg border-b pb-3 border-gray-100 dark:border-gray-800">
              <MessageSquareText size={22} />
              <span>تفاصيل الشكوى أو المقترح</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <div>
                  <span className="text-gray-400 text-xs block">اسم المُرسل:</span>
                  <span className="font-bold text-[var(--foreground)]">{selectedMsg.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">رقم الهاتف:</span>
                  <span className="font-bold text-[var(--foreground)]" dir="ltr">{selectedMsg.phone}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <span className="text-gray-400 text-xs block">البريد الإلكتروني:</span>
                <span className="font-bold text-[var(--foreground)]" dir="ltr">{selectedMsg.email}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                <span className="text-gray-400 text-xs block mb-1">نص الرسالة:</span>
                <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{selectedMsg.message}</p>
              </div>

              <div className="text-xs text-gray-400 pt-2 text-left">
                تاريخ الإرسال: {selectedMsg.createdAt}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedMsg(null)} className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all">
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
              هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟
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