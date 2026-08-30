'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'used_products'>('products');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات النموذج (إضافة / تعديل)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  
  // نظام التنبيهات والتأكيدات المخصصة
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // حقول المنتج الشاملة (جميعها نصوص لضمان خلوها تاماً من الـ undefined)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    image: '',
    brand: '',
    category: 'فلاتر',
    stages: '',
    power: '',
    sterilization: '',
    filtrationType: '',
    origin: '',
    cooling: '',
    deviceType: '',
    condition: '',
    description: '',
  });

  // جلب البيانات من Firebase حسب التاب النشط
  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionName = activeTab === 'products' ? 'products' : 'used_products';
      const querySnapshot = await getDocs(collection(db, collectionName));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(list);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // إغلاق النافذة بـ Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
        setAlertModal(prev => ({ ...prev, show: false }));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // فتح نافذة الإضافة
  const handleOpenAdd = () => {
    setEditingId(null);
    setImageInputType('url');
    setFormData({
      title: '',
      price: '',
      image: '',
      brand: '',
      category: 'فلاتر',
      stages: '',
      power: '',
      sterilization: '',
      filtrationType: '',
      origin: '',
      cooling: '',
      deviceType: '',
      condition: activeTab === 'used_products' ? 'جيد جداً' : '',
      description: '',
    });
    setIsModalOpen(true);
  };

  // فتح نافذة التعديل مع تعبئة البيانات
  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    const imageUrl = item.image || item.imageUrl || '';
    const isFileImage = imageUrl && imageUrl.startsWith('data:');
    setImageInputType(isFileImage ? 'file' : 'url');
    setFormData({
      title: item.nameAr || item.title || '',
      price: item.price !== undefined && item.price !== null ? String(item.price) : '',
      image: imageUrl,
      brand: item.brand || '',
      category: item.category || item.categoryAr || 'فلاتر',
      stages: item.stages || '',
      power: item.power || '',
      sterilization: item.sterilization || '',
      filtrationType: item.filtrationType || '',
      origin: item.origin || '',
      cooling: item.cooling || '',
      deviceType: item.deviceType || '',
      condition: item.condition || item.conditionAr || '',
      description: item.description || item.descriptionAr || item.desc || '',
    });
    setIsModalOpen(true);
  };

  // إلغاء التعديل أو الإضافة
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // تحويل الصورة المرفوعة إلى Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // حفظ المنتج (إضافة أو تعديل) مع تحديث التاريخ حتى عند التعديل
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.price || !formData.image.trim() || !formData.description.trim()) {
      setAlertModal({ show: true, message: "الرجاء استكمال الحقول الأساسية الإجبارية (عنوان المنتج، السعر، الصورة، ووصف المنتج) قبل الحفظ." });
      return;
    }

    const isSpareParts = formData.category?.includes('قطع غيار');
    const isFilter = formData.category === 'فلاتر';
    const isAC = formData.category === 'تكييفات';

    if (isFilter) {
      if (!formData.brand.trim() || !formData.stages.trim() || !formData.sterilization.trim() || !formData.filtrationType.trim() || !formData.origin.trim()) {
        setAlertModal({ show: true, message: "يرجى ملء جميع بيانات الفلتر المطلوبة بشكل كامل." });
        return;
      }
    } else if (isAC) {
      if (!formData.brand.trim() || !formData.power.trim() || !formData.cooling.trim() || !formData.deviceType.trim() || !formData.origin.trim()) {
        setAlertModal({ show: true, message: "يرجى ملء جميع بيانات التكييف المطلوبة بشكل كامل." });
        return;
      }
    } else if (isSpareParts) {
      if (!formData.origin.trim()) {
        setAlertModal({ show: true, message: "يرجى إدخال بلد المنشأ الخاص بقطع الغيار." });
        return;
      }
    }

    if (activeTab === 'used_products' && !formData.condition.trim()) {
      setAlertModal({ show: true, message: "يرجى تحديد حالة المنتج المستعمل." });
      return;
    }

    const collectionName = activeTab === 'products' ? 'products' : 'used_products';

    // حفظ الصورة في المفتاحين (image و imageUrl) لضمان توافقها التام مع الواجهة الرئيسية
    const payload: any = {
      title: formData.title.trim(),
      nameAr: formData.title.trim(),
      price: Number(formData.price),
      image: formData.image.trim(),
      imageUrl: formData.image.trim(),
      brand: isSpareParts ? '' : formData.brand.trim(),
      category: formData.category,
      stages: formData.stages.trim(),
      power: formData.power.trim(),
      sterilization: formData.sterilization.trim(),
      filtrationType: formData.filtrationType.trim(),
      origin: formData.origin.trim(),
      cooling: formData.cooling.trim(),
      deviceType: formData.deviceType.trim(),
      description: formData.description.trim(),
      createdAt: serverTimestamp(), // يتم تحديثه أو إضافته دائماً عند الحفظ
    };

    if (activeTab === 'used_products') {
      payload.condition = formData.condition.trim() || 'مستعمل';
      payload.conditionAr = formData.condition.trim() || 'مستعمل';
      payload.isUsed = true;
      payload.type = 'used';
    }

    try {
      if (editingId) {
        const docRef = doc(db, collectionName, editingId);
        await updateDoc(docRef, payload);
      } else {
        await addDoc(collection(db, collectionName), payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      setAlertModal({ show: true, message: "حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى." });
    }
  };

  // حذف منتج
  const handleDeleteConfirm = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'تأكيد الحذف النهائي',
      message: 'هل أنت متأكد من حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const collectionName = activeTab === 'products' ? 'products' : 'used_products';
          await deleteDoc(doc(db, collectionName, id));
          fetchData();
        } catch (error) {
          console.error("Error deleting product:", error);
          setAlertModal({ show: true, message: "حدث خطأ أثناء محاولة الحذف." });
        }
      },
    });
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
      {/* رأس الموضوع */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-[var(--background)] p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)]">
            {activeTab === 'products' ? 'لوحة تحكم المنتجات الجديدة' : 'لوحة تحكم المنتجات المستعملة'}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">إدارة منتجات المتجر بكل سهولة ومرونة</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[var(--secondary)] text-white px-6 py-3.5 rounded-2xl font-black shadow-md hover:opacity-90 transition cursor-pointer w-full md:w-auto text-center"
          type="button"
        >
          {activeTab === 'products' ? 'إضافة منتج جديد' : 'إضافة منتج مستعمل'}
        </button>
      </div>

      {/* التبويبات */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition cursor-pointer border ${
            activeTab === 'products'
              ? 'bg-[var(--secondary)] text-white border-[var(--secondary)] shadow-md'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--secondary)]/10'
          }`}
          type="button"
        >
          📦 المنتجات الجديدة
        </button>
        <button
          onClick={() => setActiveTab('used_products')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition cursor-pointer border ${
            activeTab === 'used_products'
              ? 'bg-[var(--secondary)] text-white border-[var(--secondary)] shadow-md'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--secondary)]/10'
          }`}
          type="button"
        >
          🔄 المنتجات المستعملة
        </button>
      </div>

      {/* جدول عرض المنتجات */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-[2.5rem] shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--muted-foreground)] font-bold animate-pulse">جاري تحميل البيانات...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[var(--muted-foreground)] font-bold">لا توجد منتجات مضافة في هذا القسم حالياً.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)]/50 text-xs text-[var(--muted-foreground)] font-black">
                  <th className="p-4">الصورة</th>
                  <th className="p-4">اسم المنتج</th>
                  <th className="p-4">القسم</th>
                  <th className="p-4">السعر</th>
                  <th className="p-4">الماركة</th>
                  {activeTab === 'used_products' && <th className="p-4">الحالة</th>}
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {items.map((item) => {
                  const displayImg = item.image || item.imageUrl || '';
                  return (
                    <tr key={item.id} className="hover:bg-[var(--secondary)]/5 transition">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0">
                          {displayImg ? (
                            <img src={displayImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-black text-[var(--foreground)]">{item.nameAr || item.title || ''}</td>
                      <td className="p-4 text-[var(--muted-foreground)] whitespace-nowrap">{item.category || 'غير محدد'}</td>
                      <td className="p-4 font-bold text-[var(--secondary)] whitespace-nowrap">{item.price !== undefined && item.price !== null && item.price !== '' ? `${item.price} ج.م` : 'اتصل للسعر'}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">{item.brand || 'غير متوفرة'}</td>
                      {activeTab === 'used_products' && (
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-[var(--secondary)]/10 text-[var(--secondary)] px-3 py-1 rounded-full text-xs font-bold inline-block whitespace-nowrap">
                            {item.condition || 'مستعمل'}
                          </span>
                        </td>
                      )}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-xl font-bold text-xs hover:bg-amber-500/20 transition cursor-pointer"
                            type="button"
                          >
                            تعديل ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(item.id)}
                            className="px-3 py-1.5 bg-red-500/10 text-red-600 border border-red-500/30 rounded-xl font-bold text-xs hover:bg-red-500/20 transition cursor-pointer"
                            type="button"
                          >
                            حذف 🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة الإضافة أو التعديل (Modal) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto"
          onClick={handleCancel}
        >
          <div 
            className="bg-[var(--background)] border border-[var(--border)] p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[var(--foreground)]">
                {editingId ? 'تعديل المنتج' : (activeTab === 'products' ? 'إضافة منتج جديد' : 'إضافة منتج مستعمل')}
              </h2>
              <button 
                onClick={handleCancel}
                className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-lg font-black flex items-center justify-center hover:bg-red-500 hover:text-white transition cursor-pointer shadow-sm"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">عنوان المنتج / الاسم *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                  placeholder="أدخل اسم المنتج..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                    placeholder="مثال: 1500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">القسم الرئيسي *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)] cursor-pointer"
                  >
                    <option value="فلاتر">الفلاتر</option>
                    <option value="تكييفات">التكييفات</option>
                    <option value="قطع غيار فلاتر">قطع غيار فلاتر</option>
                    <option value="قطع غيار تكييفات">قطع غيار تكييفات</option>
                  </select>
                </div>
              </div>

              {/* اختيار طريقة الصورة: رابط أو رفع ملف */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[var(--foreground)]">صورة المنتج *</label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => setImageInputType('url')} className={`px-2.5 py-1 rounded-lg font-bold ${imageInputType === 'url' ? 'bg-[var(--secondary)] text-white' : 'text-[var(--muted-foreground)] bg-[var(--card)] border border-[var(--border)]'}`}>رابط</button>
                    <button type="button" onClick={() => setImageInputType('file')} className={`px-2.5 py-1 rounded-lg font-bold ${imageInputType === 'file' ? 'bg-[var(--secondary)] text-white' : 'text-[var(--muted-foreground)] bg-[var(--card)] border border-[var(--border)]'}`}>رفع ملف</button>
                  </div>
                </div>
                {imageInputType === 'url' ? (
                  <input
                    type="url"
                    required={imageInputType === 'url'}
                    value={formData.image && formData.image.startsWith('data:') ? '' : formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    required={!formData.image}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-2.5 text-sm text-[var(--foreground)] file:ml-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--secondary)] file:text-white cursor-pointer"
                  />
                )}
              </div>

              {/* حقول الفلاتر الديناميكية */}
              {formData.category === 'فلاتر' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">الماركة *</label>
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="اكتب اسم الماركة..."
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المراحل *</label>
                      <input
                        type="text"
                        required
                        value={formData.stages}
                        onChange={(e) => setFormData({ ...formData, stages: e.target.value })}
                        placeholder="مثال: 7 مراحل"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">التعقيم *</label>
                      <input
                        type="text"
                        required
                        value={formData.sterilization}
                        onChange={(e) => setFormData({ ...formData, sterilization: e.target.value })}
                        placeholder="مثال: UV"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">نوع التصفية *</label>
                      <input
                        type="text"
                        required
                        value={formData.filtrationType}
                        onChange={(e) => setFormData({ ...formData, filtrationType: e.target.value })}
                        placeholder="مثال: تحلية"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المنشأ *</label>
                      <input
                        type="text"
                        required
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        placeholder="مثال: مصري"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* حقول التكييفات الديناميكية */}
              {formData.category === 'تكييفات' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">الماركة *</label>
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="اكتب الماركة..."
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">القدرة (حصان) *</label>
                      <input
                        type="text"
                        required
                        value={formData.power}
                        onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                        placeholder="مثال: 1.5 أو 2.25"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">التبريد *</label>
                      <input
                        type="text"
                        required
                        value={formData.cooling}
                        onChange={(e) => setFormData({ ...formData, cooling: e.target.value })}
                        placeholder="بارد / ساخن"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">نوع الجهاز *</label>
                      <input
                        type="text"
                        required
                        value={formData.deviceType}
                        onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                        placeholder="حائطي / دولابي"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] mb-1">المنشأ *</label>
                      <input
                        type="text"
                        required
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        placeholder="ماليزي / مصري"
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-2 py-3 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* حقول قطع الغيار */}
              {formData.category?.includes('قطع غيار') && (
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">بلد المنشأ *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="مصري / مستورد"
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                  />
                </div>
              )}

              {/* حالة المنتج المستعمل */}
              {activeTab === 'used_products' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">حالة المنتج المستعمل *</label>
                  <input
                    type="text"
                    required
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                    placeholder="مثال: بحالة الزيرو / استعمال خفيف"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">وصف المنتج (إجباري) *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--secondary)]"
                  placeholder="تفاصيل إضافية عن المنتج..."
                ></textarea>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[var(--secondary)] text-white py-3.5 rounded-2xl font-black hover:opacity-90 transition shadow-md cursor-pointer"
                >
                  حفظ البيانات 💾
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] py-3.5 rounded-2xl font-black hover:bg-[var(--border)]/50 transition cursor-pointer"
                >
                  إلغاء ❌
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التنبيه المخصصة */}
      {alertModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={() => setAlertModal({ show: false, message: '' })}
        >
          <div 
            className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="text-lg font-black text-[var(--foreground)] mb-2">تنبيه هام</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ show: false, message: '' })}
              className="w-full bg-[var(--secondary)] text-white py-3 rounded-xl font-bold cursor-pointer"
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* نافذة التأكيد للحذف */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        >
          <div 
            className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-black text-[var(--foreground)] mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">{confirmModal.message}</p>
            <div className="flex gap-2">
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold cursor-pointer hover:bg-red-700 transition"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] py-3 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}