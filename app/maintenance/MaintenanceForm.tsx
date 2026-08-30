'use client';
import { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Loader2, Send, X, AlertCircle, Info, Lock, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { saveUserMessage } from '@/lib/messageService';

interface MaintenanceFormProps {
  initialContent?: any;
}

export default function MaintenanceForm({ initialContent }: MaintenanceFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [profileWarningMessage, setProfileWarningMessage] = useState<string | null>(null);
  const [warnedFields, setWarnedFields] = useState<{ [key: string]: boolean }>({});

  const [content, setContent] = useState(initialContent || {
    title: "طلب صيانة",
    subtitle: "املأ بياناتك ونوع تفاصيل طلبك وسنتواصل معك في أسرع وقت",
    nameLabel: "الاسم",
    phoneLabel: "رقم الهاتف",
    addressLabel: "العنوان",
    emailLabel: "البريد الإلكتروني",
    readonlyNote: "البريد الإلكتروني مسجل بحسابك ولا يمكن تعديله",
    emailOptional: "اختياري",
    productTypeLabel: "نوع المنتج المطلوبة صيانته",
    messageLabel: "تفاصيل الطلب",
    submitButton: "إرسال طلب الصيانة",
    submittingButton: "جاري الإرسال...",
    successMessage: "تم إرسال طلب الصيانة بنجاح! سنتواصل معك قريباً.",
    anotherMessageButton: "إرسال طلب آخر",
    validationError: "من فضلك، اختر نوع منتج واحد على الأقل لطلب الصيانة!",
    products: {
      filters: "فلاتر مياه",
      ac: "تكييفات",
      acParts: "قطع غيار تكييف",
      filterParts: "قطع غيار فلاتر"
    }
  });

  const [userProfile, setUserProfile] = useState({
    isLoggedIn: false,
    name: '',
    phone: '',
    address: '',
    email: '',
    uid: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    products: [] as string[],
    message: '',
  });

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const unsubscribeContent = onSnapshot(doc(db, 'site_content', 'maintenance_page'), (docSnap) => {
      if (docSnap.exists()) {
        setContent((prev: any) => ({ ...prev, ...docSnap.data() }));
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let firestoreData: any = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            firestoreData = userDocSnap.data();
          }
        } catch (error) {
          console.error("Error fetching user profile data:", error);
        }

        const profileData = {
          isLoggedIn: true,
          name: firestoreData.name || user.displayName || '',
          phone: firestoreData.phone || user.phoneNumber || '',
          address: firestoreData.address || '',
          email: user.email || firestoreData.email || '',
          uid: user.uid,
        };

        setUserProfile(profileData);
        setFormData((prev) => ({
          ...prev,
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          email: profileData.email,
        }));
      } else {
        setUserProfile({ isLoggedIn: false, name: '', phone: '', address: '', email: '', uid: '' });
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalMessage(null);
        setProfileWarningMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeContent();
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    if (field === 'email' && userProfile.isLoggedIn) return;

    if (field === 'phone') {
      const filteredPhone = value.replace(/[^\d\s+\-()]/g, '');
      setFormData((prev) => ({ ...prev, phone: filteredPhone }));

      if (userProfile.isLoggedIn && userProfile.phone) {
        if (filteredPhone !== userProfile.phone && !warnedFields['phone']) {
          setProfileWarningMessage('تنبيه: لقد قمت بتعديل رقم الهاتف مقارنة ببيانات حسابك الشخصي (سيتم تحديث حسابك الأساسي تلقائياً عند إرسال الطلب).');
          setWarnedFields((prev) => ({ ...prev, phone: true }));
        }
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (userProfile.isLoggedIn) {
      const originalValue = field === 'name' ? userProfile.name : field === 'address' ? userProfile.address : '';
      if (value !== originalValue && !warnedFields[field] && originalValue !== '') {
        setProfileWarningMessage('تنبيه: لقد قمت بتعديل هذا الحقل مقارنة ببيانات حسابك الشخصي (سيتم تحديث حسابك الأساسي تلقائياً عند إرسال الطلب).');
        setWarnedFields((prev) => ({ ...prev, [field]: true }));
      }
    }
  };

  const handleProductCheckboxChange = (productLabel: string) => {
    setFormData((prev) => {
      const exists = prev.products.includes(productLabel);
      return {
        ...prev,
        products: exists 
          ? prev.products.filter((p) => p !== productLabel)
          : [...prev.products, productLabel],
      };
    });
  };

  if (!mounted) return null;

  const productsList = [
    { key: 'filters', label: content?.products?.filters || 'فلاتر مياه' },
    { key: 'ac', label: content?.products?.ac || 'تكييفات' },
    { key: 'acParts', label: content?.products?.acParts || 'قطع غيار تكييف' },
    { key: 'filterParts', label: content?.products?.filterParts || 'قطع غيار فلاتر' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.products.length === 0) {
      setModalMessage(content?.validationError || 'من فضلك، اختر نوع منتج واحد على الأقل لطلب الصيانة!');
      return;
    }

    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);

      const finalEmail = userProfile.isLoggedIn && userProfile.email ? userProfile.email : formData.email;
      if (finalEmail) {
        data.set('email', finalEmail);
      }

      data.delete('products');
      data.set('products', formData.products.join(', '));

      const web3Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      const web3Result = await web3Response.json();

      if (!web3Result.success) {
        setModalMessage(web3Result.message || 'حدث خطأ أثناء الإرسال عبر البريد الإلكتروني.');
        setIsSubmitting(false);
        return;
      }

      // حفظ الطلب في كولكشن maintenance_requests عبر دالة saveUserMessage
      await saveUserMessage('maintenance', {
        title: 'طلب صيانة جديد',
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        email: finalEmail || '',
        products: formData.products,
        message: formData.message,
      }, userProfile.isLoggedIn ? userProfile.uid : null);

      // تحديث بروفايل المستخدم لو كان مسجلاً للدخول
      if (userProfile.isLoggedIn) {
        try {
          const userDocRef = doc(db, 'users', userProfile.uid);
          await updateDoc(userDocRef, {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            updatedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
        }
      }

      setIsSubmitted(true);
      form.reset();
      setFormData({
        name: userProfile.isLoggedIn ? userProfile.name : '',
        phone: userProfile.isLoggedIn ? userProfile.phone : '',
        address: userProfile.isLoggedIn ? userProfile.address : '',
        email: userProfile.isLoggedIn ? userProfile.email : '',
        products: [],
        message: '',
      });
      setWarnedFields({});
    } catch (error) {
      console.error(error);
      setModalMessage('حدث خطأ في الاتصال بالشبكة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)]">
      
      {modalMessage && (
        <div onClick={() => setModalMessage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 text-center">
            <button onClick={() => setModalMessage(null)} className="absolute top-4 start-4 p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] bg-[var(--secondary)]/20 rounded-full transition-colors cursor-pointer"><X size={18} /></button>
            <div className="flex justify-center text-amber-500 pt-2"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold">تنبيه هام</h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">{modalMessage}</p>
            <button onClick={() => setModalMessage(null)} className="w-full py-3 bg-[var(--secondary)] hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer mt-2">حسناً، فهمت</button>
          </div>
        </div>
      )}

      {profileWarningMessage && (
        <div onClick={() => setProfileWarningMessage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] text-[var(--foreground)] border border-amber-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 text-center">
            <button onClick={() => setProfileWarningMessage(null)} className="absolute top-4 start-4 p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] bg-[var(--secondary)]/20 rounded-full transition-colors cursor-pointer"><X size={18} /></button>
            <div className="flex justify-center text-amber-500 pt-2"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold">تعديل البيانات</h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">{profileWarningMessage}</p>
            <button onClick={() => setProfileWarningMessage(null)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer mt-2">موافق، متابعة</button>
          </div>
        </div>
      )}

      <header className="text-center mb-12 md:mb-16 space-y-4">
        <div className="flex justify-center">
          <div className="p-5 rounded-3xl bg-[var(--secondary)]/10 text-[var(--secondary)] transition-all duration-300 hover:scale-110 shadow-lg border border-[var(--border)]">
            <Wrench size={44} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--secondary)] tracking-tight">
          {content?.title || 'طلب صيانة'}
        </h1>
        {content?.subtitle && (
          <p className="text-[var(--foreground)]/70 text-sm sm:text-base max-w-xl mx-auto">
            {content.subtitle}
          </p>
        )}
      </header>

      <section className="max-w-2xl mx-auto bg-[var(--background)] text-[var(--foreground)] p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-90"></div>

        {isSubmitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center text-green-500 animate-bounce"><CheckCircle2 size={64} /></div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{content?.successMessage || 'تم إرسال طلب الصيانة بنجاح!'}</h2>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  name: userProfile.isLoggedIn ? userProfile.name : '',
                  phone: userProfile.isLoggedIn ? userProfile.phone : '',
                  address: userProfile.isLoggedIn ? userProfile.address : '',
                  email: userProfile.isLoggedIn ? userProfile.email : '',
                  products: [],
                  message: '',
                });
                setWarnedFields({});
              }}
              className="mt-6 px-8 py-3.5 bg-[var(--secondary)] text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-lg cursor-pointer"
            >
              {content?.anotherMessageButton || 'إرسال طلب آخر'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <input type="hidden" name="access_key" value="504542e4-a8e9-41a7-bf42-79827798cb31" />
            <input type="hidden" name="subject" value="طلب صيانة جديد من الموقع الإلكتروني" />
            
            {userProfile.isLoggedIn && (
              <div className="p-4 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 flex items-start gap-3 text-sm text-[var(--foreground)]">
                <Sparkles size={20} className="text-[var(--secondary)] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  أهلاً بك! أي تعديل ستقوم به على بياناتك الشخصية (الاسم، الهاتف، العنوان) سيتم تحديثه تلقائياً في حسابك فور إرسال الطلب.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-bold mb-2">{content?.nameLabel || 'الاسم'}</label>
                <input 
                  name="name" 
                  id="name" 
                  type="text" 
                  required 
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold mb-2">{content?.phoneLabel || 'رقم الهاتف'}</label>
                <input 
                  name="phone" 
                  id="phone" 
                  type="tel" 
                  inputMode="numeric"
                  required 
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold mb-2">{content?.addressLabel || 'العنوان'}</label>
              <input 
                name="address" 
                id="address" 
                type="text" 
                required 
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label htmlFor="email" className="block text-sm font-bold">
                  {content?.emailLabel || 'البريد الإلكتروني'}
                  {!userProfile.isLoggedIn && (
                    <span className="text-[var(--foreground)]/60 font-normal text-xs ms-1.5">
                      ({content?.emailOptional || 'اختياري'})
                    </span>
                  )}
                </label>
                {userProfile.isLoggedIn && (
                  <span className="text-xs text-[var(--secondary)] flex items-center gap-1">
                    <Lock size={12} /> {content?.readonlyNote || 'البريد مسجل بحسابك'}
                  </span>
                )}
              </div>
              <input 
                name={!userProfile.isLoggedIn ? 'email' : undefined} 
                id="email" 
                type="email" 
                autoComplete="email"
                required={!userProfile.isLoggedIn}
                value={formData.email}
                disabled={userProfile.isLoggedIn}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full p-3.5 rounded-2xl border border-[var(--border)] outline-none transition-all ${
                  userProfile.isLoggedIn 
                    ? 'opacity-70 bg-[var(--secondary)]/5 cursor-not-allowed' 
                    : 'bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)]'
                }`} 
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-3">{content?.productTypeLabel || 'نوع المنتج'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {productsList.map((product) => (
                  <label key={product.key} className="flex items-center gap-3.5 bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)] cursor-pointer hover:border-[var(--secondary)] transition-all">
                    <input 
                      type="checkbox" 
                      name="products" 
                      value={product.label} 
                      checked={formData.products.includes(product.label)}
                      onChange={() => handleProductCheckboxChange(product.label)}
                      className="accent-[var(--secondary)] w-5 h-5 rounded-md cursor-pointer" 
                    />
                    <span className="text-sm font-bold text-[var(--foreground)]">{product.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold mb-2">{content?.messageLabel || 'تفاصيل المشكلة'}</label>
              <textarea 
                name="message" 
                id="message" 
                rows={4} 
                required 
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[var(--secondary)] text-white py-4 rounded-2xl font-black text-lg transition-all hover:opacity-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>{content?.submittingButton || 'جاري الإرسال...'}</span>
                </>
              ) : (
                <>
                  <Send size={20} className="rtl:rotate-180" />
                  <span>{content?.submitButton || 'إرسال طلب الصيانة'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}