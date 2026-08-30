'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Wrench, Calendar, Tag, Mail, MessageSquare, Briefcase,
  Trash2, Eye, CheckCircle, AlertTriangle, X, ShieldAlert, Loader2, Search, Layers, Edit3, Save 
} from 'lucide-react';

interface GenericItem {
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  message?: string;
  status?: string;
  adminNotes?: string;
  createdAtText?: string;
  [key: string]: any;
}

export default function UnifiedAdminMessagesPage() {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'complaints' | 'jobs' | 'contact' | 'events' | 'offers'>('maintenance');
  
  const [dataList, setDataList] = useState<GenericItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'super_admin' | 'moderator' | 'user'>('user');
  const [unauthorized, setUnauthorized] = useState(false);

  const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [appMessage, setAppMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const collectionsMap = {
    maintenance: 'maintenance_requests',
    complaints: 'complaints',
    jobs: 'job_applications',
    contact: 'contact_messages',
    events: 'event_bookings',
    offers: 'offer_requests'
  };

  const tabsConfig = [
    { key: 'maintenance', label: 'طلبات الصيانة', icon: Wrench, color: 'text-blue-500' },
    { key: 'complaints', label: 'الشكاوى والاقتراحات', icon: MessageSquare, color: 'text-amber-500' },
    { key: 'jobs', label: 'الوظائف', icon: Briefcase, color: 'text-cyan-500' },
    { key: 'contact', label: 'تواصل معنا', icon: Mail, color: 'text-emerald-500' },
    { key: 'events', label: 'الأحداث', icon: Calendar, color: 'text-indigo-500' },
    { key: 'offers', label: 'العروض', icon: Tag, color: 'text-purple-500' },
  ];

  const parseDateSafely = (timestamp: any): string => {
    if (!timestamp) return 'غير محدد';
    if (typeof timestamp === 'string') return timestamp;
    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleString('ar-EG');
    
    if (typeof timestamp === 'object' && timestamp !== null) {
      if (typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000).toLocaleString('ar-EG');
      }
      if (typeof timestamp.toDate === 'function') {
        try {
          return timestamp.toDate().toLocaleString('ar-EG');
        } catch (e) {
          // pass
        }
      }
    }
    return 'غير محدد';
  };

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
            await fetchTabData(activeTab);
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
  }, [activeTab]);

  const fetchTabData = async (tabKey: keyof typeof collectionsMap) => {
    setLoading(true);
    const colName = collectionsMap[tabKey];
    try {
      const querySnapshot = await getDocs(collection(db, colName));

      const list: GenericItem[] = [];
      querySnapshot.forEach((document) => {
        const data = document.data();

        list.push({
          id: document.id,
          name: data.name || data.fullName || data.applicantName || 'بدون اسم',
          phone: data.phone || data.phoneNumber || data.mobile || 'غير محدد',
          address: data.address || data.location || data.city || 'غير محدد',
          email: data.email || data.mail || 'بدون بريد',
          message: data.message || data.note || data.details || data.coverLetter || 'لا توجد تفاصيل',
          status: data.status || 'new',
          adminNotes: data.adminNotes || '',
          createdAtText: parseDateSafely(data.createdAt || data.date || data.timestamp),
          ...data
        });
      });

      setDataList(list);
    } catch (err) {
      console.error(`Error fetching data for ${tabKey}:`, err);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  // تعديل الانتقال الدقيق والمباشر بين new و resolved
  const toggleStatus = async (id: string, currentStatus?: string) => {
    const colName = collectionsMap[activeTab];
    try {
      // لو الحالة الحالية new نحولها إلى resolved والعكس صحيح بدقة
      const nextStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
      
      await updateDoc(doc(db, colName, id), { status: nextStatus });
      setDataList(dataList.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      setAppMessage({ text: `تم تحديث الحالة إلى (${nextStatus === 'resolved' ? 'مكتمل / تمت المتابعة' : 'جديد'}) بنجاح.`, type: 'success' });
      setTimeout(() => setAppMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setAppMessage({ text: 'فشل تحديث الحالة بسبب الصلاحيات.', type: 'error' });
      setTimeout(() => setAppMessage(null), 3000);
    }
  };

  const saveNote = async (id: string) => {
    const colName = collectionsMap[activeTab];
    try {
      await updateDoc(doc(db, colName, id), { adminNotes: tempNoteText });
      setDataList(dataList.map(item => item.id === id ? { ...item, adminNotes: tempNoteText } : item));
      setEditingNoteId(null);
      setAppMessage({ text: 'تم حفظ الملاحظة بنجاح.', type: 'success' });
      setTimeout(() => setAppMessage(null), 3000);
    } catch (error) {
      console.error("Error saving note:", error);
      setAppMessage({ text: 'فشل حفظ الملاحظة.', type: 'error' });
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

    const colName = collectionsMap[activeTab];
    try {
      await deleteDoc(doc(db, colName, id));
      setDataList(dataList.filter(item => item.id !== id));
      setAppMessage({ text: 'تم حذف العنصر بنجاح.', type: 'success' });
      setTimeout(() => setAppMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setAppMessage({ text: 'فشل حذف العنصر.', type: 'error' });
      setTimeout(() => setAppMessage(null), 3000);
    }
    setDeleteId(null);
  };

  const filteredData = dataList.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm) ||
    item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-background text-foreground">
        <ShieldAlert size={64} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-muted-foreground mt-2">هذه الصفحة مخصصة للأدمن والمشرفين فقط.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative p-3 sm:p-4 md:p-6 overflow-x-hidden bg-background text-foreground min-h-screen transition-colors duration-200" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-3">
            <Layers size={28} />
            إدارة الطلبات والرسائل الموحدة
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {userRole === 'admin' || userRole === 'super_admin' ? 'صلاحيات كاملة (عرض، تحديث، ملاحظات، حذف)' : 'صلاحيات متابعة وتحديث وملاحظات'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="بحث شامل..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-blue-500 text-xs transition-colors"
            />
          </div>
          <div className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold border border-blue-200 dark:border-blue-800 text-center shrink-0">
            العدد: <span className="font-black">{dataList.length}</span>
          </div>
        </div>
      </div>

      {/* التابات الستة */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer border ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                  : 'bg-card text-card-foreground border-border hover:border-blue-400'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {appMessage && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          appMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-600 text-white shadow-md'
        }`}>
          {appMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {appMessage.text}
        </div>
      )}

      {/* الجدول المحتوى */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider bg-muted/50">
                  <th className="p-4">المرسل / العميل</th>
                  <th className="p-4">التفاصيل المختصرة</th>
                  <th className="p-4">ملاحظات المتابعة (الإدارة)</th>
                  <th className="p-4">الحالة والتاريخ</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground font-bold">
                      لا توجد بيانات مطابقة في هذا القسم حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-normal" dir="ltr">{item.phone}</div>
                        <div className="text-[11px] text-muted-foreground font-normal">{item.email}</div>
                      </td>
                      
                      <td className="p-4 text-muted-foreground max-w-xs">
                        <p className="text-xs truncate">{item.message}</p>
                      </td>

                      {/* عمود الملاحظات للإدارة */}
                      <td className="p-4 max-w-xs">
                        {editingNoteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="اكتب ملاحظة..."
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-background text-foreground outline-none"
                            />
                            <button onClick={() => saveNote(item.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingNoteId(null)} className="p-1.5 bg-secondary text-secondary-foreground rounded-lg">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => { setEditingNoteId(item.id); setTempNoteText(item.adminNotes || ''); }}
                            className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer border border-transparent hover:border-blue-200 transition-all text-xs"
                          >
                            <span className="text-muted-foreground truncate">
                              {item.adminNotes || <span className="text-muted-foreground/60 italic">انقر لإضافة ملاحظة إدارية...</span>}
                            </span>
                            <Edit3 size={13} className="text-muted-foreground group-hover:text-blue-500 shrink-0" />
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold mb-1 ${
                          item.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {item.status === 'resolved' ? 'مكتمل / تمت المتابعة' : 'جديد'}
                        </span>
                        <div className="text-[11px] text-muted-foreground">{item.createdAtText}</div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl transition-colors cursor-pointer"
                            title="عرض التفاصيل كاملة"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => toggleStatus(item.id, item.status)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              item.status === 'resolved'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' 
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                            }`}
                            title="تبديل الحالة بين جديد ومكتمل"
                          >
                            <CheckCircle size={16} />
                          </button>
                          {(userRole === 'admin' || userRole === 'super_admin') && (
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                              title="حذف نهائي"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة عرض التفاصيل الكاملة */}
      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-neutral-900 border border-neutral-700 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 left-4 text-neutral-400 hover:text-white p-1 cursor-pointer">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-blue-400 font-black text-lg border-b pb-3 border-neutral-800">
              <Layers size={22} />
              <span>تفاصيل الطلب / الرسالة الكاملة (لوحة التحكم)</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-800 p-3 rounded-2xl">
                <div>
                  <span className="text-neutral-400 text-xs block">اسم العميل:</span>
                  <span className="font-bold text-white">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs block">رقم الهاتف:</span>
                  <span className="font-bold text-white" dir="ltr">{selectedItem.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-800 p-3 rounded-2xl">
                <div>
                  <span className="text-neutral-400 text-xs block">العنوان / الموقع:</span>
                  <span className="font-bold text-white">{selectedItem.address}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs block">البريد الإلكتروني:</span>
                  <span className="font-bold text-white" dir="ltr">{selectedItem.email}</span>
                </div>
              </div>

              <div className="bg-neutral-800 p-3 rounded-2xl">
                <span className="text-neutral-400 text-xs block mb-1">محتوى الرسالة / التفاصيل:</span>
                <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedItem.message}</p>
              </div>

              {selectedItem.adminNotes && (
                <div className="bg-blue-950/40 border border-blue-900 p-3 rounded-2xl">
                  <span className="text-blue-400 text-xs font-bold block mb-1">ملاحظات الإدارة:</span>
                  <p className="text-white text-xs">{selectedItem.adminNotes}</p>
                </div>
              )}

              <div className="text-xs text-neutral-400 pt-2 text-left">
                التاريخ: {selectedItem.createdAtText}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-neutral-900 border border-neutral-700 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4" dir="rtl">
            <div className="flex items-center gap-3 text-rose-500 font-black text-lg">
              <AlertTriangle size={24} />
              <span>تأكيد الحذف النهائي</span>
            </div>
            <p className="text-sm text-neutral-300">
              هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً من قاعدة البيانات؟
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-200 cursor-pointer">
                إغلاق
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}