'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon, Upload, Loader2, BookOpen, Tag, CheckCircle, CalendarDays } from 'lucide-react';

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<'blogs' | 'offers' | 'events'>('blogs');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const [uploadingImg, setUploadingImg] = useState(false);

  // نظام التنبيهات المخصص (بدل المتصفح)
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'فلاتر',
    summary: '',
    content: '',
    desc: '',
    discount: '',
    date: '',
    location: '',
    image: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // إغلاق النوافذ المنبثقة بـ Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAlertModal(prev => ({ ...prev, show: false }));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let colName = 'articles';
      if (activeTab === 'offers') colName = 'offers';
      if (activeTab === 'events') colName = 'events';

      const q = query(collection(db, colName), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setItems(list);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAlertModal({ show: true, message: "حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت." });
      return;
    }
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result as string }));
      setUploadingImg(false);
    };
    reader.onerror = () => {
      setAlertModal({ show: true, message: "حدث خطأ أثناء قراءة الملف." });
      setUploadingImg(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق الإجباري الشامل حسب القسم النشط
    if (!formData.title.trim()) {
      setAlertModal({ show: true, message: "الرجاء إدخال عنوان العنصر." });
      return;
    }
    if (!formData.image.trim()) {
      setAlertModal({ show: true, message: "الرجاء إدخال أو رفع صورة الغلاف." });
      return;
    }

    if (activeTab === 'blogs') {
      if (!formData.category.trim() || !formData.summary.trim() || !formData.content.trim()) {
        setAlertModal({ show: true, message: "الرجاء استكمال جميع حقول المقال الإجبارية (التصنيف، الملخص، ومحتوى المقال)." });
        return;
      }
    } else if (activeTab === 'offers') {
      if (!formData.discount.trim() || !formData.desc.trim()) {
        setAlertModal({ show: true, message: "الرجاء استكمال جميع حقول العرض الإجبارية (قيمة الخصم ووصف العرض)." });
        return;
      }
    } else if (activeTab === 'events') {
      if (!formData.date.trim() || !formData.location.trim() || !formData.desc.trim()) {
        setAlertModal({ show: true, message: "الرجاء استكمال جميع حقول الحدث الإجبارية (تاريخ الحدث، مكان الحدث، ووصف الحدث)." });
        return;
      }
    }

    setSaving(true);
    setSuccess(false);

    try {
      let colName = 'articles';
      if (activeTab === 'offers') colName = 'offers';
      if (activeTab === 'events') colName = 'events';

      const slugValue = formData.slug.trim() || formData.title.trim().replace(/\s+/g, '-').toLowerCase();

      const payload: any = {
        ...formData,
        slug: slugValue,
        createdAt: editingId ? undefined : Date.now()
      };

      if (activeTab === 'blogs') {
        delete payload.desc;
        delete payload.discount;
        delete payload.date;
        delete payload.location;
      } else if (activeTab === 'offers') {
        delete payload.summary;
        delete payload.content;
        delete payload.category;
        delete payload.date;
        delete payload.location;
      } else if (activeTab === 'events') {
        delete payload.summary;
        delete payload.content;
        delete payload.category;
        delete payload.discount;
      }

      if (editingId) {
        delete payload.createdAt;
        await updateDoc(doc(db, colName, editingId), payload);
      } else {
        await addDoc(collection(db, colName), payload);
      }

      setSuccess(true);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error saving item:", error);
      setAlertModal({ show: true, message: "حدث خطأ أثناء الحفظ." });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      category: item.category || 'فلاتر',
      summary: item.summary || '',
      content: item.content || '',
      desc: item.desc || '',
      discount: item.discount || '',
      date: item.date || '',
      location: item.location || '',
      image: item.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'تأكيد الحذف النهائي',
      message: 'هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          let colName = 'articles';
          if (activeTab === 'offers') colName = 'offers';
          if (activeTab === 'events') colName = 'events';

          await deleteDoc(doc(db, colName, id));
          setItems(items.filter(i => i.id !== id));
        } catch (error) {
          console.error("Error deleting item:", error);
          setAlertModal({ show: true, message: "حدث خطأ أثناء محاولة الحذف." });
        }
      },
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      category: 'فلاتر',
      summary: '',
      content: '',
      desc: '',
      discount: '',
      date: '',
      location: '',
      image: ''
    });
  };

  const getTabTitle = () => {
    if (activeTab === 'blogs') return 'مقال';
    if (activeTab === 'offers') return 'عرض';
    return 'حدث';
  };

  return (
    <div dir="rtl" className="max-w-6xl mx-auto text-foreground pb-20 px-4 sm:px-6">
      
      {/* تبديل القسم بين المدونة، العروض، والفعاليات */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-border pb-4">
        <button
          onClick={() => { setActiveTab('blogs'); resetForm(); }}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'blogs' ? 'bg-[var(--secondary)] text-white shadow-md' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
          type="button"
        >
          <BookOpen size={18} /> إدارة المقالات (المدونة)
        </button>
        <button
          onClick={() => { setActiveTab('offers'); resetForm(); }}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'offers' ? 'bg-[var(--secondary)] text-white shadow-md' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
          type="button"
        >
          <Tag size={18} /> إدارة العروض والخصومات
        </button>
        <button
          onClick={() => { setActiveTab('events'); resetForm(); }}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'events' ? 'bg-[var(--secondary)] text-white shadow-md' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
          type="button"
        >
          <CalendarDays size={18} /> إدارة الأحداث والفعاليات
        </button>
      </div>

      {/* نموذج الإضافة أو التعديل */}
      <form onSubmit={handleSave} className="border border-border rounded-3xl shadow-sm p-6 md:p-8 mb-12 text-foreground bg-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--secondary)]">
            {editingId ? `تعديل ${getTabTitle()}` : `إضافة ${getTabTitle()} جديد`}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">
              إلغاء التعديل
            </button>
          )}
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm flex items-center gap-2">
            <CheckCircle size={18} /> تم الحفظ بنجاح!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold mb-2">العنوان *</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={activeTab === 'blogs' ? 'عنوان المقال...' : activeTab === 'offers' ? 'عنوان العرض...' : 'عنوان الحدث...'}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-2">الرابط المخصص (Slug) - اختياري</label>
            <input 
              type="text" 
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-slug-example"
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
            />
          </div>

          {activeTab === 'blogs' && (
            <div>
              <label className="block text-xs font-bold mb-2">التصنيف *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3.5 rounded-2xl border border-border bg-[var(--background)] text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all cursor-pointer"
              >
                <option value="فلاتر">فلاتر</option>
                <option value="تكييفات">تكييفات</option>
                <option value="عام">عام</option>
              </select>
            </div>
          )}

          {activeTab === 'offers' && (
            <div>
              <label className="block text-xs font-bold mb-2">قيمة الخصم (مثال: 20% أو 500 جنيه) *</label>
              <input 
                type="text" 
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="خصم 20%"
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
              />
            </div>
          )}

          {activeTab === 'events' && (
            <>
              <div>
                <label className="block text-xs font-bold mb-2">تاريخ الحدث (مثال: 15 يونيو 2026) *</label>
                <input 
                  type="text" 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="15 يونيو 2026"
                  className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2">مكان الحدث (مثال: طنطا، شارع الاستاد) *</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="طنطا، شارع الاستاد"
                  className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold">صورة الغلاف *</label>
              <div className="flex gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setImageInputType('url')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${imageInputType === 'url' ? 'bg-[var(--secondary)] text-white' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  رابط URL
                </button>
                <button 
                  type="button" 
                  onClick={() => setImageInputType('file')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${imageInputType === 'file' ? 'bg-[var(--secondary)] text-white' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  رفع ملف
                </button>
              </div>
            </div>

            {imageInputType === 'url' ? (
              <input 
                type="url" 
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all"
              />
            ) : (
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-[var(--secondary)] transition-all bg-background">
                  {uploadingImg ? (
                    <Loader2 className="animate-spin text-[var(--secondary)]" size={24} />
                  ) : (
                    <>
                      <Upload size={24} className="text-muted-foreground mb-2" />
                      <span className="text-xs font-bold text-muted-foreground">اختر صورة من جهازك (أقل من 2 ميجابايت)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {formData.image && (
              <div className="mt-3 w-32 h-20 rounded-xl overflow-hidden border border-border relative">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {(activeTab === 'offers' || activeTab === 'events') && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-2">وصف مختصر (نبذة) *</label>
              <textarea 
                rows={3}
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="اكتب وصفاً مختصراً..."
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all resize-none"
              ></textarea>
            </div>
          )}

          {activeTab === 'blogs' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-2">الملخص (النبذة التعريفية) *</label>
                <textarea 
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="ملخص قصير للمقال..."
                  className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all resize-none"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-2">محتوى المقال الكامل *</label>
                <textarea 
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="اكتب محتوى المقال هنا..."
                  className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground text-sm outline-none focus:border-[var(--secondary)] transition-all resize-none"
                ></textarea>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[var(--secondary)] text-white hover:opacity-90 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="animate-spin" size={18} />}
            {editingId ? 'حفظ التعديلات' : `إضافة ${getTabTitle()}`}
          </button>
        </div>
      </form>

      {/* قائمة العناصر الحالية */}
      <div className="border border-border rounded-3xl shadow-sm p-6 md:p-8 text-foreground bg-card">
        <h3 className="text-lg font-bold mb-6">
          قائمة {activeTab === 'blogs' ? 'المقالات' : activeTab === 'offers' ? 'العروض' : 'الفعاليات'} الحالية ({items.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[var(--secondary)]" size={32} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm font-semibold">لا توجد عناصر مضافة حتى الآن.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-border bg-muted/20 gap-4">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-base mb-1 text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.summary || item.desc || item.date || 'بدون وصف'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                    type="button"
                    title="تعديل"
                  >
                    <Edit3 size={16} /> تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(item.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                    type="button"
                    title="حذف"
                  >
                    <Trash2 size={16} /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة التنبيه المخصصة (Alert Modal) */}
      {alertModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={() => setAlertModal({ show: false, message: '' })}
        >
          <div 
            className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setAlertModal({ show: false, message: '' })}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm font-black flex items-center justify-center hover:bg-red-500 hover:text-white transition cursor-pointer"
              type="button"
            >
              ✕
            </button>
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="text-lg font-black text-[var(--foreground)] mb-2">تنبيه هام</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ show: false, message: '' })}
              className="w-full bg-[var(--secondary)] text-white py-3 rounded-xl font-bold cursor-pointer hover:opacity-90 transition"
              type="button"
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* نافذة التأكيد المخصصة للحذف (Confirm Modal) */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        >
          <div 
            className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm font-black flex items-center justify-center hover:bg-red-500 hover:text-white transition cursor-pointer"
              type="button"
            >
              ✕
            </button>
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-black text-[var(--foreground)] mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">{confirmModal.message}</p>
            <div className="flex gap-2">
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-[var(--secondary)] text-white py-3 rounded-xl font-bold cursor-pointer hover:opacity-90 transition"
                type="button"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] py-3 rounded-xl font-bold cursor-pointer hover:bg-[var(--border)]/50 transition"
                type="button"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}