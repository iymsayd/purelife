'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Globe, CheckCircle, Loader2, Upload, Link as LinkIcon, Image as ImageIcon, Edit3, X, AlertTriangle } from 'lucide-react';

interface Brand {
  src: string;
  alt: string;
}

interface Feature {
  title: string;
  desc: string;
}

interface ServiceItem {
  title: string;
  desc: string;
  link: string;
}

interface CustomModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert';
  onConfirm?: () => void;
}

export default function HomeSettingsDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingBrandIdx, setUploadingBrandIdx] = useState<number | null>(null);
  const [brandInputType, setBrandInputType] = useState<'url' | 'file'>('url');
  
  const [newBrand, setNewBrand] = useState<Brand>({ src: '', alt: '' });
  const [editingBrandIndex, setEditingBrandIndex] = useState<number | null>(null);

  // Custom Modal State
  const [modal, setModal] = useState<CustomModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const router = useRouter();

  const [formData, setFormData] = useState({
    badgeText: "🥇 خيارك الأول لصيانة وتركيب الأجهزة",
    mainTitle: "المعيار الأفضل في عالم",
    highlightedTitle: "التكييفات وتنقية المياه",
    description: "مهندسين فنيين على أعلى مستوى من الخبرة والكفاءة تعمل من أجلك على مدار اليوم لصيانه و اصلاح أعطال جميع انواع التكييفات و فلاتر المياة.",
    footerNote: "وكيل حصري لأفضل أنواع أجهزة التكييف وفلاتر تنقية المياة",
    brands: [
      { src: "https://images.alborsaanews.com/2021/01/1552463410_757_199060_img_778.jpg", alt: "Carrier" },
      { src: "https://cairocart.com/media/codazon_cache/brand/250x/Manufacturer/DDD.png", alt: "Sharp" },
      { src: "https://almania-group.com/wp-content/uploads/2020/07/unionaire.png", alt: "Unionaire" },
      { src: "https://cdn.salla.sa/RxKan/LWr0sTh1RBEBGrHOjpPLMADmb9tF6OzJoAtiXFuJ.jpg", alt: "PureLife" }
    ] as Brand[],
    
    whyUsTitle: "لماذا تختار بيورلايف؟",
    whyUsSubtitle: "نلتزم بتقديم أعلى معايير الجودة لراحة وتلبية احتياجات عملائنا",
    features: [
      { title: "وكلاء وموزعون معتمدون", desc: "نضمن لك الحصول على أجهزة أصلية معتمدة ومضمونة بالكامل." },
      { title: "خدمة مميزة على مدار اليوم", desc: "دعم فني واستجابة سريعة لطلباتك في أي وقت طوال أيام الأسبوع." },
      { title: "نصلك أينما كنت", desc: "فروعنا المنتشرة تضمن لك خدمة قريبة وسريعة وفريق فني محترف." }
    ] as Feature[],

    bannerText: "تسوق أونلاين أفضل ماركات وأنواع التكييفات وفلاتر المياه من بيور لايف بأفضل أسعار وأجود خدمة في مصر",

    servicesTitle: "خدمات وأقسام بيورلايف",
    servicesSubtitle: "كل ما تحتاجه لضمان نقاء المياه وصيانة أجهزتك في مكان واحد",
    moreText: "المزيد",
    services: [
      { title: "سياسة الجودة", desc: "هي وثيقة حية تمثل روح الفريق داخل شركة بيورلايف لتحقيق الهدف المنشود وهو التحسين والتطوير المستمر.", link: "/blog" },
      { title: "طلب صيانة", desc: "يسعدنا تلقي طلباتكم للصيانة والإصلاح أينما كنتم من خلال مركز الخدمة وأطقم فنية على أعلى مستوى.", link: "/maintenance" },
      { title: "شكاوى / مقترحات", desc: "نتفاعل بكل جدية مع كل شكوى أو مقترح لإيماننا بأن عميلنا هو شريك النجاح الأساسي في مسيرة تطورنا.", link: "/complaints" },
      { title: "سوق المستعمل", desc: "خدمة إعلانية مجانية لعملائنا يمكنك من خلال السوق عرض أو شراء الأجهزة المستعملة بكل سهولة.", link: "/used-products" },
      { title: "عروض / تخفيضات", desc: "استمتع معنا بآخر العروض والتخفيضات الكبرى التي نوفرها لفترة محدودة على كافة الأجهزة.", link: "/offers" },
      { title: "الأحداث والفعاليات", desc: "تابع معنا كل جديد في بيورلايف من خلال الصور والأخبار وآخر الفعاليات وورش العمل.", link: "/events" }
    ] as ServiceItem[]
  });

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        await fetchHomeData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchHomeData = async () => {
    try {
      const docRef = doc(db, 'settings', 'home_content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error("Error fetching home settings:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isBrandEdit: boolean = false, brandIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setModal({
        isOpen: true,
        title: 'تنبيه حجم الملف',
        message: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت.',
        type: 'alert'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isBrandEdit && brandIdx !== undefined) {
        const updatedBrands = [...formData.brands];
        updatedBrands[brandIdx].src = base64String;
        setFormData({ ...formData, brands: updatedBrands });
      } else {
        setNewBrand(prev => ({ ...prev, src: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOrUpdateBrand = () => {
    if (!newBrand.src || !newBrand.alt) {
      setModal({
        isOpen: true,
        title: 'نقص في البيانات',
        message: 'يرجى إدخال رابط أو رفع صورة الماركة مع كتابة اسمها.',
        type: 'alert'
      });
      return;
    }

    if (editingBrandIndex !== null) {
      const updatedBrands = [...formData.brands];
      updatedBrands[editingBrandIndex] = newBrand;
      setFormData({ ...formData, brands: updatedBrands });
      setEditingBrandIndex(null);
    } else {
      setFormData({ ...formData, brands: [...formData.brands, newBrand] });
    }
    setNewBrand({ src: '', alt: '' });
  };

  const handleEditBrandClick = (index: number) => {
    setNewBrand(formData.brands[index]);
    setEditingBrandIndex(index);
  };

  const handleDeleteBrand = (index: number) => {
    setModal({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من رغبتك في حذف هذه الماركة بشكل نهائي؟',
      type: 'confirm',
      onConfirm: () => {
        const updatedBrands = formData.brands.filter((_, i) => i !== index);
        setFormData({ ...formData, brands: updatedBrands });
        if (editingBrandIndex === index) {
          setEditingBrandIndex(null);
          setNewBrand({ src: '', alt: '' });
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await setDoc(doc(db, 'settings', 'home_content'), formData, { merge: true });
      setSuccess(true);
      window.dispatchEvent(new Event('homeSettingsUpdated'));
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error saving home settings:", error);
      setModal({
        isOpen: true,
        title: 'خطأ في الحفظ',
        message: 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.',
        type: 'alert'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--secondary)]" size={36} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-5xl mx-auto text-[var(--foreground)] pb-20 relative">
      
      {/* Custom Modal / Alert Box */}
      {modal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 left-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">{modal.title}</h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {modal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:opacity-90 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      modal.onConfirm?.();
                      setModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md cursor-pointer"
                  >
                    تأكيد وحذف
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--secondary)] text-white hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  حسناً
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-[var(--secondary)]">إدارة محتوى الصفحة الرئيسية</h1>
          <p className="text-xs text-gray-500 mt-1">تعديل نصوص الواجهة، الماركات المعتمدة، المميزات، والخدمات الخاصة بالصفحة الرئيسية.</p>
        </div>
        <Globe className="text-[var(--secondary)]" size={32} />
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* قسم الواجهة الرئيسية (Hero Section) */}
        <div className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-[var(--secondary)]">
            <Save size={20} /> 1. قسم الواجهة الرئيسية (Hero Section)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-2">الشعار العلوي (Badge)</label>
              <input 
                type="text" 
                value={formData.badgeText}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">العنوان الرئيسي العادي</label>
              <input 
                type="text" 
                value={formData.mainTitle}
                onChange={(e) => setFormData({ ...formData, mainTitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">العنوان الرئيسي الملون (Highlighted)</label>
              <input 
                type="text" 
                value={formData.highlightedTitle}
                onChange={(e) => setFormData({ ...formData, highlightedTitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-2">الوصف التعريفي (سيتم تلوين جملة "أعلى مستوى من الخبرة والكفاءة" تلقائياً)</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-2">ملاحظة أسفل الماركات (Footer Note)</label>
              <input 
                type="text" 
                value={formData.footerNote}
                onChange={(e) => setFormData({ ...formData, footerNote: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
          </div>

          {/* إدارة الماركات (Brands Manager) */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold text-[var(--secondary)] mb-4">إدارة التوكيلات والماركات المعتمدة ({formData.brands.length})</h3>
            
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{editingBrandIndex !== null ? 'تعديل ماركة حالية' : 'إضافة ماركة جديدة'}</span>
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBrandInputType('url')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${brandInputType === 'url' ? 'bg-[var(--secondary)] text-white shadow-sm' : 'text-gray-500'}`}
                  >
                    رابط مباشر
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandInputType('file')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${brandInputType === 'file' ? 'bg-[var(--secondary)] text-white shadow-sm' : 'text-gray-500'}`}
                  >
                    رفع من الجهاز
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <input 
                    type="text" 
                    value={newBrand.alt || ''}
                    onChange={(e) => setNewBrand({ ...newBrand, alt: e.target.value })}
                    placeholder="اسم الماركة (مثال: Carrier)"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                </div>

                <div className="md:col-span-1">
                  {brandInputType === 'url' ? (
                    <input 
                      type="text" 
                      value={newBrand.src || ''}
                      onChange={(e) => setNewBrand({ ...newBrand, src: e.target.value })}
                      placeholder="رابط صورة الماركة URL"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="w-full p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[var(--secondary)]/10 file:text-[var(--secondary)] cursor-pointer"
                      />
                      {newBrand.src && (
                        <span className="text-[10px] text-emerald-500 font-bold whitespace-nowrap">تم الرفع ✓</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleAddOrUpdateBrand}
                    className="w-full bg-[var(--secondary)] hover:opacity-90 text-white p-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    {editingBrandIndex !== null && <Save size={14} />}
                    {editingBrandIndex !== null ? "حفظ التعديل" : "إضافة للقائمة"}
                  </button>
                  {editingBrandIndex !== null && (
                    <button 
                      type="button"
                      onClick={() => { setEditingBrandIndex(null); setNewBrand({ src: '', alt: '' }); }}
                      className="p-3 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-300 cursor-pointer"
                      title="إلغاء التعديل"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* عرض الماركات الحالية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.brands.map((brand, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 flex flex-col items-center justify-between gap-2 relative group">
                  <div className="h-12 w-full flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-800">
                    <img src={brand.src} alt={brand.alt} className="max-h-10 max-w-full object-contain" />
                  </div>
                  <span className="text-xs font-bold">{brand.alt}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={() => handleEditBrandClick(idx)}
                      className="p-1.5 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 rounded-lg transition-colors cursor-pointer"
                      title="تعديل الماركة"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteBrand(idx)}
                      className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                      title="حذف الماركة"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* قسم لماذا تختارنا (Why Us Section) */}
        <div className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-[var(--secondary)]">
            <Save size={20} /> 2. قسم "لماذا تختارنا" (Why Us)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold mb-2">عنوان القسم</label>
              <input 
                type="text" 
                value={formData.whyUsTitle}
                onChange={(e) => setFormData({ ...formData, whyUsTitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">الوصف الفرعي</label>
              <input 
                type="text" 
                value={formData.whyUsSubtitle}
                onChange={(e) => setFormData({ ...formData, whyUsSubtitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold">المميزات الـ 3</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
                  <span className="text-xs font-bold text-[var(--secondary)]">الميزة رقم {idx + 1}</span>
                  <input 
                    type="text" 
                    value={feat.title}
                    onChange={(e) => {
                      const updated = [...formData.features];
                      updated[idx].title = e.target.value;
                      setFormData({ ...formData, features: updated });
                    }}
                    placeholder="العنوان"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                  <textarea 
                    rows={2}
                    value={feat.desc}
                    onChange={(e) => {
                      const updated = [...formData.features];
                      updated[idx].desc = e.target.value;
                      setFormData({ ...formData, features: updated });
                    }}
                    placeholder="الوصف"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* قسم البانر الإعلاني (Value Banner) */}
        <div className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-[var(--secondary)]">
            <Save size={20} /> 3. بانر الإعلان والترويج (Value Banner)
          </h2>
          <div>
            <label className="block text-xs font-bold mb-2">نص البانر المتحرك</label>
            <textarea 
              rows={2}
              value={formData.bannerText}
              onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
            />
          </div>
        </div>

        {/* قسم خدمات وأقسام بيورلايف (Services Section) */}
        <div className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-[var(--secondary)]">
            <Save size={20} /> 4. قسم الخدمات والأقسام
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold mb-2">عنوان القسم</label>
              <input 
                type="text" 
                value={formData.servicesTitle}
                onChange={(e) => setFormData({ ...formData, servicesTitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">الوصف الفرعي</label>
              <input 
                type="text" 
                value={formData.servicesSubtitle}
                onChange={(e) => setFormData({ ...formData, servicesSubtitle: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">نص زر الزيارة (مثل: المزيد)</label>
              <input 
                type="text" 
                value={formData.moreText}
                onChange={(e) => setFormData({ ...formData, moreText: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold">بطاقات الخدمات الـ 6</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.services.map((srv, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--secondary)]">الخدمة #{idx + 1}</span>
                    <input 
                      type="text" 
                      value={srv.link}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[idx].link = e.target.value;
                        setFormData({ ...formData, services: updated });
                      }}
                      placeholder="رابط المسار (مثال: /blog)"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs w-32 outline-none focus:ring-1 focus:ring-[var(--secondary)]"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={srv.title}
                    onChange={(e) => {
                      const updated = [...formData.services];
                      updated[idx].title = e.target.value;
                      setFormData({ ...formData, services: updated });
                    }}
                    placeholder="عنوان الخدمة"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                  <textarea 
                    rows={2}
                    value={srv.desc}
                    onChange={(e) => {
                      const updated = [...formData.services];
                      updated[idx].desc = e.target.value;
                      setFormData({ ...formData, services: updated });
                    }}
                    placeholder="الوصف"
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-[var(--background)] text-xs outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* أزرار الحفظ */}
        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-[var(--secondary)] hover:opacity-90 text-white px-8 py-4 rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "جاري الحفظ..." : "حفظ جميع التغييرات وتحديث الصفحة الرئيسية"}
          </button>

          {success && (
            <span className="text-emerald-500 font-bold text-xs flex items-center gap-1 animate-bounce">
              <CheckCircle size={16} /> تم حفظ التعديلات وتحديث الصفحة الرئيسية بنجاح!
            </span>
          )}
        </div>

      </form>
    </div>
  );
}