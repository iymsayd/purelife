'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Edit3, PlusCircle, Image as ImageIcon, X } from 'lucide-react';

interface UsedProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  slug: string;
  price: number;
  conditionAr: string;
  conditionEn: string;
  usageDurationAr: string;
  usageDurationEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  isAvailable: boolean;
}

export default function AdminUsedProductsPage() {
  const [products, setProducts] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    categoryAr: '',
    categoryEn: '',
    slug: '',
    price: '',
    conditionAr: 'ممتازة',
    conditionEn: 'Excellent',
    usageDurationAr: 'استعمال خفيف',
    usageDurationEn: 'Light Use',
    descriptionAr: '',
    descriptionEn: '',
    image: '',
    isAvailable: true
  });

  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [message, setMessage] = useState('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const fetchUsedProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'used_products'));
      const list: UsedProduct[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nameAr: data.nameAr || data.title || '',
          nameEn: data.nameEn || '',
          categoryAr: data.categoryAr || data.category || '',
          categoryEn: data.categoryEn || '',
          slug: data.slug || generateSlug(data.nameAr || data.nameEn || 'used-product'),
          price: Number(data.price) || 0,
          conditionAr: data.conditionAr || data.condition || '',
          conditionEn: data.conditionEn || '',
          usageDurationAr: data.usageDurationAr || data.usageDuration || '',
          usageDurationEn: data.usageDurationEn || '',
          descriptionAr: data.descriptionAr || '',
          descriptionEn: data.descriptionEn || '',
          image: data.image || '',
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        });
      });
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsedProducts();
  }, []);

  const handleNameArChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      nameAr: val,
      slug: !editingId ? generateSlug(val) : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.price) return alert('يرجى إدخال اسم المنتج والسعر');

    try {
      const productData = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        categoryAr: form.categoryAr,
        categoryEn: form.categoryEn,
        slug: form.slug || generateSlug(form.nameAr),
        price: Number(form.price),
        conditionAr: form.conditionAr,
        conditionEn: form.conditionEn,
        usageDurationAr: form.usageDurationAr,
        usageDurationEn: form.usageDurationEn,
        descriptionAr: form.descriptionAr,
        descriptionEn: form.descriptionEn,
        image: form.image || '',
        isAvailable: form.isAvailable,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'used_products', editingId), productData);
        setMessage('تم تعديل المنتج المستعمل بنجاح! ✏️');
      } else {
        await addDoc(collection(db, 'used_products'), {
          ...productData,
          createdAt: new Date().toISOString(),
        });
        setMessage('تم إضافة المنتج المستعمل بنجاح! ♻️');
      }

      resetForm();
      fetchUsedProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (p: UsedProduct) => {
    setEditingId(p.id);
    setForm({
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      categoryAr: p.categoryAr,
      categoryEn: p.categoryEn,
      slug: p.slug,
      price: String(p.price),
      conditionAr: p.conditionAr,
      conditionEn: p.conditionEn,
      usageDurationAr: p.usageDurationAr,
      usageDurationEn: p.usageDurationEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      image: p.image || '',
      isAvailable: p.isAvailable,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ 
      nameAr: '', 
      nameEn: '', 
      categoryAr: '',
      categoryEn: '',
      slug: '', 
      price: '', 
      conditionAr: 'ممتازة', 
      conditionEn: 'Excellent', 
      usageDurationAr: 'استعمال خفيف',
      usageDurationEn: 'Light Use',
      descriptionAr: '', 
      descriptionEn: '', 
      image: '',
      isAvailable: true 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteDoc(doc(db, 'used_products', id));
      setProducts(products.filter(p => p.id !== id));
      setMessage('تم الحذف بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-12 text-[var(--muted-foreground)] font-bold">جاري التحميل...</div>;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border)]">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">إدارة المنتجات المستعملة ♻️</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">اعرض الفلاتر والتكييفات المستعملة أو قطع الغيار مع التحكم الكامل في إتاحتها.</p>
      </div>

      {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-xl text-sm font-bold">{message}</div>}

      <div className="bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <PlusCircle className="text-[var(--secondary)]" /> {editingId ? 'تعديل المنتج المستعمل' : 'إضافة منتج مستعمل جديد'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer" type="button">
              <X size={14} /> إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* اسم المنتج بالعربي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">اسم المنتج (عربي)</label>
            <input 
              type="text" 
              placeholder="مثال: فلتر مياه 7 مراحل مستعمل" 
              value={form.nameAr} 
              onChange={e => handleNameArChange(e.target.value)} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              required 
            />
          </div>

          {/* اسم المنتج بالإنجليزي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">Product Name (English)</label>
            <input 
              type="text" 
              placeholder="e.g. Used 7-Stage Water Filter" 
              value={form.nameEn} 
              onChange={e => setForm({...form, nameEn: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              required 
            />
          </div>

          {/* نوع المنتج بالعربي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">نوع المنتج / التصنيف (عربي)</label>
            <input 
              type="text" 
              placeholder="مثال: فلاتر / تكييفات" 
              value={form.categoryAr} 
              onChange={e => setForm({...form, categoryAr: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* نوع المنتج بالإنجليزي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">Product Type / Category (English)</label>
            <input 
              type="text" 
              placeholder="e.g. Water Filters / Air Conditioners" 
              value={form.categoryEn} 
              onChange={e => setForm({...form, categoryEn: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* السعر */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">السعر (ج.م)</label>
            <input 
              type="number" 
              placeholder="مثال: 1500" 
              value={form.price} 
              onChange={e => setForm({...form, price: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              required 
            />
          </div>

          {/* السلاج */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">رابط السلاج (Slug)</label>
            <input 
              type="text" 
              placeholder="slug-url-format" 
              value={form.slug} 
              onChange={e => setForm({...form, slug: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none font-mono text-xs w-full" 
              required 
            />
          </div>

          {/* حالة الجهاز بالعربي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">حالة الجهاز (عربي)</label>
            <input 
              type="text" 
              placeholder="مثال: ممتازة / جيد" 
              value={form.conditionAr} 
              onChange={e => setForm({...form, conditionAr: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* حالة الجهاز بالإنجليزي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">Condition (English)</label>
            <input 
              type="text" 
              placeholder="e.g. Excellent / Good" 
              value={form.conditionEn} 
              onChange={e => setForm({...form, conditionEn: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* مدة الاستعمال بالعربي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">مدة الاستعمال (عربي)</label>
            <input 
              type="text" 
              placeholder="مثال: استعمال خفيف / 6 شهور" 
              value={form.usageDurationAr} 
              onChange={e => setForm({...form, usageDurationAr: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* مدة الاستعمال بالإنجليزي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">Usage Duration (English)</label>
            <input 
              type="text" 
              placeholder="e.g. Light Use / 6 Months" 
              value={form.usageDurationEn} 
              onChange={e => setForm({...form, usageDurationEn: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
            />
          </div>

          {/* إتاحة المنتج للظهور في الموقع */}
          <div className="md:col-span-2 flex items-center gap-3 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
            <input 
              type="checkbox" 
              id="isAvailableToggle"
              checked={form.isAvailable} 
              onChange={e => setForm({...form, isAvailable: e.target.checked})} 
              className="w-5 h-5 accent-[var(--secondary)] cursor-pointer"
            />
            <label htmlFor="isAvailableToggle" className="text-sm font-bold text-[var(--foreground)] cursor-pointer">
              متاح للظهور في الموقع (Is Available)
            </label>
          </div>

          {/* الصورة */}
          <div className="space-y-2 md:col-span-2 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
            <label className="text-xs font-bold text-[var(--muted-foreground)] block">صورة المنتج المستعمل</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[var(--foreground)]">
                <input type="radio" name="imageTypeUsed" checked={imageInputType === 'url'} onChange={() => setImageInputType('url')} /> لصق رابط صورة (URL)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[var(--foreground)]">
                <input type="radio" name="imageTypeUsed" checked={imageInputType === 'file'} onChange={() => setImageInputType('file')} /> رفع من الجهاز
              </label>
            </div>

            {imageInputType === 'url' ? (
              <input 
                type="text" 
                placeholder="https://example.com/image.jpg" 
                value={form.image || ''} 
                onChange={e => setForm({...form, image: e.target.value})} 
                className="p-3 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
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
                className="p-2 bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              />
            )}
          </div>

          {/* الوصف بالعربي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">تفاصيل إضافية (عربي)</label>
            <textarea 
              placeholder="اكتب التفاصيل بالعربية..." 
              value={form.descriptionAr} 
              onChange={e => setForm({...form, descriptionAr: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              rows={3}
            ></textarea>
          </div>

          {/* الوصف بالإنجليزي */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--muted-foreground)]">Additional Details (English)</label>
            <textarea 
              placeholder="Write details in English..." 
              value={form.descriptionEn} 
              onChange={e => setForm({...form, descriptionEn: e.target.value})} 
              className="p-3 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm outline-none w-full" 
              rows={3}
            ></textarea>
          </div>
          
          <button type="submit" className="md:col-span-2 bg-[var(--secondary)] text-white font-bold py-3 rounded-xl hover:opacity-95 cursor-pointer">
            {editingId ? 'تحديث المنتج المستعمل' : 'نشر المنتج المستعمل'}
          </button>
        </form>
      </div>

      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[var(--background)] text-[var(--muted-foreground)] text-xs font-bold border-b border-[var(--border)]">
              <th className="p-4">المنتج</th>
              <th className="p-4">نوع المنتج</th>
              <th className="p-4">الحالة / الإتاحة</th>
              <th className="p-4">السعر</th>
              <th className="p-4 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[var(--muted-foreground)]">لا توجد منتجات مستعملة مضافة حالياً.</td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="hover:bg-[var(--background)]/50 transition">
                  <td className="p-4 font-bold flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image ? <img src={p.image} alt={p.nameAr} className="w-full h-full object-cover" /> : <ImageIcon className="text-[var(--muted-foreground)]" />}
                    </div>
                    <div>
                      <p className="text-[var(--foreground)]">{p.nameAr} <span className="text-xs text-[var(--muted-foreground)] font-normal">({p.nameEn})</span></p>
                      <p className="text-xs text-[var(--secondary)] font-mono">/{p.slug}</p>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-[var(--foreground)]">
                    <span className="bg-[var(--background)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                      {p.categoryAr || 'غير محدد'} <span className="text-muted-foreground font-normal">({p.categoryEn || 'N/A'})</span>
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-xs">
                    <div className="text-amber-500">{p.conditionAr} <span className="text-muted-foreground font-normal">({p.conditionEn})</span></div>
                    <div className="mt-1">
                      {p.isAvailable ? (
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">متاح بالموقع</span>
                      ) : (
                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold">مخفي</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-[var(--secondary)]">{p.price} ج.م</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-xl hover:opacity-80 transition cursor-pointer" type="button"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:opacity-80 transition cursor-pointer" type="button"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}