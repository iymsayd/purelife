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
  userId?: string | null;
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
    maintenance: ['maintenance_requests', 'maintenance'],
    complaints: ['complaints', 'suggestions'],
    jobs: ['job_applications', 'jobs', 'careers'],
    contact: ['contact_messages', 'contact', 'messages'],
    events: ['event_bookings', 'events', 'eventRequests'],
    offers: ['offer_requests', 'offers', 'offerRequests']
  };

  const tabsConfig = [
    { key: 'maintenance', label: 'طلبات الصيانة', icon: Wrench },
    { key: 'complaints', label: 'الشكاوى والاقتراحات', icon: MessageSquare },
    { key: 'jobs', label: 'الوظائف', icon: Briefcase },
    { key: 'contact', label: 'تواصل معنا', icon: Mail },
    { key: 'events', label: 'الأحداث', icon: Calendar },
    { key: 'offers', label: 'العروض', icon: Tag },
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
        } catch (e) {}
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
    const possibleCols = collectionsMap[tabKey];
    try {
      let list: GenericItem[] = [];
      const processedIds = new Set<string>();

      for (const colName of possibleCols) {
        try {
          const querySnapshot = await getDocs(collection(db, colName));
          querySnapshot.forEach((document) => {
            if (processedIds.has(document.id)) return;
            processedIds.add(document.id);

            const data = document.data();
            
            if (data.slug || (data.image && typeof data.image === 'string' && data.image.startsWith('data:image')) || (tabKey === 'events' && !data.message && !data.phone && data.title && !data.userId)) {
              return;
            }

            list.push({
              id: document.id,
              name: data.name || data.fullName || data.applicantName || data.userName || 'بدون اسم',
              phone: data.phone || data.phoneNumber || data.mobile || 'غير محدد',
              address: data.address || data.location || data.city || 'غير محدد',
              email: data.email || data.mail || 'بدون بريد',
              message: data.message || data.note || data.details || data.coverLetter || data.description || data.desc || 'لا توجد تفاصيل',
              status: data.status === 'resolved' || data.status === 'مكتمل' ? 'resolved' : 'new',
              adminNotes: data.adminNotes || '',
              createdAtText: parseDateSafely(data.createdAt || data.date || data.timestamp),
              userId: data.userId || data.uid || null,
              ...data
            });
          });
        } catch (err) {}
      }

      setDataList(list);
    } catch (err) {
      console.error(`Error fetching data for ${tabKey}:`, err);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus?: string) => {
    const possibleCols = collectionsMap[activeTab];
    try {
      const nextStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
      for (const colName of possibleCols) {
        try {
          await updateDoc(doc(db, colName, id), { status: nextStatus });
          break;
        } catch (e) {}
      }

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
    const possibleCols = collectionsMap[activeTab];
    try {
      for (const colName of possibleCols) {
        try {
          await updateDoc(doc(db, colName, id), { adminNotes: tempNoteText });
          break;
        } catch (e) {}
      }
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

    const possibleCols = collectionsMap[activeTab];
    try {
      for (const colName of possibleCols) {
        try {
          await deleteDoc(doc(db, colName, id));
        } catch (e) {}
      }
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

  const renderTabSpecificDetails = (item: GenericItem) => {
    const hiddenKeys = ['id', 'name', 'fullName', 'applicantName', 'userName', 'phone', 'phoneNumber', 'mobile', 'address', 'location', 'city', 'email', 'mail', 'message', 'note', 'details', 'coverLetter', 'description', 'desc', 'status', 'adminNotes', 'createdAt', 'date', 'timestamp', 'userId', 'uid', 'type', 'createdAtText'];
    const extraEntries = Object.entries(item).filter(([key, val]) => !hiddenKeys.includes(key) && val !== null && val !== undefined && val !== '');

    return (
      <div className="space-y-2.5 text-xs divide-y divide-border/40">
        {item.deviceType && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">نوع الجهاز / الخدمة:</span> <span className="text-foreground font-bold">{item.deviceType}</span></div>}
        {item.jobTitle && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">المسمى الوظيفي المطلوب:</span> <span className="text-foreground font-bold">{item.jobTitle}</span></div>}
        {item.experienceYears && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">سنوات الخبرة:</span> <span className="text-foreground font-bold">{item.experienceYears}</span></div>}
        {item.cvLink && <div className="pt-2.5 first:pt-0 flex justify-between items-center"><span className="text-muted-foreground">السيرة الذاتية:</span> <a href={item.cvLink} target="_blank" rel="noreferrer" className="text-secondary hover:underline font-bold">عرض الملف (CV)</a></div>}
        {item.eventTitle && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">اسم الفعالية / الحدث:</span> <span className="text-foreground font-bold">{item.eventTitle}</span></div>}
        {item.ticketsCount && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">عدد التذاكر:</span> <span className="text-foreground font-bold">{item.ticketsCount}</span></div>}
        {item.offerName && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">العرض المختار:</span> <span className="text-foreground font-bold">{item.offerName}</span></div>}
        {item.budget && <div className="pt-2.5 first:pt-0 flex justify-between"><span className="text-muted-foreground">الميزانية المقدرة:</span> <span className="text-foreground font-bold">{item.budget}</span></div>}

        {extraEntries.map(([key, val]) => {
          if (['deviceType', 'jobTitle', 'experienceYears', 'cvLink', 'eventTitle', 'ticketsCount', 'offerName', 'budget'].includes(key)) return null;
          let displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return (
            <div key={key} className="flex items-center justify-between pt-2.5">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-semibold text-foreground text-left max-w-[60%] truncate">{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-background text-foreground">
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 mb-4 text-rose-600 dark:text-rose-400">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-muted-foreground mt-2 text-sm">هذه الصفحة مخصصة للأدمن والمشرفين فقط.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative p-4 sm:p-6 md:p-8 overflow-x-hidden bg-background text-foreground min-h-screen transition-colors duration-300" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-secondary/15 text-secondary border border-secondary/30 shadow-inner">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-secondary">
              إدارة الطلبات والرسائل الموحدة
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {userRole === 'admin' || userRole === 'super_admin' ? 'صلاحيات كاملة لإدارة الطلبات (عرض، تحديث، ملاحظات، حذف)' : 'صلاحيات متابعة وتحديث وملاحظات'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="بحث شامل بالاسم، الهاتف، البريد..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-border bg-background text-foreground outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-xs transition-all shadow-xs"
            />
          </div>
          <div className="text-xs bg-muted/60 text-foreground px-4 py-2.5 rounded-2xl font-bold border border-border text-center shrink-0 flex items-center justify-center gap-2">
            <span className="text-muted-foreground">الإجمالي:</span> 
            <span className="font-black text-secondary">{dataList.length}</span>
          </div>
        </div>
      </div>

      {/* التابات (Tabs) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSearchTerm(''); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer border ${
                isActive 
                  ? 'bg-secondary text-secondary-foreground border-secondary shadow-md shadow-secondary/25 scale-[1.03]' 
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-secondary-foreground' : 'text-muted-foreground'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* تنبيهات التطبيق */}
      {appMessage && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${
          appMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {appMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{appMessage.text}</span>
        </div>
      )}

      {/* جدول البيانات */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-secondary" size={40} />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider bg-muted/40">
                  <th className="p-4.5">المرسل / العميل</th>
                  <th className="p-4.5">نوع المُرسل</th>
                  <th className="p-4.5">ملاحظات العميل</th>
                  <th className="p-4.5">ملاحظات الإدارة</th>
                  <th className="p-4.5">الحالة والتاريخ</th>
                  <th className="p-4.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground font-medium text-sm">
                      لا توجد بيانات مطابقة في هذا القسم حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4.5 align-middle">
                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{item.phone}</div>
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5">{item.email}</div>
                      </td>
                      
                      <td className="p-4.5 align-middle">
                        {item.userId ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            عضو مسجل
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            زائر
                          </span>
                        )}
                      </td>

                      <td className="p-4.5 align-middle max-w-xs">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.message}</p>
                      </td>

                      <td className="p-4.5 align-middle max-w-xs">
                        {editingNoteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="اكتب ملاحظة..."
                              className="w-full text-xs px-3 py-2 rounded-xl border border-secondary bg-background text-foreground outline-none shadow-xs"
                            />
                            <button onClick={() => saveNote(item.id)} className="p-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 cursor-pointer transition-opacity shadow-xs">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingNoteId(null)} className="p-2 bg-muted text-foreground hover:bg-muted/80 rounded-xl cursor-pointer transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => { setEditingNoteId(item.id); setTempNoteText(item.adminNotes || ''); }}
                            className="group/note flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/50 hover:bg-secondary/10 cursor-pointer border border-border/60 hover:border-secondary/30 transition-all text-xs"
                          >
                            <span className="text-muted-foreground truncate">
                              {item.adminNotes || <span className="text-muted-foreground/50 italic">انقر لإضافة ملاحظة إدارية...</span>}
                            </span>
                            <Edit3 size={13} className="text-muted-foreground group-hover/note:text-secondary shrink-0 transition-colors" />
                          </div>
                        )}
                      </td>

                      <td className="p-4.5 align-middle">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold mb-1.5 ${
                          item.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.status === 'resolved' ? 'مكتمل / تمت المتابعة' : 'جديد'}
                        </span>
                        <div className="text-[11px] text-muted-foreground">{item.createdAtText}</div>
                      </td>

                      <td className="p-4.5 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2.5 bg-muted hover:bg-secondary hover:text-secondary-foreground text-foreground rounded-2xl transition-all cursor-pointer shadow-xs border border-border"
                            title="عرض التفاصيل كاملة"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => toggleStatus(item.id, item.status)}
                            className={`p-2.5 rounded-2xl transition-all cursor-pointer border ${
                              item.status === 'resolved'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                            title="تبديل الحالة بين جديد ومكتمل"
                          >
                            <CheckCircle size={15} />
                          </button>
                          {(userRole === 'admin' || userRole === 'super_admin') && (
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl transition-all cursor-pointer"
                              title="حذف نهائي"
                            >
                              <Trash2 size={15} />
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

      {/* نافذة التفاصيل (Modal) */}
      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border text-foreground rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" dir="rtl">
            <button onClick={() => setSelectedItem(null)} className="absolute top-5 left-5 text-muted-foreground hover:text-foreground p-1.5 rounded-xl bg-muted/60 transition-colors cursor-pointer">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-foreground font-black text-lg border-b border-border pb-4">
              <span className="p-2.5 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 shadow-xs">
                <Layers size={20} />
              </span>
              <span>تفاصيل الطلب / الرسالة الكاملة</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-muted/50 border border-border/60 p-3.5 rounded-2xl flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-bold">نوع المُرسل:</span>
                <span className={`text-xs font-black px-3.5 py-1 rounded-xl border ${
                  selectedItem.userId ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {selectedItem.userId ? 'عضو مسجل' : 'زائر'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/50 border border-border/60 p-3.5 rounded-2xl">
                <div>
                  <span className="text-muted-foreground text-[11px] font-bold block mb-1">اسم العميل:</span>
                  <span className="font-bold text-foreground">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] font-bold block mb-1">رقم الهاتف:</span>
                  <span className="font-bold text-foreground" dir="ltr">{selectedItem.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/50 border border-border/60 p-3.5 rounded-2xl">
                <div>
                  <span className="text-muted-foreground text-[11px] font-bold block mb-1">العنوان / الموقع:</span>
                  <span className="font-bold text-foreground">{selectedItem.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] font-bold block mb-1">البريد الإلكتروني:</span>
                  <span className="font-bold text-foreground" dir="ltr">{selectedItem.email}</span>
                </div>
              </div>

              <div className="bg-muted/50 border border-border/60 p-3.5 rounded-2xl">
                <span className="text-muted-foreground text-xs font-bold block mb-2">محتوى الرسالة / التفاصيل الأساسية:</span>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{selectedItem.message}</p>
              </div>

              <div className="bg-muted/80 border border-border p-3.5 rounded-2xl space-y-2">
                <span className="text-secondary text-xs font-bold block mb-2">خيارات وبيانات إضافية:</span>
                {renderTabSpecificDetails(selectedItem)}
              </div>

              {selectedItem.adminNotes && (
                <div className="bg-secondary/10 border border-secondary/20 p-3.5 rounded-2xl">
                  <span className="text-secondary text-xs font-bold block mb-1">ملاحظات الإدارة:</span>
                  <p className="text-foreground text-xs leading-relaxed">{selectedItem.adminNotes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-1 text-left font-medium">
                تاريخ الإنشاء: {selectedItem.createdAtText}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button onClick={() => setSelectedItem(null)} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground cursor-pointer shadow-sm transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف (Modal) */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border text-foreground rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 font-black text-lg">
              <div className="p-2 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle size={22} />
              </div>
              <span>تأكيد الحذف النهائي</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors">
                إغلاق
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm transition-colors">
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}