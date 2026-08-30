'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Calendar, Trash2, Edit3, PlusCircle, Image as ImageIcon, X } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  titleEn?: string;
  desc?: string;
  descEn?: string;
  date: string;
  location: string;
  locationEn?: string;
  image?: string;
  slug?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState({ 
    title: '', 
    titleEn: '', 
    desc: '', 
    descEn: '', 
    date: '', 
    location: '', 
    locationEn: '', 
    image: '', 
    slug: '' 
  });
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(db, 'events'));
      const list: EventItem[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as EventItem));
      setEvents(list);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      if (err?.code === 'permission-denied') {
        setMessage('خطأ في الصلاحيات: يرجى التحقق من قواعد الأمان (Firestore Rules) الخاصة بـ Firebase.');
      }
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setLoading(true);

    try {
      const generatedSlug = form.slug.trim() || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      
      const eventData = {
        title: form.title,
        titleEn: form.titleEn || '',
        desc: form.desc || '',
        descEn: form.descEn || '',
        date: form.date,
        location: form.location,
        locationEn: form.locationEn || '',
        image: form.image || '',
        slug: generatedSlug,
      };

      if (editingId) {
        await updateDoc(doc(db, 'events', editingId), eventData);
        setMessage('تم تعديل الحدث بنجاح! 🎯');
      } else {
        await addDoc(collection(db, 'events'), { 
          ...eventData, 
          createdAt: serverTimestamp() 
        });
        setMessage('تم إضافة الحدث بنجاح! 🚀');
      }

      resetForm();
      fetchEvents();
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      console.error("Error saving event:", err);
      if (err?.code === 'permission-denied') {
        alert('حدث خطأ: ليس لديك صلاحية الكتابة في قاعدة البيانات (حقق من Firebase Security Rules).');
      } else {
        alert('حدث خطأ أثناء حفظ الحدث.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || '',
      titleEn: ev.titleEn || '',
      desc: ev.desc || '',
      descEn: ev.descEn || '',
      date: ev.date || '',
      location: ev.location || '',
      locationEn: ev.locationEn || '',
      image: ev.image || '',
      slug: ev.slug || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', titleEn: '', desc: '', descEn: '', date: '', location: '', locationEn: '', image: '', slug: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحدث نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
    } catch (err: any) {
      console.error("Error deleting event:", err);
      if (err?.code === 'permission-denied') {
        alert('خطأ في الصلاحيات: لا يمكنك حذف المستند بسبب قواعد الأمان في فايربيس.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-6" dir="rtl">
      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span>إدارة الأحداث والصيانة المجدولة</span> <Calendar className="text-secondary" />
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
          تابع مواعيد المعارض، المؤتمرات، أو فترات الصيانة الدورية ودعم اللغات بكل سهولة.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold shadow-sm border ${message.includes('خطأ') ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors relative">
        {editingId && (
          <button 
            type="button"
            onClick={resetForm}
            className="absolute top-6 left-6 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
          >
            <X size={14} /> إلغاء التعديل
          </button>
        )}

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
          <PlusCircle className="text-secondary" /> {editingId ? "تعديل الحدث الحالي" : "إضافة حدث جديد"}
        </h2>
        
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">عنوان الحدث (عربي)</label>
            <input type="text" placeholder="مثال: مؤتمر تنقية المياه السنوي" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">عنوان الحدث (إنجليزي - Title En)</label>
            <input type="text" placeholder="Example: Annual Water Purification Conference" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">تاريخ الحدث</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">الرابط المختصر (Slug) - اختياري</label>
            <input type="text" placeholder="event-slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">المكان / الفرع (عربي)</label>
            <input type="text" placeholder="مثال: فرع طنطا الرئيسي" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">المكان / الفرع (إنجليزي - Location En)</label>
            <input type="text" placeholder="Example: Tanta Main Branch" value={form.locationEn} onChange={e => setForm({...form, locationEn: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">وصف تفصيلي (عربي)</label>
            <textarea placeholder="تفاصيل الحدث بالعربية..." value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium min-h-[90px] w-full"></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">وصف تفصيلي (إنجليزي - Desc En)</label>
            <textarea placeholder="Detailed description in English..." value={form.descEn} onChange={e => setForm({...form, descEn: e.target.value})} className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium min-h-[90px] w-full"></textarea>
          </div>

          <div className="space-y-3 md:col-span-2 bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
              <ImageIcon size={16} /> صورة الحدث / بانر (اختياري)
            </label>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800 dark:text-gray-200">
                <input type="radio" name="imgTypeEv" checked={imageInputType === 'url'} onChange={() => setImageInputType('url')} /> لصق رابط صورة (URL)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800 dark:text-gray-200">
                <input type="radio" name="imgTypeEv" checked={imageInputType === 'file'} onChange={() => setImageInputType('file')} /> رفع من الجهاز
              </label>
            </div>

            {imageInputType === 'url' ? (
              <input type="text" placeholder="https://example.com/event.jpg" value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} className="p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
            ) : (
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setForm({...form, image: reader.result as string});
                  reader.readAsDataURL(file);
                }
              }} className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
            )}
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 bg-secondary text-white font-bold py-4 rounded-xl hover:opacity-90 transition shadow-md cursor-pointer disabled:bg-gray-400">
            {loading ? "جاري الحفظ..." : (editingId ? "تحديث الحدث 🛠️" : "حفظ وإطلاق الحدث 🚀")}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-xs font-bold border-b dark:border-gray-800">
                <th className="p-4">الحدث (عربي / إنجليزي)</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">المكان</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">لا توجد فعاليات مضافة حالياً.</td>
                </tr>
              ) : (
                events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-secondary"/> 
                        <span>{ev.title}</span>
                      </div>
                      {ev.titleEn && <div className="text-xs text-gray-400 font-normal mt-0.5">{ev.titleEn}</div>}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{ev.date}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">
                      <div>{ev.location}</div>
                      {ev.locationEn && <div className="text-xs opacity-75">{ev.locationEn}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => handleEdit(ev)} className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition cursor-pointer" title="تعديل">
                          <Edit3 size={16}/>
                        </button>
                        <button type="button" onClick={() => handleDelete(ev.id)} className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition cursor-pointer" title="حذف">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}