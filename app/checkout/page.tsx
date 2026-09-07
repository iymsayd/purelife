'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/context/CartContext'; 
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { saveUserMessage } from '@/lib/messageService';
import { ShieldCheck, MapPin, Phone, User as UserIcon, Mail, ShoppingBag, ArrowRight, CheckCircle2, LogIn, UserPlus, X, AlertCircle, Globe } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalAmount, clearCart, isMounted: isCartMounted } = useCart() as {
    cartItems: any[];
    totalAmount: number;
    clearCart: () => void;
    isMounted: boolean;
  };

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // حقول بيانات العميل
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [country, setCountry] = useState('مصر');

  // حالات أخطاء التحقق (Validation & Anti-Spam Errors)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  // تفعيل زر Esc لإغلاق النافذة المنبثقة للـ Auth
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // التحقق من حالة تسجيل الدخول وجلب البيانات الفعلية
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        setUser(null);
        setShowAuthModal(true);
        setAuthLoading(false);
        return;
      }
      
      setUser(currentUser);
      setEmail(currentUser.email || '');

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setName(data.name || currentUser.displayName || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setGovernorate(data.governorate || 'غير محدد');
          setCountry(data.country || 'مصر');
        }
      } catch (error) {
        console.error("Error fetching user data for checkout:", error);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // حماية إضافية: لو السلة فارغة بعد التحميل، نوجهه للمتجر فوراً
  useEffect(() => {
    if (isCartMounted && cartItems.length === 0 && !success) {
      router.replace('/#products');
    }
  }, [isCartMounted, cartItems, success, router]);

  // منع أي ريندر وهمي أو مشكلة هيدريشن قبل اكتمال التحميل
  if (!isCartMounted || authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // دالة لجلب اسم المنتج بمرونة
  const getLocalizedItemTitle = (item: any) => {
    return item.titleAr || item.nameAr || item.title || item.name || 'منتج بدون اسم';
  };

  // دالة تنظيف المدخلات لحماية البيانات ضد الـ Spam وحقن الكود (Sanitization)
  const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>?/gm, '').trim();
  };

  // دالة التحقق من صحة الفورم (Form Validation) بالنص المطلوب تماماً
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone);
    const cleanAddress = sanitizeInput(address);

    // التحقق من الاسم (ألا يقل عن 3 أحرف أو يحتوي على رموز خبيثة)
    if (!cleanName || cleanName.length < 3 || /[<>/\\]/.test(name)) {
      errors.name = 'الاسم يجب ألا يقل عن 3 أحرف.';
    }

    // التحقق من رقم الهاتف المصري (يبدأ بـ 01 ويحتوي على 11 رقماً صحيحاً)
    const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!cleanPhone || !egyptianPhoneRegex.test(cleanPhone)) {
      errors.phone = 'رقم الهاتف غير صحيح (يجب ألا يقل عن 10 أرقام).';
    }

    // التحقق من العنوان بالتفصيل
    if (!cleanAddress || cleanAddress.length < 5) {
      errors.address = 'يرجى كتابة العنوان بشكل مفصل وصحيح.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // إرسال الطلب وتحديث بيانات اليوزر الفعلية وإرساله لجوجل شيت عبر messageService
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. فحص منع السبام (Rate Limiting محلي لمنع الضغط المتكرر في أقل من 5 ثواني)
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      alert("برجاء الانتظار قليلاً قبل إعادة إرسال الطلب لمنع التكرار (Spam Protection).");
      return;
    }

    if (!user) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      setShowAuthModal(true);
      return;
    }

    // 2. تفعيل الفاليديشن
    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      alert("سلة المشتريات فارغة!");
      router.replace('/#products');
      return;
    }

    setSubmitting(true);
    setLastSubmitTime(now);

    try {
      const cleanName = sanitizeInput(name);
      const cleanPhone = sanitizeInput(phone);
      const cleanAddress = sanitizeInput(address);

      // 3. تحديث بيانات اليوزر في الداتا بأمان
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        governorate,
        country,
        updatedAt: serverTimestamp(),
      });

      // 4. تجهيز عناصر الطلب
      const formattedItems = cartItems.map((item) => ({
        id: item.id || '',
        title: getLocalizedItemTitle(item),
        price: item.price || 0,
        quantity: item.quantity || 1,
        type: item.type || (item.isUsed ? 'used' : 'new'),
        image: item.image || '',
      }));

      // نص منسق تفصيلي للمنتجات ليظهر بشكل احترافي في الشيت والرسائل
      const itemsSummaryText = formattedItems
        .map(item => `- ${item.title} (الكمية: ${item.quantity} | السعر: ${item.price} ج.م | النوع: ${item.type})`)
        .join(' | ');

      // 5. إرسال الطلب عبر دالة saveUserMessage الموحدة (لتحفظ بـ فايربيس وترسل لجوجل شيت تلقائياً)
      await saveUserMessage('orders', {
        userId: user.uid,
        name: cleanName,
        fullName: cleanName,
        phone: cleanPhone,
        email: email,
        title: `طلب شراء جديد - إجمالي: ${totalAmount} ج.م`,
        address: `${governorate} - ${cleanAddress}`,
        message: itemsSummaryText,
        items: formattedItems,
        totalAmount: totalAmount || 0,
        status: 'pending',
        createdAt: new Date().toLocaleString(),
      });

      clearCart();
      setSuccess(true);

      setTimeout(() => {
        router.push('/profile');
      }, 3500);

    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error submitting order:", err?.message || err);
      alert("حدث خطأ أثناء إتمام الطلب، برجاء المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  // شاشة نافذة تسجيل الدخول لو المستخدم مش مسجل
  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative" dir="rtl">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-center p-4">
          <div className="bg-background text-foreground rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 relative border border-border text-center animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => router.push('/')}
              className="absolute top-4 start-4 text-foreground/60 hover:text-foreground bg-secondary/10 hover:bg-secondary/20 p-2 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/30 shadow-inner">
              <UserIcon size={32} />
            </div>

            <h3 className="text-xl font-black text-foreground mb-2">مطلوب تسجيل الدخول</h3>
            <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
              عذراً، لا يمكنك إتمام الشراء إلا بعد تسجيل الدخول لحسابك لتأكيد بيانات الشحن الخاصة بك.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </button>

              <button 
                onClick={() => router.push('/register')}
                className="w-full bg-secondary/20 hover:bg-secondary/30 text-foreground font-bold py-3.5 px-4 rounded-xl border border-border transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus size={18} />
                <span>إنشاء حساب جديد</span>
              </button>

              <button 
                onClick={() => router.push('/')}
                className="w-full text-foreground/60 hover:text-foreground text-sm font-semibold py-2 transition-all cursor-pointer"
              >
                العودة للرئيسية
              </button>
        </div>
      </div>
    </div>
    </main>
  );
}

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-background" dir="rtl">
        <div className="bg-background text-foreground p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-emerald-500/30 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">تم إتمام طلبك بنجاح!</h2>
          <p className="text-sm text-foreground/80 mb-3 leading-relaxed">سيتواصل معك فريق الدعم الفني خلال 24 ساعة لتأكيد الشحن.</p>
          <p className="text-xs text-emerald-500 font-medium mb-6">جاري توجيهك إلى صفحة الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <header className="flex items-center gap-3 mb-8">
          <div className="p-3.5 bg-gradient-to-tr from-sky-500/25 via-indigo-500/25 to-purple-500/25 text-sky-500 rounded-2xl border border-sky-500/30 shadow-md">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              إتمام الشراء ومراجعة البيانات
            </h1>
            <p className="text-xs text-foreground/60 mt-0.5">خطوات بسيطة لتأكيد وسيلة الشحن واستلام طلبك</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* نموذج البيانات والشحن */}
          <div className="lg:col-span-7 bg-background text-foreground rounded-3xl shadow-xl border border-border/70 p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-lg font-black mb-1 flex items-center gap-2">
              <MapPin size={20} className="text-sky-500" />
              بيانات الشحن والاستلام
            </h2>
            <p className="text-xs text-foreground/70 mb-4">
              تم إدراج بيانات المحافظة والدولة من ملفك الشخصي مباشرة لضمان دقة الشحن.
            </p>

            <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-amber-500" />
              <span>
                <strong>تنويه هام:</strong> أي تعديل تقم به على (الاسم، الهاتف، أو العنوان) سيتم تحديثه في حسابك الشخصي تلقائياً عند تأكيد الطلب.
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/90">الاسم الكامل *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 pointer-events-none">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    className={`w-full pr-11 pl-4 py-3 rounded-2xl border bg-secondary/5 text-foreground focus:ring-2 text-sm outline-none transition-all shadow-xs ${
                      formErrors.name ? 'border-red-500 focus:ring-red-500/50' : 'border-border/80 focus:ring-sky-500/50 focus:border-sky-500'
                    }`}
                    placeholder="ادخل اسمك الكامل"
                  />
                </div>
                {formErrors.name && <p className="text-xs text-red-500 mt-1.5 font-medium">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/90">البريد الإلكتروني (لا يمكن تعديله)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pr-11 pl-4 py-3 rounded-2xl border border-border/60 bg-secondary/20 text-foreground/50 text-sm cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/90">رقم الهاتف للتواصل *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 pointer-events-none">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                    }}
                    className={`w-full pr-11 pl-4 py-3 rounded-2xl border bg-secondary/5 text-foreground focus:ring-2 text-sm outline-none transition-all shadow-xs ${
                      formErrors.phone ? 'border-red-500 focus:ring-red-500/50' : 'border-border/80 focus:ring-sky-500/50 focus:border-sky-500'
                    }`}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                {formErrors.phone && <p className="text-xs text-red-500 mt-1.5 font-medium">{formErrors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground/90">المحافظة (من حسابك)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 pointer-events-none">
                      <MapPin size={18} />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={governorate}
                      className="w-full pr-11 pl-4 py-3 rounded-2xl border border-border/60 bg-secondary/20 text-foreground/70 text-sm cursor-not-allowed font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground/90">الدولة</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-foreground/40 pointer-events-none">
                      <Globe size={18} />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={country}
                      className="w-full pr-11 pl-4 py-3 rounded-2xl border border-border/60 bg-secondary/20 text-foreground/70 text-sm cursor-not-allowed font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/90">العنوان بالتفصيل *</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border bg-secondary/5 text-foreground focus:ring-2 text-sm outline-none transition-all resize-none shadow-xs ${
                    formErrors.address ? 'border-red-500 focus:ring-red-500/50' : 'border-border/80 focus:ring-sky-500/50 focus:border-sky-500'
                  }`}
                  placeholder="الشارع، رقم الحارة، العلامة المميزة..."
                ></textarea>
                {formErrors.address && <p className="text-xs text-red-500 mt-1.5 font-medium">{formErrors.address}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full mt-6 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-600 hover:to-indigo-800 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري تأكيد الطلب وتحديث بياناتك...
                  </span>
                ) : (
                  <>
                    <span>تأكيد الطلب بهذه البيانات</span>
                    <ArrowRight size={18} className="rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ملخص الطلب والأسعار */}
          <div className="lg:col-span-5 bg-background text-foreground rounded-3xl shadow-xl border border-border/70 p-6 h-fit backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="text-lg font-black text-foreground">
                ملخص الطلب
              </h3>
              <span className="text-xs bg-sky-500/10 text-sky-500 font-bold px-2.5 py-1 rounded-full border border-sky-500/20">
                {cartItems.length} منتجات
            </span>
            </div>
            
            <div className="space-y-3.5 max-h-80 overflow-y-auto mb-4 ps-1">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 text-sm pb-3 border-b border-border/50 last:border-none">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 bg-secondary/10 border border-border rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={getLocalizedItemTitle(item)} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <p className="font-bold text-foreground truncate max-w-[140px] sm:max-w-[160px]" title={getLocalizedItemTitle(item)}>
                          {getLocalizedItemTitle(item)}
                        </p>
                        {item.type === 'used' || item.isUsed ? (
                          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/35 shrink-0">مستعمل</span>
                        ) : (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/35 shrink-0">جديد</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">الكمية: {item.quantity || 1}</p>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                      {(item.price || 0) * (item.quantity || 1)} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm text-foreground/80">
                <span>إجمالي المنتجات</span>
                <span className="font-semibold text-foreground whitespace-nowrap">{totalAmount} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm text-foreground/80">
                <span>رسوم الشحن</span>
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-xs">تُحدد لاحقاً</span>
              </div>
              <div className="flex justify-between items-center text-base font-black pt-3 border-t border-border">
                <span>الإجمالي الكلي</span>
                <span className="text-sky-500 text-lg sm:text-xl font-black whitespace-nowrap">{totalAmount} ج.م</span>
              </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-4 rounded-2xl border border-sky-500/20 flex items-start gap-3 shadow-inner">
            <ShieldCheck className="text-sky-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-foreground/80 leading-relaxed">
              ضمان حقيقي ودعم فني متواصل لجميع منتجات معالجة المياه والتكييفات والمنتجات المستعملة والجديدة.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
  );
}