'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Tag, Trash2, Edit3, PlusCircle, Sparkles, Image as ImageIcon, X } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  titleEn?: string;
  desc?: string;
  descEn?: string;
  discount: string;
  code: string;
  image?: string;
  slug?: string;
  active: boolean;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState({ 
    title: '', 
    titleEn: '', 
    desc: '', 
    descEn: '', 
    discount: '', 
    code: '', 
    image: '', 
    slug: '' 
  });
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const snap = await getDocs(collection(db, 'offers'));
      const list: Offer[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Offer));
      setOffers(list);
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.discount) return;
    setLoading(true);

    try {
      const generatedSlug = form.slug.trim() || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      
      const offerData = {
        ...form,
        slug: generatedSlug,
        active: true,
      };

      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), offerData);
        setMessage('تم تعديل العرض بنجاح! 🎯');
      } else {
        await addDoc(collection(db, 'offers'), { 
          ...offerData, 
          createdAt: serverTimestamp() 
        });
        setMessage('تم إضافة العرض بنجاح وشهادة الإطلاق جاهزة! 🚀');
      }

      resetForm();
      fetchOffers();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error("Error saving offer:", err);
      alert('حدث خطأ أثناء حفظ العرض.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title || '',
      titleEn: offer.titleEn || '',
      desc: offer.desc || '',
      descEn: offer.descEn || '',
      discount: offer.discount || '',
      code: offer.code || '',
      image: offer.image || '',
      slug: offer.slug || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', titleEn: '', desc: '', descEn: '', discount: '', code: '', image: '', slug: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العرض نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      setOffers(offers.filter(o => o.id !== id));
    } catch (err) {
      console.error("Error deleting offer:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span>إدارة العروض والخصومات</span> <Tag className="text-secondary" />
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
          تحكم في العروض الترويجية والخصومات والباقات ودعم اللغات (عربي / إنجليزي) بكل سهولة.
        </p>
      </div>

      {message && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-2xl text-sm font-bold shadow-sm">
          {message}
        </div>
      )}

      {/* نموذج الإضافة أو التعديل */}
      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors relative">
        {editingId && (
          <button 
            onClick={resetForm}
            className="absolute top-6 left-6 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
          >
            <X size={14} /> إلغاء التعديل
          </button>
        )}

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
          <PlusCircle className="text-secondary" /> {editingId ? "تعديل العرض الحالي" : "إضافة عرض جديد"}
        </h2>
        
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* العنوان بالعربي */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">عنوان العرض (بالعربي)</label>
            <input 
              type="text" 
              placeholder="مثال: عرض فلتر المياه الشامل" 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" 
              required 
            />
          </div>

          {/* العنوان بالإنجليزي */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">عنوان العرض (بالإنجليزي - Title En)</label>
            <input 
              type="text" 
              placeholder="Example: Comprehensive Water Filter Offer" 
              value={form.titleEn} 
              onChange={e => setForm({...form, titleEn: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" 
            />
          </div>

          {/* قيمة الخصم */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">قيمة الخصم</label>
            <input 
              type="text" 
              placeholder="مثال: 20% أو 250 ج.م" 
              value={form.discount} 
              onChange={e => setForm({...form, discount: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" 
              required 
            />
          </div>

          {/* كود الخصم */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">كود الخصم</label>
            <input 
              type="text" 
              placeholder="مثال: PURE20" 
              value={form.code} 
              onChange={e => setForm({...form, code: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" 
              required 
            />
          </div>

          {/* الرابط المختصر */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">الرابط المختصر (Slug) - اختياري</label>
            <input 
              type="text" 
              placeholder="offer-slug" 
              value={form.slug} 
              onChange={e => setForm({...form, slug: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium w-full" 
            />
          </div>
          
          {/* الوصف بالعربي */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">وصف تفصيلي للعرض (بالعربي)</label>
            <textarea 
              placeholder="اكتب تفاصيل العرض بالعربية..." 
              value={form.desc} 
              onChange={e => setForm({...form, desc: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium min-h-[100px] w-full" 
              required
            ></textarea>
          </div>

          {/* الوصف بالإنجليزي */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">وصف تفصيلي للعرض (بالإنجليزي - Desc En)</label>
            <textarea 
              placeholder="Write detailed description in English..." 
              value={form.descEn} 
              onChange={e => setForm({...form, descEn: e.target.value})} 
              className="p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none text-gray-900 dark:text-white font-medium min-h-[100px] w-full" 
            ></textarea>
          </div>

          {/* خيارات إدخال الصورة */}
          <div className="space-y-3 md:col-span-2 bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
              <ImageIcon size={16} /> بانر أو صورة العرض (اختياري)
            </label>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800 dark:text-gray-200">
                <input type="radio" name="imgType" checked={imageInputType === 'url'} onChange={() => setImageInputType('url')} /> لصق رابط صورة (URL)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-800 dark:text-gray-200">
                <input type="radio" name="imgType" checked={imageInputType === 'file'} onChange={() => setImageInputType('file')} /> رفع من الجهاز
              </label>
            </div>

            {imageInputType === 'url' ? (
              <input 
                type="text" 
                placeholder="https://example.com/banner.jpg" 
                value={form.image} 
                onChange={e => setForm({...form, image: e.target.value})} 
                className="p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
              />
            ) : (
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setForm({...form, image: reader.result as string});
                    reader.readAsDataURL(file);
                  }
                }} 
                className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm outline-none w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
              />
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 bg-secondary text-white font-bold py-4 rounded-xl hover:opacity-90 transition shadow-md cursor-pointer disabled:bg-gray-400"
          >
            {loading ? "جاري الحفظ..." : (editingId ? "تحديث العرض 🛠️" : "إطلاق العرض الجديد 🚀")}
          </button>
        </form>
      </div>

      {/* جدول عرض العروض المتاحة */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-xs font-bold border-b dark:border-gray-800">
                <th className="p-4">العرض (عربي / إنجليزي)</th>
                <th className="p-4">قيمة الخصم</th>
                <th className="p-4">الكود</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                    لا توجد عروض مضافة حالياً.
                  </td>
                </tr>
              ) : (
                offers.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-secondary"/> 
                        <span>{o.title}</span>
                      </div>
                      {o.titleEn && <div className="text-xs text-gray-400 font-normal mt-0.5">{o.titleEn}</div>}
                    </td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-bold">{o.discount}</td>
                    <td className="p-4">
                      <span className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 rounded-lg inline-block font-bold">
                        {o.code}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(o)} className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition cursor-pointer" title="تعديل">
                          <Edit3 size={16}/>
                        </button>
                        {/* تم تصحيح الـ Trash2 هنا */}
                        <button onClick={() => handleDelete(o.id)} className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition cursor-pointer" title="حذف">
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